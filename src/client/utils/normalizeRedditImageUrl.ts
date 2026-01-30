export const normalizeRedditImageUrl = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed, 'https://reddit.com');

    // Handle reddit.com/media?url=... wrappers
    if (parsed.hostname.endsWith('reddit.com') && parsed.pathname === '/media') {
      const target = parsed.searchParams.get('url');
      if (target) {
        return normalizeRedditImageUrl(target);
      }
    }

    // Prefer direct CDN host for preview links, keep query when present
    if (parsed.hostname === 'preview.redd.it') {
      return `https://i.redd.it${parsed.pathname}${parsed.search}`;
    }

    if (parsed.hostname.endsWith('redd.it')) {
      return `https://${parsed.hostname}${parsed.pathname}${parsed.search}`;
    }

    return parsed.toString();
  } catch {
    return trimmed;
  }
};
