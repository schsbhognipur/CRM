import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} — College CMS`;
    return () => {
      document.title = 'College CMS';
    };
  }, [title]);
};
