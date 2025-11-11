import { NextResponse, type NextRequest } from 'next/server';

/**
 * Supported API versions
 */
export const SUPPORTED_VERSIONS = ['v1'] as const;
export type ApiVersion = (typeof SUPPORTED_VERSIONS)[number];

/**
 * Current API version
 */
export const CURRENT_VERSION: ApiVersion = 'v1';

/**
 * Extracts API version from request URL
 * @param request The request object
 * @returns The API version or null if not found
 */
export function getApiVersion(request: NextRequest | Request): ApiVersion | null {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/(v\d+)\//);
  if (match && match[1]) {
    return match[1] as ApiVersion;
  }
  return null;
}

/**
 * Checks if an API version is supported
 * @param version The API version to check
 * @returns True if the version is supported
 */
export function isVersionSupported(version: string): version is ApiVersion {
  return SUPPORTED_VERSIONS.includes(version as ApiVersion);
}

/**
 * Adds version headers to response
 * @param response The response object
 * @param version The API version
 * @param deprecated Whether the version is deprecated
 * @param sunsetDate Optional sunset date for deprecated versions
 * @returns The response with version headers
 */
export function addVersionHeaders(
  response: NextResponse,
  version: ApiVersion,
  deprecated: boolean = false,
  sunsetDate?: string,
): NextResponse {
  response.headers.set('API-Version', version);
  response.headers.set('API-Version-Deprecated', deprecated.toString());
  response.headers.set('API-Version-Current', CURRENT_VERSION);

  if (deprecated && sunsetDate) {
    response.headers.set('Sunset', sunsetDate);
    response.headers.set(
      'Warning',
      `299 - "API version ${version} is deprecated. Please migrate to ${CURRENT_VERSION}."`,
    );
  }

  return response;
}

/**
 * Creates a response for unsupported API version
 * @param version The unsupported version
 * @returns Error response
 */
export function createUnsupportedVersionResponse(version: string): NextResponse {
  const response = NextResponse.json(
    {
      error: `API version ${version} is not supported.`,
      supportedVersions: SUPPORTED_VERSIONS,
      currentVersion: CURRENT_VERSION,
    },
    { status: 400 },
  );

  return addVersionHeaders(response, CURRENT_VERSION);
}

/**
 * Creates a response for deprecated API version
 * @param version The deprecated version
 * @param sunsetDate The sunset date
 * @returns Error response
 */
export function createDeprecatedVersionResponse(
  version: ApiVersion,
  sunsetDate: string,
): NextResponse {
  const response = NextResponse.json(
    {
      error: `API version ${version} is deprecated. Please migrate to ${CURRENT_VERSION}.`,
      currentVersion: CURRENT_VERSION,
      sunsetDate,
      migrationGuide: `/docs/api/migration/${version}-to-${CURRENT_VERSION}`,
    },
    { status: 410 }, // Gone
  );

  return addVersionHeaders(response, version, true, sunsetDate);
}

/**
 * Middleware to handle API versioning
 * @param handler The route handler
 * @returns Wrapped handler with versioning support
 */
export function withApiVersioning<T extends unknown[]>(
  handler: (
    req: NextRequest,
    version: ApiVersion,
    ...args: T
  ) => Promise<NextResponse> | NextResponse,
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const version = getApiVersion(req);

    // If no version specified, default to current version
    if (!version) {
      // Redirect to current version for backward compatibility
      const url = new URL(req.url);
      url.pathname = url.pathname.replace('/api/', `/api/${CURRENT_VERSION}/`);
      return NextResponse.redirect(url, 308); // Permanent redirect
    }

    // Check if version is supported
    if (!isVersionSupported(version)) {
      return createUnsupportedVersionResponse(version);
    }

    // Check if version is deprecated (future use)
    // const isDeprecated = DEPRECATED_VERSIONS.includes(version);
    // if (isDeprecated) {
    //   return createDeprecatedVersionResponse(version, SUNSET_DATES[version]);
    // }

    // Call handler with version
    const response = await handler(req, version, ...args);

    // Add version headers
    return addVersionHeaders(response, version);
  };
}

/**
 * Gets API version information
 * @returns Version information object
 */
export function getApiVersionInfo() {
  return {
    versions: SUPPORTED_VERSIONS,
    current: CURRENT_VERSION,
    deprecated: [] as ApiVersion[],
  };
}
