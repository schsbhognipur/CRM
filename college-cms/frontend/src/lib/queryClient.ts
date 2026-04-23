import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 404) return false;
        if (error?.response?.status === 403) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
    mutations: {
      onError: (error: any) => {
        const message = error?.response?.data?.message || "Something went wrong";
        toast.error(message);
      }
    }
  }
});
