'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <main className="w-full min-h-screen bg-[#0a0b0e] text-white antialiased">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh bg-[#121212] text-white antialiased">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-3 sm:p-5 md:p-8 pt-16 md:pt-8 w-full max-w-full overflow-x-hidden min-h-dvh">
        {children}
      </main>
    </div>
  );
}
