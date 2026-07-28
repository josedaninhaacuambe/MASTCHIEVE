'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { startAuthentication } from '@simplewebauthn/browser';
import { Fingerprint, CheckCircle2, XCircle, Loader2, Settings, LogIn, UserPlus } from 'lucide-react';
import { kioskApi, isKioskConfigured, getKioskDeviceNome } from '@/lib/kiosk-api';
import Link from 'next/link';

type Estado = 'idle' | 'a-verificar' | 'sucesso' | 'erro';

export default function QuiosquePage() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [nome, setNome] = useState('');
  const [estado, setEstado] = useState<Estado>('idle');
  const [mensagem, setMensagem] = useState('');
  const [resultado, setResultado] = useState<{ nome: string; tipo: string } | null>(null);

  useEffect(() => {
    if (!isKioskConfigured()) {
      router.replace('/quiosque/setup');
      return;
    }
    setNome(getKioskDeviceNome() || 'Quiosque');
    setPronto(true);
  }, [router]);

  useEffect(() => {
    if (estado === 'sucesso' || estado === 'erro') {
      const t = setTimeout(() => { setEstado('idle'); setResultado(null); setMensagem(''); }, 5000);
      return () => clearTimeout(t);
    }
  }, [estado]);

  const marcarPresenca = async () => {
    setEstado('a-verificar');
    setMensagem('');
    try {
      const { data: optionsResp } = await kioskApi.post('/rh/presenca/quiosque/webauthn/options');
      const authResponse = await startAuthentication({ optionsJSON: optionsResp.data });
      const { data: verifyResp } = await kioskApi.post('/rh/presenca/quiosque/webauthn/verify', { response: authResponse });
      const r = verifyResp.data;
      setResultado({ nome: `${r.funcionario.firstName} ${r.funcionario.lastName}`, tipo: r.tipo });
      setEstado('sucesso');
    } catch (e: any) {
      setMensagem(e?.response?.data?.message || 'Não foi possível verificar a impressão digital. Tente novamente.');
      setEstado('erro');
    }
  };

  if (!pronto) return null;

  return (
    <div className="bg-white rounded-2xl p-10 w-full max-w-lg space-y-6 shadow-2xl text-center relative">
      <Link href="/quiosque/setup" className="absolute top-4 right-4 text-gray-300 hover:text-gray-500">
        <Settings className="w-5 h-5" />
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-gray-400">{nome}</h1>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">Marcação de Presença</h2>
      </div>

      {estado === 'idle' && (
        <>
          <button onClick={marcarPresenca}
            className="mx-auto flex flex-col items-center justify-center gap-3 w-48 h-48 rounded-full bg-gray-900 hover:bg-gray-800 text-white transition shadow-lg">
            <Fingerprint className="w-16 h-16" />
            <span className="text-sm font-medium">Marcar Presença</span>
          </button>
          <p className="text-gray-400 text-sm">Toque no botão e use o leitor de impressão digital deste computador</p>
        </>
      )}

      {estado === 'a-verificar' && (
        <div className="py-10 flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-14 h-14 animate-spin" />
          <span className="text-sm font-medium">A verificar impressão digital...</span>
        </div>
      )}

      {estado === 'sucesso' && resultado && (
        <div className="py-8 flex flex-col items-center gap-3">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <div className="text-xl font-bold text-gray-900">{resultado.nome}</div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${resultado.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {resultado.tipo === 'ENTRADA' ? 'Entrada registada' : 'Saída registada'}
          </span>
        </div>
      )}

      {estado === 'erro' && (
        <div className="py-8 flex flex-col items-center gap-3">
          <XCircle className="w-16 h-16 text-red-500" />
          <p className="text-sm text-gray-600 max-w-xs">{mensagem}</p>
          <button onClick={() => setEstado('idle')} className="text-sm text-gray-500 underline">Tentar novamente</button>
        </div>
      )}

      <Link href="/quiosque/enrolar" className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 pt-2">
        <UserPlus className="w-3.5 h-3.5" /> Registar nova impressão digital
      </Link>
    </div>
  );
}
