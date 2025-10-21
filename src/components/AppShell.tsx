// src/components/AppShell.tsx
import TopNav from './TopNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-ink-900 dark:text-slate-100">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
