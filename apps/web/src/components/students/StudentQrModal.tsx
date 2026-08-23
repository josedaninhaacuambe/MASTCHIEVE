'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { QrCode, X, Download, RotateCw } from 'lucide-react';

interface Props {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

interface QrCodeData {
  qrImage: string;
  generatedAt: string;
}

export default function StudentQrModal({ studentId, studentName, onClose }: Props) {
  const qc = useQueryClient();
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  const { data: qrCode, isLoading } = useQuery({
    queryKey: ['student-qr', studentId],
    queryFn: async () => {
      const { data } = await api.get(`/students/${studentId}/qr-code`);
      return (data.data ?? data) as QrCodeData | null;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/students/${studentId}/qr-code`);
      return (data.data ?? data) as QrCodeData;
    },
    onSuccess: (data) => {
      qc.setQueryData(['student-qr', studentId], data);
      setShowRegenerateConfirm(false);
      toast.success('QR Code gerado com sucesso');
    },
    onError: () => toast.error('Não foi possível gerar o QR Code'),
  });

  const fileName = `qr-atleta-${studentName.trim().toLowerCase().replace(/\s+/g, '-')}.png`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <QrCode className="w-4 h-4" /> QR de Acesso — {studentName}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-gray-400">A carregar...</div>
        ) : qrCode ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <img src={qrCode.qrImage} alt={`QR de acesso de ${studentName}`} className="w-56 h-56 rounded-lg border border-gray-200" />
              <p className="text-xs text-gray-400">Gerado em {formatDate(qrCode.generatedAt)}</p>
            </div>
            <p className="text-xs text-gray-500">
              Este código dá acesso completo à conta do atleta na app mobile — partilha apenas com o encarregado de educação ou o próprio atleta.
            </p>
            <div className="flex gap-2">
              <a
                href={qrCode.qrImage}
                download={fileName}
                className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-2.5 rounded-xl text-sm font-medium transition"
              >
                <Download className="w-4 h-4" /> Descarregar
              </a>
              <button
                onClick={() => setShowRegenerateConfirm(true)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-amber-200 text-amber-700 hover:bg-amber-50 px-3 py-2.5 rounded-xl text-sm font-medium transition"
              >
                <RotateCw className="w-4 h-4" /> Regenerar
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm text-gray-500">Este atleta ainda não tem um QR de acesso gerado.</p>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="inline-flex items-center gap-1.5 bg-mastchieve-600 hover:bg-mastchieve-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
            >
              <QrCode className="w-4 h-4" /> {generateMutation.isPending ? 'A gerar...' : 'Gerar QR Code'}
            </button>
          </div>
        )}
      </div>

      {showRegenerateConfirm && (
        <ConfirmDialog
          title="Regenerar QR Code"
          message="Vai ser gerado um novo QR Code. O código atual deixa imediatamente de funcionar — quem já o tiver guardado não conseguirá voltar a entrar com ele."
          confirmLabel="Regenerar"
          danger
          isPending={generateMutation.isPending}
          onConfirm={() => generateMutation.mutate()}
          onCancel={() => setShowRegenerateConfirm(false)}
        />
      )}
    </div>
  );
}
