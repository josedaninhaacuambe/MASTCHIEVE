import { create } from 'zustand';

type ToastVariant = 'success' | 'error' | 'warning' | 'default';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (t) =>
    set((s) => ({
      toasts: [...s.toasts, { ...t, id: Math.random().toString(36).slice(2) }],
    })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

function add(variant: ToastVariant, title: string, description?: string) {
  useToastStore.getState().add({ variant, title, description });
}

export const toast = {
  success: (title: string, description?: string) => add('success', title, description),
  error: (title: string, description?: string) => add('error', title, description),
  warning: (title: string, description?: string) => add('warning', title, description),
  info: (title: string, description?: string) => add('default', title, description),
};
