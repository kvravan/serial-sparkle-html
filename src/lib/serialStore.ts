import { SerialInventory, ASN, Product } from '@/types';

export interface SerialStore {
  serials: SerialInventory[];
  asns: ASN[];
  products: Product[];
  lastUpdated: number;
}

const DB_NAME = 'SerialManagementDB';
const DB_VERSION = 1;
const STORE_NAME = 'serialStore';

class SerialStoreManager {
  private db: IDBDatabase | null = null;
  private subscribers: Set<() => void> = new Set();

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }

  async getStore(): Promise<SerialStore> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('data');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Initialize with default data
          const defaultStore: SerialStore = {
            serials: this.getDefaultSerials(),
            asns: this.getDefaultASNs(),
            products: this.getDefaultProducts(),
            lastUpdated: Date.now()
          };
          this.setStore(defaultStore);
          resolve(defaultStore);
        }
      };
    });
  }

  async setStore(data: SerialStore): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ ...data, lastUpdated: Date.now() }, 'data');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.notifySubscribers();
        resolve();
      };
    });
  }

  async addSerials(serials: SerialInventory[]): Promise<void> {
    const store = await this.getStore();
    store.serials.push(...serials);
    await this.setStore(store);
  }

  async updateSerial(updatedSerial: SerialInventory): Promise<void> {
    const store = await this.getStore();
    const index = store.serials.findIndex(s => s.id === updatedSerial.id);
    if (index !== -1) {
      store.serials[index] = updatedSerial;
      await this.setStore(store);
    }
  }

  async updateSerialStatus(serialId: string, status: SerialInventory['status'], asnId?: string): Promise<void> {
    const store = await this.getStore();
    const serial = store.serials.find(s => s.id === serialId);
    if (serial) {
      serial.status = status;
      serial.asn_id = asnId;
      serial.updated_date = new Date();
      await this.setStore(store);
    }
  }

  async getSerialsByStatus(status: SerialInventory['status']): Promise<SerialInventory[]> {
    const store = await this.getStore();
    return store.serials.filter(s => s.status === status);
  }

  async getSerialsByASN(asnId: string): Promise<SerialInventory[]> {
    const store = await this.getStore();
    return store.serials.filter(s => s.asn_id === asnId);
  }

  async getSerialsByPartNumber(partNumberId: string): Promise<SerialInventory[]> {
    const store = await this.getStore();
    return store.serials.filter(s => s.part_number_id === partNumberId);
  }

  async getSerialCounts(): Promise<{
    total: number;
    unassigned: number;
    blocked: number;
    assigned: number;
  }> {
    const store = await this.getStore();
    return {
      total: store.serials.length,
      unassigned: store.serials.filter(s => s.status === 'unassigned').length,
      blocked: store.serials.filter(s => s.status === 'blocked').length,
      assigned: store.serials.filter(s => s.status === 'assigned').length,
    };
  }

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
        asn_number: 'ASN-2024-001',
        status: 'draft',
        ship_date: new Date('2024-02-15'),
        created_date: new Date('2024-01-15'),
        updated_date: new Date('2024-01-20'),
        items: [
          {
            id: 'item1',
            asn_id: '1',
            part_number_id: '1',
            buyer_part_number: 'CPU-001-X7',
            ship_quantity: 10,
            lots: [
              {
                id: 'lot1',
                item_id: 'item1',
                lot_number: 'LOT001',
                quantity: 5
              },
              {
                id: 'lot2',
                item_id: 'item1',
                lot_number: 'LOT002',
                quantity: 5
              }
            ]
          },
          {
            id: 'item2',
            asn_id: '1',
            part_number_id: '2',
            buyer_part_number: 'MEM-002-DDR5',
            ship_quantity: 20,
            lots: [
              {
                id: 'lot3',
                item_id: 'item2',
                lot_number: 'LOT003',
                quantity: 15
              },
              {
                id: 'lot4',
                item_id: 'item2',
                lot_number: 'LOT004',
                quantity: 5
              }
            ]
          },
          {
            id: 'item3',
            asn_id: '1',
            part_number_id: '3',
            buyer_part_number: 'SSD-003-NVMe',
            ship_quantity: 8,
            lots: [
              {
                id: 'lot5',
                item_id: 'item3',
                lot_number: 'LOT005',
                quantity: 8
              }
            ]
          }
        ]
      },
      {
        id: '2',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        asn_number: 'ASN-2024-002',
        status: 'submitted',
        ship_date: new Date('2024-02-20'),
        created_date: new Date('2024-01-18'),
        updated_date: new Date('2024-01-25'),
        items: []
      }
    ];
  }

  private getDefaultProducts(): Product[] {
    return [
      {
        id: '1',
        buyer_identifier: 'ACME_CORP',
        supplier_identifier: 'TECH_SUPPLY_001',
        buyer_part_number: 'CPU-001-X7',
        description: 'High-performance processor unit with enhanced cooling',
        price: 299.99,
        dimensions: '40mm x 40mm x 5mm',
        created_date: new Date('2024-01-15'),
        updated_date: new Date('2024-01-20')
      },
      {
        id: '2',
        buyer_identifier: 'ACME_CORP',
        supplier_identifier: 'TECH_SUPPLY_001',
        buyer_part_number: 'MEM-002-DDR5',
        description: 'DDR5 Memory Module 32GB',
        price: 189.99,
        dimensions: '133mm x 30mm x 5mm',
        created_date: new Date('2024-01-10'),
        updated_date: new Date('2024-01-18')
      },
      {
        id: '3',
        buyer_identifier: 'BETA_SYSTEMS',
        supplier_identifier: 'COMPONENT_PLUS',
        buyer_part_number: 'SSD-003-NVMe',
        description: 'NVMe SSD 1TB High Speed Storage',
        price: 149.99,
        dimensions: '80mm x 22mm x 2.38mm',
        created_date: new Date('2024-01-12'),
        updated_date: new Date('2024-01-22')
      }
    ];
  }
}

export const serialStore = new SerialStoreManager();