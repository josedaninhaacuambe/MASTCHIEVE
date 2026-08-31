'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileAppBanner } from '@/components/layout/mobile-app-banner';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { OnboardingTour } from '@/components/onboarding-tour';
import { InstructorChecklistGate, useInstructorGateBlocking } from '@/components/instructor-checklist-gate';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen, closeSidebar, darkMode } = useUIStore();
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const isBlocking = useInstructorGateBlocking();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  // Apply persisted dark mode preference on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Bloqueia toda a navegação/interação com o resto da app enquanto a rotina
  // diária do instrutor estiver por preencher — `inert` não é uma prop JSX
  // tipada em React 18, por isso é aplicada directamente no nó DOM.
  useEffect(() => {
    if (shellRef.current) (shellRef.current as any).inert = isBlocking;
  }, [isBlocking]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div ref={shellRef} className="contents">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <MobileAppBanner />
          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      <PwaInstallPrompt />
      <OnboardingTour />
      <InstructorChecklistGate />
    </div>
  );
}
