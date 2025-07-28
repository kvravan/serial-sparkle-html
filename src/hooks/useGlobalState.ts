import { useState, useEffect } from 'react';
import { globalStore, GlobalState } from '@/store/globalStore';
import { SerialInventory, ASN, Product } from '@/types';

export const useGlobalState = () => {
  const [state, setState] = useState<GlobalState>(globalStore.getState());

  useEffect(() => {
    const unsubscribe = globalStore.subscribe(setState);
    return unsubscribe;
  }, []);

  // Core data actions
  const actions = {
    // Serial actions
    addSerials: (serials: SerialInventory[]) => globalStore.addSerials(serials),
    updateSerial: (serial: SerialInventory) => globalStore.updateSerial(serial),
    deleteSerial: (serialId: string) => globalStore.deleteSerial(serialId),
    updateSerialStatus: (serialId: string, status: SerialInventory['status'], asnId?: string) => 
      globalStore.updateSerialStatus(serialId, status, asnId),

    // ASN actions
    addASN: (asn: ASN) => globalStore.addASN(asn),
    updateASN: (asn: ASN) => globalStore.updateASN(asn),
    deleteASN: (asnId: string) => globalStore.deleteASN(asnId),

    // Product actions
    addProduct: (product: Product) => globalStore.addProduct(product),
    updateProduct: (product: Product) => globalStore.updateProduct(product),
    deleteProduct: (productId: string) => globalStore.deleteProduct(productId),

    // UI actions
    setActiveTab: (tab: string) => globalStore.setActiveTab(tab),
    setSelectedSerial: (serial: SerialInventory | null) => globalStore.setSelectedSerial(serial),
    setSelectedASN: (asn: ASN | null) => globalStore.setSelectedASN(asn),
    setSelectedProduct: (product: Product | null) => globalStore.setSelectedProduct(product),
    setSearchTerm: (type: 'serials' | 'asns' | 'products', term: string) => 
      globalStore.setSearchTerm(type, term),
    setFilter: (type: 'serialStatus' | 'asnStatus', value: any) => 
      globalStore.setFilter(type, value),
    toggleModal: (modal: keyof GlobalState['ui']['modals'], open?: boolean) => 
      globalStore.toggleModal(modal, open),

    // System actions
    setLoading: (loading: boolean) => globalStore.setLoading(loading),
    addError: (error: string) => globalStore.addError(error),
    clearErrors: () => globalStore.clearErrors(),
  };

  // Computed/derived data
  const computed = {
    getSerialsByStatus: (status: SerialInventory['status']) => globalStore.getSerialsByStatus(status),
    getSerialsByASN: (asnId: string) => globalStore.getSerialsByASN(asnId),
    getSerialsByPartNumber: (partNumberId: string) => globalStore.getSerialsByPartNumber(partNumberId),
    getSerialCounts: () => globalStore.getSerialCounts(),
    getFilteredSerials: () => globalStore.getFilteredSerials(),
    getFilteredASNs: () => globalStore.getFilteredASNs(),
    getFilteredProducts: () => globalStore.getFilteredProducts(),
  };

  return {
    state,
    actions,
    computed,
    // Quick access to commonly used state parts
    serials: state.serials,
    asns: state.asns,
    products: state.products,
    ui: state.ui,
    system: state.system,
  };
};

// Selectors for specific parts of state (optional, for performance optimization)
export const useSerials = () => {
  const { serials, actions, computed } = useGlobalState();
  return { serials, actions, computed };
};

export const useASNs = () => {
  const { asns, actions, computed } = useGlobalState();
  return { asns, actions, computed };
};

export const useProducts = () => {
  const { products, actions, computed } = useGlobalState();
  return { products, actions, computed };
};

export const useUIState = () => {
  const { ui, actions } = useGlobalState();
  return { ui, actions };
};

export const useSystemState = () => {
  const { system, actions } = useGlobalState();
  return { system, actions };
};