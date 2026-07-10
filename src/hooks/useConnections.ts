import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../context/AuthContext';
import { connectDemo, disconnectDemo, syncDemo, ProviderId } from '../services/wearables';

export type ConnectionRow = Database['public']['Tables']['device_connections']['Row'];

export function useConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<ProviderId | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setConnections([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('device_connections').select('*').eq('user_id', user.id);
    if (error) {
      if (error.code !== '42P01') console.error('Error fetching connections:', error);
    } else {
      setConnections(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const isConnected = useCallback(
    (provider: ProviderId) => connections.some((c) => c.provider === provider && c.status === 'connected'),
    [connections]
  );

  const connect = useCallback(
    async (provider: ProviderId) => {
      if (!user || provider !== 'demo') return;
      setBusy(provider);
      try {
        await connectDemo(user.id);
        toast.success('Demo device connected — 90 days of data synced');
        await refresh();
      } catch (e) {
        console.error(e);
        toast.error('Could not connect. Is the health_platform migration applied?');
      } finally {
        setBusy(null);
      }
    },
    [user, refresh]
  );

  const sync = useCallback(
    async (provider: ProviderId) => {
      if (!user || provider !== 'demo') return;
      setBusy(provider);
      try {
        await syncDemo(user.id);
        toast.success('Synced');
        await refresh();
      } catch (e) {
        console.error(e);
        toast.error('Sync failed. Try again.');
      } finally {
        setBusy(null);
      }
    },
    [user, refresh]
  );

  const disconnect = useCallback(
    async (provider: ProviderId) => {
      if (!user || provider !== 'demo') return;
      setBusy(provider);
      try {
        await disconnectDemo(user.id);
        toast.success('Disconnected — demo data removed');
        await refresh();
      } catch (e) {
        console.error(e);
        toast.error('Could not disconnect. Try again.');
      } finally {
        setBusy(null);
      }
    },
    [user, refresh]
  );

  return { connections, loading, busy, isConnected, connect, sync, disconnect, refresh };
}
