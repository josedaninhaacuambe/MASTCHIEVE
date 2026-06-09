'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const DISMISSED_KEY = 'mastchieve-app-banner-dismissed';

export function MobileAppBanner() {
  const role = useAuthStore((s) => s.user?.role);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (role !== 'STUDENT' && role !== 'INSTRUCTOR') return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (!dismissed) setVisible(true);
  }, [role]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="relative flex items-center gap-3 px-4 py-2.5 text-sm overflow-hidden"
      style={{ background: 'linear-gradient(90deg, #0F1F5C 0%, #1A56DB 60%, #0891B2 100%)' }}
    >
      {/* Shimmer stripe */}
      <div className="absolute inset-y-0 left-0 w-1/3 bg-white/5 skew-x-[-20deg] translate-x-[-100%] animate-[banner-shimmer_3s_ease-in-out_infinite]" />

      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
        <Smartphone className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3">
        <span className="text-white font-semibold text-xs sm:text-sm whitespace-nowrap">
          App Mastchieve para mobile
        </span>
        <span className="text-white/60 text-xs truncate hidden sm:inline">
          Leva os teus treinos, feedback e progresso para onde quiseres — iOS &amp; Android
        </span>
      </div>

      <a
        href="#"
        onClick={(e) => { e.preventDefault(); dismiss(); }}
        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap flex-shrink-0"
      >
        Saber mais <ArrowRight className="w-3.5 h-3.5" />
      </a>

      <button
        onClick={dismiss}
        className="p-1 text-white/50 hover:text-white transition flex-shrink-0"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>

      <style jsx>{`
        @keyframes banner-shimmer {
          0%   { transform: translateX(-200%) skewX(-20deg); }
          50%  { transform: translateX(400%) skewX(-20deg); }
          100% { transform: translateX(400%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
}
