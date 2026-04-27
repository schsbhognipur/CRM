import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Safely initialize client only if URL is present to avoid top-level crash
const supabaseClient = supabaseUrl ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const useRealtimeDashboard = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Realtime Dashboard: Supabase credentials missing. Pulse updates disabled.');
      return;
    }

    try {
      const channel = supabaseClient
        .channel('transactions-db-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'Transaction' },
          (payload) => {
            console.log('Realtime pulse received:', payload);
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          }
        )
        .subscribe();

      return () => {
        if (supabaseClient) {
          supabaseClient.removeChannel(channel);
        }
      };
    } catch (error) {
      console.error('❌ Realtime Dashboard: Subscription failed.', error);
    }
  }, [queryClient]);
};
