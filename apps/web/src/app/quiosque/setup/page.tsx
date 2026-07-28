'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MonitorSmartphone, Save } from 'lucide-react';
import { isKioskConfigured, getKioskDeviceNome, setKioskConfig, clearKioskConfig } from '@/lib/kiosk-api';

export default function QuiosqueSetupPage() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [nome, setNome] = useState('');
  const [jaConfigurado, setJaConfigurado] = useState(false);

  useEffect(() => {
    setJaConfigurado(isKioskConfigured());
    setNome(getKioskDeviceNome() || '');
  }, []);

  const guardar = () => {
    if (!deviceId || !deviceKey) return;
    setKioskConfig(deviceId.trim(), deviceKey.trim(), nome.trim() || undefined);
    router.push('/quiosque');
  };

  const limpar = () => {
    clearKioskConfig();
    setDeviceId('');
    setDeviceKey('');
    setNome('');
    setJaConfigurado(false);
  };

  return (
    <div className="bg-white rounded-2xl p-8 w-full max-w-md space-y-5 shadow-2xl">
      <div className="text-center">
        <MonitorSmartphone className="w-10 h-10 mx-auto text-gray-700 mb-2" />
        <h1 className="text-xl font-bold text-gray-900">Configuração do Quiosque</h1>
        <p className="text-gray-500 text-sm mt-1">Insira as credenciais deste computador, geradas em RH → Presença Biométrica → Quiosques</p>
      </div>

      {jaConfigurado && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-3 py-2">
          Este computador já está configurado{nome ? ` como "${nome}"` : ''}. Preencher novamente substitui a configuração atual.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ID do dispositivo*</label>
        <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="Cole aqui o ID" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chave*</label>
        <input value={deviceKey} onChange={(e) => setDeviceKey(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="Cole aqui a chave" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome (opcional)</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Receção — Piscina Central" />
      </div>

      <div className="flex gap-3 pt-2">
        {jaConfigurado && (
          <button onClick={limpar} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50">Limpar</button>
        )}
        <button onClick={guardar} disabled={!deviceId || !deviceKey}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>
    </div>
  );
}
