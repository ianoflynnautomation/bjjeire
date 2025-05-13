// Basic URL formatter
export const formatDisplayUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    try {
      const parsedUrl = new URL(url);
      // Remove 'www.' and trailing slash for cleaner display
      return parsedUrl.hostname.replace(/^www\./, '') + parsedUrl.pathname.replace(/\/$/, '');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // If URL is invalid, return it as is or a modified version
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    }
  };
  
  // Function to ensure URL has a scheme for external links
  export const ensureExternalUrlScheme = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };