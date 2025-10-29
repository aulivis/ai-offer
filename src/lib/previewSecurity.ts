export const PREVIEW_CSP_DIRECTIVE =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data: https:; font-src data:; connect-src 'none'; frame-ancestors 'none'";

export function injectPreviewCspMeta(html: string): string {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP_DIRECTIVE}" />`;
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>\n    ${meta}`);
  }
  return html;
}
