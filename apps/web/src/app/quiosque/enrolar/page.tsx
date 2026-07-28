'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, LogIn, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getKioskDeviceId, getKioskDeviceNome, isKioskConfigured } from '@/lib/kiosk-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4301/api/v1';

type Passo = 'login' | 'pronto' | 'a-registar' | 'sucesso' | 'erro';

export default function QuiosqueEnrolarPage() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [nomeQuiosque, setNomeQuiosque] = useState('');
  const [passo, setPasso] = useState<Passo>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeFuncionario, setNomeFuncionario] = useState('');
  const [token, setToken] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isKioskConfigured()) {
      router.replace('/quiosque/setup');
      return;
    }
    setNomeQuiosque(getKioskDeviceNome() || 'Quiosque');
    setPronto(true);
  }, [router]);

  const entrar = async () => {
    setErro('');
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
      setToken(data.data.accessToken);
      setNomeFuncionario(`${data.data.user?.firstName || ''} ${data.data.user?.lastName || ''}`.trim() || email);
      setPasso('pronto');
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Credenciais inválidas');
    }
  };

  const registarDigital = async () => {
    setPasso('a-registar');
    setErro('');
    const dispositivoId = getKioskDeviceId();
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const { data: optionsResp } = await axios.post(
        `${API_URL}/rh/presenca/credenciais/webauthn/registo/options`,
        { dispositivoId },
        auth,
      );
      const regResponse = await startRegistration({ optionsJSON: optionsResp.data });
      await axios.post(
        `${API_URL}/rh/presenca/credenciais/webauthn/registo/verify`,
        { dispositivoId, response: regResponse, deviceLabel: nomeQuiosque },
        auth,
      );
      setPasso('sucesso');
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Não foi possível registar a impressão digital.');
      setPasso('erro');
    }
  };

  const reiniciar = () => {
    setEmail('');
    setPassword('');
    setToken('');
    setNomeFuncionario('');
    setErro('');
    setPasso('login');
  };

  if (!pronto) return null;

  return (
    <div className="bg-white rounded-2xl p-8 w-full max-w-md space-y-5 shadow-2xl">
      <Link href="/quiosque" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </Link>

      <div className="text-center">
        <Fingerprint className="w-10 h-10 mx-auto text-gray-700 mb-2" />
        <h1 className="text-xl font-bold text-gray-900">Registar Impressão Digital</h1>
        <p className="text-gray-500 text-sm mt-1">{nomeQuiosque}</p>
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{erro}</div>}

      {passo === 'login' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 text-center">Inicie sessão com a sua conta para associar a sua digital a este quiosque. A sessão não fica guardada neste computador.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Palavra-passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === 'Enter' && entrar()} />
          </div>
          <button onClick={entrar} disabled={!email || !password}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
            <LogIn className="w-4 h-4" /> Entrar
          </button>
        </div>
      )}

      {passo === 'pronto' && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-700">Sessão iniciada como <span className="font-semibold">{nomeFuncionario}</span></p>
          <p className="text-xs text-gray-500">Toque no botão e coloque o dedo no leitor deste computador para registar a sua impressão digital.</p>
          <button onClick={registarDigital}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900">
            <Fingerprint className="w-4 h-4" /> Registar Impressão Digital
          </button>
          <button onClick={reiniciar} className="text-xs text-gray-400 hover:text-gray-600">Trocar de conta</button>
        </div>
      )}

      {passo === 'a-registar' && (
        <div className="py-8 flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-12 h-12 animate-spin" />
          <span className="text-sm font-medium">A aguardar leitura da impressão digital...</span>
        </div>
      )}

      {passo === 'sucesso' && (
        <div className="py-6 flex flex-col items-center gap-3">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
          <p className="text-sm font-medium text-gray-900">Impressão digital registada com sucesso</p>
          <div className="flex gap-3 w-full pt-2">
            <button onClick={reiniciar} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Registar outra pessoa</button>
            <Link href="/quiosque" className="flex-1 text-center bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900">Ir para marcação</Link>
          </div>
        </div>
      )}

      {passo === 'erro' && (
        <div className="py-6 flex flex-col items-center gap-3">
          <XCircle className="w-14 h-14 text-red-500" />
          <button onClick={() => setPasso('pronto')} className="text-sm text-gray-500 underline">Tentar novamente</button>
        </div>
      )}
    </div>
  );
}
