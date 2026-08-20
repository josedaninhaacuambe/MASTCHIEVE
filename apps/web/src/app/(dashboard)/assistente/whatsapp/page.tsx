'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { MessageSquare, Send, CheckCircle2, XCircle, User, Phone, Clock } from 'lucide-react';

const TIPO_LABEL: Record<string, string> = {
  BOAS_VINDAS: 'Boas-vindas',
  NEWSLETTER: 'Newsletter',
  OUTRO: 'Outro',
};

export default function WhatsappOutboxPage() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<'PENDENTE' | 'ENVIADA' | 'CANCELADA' | ''>('PENDENTE');

  const { data, isLoading } = useQuery({
    queryKey: ['whatsapp-outbox', filtro],
    queryFn: async () => {
      const { data } = await api.get('/whatsapp', { params: filtro ? { estado: filtro } : {} });
      return data.data ?? [];
    },
  });

  const marcarEnviada = useMutation({
    mutationFn: (id: string) => api.put(`/whatsapp/${id}/enviada`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-outbox'] }),
  });

  const cancelar = useMutation({
    mutationFn: (id: string) => api.delete(`/whatsapp/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-outbox'] }),
  });

  const mensagens: any[] = data ?? [];

  const abrirWhatsapp = (telefone: string, mensagem: string) => {
    const numero = telefone.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-green-600" /> WhatsApp — Fila de Envio
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Mensagens preparadas pelo sistema (boas-vindas, newsletter). Abre o WhatsApp com o texto pronto e marca como enviada depois de confirmar.
        </p>
      </div>

      <div className="flex gap-2">
        {(['PENDENTE', 'ENVIADA', 'CANCELADA', ''] as const).map((estado) => (
          <button
            key={estado || 'TODAS'}
            onClick={() => setFiltro(estado)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              filtro === estado ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {estado || 'Todas'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400">A carregar...</div>
      ) : mensagens.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma mensagem nesta lista</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mensagens.map((m) => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {TIPO_LABEL[m.tipo] ?? m.tipo}
                    </span>
                    {m.student && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> {m.student.firstName} {m.student.lastName}
                      </span>
                    )}
                    {m.lead && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> {m.lead.nome} (lead)
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {m.telefone}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{m.mensagem}</p>
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(m.createdAt).toLocaleString('pt-PT')}
                  </p>
                </div>
                {m.estado === 'PENDENTE' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => abrirWhatsapp(m.telefone, m.mensagem)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold transition"
                    >
                      <Send className="w-3.5 h-3.5" /> Abrir WhatsApp
                    </button>
                    <button
                      onClick={() => marcarEnviada.mutate(m.id)}
                      disabled={marcarEnviada.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Marcar enviada
                    </button>
                    <button
                      onClick={() => cancelar.mutate(m.id)}
                      disabled={cancelar.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancelar
                    </button>
                  </div>
                )}
                {m.estado === 'ENVIADA' && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Enviada
                  </span>
                )}
                {m.estado === 'CANCELADA' && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                    <XCircle className="w-3 h-3" /> Cancelada
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
