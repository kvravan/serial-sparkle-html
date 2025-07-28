import { SerialInventory, ASN, Product } from '@/types';

// Global State Interface
export interface GlobalState {
  // Core Data
  serials: SerialInventory[];
  asns: ASN[];
  products: Product[];
  
  // UI State
  ui: {
    activeTab: string;
    selectedSerial: SerialInventory | null;
    selectedASN: ASN | null;
    selectedProduct: Product | null;
    searchTerms: {
      serials: string;
      asns: string;
      products: string;
    };
    filters: {
      serialStatus: SerialInventory['status'] | 'all';
      asnStatus: ASN['status'] | 'all';
    };
    modals: {
      serialDetail: boolean;
      asnDetail: boolean;
      addSerial: boolean;
      addASN: boolean;
      assignSerials: boolean;
      uploadChildSerials: boolean;
      importSerials: boolean;
    };
  };
  
  // System State
  system: {
    loading: boolean;
    lastUpdated: number;
    errors: string[];
  };
}

// Default State
const defaultState: GlobalState = {
  serials: [],
  asns: [],
  products: [],
  ui: {
    activeTab: 'products',
    selectedSerial: null,
    selectedASN: null,
    selectedProduct: null,
    searchTerms: {
      serials: '',
      asns: '',
      products: ''
    },
    filters: {
      serialStatus: 'all',
      asnStatus: 'all'
    },
    modals: {
      serialDetail: false,
      asnDetail: false,
      addSerial: false,
      addASN: false,
      assignSerials: false,
      uploadChildSerials: false,
      importSerials: false
    }
  },
  system: {
    loading: false,
    lastUpdated: Date.now(),
    errors: []
  }
};

// Global Store Manager Class
class GlobalStoreManager {
  private state: GlobalState = defaultState;
  private subscribers: Set<(state: GlobalState) => void> = new Set();
  private db: IDBDatabase | null = null;
  
  private readonly DB_NAME = 'GlobalStateDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'globalState';

  // Initialize IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadState().then(() => resolve());
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  // Subscribe to state changes
  subscribe(callback: (state: GlobalState) => void): () => void {
    this.subscribers.add(callback);
    // Immediately call with current state
    callback(this.state);
    
    return () => this.subscribers.delete(callback);
  }

  // Get current state
  getState(): GlobalState {
    return { ...this.state };
  }

  // Update state
  setState(updater: (state: GlobalState) => Partial<GlobalState>): void {
    const updates = updater(this.state);
    this.state = {
      ...this.state,
      ...updates,
      system: {
        ...this.state.system,
        ...updates.system,
        lastUpdated: Date.now()
      }
    };
    
    this.notifySubscribers();
    this.saveState();
  }

  // Notify all subscribers
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // Load state from IndexedDB
  private async loadState(): Promise<void> {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get('state');
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          if (request.result) {
            this.state = {
              ...defaultState,
              ...request.result,
              system: {
                ...defaultState.system,
                ...request.result.system,
                lastUpdated: Date.now()
              }
            };
          } else {
            // Initialize with default data if no state exists
            this.state = {
              ...defaultState,
              serials: this.getDefaultSerials(),
              asns: this.getDefaultASNs(),
              products: this.getDefaultProducts()
            };
          }
          this.notifySubscribers();
          resolve();
        };
        
        request.onerror = () => {
          console.error('Failed to load state from IndexedDB');
          this.state = {
            ...defaultState,
            serials: this.getDefaultSerials(),
            asns: this.getDefaultASNs(),
            products: this.getDefaultProducts()
          };
          this.notifySubscribers();
          resolve();
        };
      });
    } catch (error) {
      console.error('Error loading state:', error);
    }
  }

  // Save state to IndexedDB
  private async saveState(): Promise<void> {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.put(this.state, 'state');
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  // Action methods for data manipulation
  addSerials(serials: SerialInventory[]): void {
    this.setState(state => ({
      serials: [...state.serials, ...serials]
    }));
  }

  updateSerial(updatedSerial: SerialInventory): void {
    this.setState(state => ({
      serials: state.serials.map(serial => 
        serial.id === updatedSerial.id ? updatedSerial : serial
      )
    }));
  }

  deleteSerial(serialId: string): void {
    this.setState(state => ({
      serials: state.serials.filter(serial => serial.id !== serialId)
    }));
  }

  updateSerialStatus(serialId: string, status: SerialInventory['status'], asnId?: string): void {
    this.setState(state => ({
      serials: state.serials.map(serial => 
        serial.id === serialId 
          ? { ...serial, status, asn_id: asnId, updated_date: new Date() }
          : serial
      )
    }));
  }

  addASN(asn: ASN): void {
    this.setState(state => ({
      asns: [...state.asns, asn]
    }));
  }

  updateASN(updatedASN: ASN): void {
    this.setState(state => ({
      asns: state.asns.map(asn => 
        asn.id === updatedASN.id ? updatedASN : asn
      )
    }));
  }

  deleteASN(asnId: string): void {
    this.setState(state => ({
      asns: state.asns.filter(asn => asn.id !== asnId)
    }));
  }

  addProduct(product: Product): void {
    this.setState(state => ({
      products: [...state.products, product]
    }));
  }

  updateProduct(updatedProduct: Product): void {
    this.setState(state => ({
      products: state.products.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      )
    }));
  }

  deleteProduct(productId: string): void {
    this.setState(state => ({
      products: state.products.filter(product => product.id !== productId)
    }));
  }

  // UI State Actions
  setActiveTab(tab: string): void {
    this.setState(state => ({
      ui: { ...state.ui, activeTab: tab }
    }));
  }

  setSelectedSerial(serial: SerialInventory | null): void {
    this.setState(state => ({
      ui: { ...state.ui, selectedSerial: serial }
    }));
  }

  setSelectedASN(asn: ASN | null): void {
    this.setState(state => ({
      ui: { ...state.ui, selectedASN: asn }
    }));
  }

  setSelectedProduct(product: Product | null): void {
    this.setState(state => ({
      ui: { ...state.ui, selectedProduct: product }
    }));
  }

  setSearchTerm(type: 'serials' | 'asns' | 'products', term: string): void {
    this.setState(state => ({
      ui: {
        ...state.ui,
        searchTerms: { ...state.ui.searchTerms, [type]: term }
      }
    }));
  }

  setFilter(type: 'serialStatus' | 'asnStatus', value: any): void {
    this.setState(state => ({
      ui: {
        ...state.ui,
        filters: { ...state.ui.filters, [type]: value }
      }
    }));
  }

  toggleModal(modal: keyof GlobalState['ui']['modals'], open?: boolean): void {
    this.setState(state => ({
      ui: {
        ...state.ui,
        modals: {
          ...state.ui.modals,
          [modal]: open !== undefined ? open : !state.ui.modals[modal]
        }
      }
    }));
  }

  // System State Actions
  setLoading(loading: boolean): void {
    this.setState(state => ({
      system: { ...state.system, loading }
    }));
  }

  addError(error: string): void {
    this.setState(state => ({
      system: {
        ...state.system,
        errors: [...state.system.errors, error]
      }
    }));
  }

  clearErrors(): void {
    this.setState(state => ({
      system: { ...state.system, errors: [] }
    }));
  }

  // Computed/Derived State Methods
  getSerialsByStatus(status: SerialInventory['status']): SerialInventory[] {
    return this.state.serials.filter(s => s.status === status);
  }

  getSerialsByASN(asnId: string): SerialInventory[] {
    return this.state.serials.filter(s => s.asn_id === asnId);
  }

  getSerialsByPartNumber(partNumberId: string): SerialInventory[] {
    return this.state.serials.filter(s => s.part_number_id === partNumberId);
  }

  getSerialCounts(): {
    total: number;
    unassigned: number;
    blocked: number;
    assigned: number;
  } {
    return {
      total: this.state.serials.length,
      unassigned: this.state.serials.filter(s => s.status === 'unassigned').length,
      blocked: this.state.serials.filter(s => s.status === 'blocked').length,
      assigned: this.state.serials.filter(s => s.status === 'assigned').length,
    };
  }

  getFilteredSerials(): SerialInventory[] {
    const { searchTerms, filters } = this.state.ui;
    let filtered = this.state.serials;

    // Apply status filter
    if (filters.serialStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filters.serialStatus);
    }

    // Apply search term
    if (searchTerms.serials) {
      const term = searchTerms.serials.toLowerCase();
      filtered = filtered.filter(s => 
        s.serial_number.toLowerCase().includes(term) ||
        s.part_number_id.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  getFilteredASNs(): ASN[] {
    const { searchTerms, filters } = this.state.ui;
    let filtered = this.state.asns;

    // Apply status filter
    if (filters.asnStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filters.asnStatus);
    }

    // Apply search term
    if (searchTerms.asns) {
      const term = searchTerms.asns.toLowerCase();
      filtered = filtered.filter(a => 
        a.asn_number.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  getFilteredProducts(): Product[] {
    const { searchTerms } = this.state.ui;
    let filtered = this.state.products;

    // Apply search term
    if (searchTerms.products) {
      const term = searchTerms.products.toLowerCase();
      filtered = filtered.filter(p => 
        p.buyer_part_number.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  // Default data methods (moved from serialStore.ts)
  private getDefaultSerials(): SerialInventory[] {
    return [
      {
        id: '1',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '1',
        serial_number: 'CPU001X7001',
        status: 'blocked',
        asn_id: '1',
        created_date: new Date('2024-01-15'),
        updated_date: new Date('2024-01-20'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '2',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '1',
        serial_number: 'CPU001X7002',
        status: 'assigned',
        asn_id: '1',
        created_date: new Date('2024-01-16'),
        updated_date: new Date('2024-01-21'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '3',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '1',
        serial_number: 'CPU001X7003',
        status: 'unassigned',
        created_date: new Date('2024-01-17'),
        updated_date: new Date('2024-01-17'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '4',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '1',
        serial_number: 'CPU001X7004',
        status: 'unassigned',
        created_date: new Date('2024-01-18'),
        updated_date: new Date('2024-01-18'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '5',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '2',
        serial_number: 'MEM002DDR5001',
        status: 'unassigned',
        created_date: new Date('2024-01-19'),
        updated_date: new Date('2024-01-19'),
        created_by: 'admin',
        updated_by: 'admin'
      }
    ];
  }

  private getDefaultASNs(): ASN[] {
    return [
      {
        id: '1',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        asn_number: 'ASN001',
        status: 'draft',
        ship_date: new Date('2024-02-01'),
        delivery_date: new Date('2024-02-05'),
        created_date: new Date('2024-01-25'),
        updated_date: new Date('2024-01-25'),
        items: []
      },
      {
        id: '2',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        asn_number: 'ASN002',
        status: 'submitted',
        ship_date: new Date('2024-02-03'),
        delivery_date: new Date('2024-02-07'),
        created_date: new Date('2024-01-27'),
        updated_date: new Date('2024-01-30'),
        items: []
      }
    ];
  }

  private getDefaultProducts(): Product[] {
    return [
      {
        id: '1',
        buyer_identifier: 'ACME-CPU-001',
        supplier_identifier: 'INTEL-i7-13700K',
        buyer_part_number: 'CPU001',
        description: 'Intel Core i7-13700K Processor',
        price: 450.99,
        dimensions: '37.5 x 37.5 x 7.4 mm',
        created_date: new Date('2024-01-01'),
        updated_date: new Date('2024-01-01')
      },
      {
        id: '2',
        buyer_identifier: 'ACME-MEM-002',
        supplier_identifier: 'CORSAIR-32GB-DDR5',
        buyer_part_number: 'MEM002',
        description: 'Corsair Vengeance 32GB DDR5-5600',
        price: 189.99,
        dimensions: '133.35 x 7.0 x 34.1 mm',
        created_date: new Date('2024-01-02'),
        updated_date: new Date('2024-01-02')
      }
    ];
  }
}

// Create global instance
export const globalStore = new GlobalStoreManager();

// Initialize the store
globalStore.init().catch(console.error);