'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import Swagger UI CSS
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function DocsPage() {
  const [spec, setSpec] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the OpenAPI spec from the API endpoint
    fetch('/api/openapi')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load API documentation: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setSpec(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load API documentation');
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Documentation</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI spec={spec} />
    </div>
  );
}
