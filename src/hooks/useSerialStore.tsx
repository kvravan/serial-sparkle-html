import { useState, useEffect } from 'react';
import { serialStore, SerialStore } from '@/lib/serialStore';
import { SerialInventory } from '@/types';

export const useSerialStore = () => {
  const [store, setStore] = useState<SerialStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadStore = async () => {
      try {
        const storeData = await serialStore.getStore();
        if (mounted) {
          setStore(storeData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load serial store:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const unsubscribe = serialStore.subscribe(() => {
      loadStore();
    });

    loadStore();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const addSerials = async (serials: SerialInventory[]) => {
    await serialStore.addSerials(serials);
  };

  const updateSerial = async (serial: SerialInventory) => {
    await serialStore.updateSerial(serial);
  };

  const updateSerialStatus = async (serialId: string, status: SerialInventory['status'], asnId?: string) => {
    await serialStore.updateSerialStatus(serialId, status, asnId);
  };

  const getSerialsByStatus = async (status: SerialInventory['status']) => {
    return await serialStore.getSerialsByStatus(status);
  };

  const getSerialsByASN = async (asnId: string) => {
    return await serialStore.getSerialsByASN(asnId);
  };

  const getSerialsByPartNumber = async (partNumberId: string) => {
    return await serialStore.getSerialsByPartNumber(partNumberId);
  };

  const getSerialCounts = async () => {
    return await serialStore.getSerialCounts();
  };

  return {
    store,
    loading,
    addSerials,
    updateSerial,
    updateSerialStatus,
    getSerialsByStatus,
    getSerialsByASN,
    getSerialsByPartNumber,
    getSerialCounts,
  };
};