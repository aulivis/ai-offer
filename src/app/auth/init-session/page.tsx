'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ensureSession, resetSessionState } from '@/lib/supabaseClient';
import { t } from '@/copy';

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

        // Small initial delay to ensure cookies from redirect are processed by the browser
        // This is important because cookies set in a redirect response need time to be
        // stored by the browser before they can be sent with subsequent requests
        await new Promise(resolve => setTimeout(resolve, 100));

        // Fetch tokens from server-side API endpoint with retries
        // This endpoint reads HttpOnly cookies server-side and returns tokens
        // so we can initialize the Supabase client session
        // We retry because cookies might need time to propagate after redirect
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        let verifiedUserId: string | null = null;
        
        const maxRetries = 5;
        let lastFetchError: Error | null = null;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            // Wait before each attempt (exponential backoff)
            // First attempt already waited 100ms, so wait more on retries
            if (attempt > 0) {
              const delay = Math.min(300 * Math.pow(1.5, attempt - 1), 2000);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            const verifyResponse = await fetch('/api/auth/init-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ expectedUserId }),
              credentials: 'include',
              cache: 'no-store',
            });
            
            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json().catch(() => ({}));
              
              // If cookies not found and we have retries left, try again
              if (errorData.hasCookies === false && attempt < maxRetries - 1) {
                console.warn(`Cookies not found, retrying... (attempt ${attempt + 1}/${maxRetries})`, {
                  status: verifyResponse.status,
                  error: errorData.error,
                  debug: errorData.debug,
                });
                lastFetchError = new Error(errorData.error || 'Cookies not found');
                continue;
              }
              
              console.warn('Failed to get tokens from server', {
                status: verifyResponse.status,
                error: errorData.error,
                hasCookies: errorData.hasCookies,
                attempt: attempt + 1,
              });
              
              if (!errorData.hasCookies) {
                throw new Error(t('errors.auth.cookiesNotFound'));
              }
              
              throw new Error(errorData.error || t('errors.initSession.error'));
            }
            
            const verifyData = await verifyResponse.json();
            if (!verifyData.success || !verifyData.accessToken || !verifyData.refreshToken) {
              throw new Error(t('errors.initSession.error'));
            }
            
            accessToken = verifyData.accessToken;
            refreshToken = verifyData.refreshToken;
            verifiedUserId = verifyData.userId;
            
            console.log('Tokens received from server', { 
              userId: verifiedUserId,
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              attempt: attempt + 1,
            });
            
            // Success! Break out of retry loop
            break;
          } catch (fetchError) {
            lastFetchError = fetchError instanceof Error ? fetchError : new Error('Unknown error');
            
            // If this is the last attempt, throw the error
            if (attempt === maxRetries - 1) {
              console.error('Failed to fetch tokens from API after all retries', lastFetchError);
              throw lastFetchError;
            }
            
            // Otherwise, log and continue to next retry
            console.warn(`Failed to fetch tokens (attempt ${attempt + 1}/${maxRetries}), retrying...`, lastFetchError.message);
          }
        }
        
        // If we got here without tokens, something went wrong
        if (!accessToken || !refreshToken) {
          throw lastFetchError || new Error(t('errors.initSession.error'));
        }
        
        // Now initialize Supabase client session with the tokens
        const { getSupabaseClient } = await import('@/lib/supabaseClient');
        const client = getSupabaseClient();
        
        let sessionInitialized = false;
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt < 6; attempt++) {
          try {
            // Set the session using the tokens we got from the server
            const { data, error: setError } = await client.auth.setSession({
              access_token: accessToken!,
              refresh_token: refreshToken!,
            });
            
            if (setError) {
              throw new Error(`Failed to set session: ${setError.message}`);
            }
            
            if (!data.session || !data.session.user) {
              throw new Error('Session set but no user found');
            }
            
            // Verify user ID matches
            if (expectedUserId && data.session.user.id !== expectedUserId) {
              throw new Error(
                `Session user ID mismatch: expected ${expectedUserId}, got ${data.session.user.id}`
              );
            }
            
            // Verify session is actually active
            await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
            
            const { data: { session: verifySession }, error: verifyError } = await client.auth.getSession();
            
            if (verifyError) {
              throw new Error(`Session verification failed: ${verifyError.message}`);
            }
            
            if (!verifySession || !verifySession.user) {
              throw new Error('Session not found after initialization');
            }
            
            if (verifySession.user.id !== data.session.user.id) {
              throw new Error('Session user ID changed after initialization');
            }
            
            // Success!
            sessionInitialized = true;
            verifiedUserId = verifySession.user.id;
            console.log('Session initialized successfully', { userId: verifiedUserId });
            break;
          } catch (err) {
            lastError = err instanceof Error ? err : new Error('Unknown error');
            console.warn(`Session initialization attempt ${attempt + 1} failed:`, lastError.message);
            
            // If this isn't the last attempt, wait before retrying
            if (attempt < 5) {
              const delay = Math.min(200 * Math.pow(1.5, attempt), 1500);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        if (!sessionInitialized || !verifiedUserId) {
          throw lastError || new Error(t('errors.initSession.error'));
        }
        
        // Success!
        if (mounted) {
          setUserId(verifiedUserId);
          setStatus('success');
          
          // Small delay to ensure session is fully propagated
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Redirect to final destination
          router.replace(redirectTo);
        }
      } catch (err) {
        if (!mounted) return;
        
        const errorMessage = err instanceof Error ? err.message : t('errors.initSession.error');
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
          <div style={{ 
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '24px', height: '24px', color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
            {t('errors.initSession.error')}
          </h1>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
            {error || t('errors.initSession.errorDescription')}
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {t('errors.initSession.redirectingToLogin')}
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
      textAlign: 'center',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ maxWidth: '500px' }}>
        <div style={{ 
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#111827' }}>
          {status === 'success' ? t('errors.initSession.success') : t('errors.initSession.initializing')}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: '1.6' }}>
          {status === 'success' 
            ? t('errors.initSession.redirectingToDashboard')
            : t('errors.initSession.pleaseWait')}
        </p>
        {status === 'success' && (
          <div style={{ 
            marginTop: '1.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#d1fae5',
            borderRadius: '0.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#065f46',
            fontSize: '0.875rem'
          }}>
            <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{t('errors.initSession.redirecting')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

