import LoginClient from './LoginClient';
import { Suspense } from 'react';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';

function LoginContent() {
  return <LoginClient />;
}

export default function Page() {
  return (
    <PageErrorBoundary>
      <Suspense
        fallback={
          <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 pb-16 pt-12">
            <div className="text-center">
              <p className="text-fg-muted">Betöltés...</p>
            </div>
          </main>
        }
      >
        <LoginContent />
      </Suspense>
    </PageErrorBoundary>
  );
}
