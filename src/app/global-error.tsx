'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#111', margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '1rem' }}>💥</div>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Critical Error</h2>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>The application encountered a critical error. Please refresh the page.</p>
            <button
              onClick={reset}
              style={{ backgroundColor: '#ea580c', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            >
              Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
