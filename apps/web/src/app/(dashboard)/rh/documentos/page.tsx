'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Upload, FolderOpen } from 'lucide-react';

const TIPOS = ['BI', 'CERTIFICADO_NADADOR_SALVADOR', 'CERTIFICADO_INSTRUTOR_NATACAO', 'CERTIFICADO_PRIMEIROS_SOCORROS', 'REGISTO_CRIMINAL', 'ATESTADO_APTIDAO_FISICA', 'CONTRATO', 'CV', 'OUTRO'];

export default function DocumentosRhPage() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [funcionarioId, setFuncionarioId] = useState('');
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState('OUTRO');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/rh/funcionarios').then(r => setFuncionarios(r.data.data?.data || r.data.data || [])).catch(() => {});
  }, []);

  const load = async (fid: string) => {
    if (!fid) { setDocumentos([]); return; }
    setLoading(true);
    try {
      const r = await api.get(`/rh/documentos/funcionario/${fid}`);
      setDocumentos(r.data.data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar documentos', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(funcionarioId); }, [funcionarioId]);

  const upload = async () => {
    if (!file || !funcionarioId) {
      toast.error('Campos obrigatórios', 'Seleciona o funcionário e o ficheiro');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('tipo', tipo);
    fd.append('funcionarioId', funcionarioId);
    try {
      await api.post('/rh/documentos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Documento enviado');
      load(funcionarioId);
    } catch (e: any) {
      toast.error('Erro ao enviar documento', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setUploading(false);
    }
  };

  const validar = async (id: string) => {
    try { await api.put(`/rh/documentos/${id}/validar`); load(funcionarioId); }
    catch (e: any) { toast.error('Erro ao validar documento', e?.response?.data?.message ?? 'Tenta novamente'); }
  };
  const remover = async (id: string) => {
    if (!window.confirm('Remover este documento? Esta ação não pode ser desfeita.')) return;
    try { await api.delete(`/rh/documentos/${id}`); toast.success('Documento removido'); load(funcionarioId); }
    catch (e: any) { toast.error('Erro ao remover documento', e?.response?.data?.message ?? 'Tenta novamente'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documentos de RH</h1>
        <p className="text-gray-500 text-sm mt-1">BI, certificados, contratos e outros documentos por funcionário</p>
      </div>

      <div className="max-w-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
        <select value={funcionarioId} onChange={(e) => setFuncionarioId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">— Selecionar funcionário —</option>
          {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
        </select>
      </div>

      {funcionarioId && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {TIPOS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ficheiro</label>
            <input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </div>
          <button onClick={upload} disabled={!file || uploading} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium disabled:opacity-50">
            <Upload className="w-4 h-4" /> {uploading ? 'A enviar...' : 'Enviar'}
          </button>
        </div>
      )}

      {!funcionarioId ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Selecione um funcionário para ver os documentos
        </div>
      ) : loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : documentos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">Nenhum documento enviado</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {documentos.map((d: any) => (
            <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm">
                <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline font-medium">{d.nome}</a>
                <span className="text-gray-400"> · {d.tipo.replace(/_/g, ' ')}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${d.validado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{d.validado ? 'Validado' : 'Pendente'}</span>
              </div>
              <div className="flex gap-2">
                {!d.validado && <button onClick={() => validar(d.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Validar</button>}
                <button onClick={() => remover(d.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
