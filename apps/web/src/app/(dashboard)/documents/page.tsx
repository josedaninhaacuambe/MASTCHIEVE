'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';
import {
  FileText, Upload, Trash2, Download, Eye, Search,
  Plus, X, AlertCircle, RefreshCw, FileCheck, FolderOpen,
  Users, ChevronRight,
} from 'lucide-react';

const DOC_TYPES = [
  { value: 'MEDICAL', label: 'Ficha médica', color: 'bg-red-100 text-red-700' },
  { value: 'AUTHORIZATION', label: 'Autorização', color: 'bg-blue-100 text-blue-700' },
  { value: 'ID', label: 'Identificação', color: 'bg-green-100 text-green-700' },
  { value: 'CONTRACT', label: 'Contrato', color: 'bg-purple-100 text-purple-700' },
  { value: 'PHOTO', label: 'Foto', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'OTHER', label: 'Outro', color: 'bg-gray-100 text-gray-600' },
];

function typeConfig(type: string) {
  return DOC_TYPES.find(t => t.value === type) ?? DOC_TYPES[DOC_TYPES.length - 1];
}

function formatSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function UploadModal({ studentId, studentName, onClose, onSuccess }: {
  studentId: string; studentName: string; onClose: () => void; onSuccess: () => void;
}) {
  const [type, setType] = useState('OTHER');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Nenhum ficheiro seleccionado');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      return api.post(`/documents/students/${studentId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => { toast.success('Documento enviado', file?.name ?? ''); onSuccess(); onClose(); },
    onError: (e: any) => toast.error('Erro no upload', e?.response?.data?.message),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Enviar documento</h2>
            <p className="text-xs text-gray-400 mt-0.5">{studentName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Tipo de documento</label>
            <div className="grid grid-cols-3 gap-2">
              {DOC_TYPES.map(({ value, label, color }) => (
                <button key={value} onClick={() => setType(value)}
                  className={cn('px-2 py-2 rounded-xl text-xs font-medium border-2 transition',
                    type === value ? `${color} border-current` : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Ficheiro</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={cn('border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition',
                file ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50')}>
              {file ? (
                <div className="flex items-center gap-3 justify-center">
                  <FileCheck className="w-6 h-6 text-blue-500 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-48">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Clique para seleccionar</p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF, imagem, Word — máx. 10 MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={() => mutation.mutate()} disabled={!file || mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
            <Upload className="w-4 h-4" />
            {mutation.isPending ? 'A enviar...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-doc-list'],
    queryFn: async () => { const { data } = await api.get('/students?limit=100'); return data.data ?? []; },
    staleTime: 60_000,
  });

  const { data: docs, isLoading: loadingDocs, isError } = useQuery({
    queryKey: ['documents', selectedStudentId],
    queryFn: async () => {
      const { data } = await api.get(`/documents/students/${selectedStudentId}`);
      return data ?? [];
    },
    enabled: !!selectedStudentId,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      toast.success('Documento eliminado');
      qc.invalidateQueries({ queryKey: ['documents', selectedStudentId] });
    },
    onError: () => toast.error('Erro ao eliminar documento'),
  });

  const students: any[] = studentsData ?? [];
  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const allDocs: any[] = Array.isArray(docs) ? docs : docs?.data ?? [];
  const filteredDocs = typeFilter ? allDocs.filter(d => d.type === typeFilter) : allDocs;

  return (
    <div className="space-y-5">
      {showUpload && selectedStudentId && (
        <UploadModal
          studentId={selectedStudentId}
          studentName={selectedStudentName}
          onClose={() => setShowUpload(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['documents', selectedStudentId] })}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de documentos dos atletas</p>
        </div>
        {selectedStudentId && (
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
            <Plus className="w-4 h-4" /> Enviar documento
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Student selector */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Pesquisar atleta..." />
            </div>
          </div>
          {loadingStudents ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">Nenhum atleta encontrado</div>
              ) : filteredStudents.map(s => (
                <button key={s.id}
                  onClick={() => { setSelectedStudentId(s.id); setSelectedStudentName(`${s.firstName} ${s.lastName}`); }}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition',
                    selectedStudentId === s.id ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50')}>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                    {s.firstName?.[0]}{s.lastName?.[0]}
                  </div>
                  <span className={cn('text-sm font-medium flex-1 truncate',
                    selectedStudentId === s.id ? 'text-blue-700' : 'text-gray-900')}>
                    {s.firstName} {s.lastName}
                  </span>
                  <ChevronRight className={cn('w-4 h-4',
                    selectedStudentId === s.id ? 'text-blue-400' : 'text-gray-300')} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Documents panel */}
        <div className="lg:col-span-2">
          {!selectedStudentId ? (
            <div className="bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center py-20 text-gray-400">
              <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Seleccione um atleta</p>
              <p className="text-xs mt-1">Os documentos aparecerão aqui</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">{selectedStudentName}</span>
                  {!loadingDocs && <span className="text-xs text-gray-400">· {filteredDocs.length} documento(s)</span>}
                </div>
                {/* Type filter */}
                <div className="flex items-center gap-1">
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Todos os tipos</option>
                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {loadingDocs ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : isError ? (
                <div className="py-10 text-center text-red-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Erro ao carregar documentos</p>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="py-14 text-center text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum documento encontrado</p>
                  <button onClick={() => setShowUpload(true)}
                    className="mt-3 text-blue-600 text-sm hover:underline flex items-center gap-1 mx-auto">
                    <Plus className="w-3.5 h-3.5" /> Enviar primeiro documento
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredDocs.map((doc: any) => {
                    const cfg = typeConfig(doc.type);
                    return (
                      <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>
                              {cfg.label}
                            </span>
                            <span className="text-xs text-gray-400">{formatSize(doc.size)}</span>
                            <span className="text-xs text-gray-400">{formatDate(doc.uploadedAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${doc.url}`}
                            target="_blank" rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Visualizar">
                            <Eye className="w-4 h-4" />
                          </a>
                          <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${doc.url}`}
                            download={doc.name}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Descarregar">
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => {
                              if (confirm(`Eliminar "${doc.name}"?`)) deleteMutation.mutate(doc.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
