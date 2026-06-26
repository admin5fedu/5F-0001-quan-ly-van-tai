import DOMPurify from 'dompurify';

const BASE: any = {
  USE_PROFILES: { html: true },
};

/**
 * Sanitize untrusted HTML before `dangerouslySetInnerHTML`.
 * Keeps common rich-text tags from editors; strips scripts and event handlers.
 */
export function sanitizeHtml(dirty: string, extra?: any): string {
  if (!dirty?.trim()) return '';
  return DOMPurify.sanitize(dirty, { ...BASE, ...extra }) as unknown as string;
}
