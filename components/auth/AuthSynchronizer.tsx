import React, { useEffect } from 'react';
import { isSupabase } from '@/lib/data/config';
import { getSupabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useStore';

export const AuthSynchronizer: React.FC = () => {
  useEffect(() => {
    if (!isSupabase()) return;

    const supabase = getSupabase();
    if (!supabase) return;

    // Listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const state = useAuthStore.getState();
      
      // If Zustand thinks the user is authenticated, but Supabase says they are signed out (or session is null on initial check)
      if (state.isAuthenticated) {
        if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
          console.warn(`[AuthSynchronizer] Desynchronization detected: Zustand state is active but Supabase session is invalid (${event}). Forcing logout...`);
          state.logout();
          window.location.replace('/dang-nhap');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
};
