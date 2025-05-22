import { useCallback } from 'react';

export const useScrollToTop = () => {
  return useCallback(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);
};