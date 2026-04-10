import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const useRealtimeDashboard = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabaseClient
      .channel('transactions-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Transaction' },
        (payload) => {
          console.log('Realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [queryClient]);
};
