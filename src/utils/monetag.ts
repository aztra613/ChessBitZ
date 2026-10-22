export const MONETAG_DIRECT_LINK = 'https://uplcm.com/4/12093544';

export function openDirectLink(): void {
  if (typeof window === 'undefined') return;
  window.open(MONETAG_DIRECT_LINK, '_blank', 'noopener,noreferrer');
}
