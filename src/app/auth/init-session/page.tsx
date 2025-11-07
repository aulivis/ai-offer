'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ensureSession, resetSessionState } from '@/lib/supabaseClient';

/**
 * Client-side session initialization page.
 * 
 * This page is used after OAuth callbacks to ensure the Supabase client
 * session is properly initialized from cookies before redirecting to the
 * final destination (e.g., dashboard).
 * 
 * Flow:
 * 1. OAuth callback sets cookies server-side
 * 2. Redirects to this page
 * 3. This page initializes the Supabase client session from cookies
 * 4. Verifies the session is ready
 * 5. Redirects to the final destination
 */
export default function InitSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'initializing' | 'success' | 'error'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const redirectTo = searchParams?.get('redirect') || '/dashboard';
    const expectedUserId = searchParams?.get('user_id') || undefined;

    const initialize = async () => {
      try {
        // Reset any stale session state
        resetSessionState();

        // Wait a bit for cookies to be available (browser cookie propagation)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if cookies are available
        const accessToken = getCookie('propono_at');
        const refreshToken = getCookie('propono_rt');

        if (!accessToken || !refreshToken) {
          // Cookies not available yet, wait and retry
          for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
            const retryAccessToken = getCookie('propono_at');
            const retryRefreshToken = getCookie('propono_rt');
            
            if (retryAccessToken && retryRefreshToken) {
              break;
            }
            
            if (attempt === 4) {
              throw new Error('Authentication cookies not found. Please try logging in again.');
            }
          }
        }

        // Initialize session with exponential backoff retry
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            await ensureSession(expectedUserId);
            
            // Verify session was initialized by checking if we can get user info
            const { getSupabaseClient } = await import('@/lib/supabaseClient');
            const client = getSupabaseClient();
            const { data: { session }, error: sessionError } = await client.auth.getSession();
            
            if (sessionError) {
              throw new Error(`Session verification failed: ${sessionError.message}`);
            }
            
            if (!session || !session.user) {
              throw new Error('Session initialized but no user found');
            }
            
            if (expectedUserId && session.user.id !== expectedUserId) {
              throw new Error(
                `Session user ID mismatch: expected ${expectedUserId}, got ${session.user.id}`
              );
            }
            
            // Success!
            if (mounted) {
              setUserId(session.user.id);
              setStatus('success');
              
              // Small delay to ensure session is fully propagated
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Redirect to final destination
              router.replace(redirectTo);
            }
            
            return;
          } catch (err) {
            lastError = err instanceof Error ? err : new Error('Unknown error');
            
            // If this isn't the last attempt, wait before retrying with exponential backoff
            if (attempt < 4) {
              const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5 seconds
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        // All retries failed
        throw lastError || new Error('Failed to initialize session after multiple attempts');
      } catch (err) {
        if (!mounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize session';
        console.error('Session initialization failed:', err);
        setError(errorMessage);
        setStatus('error');
        
        // Redirect to login after a delay with error message
        setTimeout(() => {
          const errorParam = encodeURIComponent(errorMessage);
          router.replace(`/login?error=${errorParam}&redirect=${encodeURIComponent(redirectTo)}`);
        }, 3000);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  // Helper to read cookies
  function getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() ?? null;
    }
    return null;
  }

  if (status === 'error') {
    return (
      <div style={{ 
        display: 'grid', 
        placeItems: 'center', 
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '500px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Session Initialization Failed
          </h1>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
            {error || 'An error occurred while initializing your session.'}
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid', 
      placeItems: 'center', 
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '500px' }}>
        <div style={{ 
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {status === 'success' ? 'Session Ready' : 'Initializing Session...'}
        </h1>
        <p style={{ color: '#6b7280' }}>
          {status === 'success' 
            ? `Welcome! Redirecting to dashboard...`
            : 'Please wait while we set up your session.'}
        </p>
        {userId && (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            User ID: {userId.slice(0, 8)}...
          </p>
        )}
      </div>
    </div>
  );
}

