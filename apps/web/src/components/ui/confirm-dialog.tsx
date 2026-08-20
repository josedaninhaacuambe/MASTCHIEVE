'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title, message, confirmLabel = 'Confirmar', danger, isPending, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className={danger ? 'w-4 h-4 text-red-500' : 'w-4 h-4 text-amber-500'} /> {title}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={
              danger
                ? 'flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition'
                : 'flex items-center gap-1.5 bg-mastchieve-600 hover:bg-mastchieve-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition'
            }
          >
            {isPending ? 'A processar...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
