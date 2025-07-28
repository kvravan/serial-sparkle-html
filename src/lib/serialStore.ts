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
      },
      {
        id: '6',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '2',
        serial_number: 'MEM002DDR5002',
        status: 'blocked',
        asn_id: '1',
        created_date: new Date('2024-01-20'),
        updated_date: new Date('2024-01-25'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '7',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '3',
        serial_number: 'SSD003NVME001',
        status: 'unassigned',
        created_date: new Date('2024-01-21'),
        updated_date: new Date('2024-01-21'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '8',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '3',
        serial_number: 'SSD003NVME002',
        status: 'assigned',
        asn_id: '1',
        created_date: new Date('2024-01-22'),
        updated_date: new Date('2024-01-27'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '9',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '4',
        serial_number: 'GPU004RTX001',
        status: 'unassigned',
        created_date: new Date('2024-01-23'),
        updated_date: new Date('2024-01-23'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '10',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '4',
        serial_number: 'GPU004RTX002',
        status: 'blocked',
        asn_id: '2',
        created_date: new Date('2024-01-24'),
        updated_date: new Date('2024-01-29'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '11',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '5',
        serial_number: 'MB005Z690001',
        status: 'unassigned',
        created_date: new Date('2024-01-25'),
        updated_date: new Date('2024-01-25'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '12',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '5',
        serial_number: 'MB005Z690002',
        status: 'assigned',
        asn_id: '2',
        created_date: new Date('2024-01-26'),
        updated_date: new Date('2024-01-31'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '13',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        part_number_id: '6',
        serial_number: 'PSU006850W001',
        status: 'unassigned',
        created_date: new Date('2024-01-27'),
        updated_date: new Date('2024-01-27'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '14',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        part_number_id: '6',
        serial_number: 'PSU006850W002',
        status: 'blocked',
        asn_id: '3',
        created_date: new Date('2024-01-28'),
        updated_date: new Date('2024-02-02'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '15',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        part_number_id: '7',
        serial_number: 'CASE007ATX001',
        status: 'unassigned',
        created_date: new Date('2024-01-29'),
        updated_date: new Date('2024-01-29'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '16',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        part_number_id: '7',
        serial_number: 'CASE007ATX002',
        status: 'assigned',
        asn_id: '3',
        created_date: new Date('2024-01-30'),
        updated_date: new Date('2024-02-04'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '17',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '8',
        serial_number: 'COOL008AIO001',
        status: 'unassigned',
        created_date: new Date('2024-02-01'),
        updated_date: new Date('2024-02-01'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '18',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '8',
        serial_number: 'COOL008AIO002',
        status: 'blocked',
        asn_id: '1',
        created_date: new Date('2024-02-02'),
        updated_date: new Date('2024-02-07'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '19',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '9',
        serial_number: 'FAN009120MM001',
        status: 'unassigned',
        created_date: new Date('2024-02-03'),
        updated_date: new Date('2024-02-03'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '20',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '9',
        serial_number: 'FAN009120MM002',
        status: 'assigned',
        asn_id: '2',
        created_date: new Date('2024-02-04'),
        updated_date: new Date('2024-02-09'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '21',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '10',
        serial_number: 'MON01027IN001',
        status: 'unassigned',
        created_date: new Date('2024-02-06'),
        updated_date: new Date('2024-02-06'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '22',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '10',
        serial_number: 'MON01027IN002',
        status: 'blocked',
        asn_id: '4',
        created_date: new Date('2024-02-07'),
        updated_date: new Date('2024-02-12'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '23',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '11',
        serial_number: 'KB011MECH001',
        status: 'unassigned',
        created_date: new Date('2024-02-08'),
        updated_date: new Date('2024-02-08'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '24',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '11',
        serial_number: 'KB011MECH002',
        status: 'assigned',
        asn_id: '4',
        created_date: new Date('2024-02-09'),
        updated_date: new Date('2024-02-14'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '25',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '12',
        serial_number: 'MOUSE012WIRELESS001',
        status: 'unassigned',
        created_date: new Date('2024-02-10'),
        updated_date: new Date('2024-02-10'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '26',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '12',
        serial_number: 'MOUSE012WIRELESS002',
        status: 'blocked',
        asn_id: '4',
        created_date: new Date('2024-02-11'),
        updated_date: new Date('2024-02-16'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '27',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '13',
        serial_number: 'NET013WIFI6001',
        status: 'unassigned',
        created_date: new Date('2024-02-12'),
        updated_date: new Date('2024-02-12'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '28',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '13',
        serial_number: 'NET013WIFI6002',
        status: 'assigned',
        asn_id: '5',
        created_date: new Date('2024-02-13'),
        updated_date: new Date('2024-02-18'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '29',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '14',
        serial_number: 'CABLE014USBC001',
        status: 'unassigned',
        created_date: new Date('2024-02-14'),
        updated_date: new Date('2024-02-14'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '30',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '14',
        serial_number: 'CABLE014USBC002',
        status: 'blocked',
        asn_id: '5',
        created_date: new Date('2024-02-15'),
        updated_date: new Date('2024-02-20'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '31',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '15',
        serial_number: 'ADAPTER015POWER001',
        status: 'unassigned',
        created_date: new Date('2024-02-16'),
        updated_date: new Date('2024-02-16'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '32',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        part_number_id: '15',
        serial_number: 'ADAPTER015POWER002',
        status: 'assigned',
        asn_id: '5',
        created_date: new Date('2024-02-17'),
        updated_date: new Date('2024-02-22'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '33',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        part_number_id: '16',
        serial_number: 'SPEAKER0162.1001',
        status: 'unassigned',
        created_date: new Date('2024-02-18'),
        updated_date: new Date('2024-02-18'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '34',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        part_number_id: '16',
        serial_number: 'SPEAKER0162.1002',
        status: 'blocked',
        asn_id: '6',
        created_date: new Date('2024-02-19'),
        updated_date: new Date('2024-02-24'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '35',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        part_number_id: '17',
        serial_number: 'MIC017CONDENSER001',
        status: 'unassigned',
        created_date: new Date('2024-02-20'),
        updated_date: new Date('2024-02-20'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '36',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        part_number_id: '17',
        serial_number: 'MIC017CONDENSER002',
        status: 'assigned',
        asn_id: '6',
        created_date: new Date('2024-02-21'),
        updated_date: new Date('2024-02-26'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '37',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        part_number_id: '18',
        serial_number: 'WEBCAM0184K001',
        status: 'unassigned',
        created_date: new Date('2024-02-22'),
        updated_date: new Date('2024-02-22'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '38',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        part_number_id: '18',
        serial_number: 'WEBCAM0184K002',
        status: 'blocked',
        asn_id: '6',
        created_date: new Date('2024-02-23'),
        updated_date: new Date('2024-02-28'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '39',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '10',
        serial_number: 'MON01027IN003',
        status: 'unassigned',
        created_date: new Date('2024-02-24'),
        updated_date: new Date('2024-02-24'),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '40',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: '11',
        serial_number: 'KB011MECH003',
        status: 'unassigned',
        created_date: new Date('2024-02-25'),
        updated_date: new Date('2024-02-25'),
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
          },
          {
            id: 'item8',
            asn_id: '1',
            part_number_id: '8',
            buyer_part_number: 'COOL-008-AIO',
            ship_quantity: 5,
            lots: [
              {
                id: 'lot8',
                item_id: 'item8',
                lot_number: 'LOT008',
                quantity: 5
              }
            ]
          }
        ],
        packaging_hierarchy: {
          id: 'hierarchy1',
          name: 'Main Shipment',
          type: 'shipment',
          children: [
            {
              id: 'container1',
              name: 'Ocean Container CONT-001',
              type: 'container',
              dimensions: '40ft x 8ft x 8.5ft',
              children: [
                {
                  id: 'pallet1',
                  name: 'Pallet PAL-001',
                  type: 'pallet',
                  dimensions: '48in x 40in x 6in',
                  children: [
                    {
                      id: 'carton1',
                      name: 'Master Carton MC-001',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box1',
                          name: 'Inner Box IB-001',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit1',
                              name: 'Unit U-001',
                              type: 'unit',
                              serial_number: 'CPU001X7001',
                              part_number: 'CPU-001-X7'
                            },
                            {
                              id: 'unit2',
                              name: 'Unit U-002',
                              type: 'unit',
                              serial_number: 'CPU001X7002',
                              part_number: 'CPU-001-X7'
                            }
                          ]
                        },
                        {
                          id: 'box2',
                          name: 'Inner Box IB-002',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit3',
                              name: 'Unit U-003',
                              type: 'unit',
                              serial_number: 'CPU001X7003',
                              part_number: 'CPU-001-X7'
                            },
                            {
                              id: 'unit4',
                              name: 'Unit U-004',
                              type: 'unit',
                              serial_number: 'CPU001X7004',
                              part_number: 'CPU-001-X7'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      id: 'carton2',
                      name: 'Master Carton MC-002',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box3',
                          name: 'Inner Box IB-003',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit5',
                              name: 'Unit U-005',
                              type: 'unit',
                              serial_number: 'MEM002DDR5001',
                              part_number: 'MEM-002-DDR5'
                            },
                            {
                              id: 'unit6',
                              name: 'Unit U-006',
                              type: 'unit',
                              serial_number: 'MEM002DDR5002',
                              part_number: 'MEM-002-DDR5'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  id: 'pallet2',
                  name: 'Pallet PAL-002',
                  type: 'pallet',
                  dimensions: '48in x 40in x 6in',
                  children: [
                    {
                      id: 'carton3',
                      name: 'Master Carton MC-003',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box4',
                          name: 'Inner Box IB-004',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit7',
                              name: 'Unit U-007',
                              type: 'unit',
                              serial_number: 'SSD003NVME001',
                              part_number: 'SSD-003-NVMe'
                            },
                            {
                              id: 'unit8',
                              name: 'Unit U-008',
                              type: 'unit',
                              serial_number: 'SSD003NVME002',
                              part_number: 'SSD-003-NVMe'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      id: 'carton4',
                      name: 'Master Carton MC-004',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box5',
                          name: 'Inner Box IB-005',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit9',
                              name: 'Unit U-009',
                              type: 'unit',
                              serial_number: 'COOL008AIO001',
                              part_number: 'COOL-008-AIO'
                            },
                            {
                              id: 'unit10',
                              name: 'Unit U-010',
                              type: 'unit',
                              serial_number: 'COOL008AIO002',
                              part_number: 'COOL-008-AIO'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
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
        items: [
          {
            id: 'item4',
            asn_id: '2',
            part_number_id: '4',
            buyer_part_number: 'GPU-004-RTX',
            ship_quantity: 15,
            lots: [
              {
                id: 'lot6',
                item_id: 'item4',
                lot_number: 'LOT006',
                quantity: 10
              },
              {
                id: 'lot7',
                item_id: 'item4',
                lot_number: 'LOT007',
                quantity: 5
              }
            ]
          },
          {
            id: 'item5',
            asn_id: '2',
            part_number_id: '5',
            buyer_part_number: 'MB-005-Z690',
            ship_quantity: 12,
            lots: [
              {
                id: 'lot9',
                item_id: 'item5',
                lot_number: 'LOT009',
                quantity: 12
              }
            ]
          },
          {
            id: 'item9',
            asn_id: '2',
            part_number_id: '9',
            buyer_part_number: 'FAN-009-120MM',
            ship_quantity: 25,
            lots: [
              {
                id: 'lot10',
                item_id: 'item9',
                lot_number: 'LOT010',
                quantity: 15
              },
              {
                id: 'lot11',
                item_id: 'item9',
                lot_number: 'LOT011',
                quantity: 10
              }
            ]
          }
        ],
        packaging_hierarchy: {
          id: 'hierarchy2',
          name: 'Gaming Components Shipment',
          type: 'shipment',
          children: [
            {
              id: 'container2',
              name: 'Air Freight Container AFC-001',
              type: 'container',
              dimensions: '20ft x 8ft x 8.5ft',
              children: [
                {
                  id: 'pallet3',
                  name: 'Pallet PAL-003',
                  type: 'pallet',
                  dimensions: '48in x 40in x 6in',
                  children: [
                    {
                      id: 'carton4',
                      name: 'Master Carton MC-004',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box5',
                          name: 'Inner Box IB-005',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit9',
                              name: 'Unit U-009',
                              type: 'unit',
                              serial_number: 'GPU004RTX001',
                              part_number: 'GPU-004-RTX'
                            },
                            {
                              id: 'unit10',
                              name: 'Unit U-010',
                              type: 'unit',
                              serial_number: 'GPU004RTX002',
                              part_number: 'GPU-004-RTX'
                            }
                          ]
                        },
                        {
                          id: 'box6',
                          name: 'Inner Box IB-006',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit11',
                              name: 'Unit U-011',
                              type: 'unit',
                              serial_number: 'MB005Z690001',
                              part_number: 'MB-005-Z690'
                            },
                            {
                              id: 'unit12',
                              name: 'Unit U-012',
                              type: 'unit',
                              serial_number: 'MB005Z690002',
                              part_number: 'MB-005-Z690'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  id: 'pallet4',
                  name: 'Pallet PAL-004',
                  type: 'pallet',
                  dimensions: '48in x 40in x 6in',
                  children: [
                    {
                      id: 'carton5',
                      name: 'Master Carton MC-005',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box7',
                          name: 'Inner Box IB-007',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit13',
                              name: 'Unit U-013',
                              type: 'unit',
                              serial_number: 'FAN009120MM001',
                              part_number: 'FAN-009-120MM'
                            },
                            {
                              id: 'unit14',
                              name: 'Unit U-014',
                              type: 'unit',
                              serial_number: 'FAN009120MM002',
                              part_number: 'FAN-009-120MM'
                            }
                          ]
                        },
                        {
                          id: 'box8',
                          name: 'Inner Box IB-008',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit15',
                              name: 'Unit U-015',
                              type: 'unit',
                              serial_number: 'FAN009120MM003',
                              part_number: 'FAN-009-120MM'
                            },
                            {
                              id: 'unit16',
                              name: 'Unit U-016',
                              type: 'unit',
                              serial_number: 'FAN009120MM004',
                              part_number: 'FAN-009-120MM'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      id: 'carton6',
                      name: 'Master Carton MC-006',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box9',
                          name: 'Inner Box IB-009',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit17',
                              name: 'Unit U-017',
                              type: 'unit',
                              serial_number: 'GPU004RTX003',
                              part_number: 'GPU-004-RTX'
                            },
                            {
                              id: 'unit18',
                              name: 'Unit U-018',
                              type: 'unit',
                              serial_number: 'GPU004RTX004',
                              part_number: 'GPU-004-RTX'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      {
        id: '3',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        asn_number: 'ASN-2024-003',
        status: 'received',
        ship_date: new Date('2024-02-10'),
        delivery_date: new Date('2024-02-12'),
        created_date: new Date('2024-01-20'),
        updated_date: new Date('2024-02-12'),
        items: [
          {
            id: 'item6',
            asn_id: '3',
            part_number_id: '6',
            buyer_part_number: 'PSU-006-850W',
            ship_quantity: 8,
            lots: [
              {
                id: 'lot12',
                item_id: 'item6',
                lot_number: 'LOT012',
                quantity: 8
              }
            ]
          },
          {
            id: 'item7',
            asn_id: '3',
            part_number_id: '7',
            buyer_part_number: 'CASE-007-ATX',
            ship_quantity: 6,
            lots: [
              {
                id: 'lot13',
                item_id: 'item7',
                lot_number: 'LOT013',
                quantity: 6
              }
            ]
          }
        ],
        packaging_hierarchy: {
          id: 'hierarchy3',
          name: 'Power & Case Shipment',
          type: 'shipment',
          children: [
            {
              id: 'container3',
              name: 'Truck Container TRC-001',
              type: 'container',
              dimensions: '53ft x 8.5ft x 8.5ft',
              children: [
                {
                  id: 'pallet5',
                  name: 'Pallet PAL-005',
                  type: 'pallet',
                  dimensions: '48in x 40in x 6in',
                  children: [
                    {
                      id: 'carton6',
                      name: 'Master Carton MC-006',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box8',
                          name: 'Inner Box IB-008',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit15',
                              name: 'Unit U-015',
                              type: 'unit',
                              serial_number: 'PSU006850W001',
                              part_number: 'PSU-006-850W'
                            },
                            {
                              id: 'unit16',
                              name: 'Unit U-016',
                              type: 'unit',
                              serial_number: 'PSU006850W002',
                              part_number: 'PSU-006-850W'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      id: 'carton7',
                      name: 'Master Carton MC-007',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box9',
                          name: 'Inner Box IB-009',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit17',
                              name: 'Unit U-017',
                              type: 'unit',
                              serial_number: 'CASE007ATX001',
                              part_number: 'CASE-007-ATX'
                            },
                            {
                              id: 'unit18',
                              name: 'Unit U-018',
                              type: 'unit',
                              serial_number: 'CASE007ATX002',
                              part_number: 'CASE-007-ATX'
                            }
                          ]
                        },
                        {
                          id: 'box10',
                          name: 'Inner Box IB-010',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit19',
                              name: 'Unit U-019',
                              type: 'unit',
                              serial_number: 'CASE007ATX003',
                              part_number: 'CASE-007-ATX'
                            },
                            {
                              id: 'unit20',
                              name: 'Unit U-020',
                              type: 'unit',
                              serial_number: 'CASE007ATX004',
                              part_number: 'CASE-007-ATX'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      id: 'carton8',
                      name: 'Master Carton MC-008',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box11',
                          name: 'Inner Box IB-011',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit21',
                              name: 'Unit U-021',
                              type: 'unit',
                              serial_number: 'PSU006850W003',
                              part_number: 'PSU-006-850W'
                            },
                            {
                              id: 'unit22',
                              name: 'Unit U-022',
                              type: 'unit',
                              serial_number: 'PSU006850W004',
                              part_number: 'PSU-006-850W'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      {
        id: '4',
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        asn_number: 'ASN-2024-004',
        status: 'draft',
        ship_date: new Date('2024-03-01'),
        created_date: new Date('2024-01-25'),
        updated_date: new Date('2024-01-30'),
        items: [
          {
            id: 'item10',
            asn_id: '4',
            part_number_id: '10',
            buyer_part_number: 'MON-010-27IN',
            ship_quantity: 30,
            lots: [
              {
                id: 'lot14',
                item_id: 'item10',
                lot_number: 'LOT014',
                quantity: 20
              },
              {
                id: 'lot15',
                item_id: 'item10',
                lot_number: 'LOT015',
                quantity: 10
              }
            ]
          },
          {
            id: 'item11',
            asn_id: '4',
            part_number_id: '11',
            buyer_part_number: 'KB-011-MECH',
            ship_quantity: 50,
            lots: [
              {
                id: 'lot16',
                item_id: 'item11',
                lot_number: 'LOT016',
                quantity: 30
              },
              {
                id: 'lot17',
                item_id: 'item11',
                lot_number: 'LOT017',
                quantity: 20
              }
            ]
          },
          {
            id: 'item12',
            asn_id: '4',
            part_number_id: '12',
            buyer_part_number: 'MOUSE-012-WIRELESS',
            ship_quantity: 40,
            lots: [
              {
                id: 'lot18',
                item_id: 'item12',
                lot_number: 'LOT018',
                quantity: 40
              }
            ]
          }
        ],
        packaging_hierarchy: {
          id: 'hierarchy4',
          name: 'Peripherals Shipment',
          type: 'shipment',
          children: [
            {
              id: 'container4',
              name: 'Ocean Container CONT-002',
              type: 'container',
              dimensions: '40ft x 8ft x 8.5ft',
              children: [
                {
                  id: 'pallet6',
                  name: 'Pallet PAL-006',
                  type: 'pallet',
                  dimensions: '48in x 40in x 6in',
                  children: [
                    {
                      id: 'carton8',
                      name: 'Master Carton MC-008',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box10',
                          name: 'Inner Box IB-010',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit19',
                              name: 'Unit U-019',
                              type: 'unit',
                              serial_number: 'MON01027IN001',
                              part_number: 'MON-010-27IN'
                            },
                            {
                              id: 'unit20',
                              name: 'Unit U-020',
                              type: 'unit',
                              serial_number: 'MON01027IN002',
                              part_number: 'MON-010-27IN'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  id: 'pallet7',
                  name: 'Pallet PAL-007',
                  type: 'pallet',
                  dimensions: '48in x 40in x 6in',
                  children: [
                    {
                      id: 'carton9',
                      name: 'Master Carton MC-009',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box11',
                          name: 'Inner Box IB-011',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit21',
                              name: 'Unit U-021',
                              type: 'unit',
                              serial_number: 'KB011MECH001',
                              part_number: 'KB-011-MECH'
                            },
                            {
                              id: 'unit22',
                              name: 'Unit U-022',
                              type: 'unit',
                              serial_number: 'KB011MECH002',
                              part_number: 'KB-011-MECH'
                            }
                          ]
                        },
                        {
                          id: 'box12',
                          name: 'Inner Box IB-012',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit23',
                              name: 'Unit U-023',
                              type: 'unit',
                              serial_number: 'MOUSE012WIRELESS001',
                              part_number: 'MOUSE-012-WIRELESS'
                            },
                            {
                              id: 'unit24',
                              name: 'Unit U-024',
                              type: 'unit',
                              serial_number: 'MOUSE012WIRELESS002',
                              part_number: 'MOUSE-012-WIRELESS'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      id: 'carton10',
                      name: 'Master Carton MC-010',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box13',
                          name: 'Inner Box IB-013',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit25',
                              name: 'Unit U-025',
                              type: 'unit',
                              serial_number: 'MON01027IN003',
                              part_number: 'MON-010-27IN'
                            },
                            {
                              id: 'unit26',
                              name: 'Unit U-026',
                              type: 'unit',
                              serial_number: 'MON01027IN004',
                              part_number: 'MON-010-27IN'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      {
        id: '5',
        supplier_id: 'sup2',
        buyer_id: 'buy2',
        asn_number: 'ASN-2024-005',
        status: 'submitted',
        ship_date: new Date('2024-03-05'),
        created_date: new Date('2024-01-28'),
        updated_date: new Date('2024-02-02'),
        items: [
          {
            id: 'item13',
            asn_id: '5',
            part_number_id: '13',
            buyer_part_number: 'NET-013-WIFI6',
            ship_quantity: 18,
            lots: [
              {
                id: 'lot19',
                item_id: 'item13',
                lot_number: 'LOT019',
                quantity: 18
              }
            ]
          },
          {
            id: 'item14',
            asn_id: '5',
            part_number_id: '14',
            buyer_part_number: 'CABLE-014-USB-C',
            ship_quantity: 100,
            lots: [
              {
                id: 'lot20',
                item_id: 'item14',
                lot_number: 'LOT020',
                quantity: 60
              },
              {
                id: 'lot21',
                item_id: 'item14',
                lot_number: 'LOT021',
                quantity: 40
              }
            ]
          },
          {
            id: 'item15',
            asn_id: '5',
            part_number_id: '15',
            buyer_part_number: 'ADAPTER-015-POWER',
            ship_quantity: 25,
            lots: [
              {
                id: 'lot22',
                item_id: 'item15',
                lot_number: 'LOT022',
                quantity: 25
              }
            ]
          }
        ],
        packaging_hierarchy: {
          id: 'hierarchy5',
          name: 'Networking & Cables Shipment',
          type: 'shipment',
          children: [
            {
              id: 'container5',
              name: 'Air Freight Container AFC-002',
              type: 'container',
              dimensions: '20ft x 8ft x 8.5ft',
              children: [
                {
                  id: 'pallet8',
                  name: 'Pallet PAL-008',
                  type: 'pallet',
                  dimensions: '48in x 40in x 6in',
                  children: [
                    {
                      id: 'carton10',
                      name: 'Master Carton MC-010',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box12',
                          name: 'Inner Box IB-012',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit23',
                              name: 'Unit U-023',
                              type: 'unit',
                              serial_number: 'NET013WIFI6001',
                              part_number: 'NET-013-WIFI6'
                            },
                            {
                              id: 'unit24',
                              name: 'Unit U-024',
                              type: 'unit',
                              serial_number: 'NET013WIFI6002',
                              part_number: 'NET-013-WIFI6'
                            }
                          ]
                        },
                        {
                          id: 'box13',
                          name: 'Inner Box IB-013',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit25',
                              name: 'Unit U-025',
                              type: 'unit',
                              serial_number: 'CABLE014USBC001',
                              part_number: 'CABLE-014-USB-C'
                            },
                            {
                              id: 'unit26',
                              name: 'Unit U-026',
                              type: 'unit',
                              serial_number: 'CABLE014USBC002',
                              part_number: 'CABLE-014-USB-C'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      id: 'carton11',
                      name: 'Master Carton MC-011',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box14',
                          name: 'Inner Box IB-014',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit27',
                              name: 'Unit U-027',
                              type: 'unit',
                              serial_number: 'ADAPTER015POWER001',
                              part_number: 'ADAPTER-015-POWER'
                            },
                            {
                              id: 'unit28',
                              name: 'Unit U-028',
                              type: 'unit',
                              serial_number: 'ADAPTER015POWER002',
                              part_number: 'ADAPTER-015-POWER'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      {
        id: '6',
        supplier_id: 'sup3',
        buyer_id: 'buy3',
        asn_number: 'ASN-2024-006',
        status: 'draft',
        ship_date: new Date('2024-03-10'),
        created_date: new Date('2024-02-01'),
        updated_date: new Date('2024-02-05'),
        items: [
          {
            id: 'item16',
            asn_id: '6',
            part_number_id: '16',
            buyer_part_number: 'SPEAKER-016-2.1',
            ship_quantity: 12,
            lots: [
              {
                id: 'lot23',
                item_id: 'item16',
                lot_number: 'LOT023',
                quantity: 12
              }
            ]
          },
          {
            id: 'item17',
            asn_id: '6',
            part_number_id: '17',
            buyer_part_number: 'MIC-017-CONDENSER',
            ship_quantity: 8,
            lots: [
              {
                id: 'lot24',
                item_id: 'item17',
                lot_number: 'LOT024',
                quantity: 8
              }
            ]
          },
          {
            id: 'item18',
            asn_id: '6',
            part_number_id: '18',
            buyer_part_number: 'WEBCAM-018-4K',
            ship_quantity: 15,
            lots: [
              {
                id: 'lot25',
                item_id: 'item18',
                lot_number: 'LOT025',
                quantity: 10
              },
              {
                id: 'lot26',
                item_id: 'item18',
                lot_number: 'LOT026',
                quantity: 5
              }
            ]
          }
        ],
        packaging_hierarchy: {
          id: 'hierarchy6',
          name: 'Audio & Video Shipment',
          type: 'shipment',
          children: [
            {
              id: 'container6',
              name: 'Truck Container TRC-002',
              type: 'container',
              dimensions: '53ft x 8.5ft x 8.5ft',
              children: [
                {
                  id: 'pallet9',
                  name: 'Pallet PAL-009',
                  type: 'pallet',
                  dimensions: '48in x 40in x 6in',
                  children: [
                    {
                      id: 'carton11',
                      name: 'Master Carton MC-011',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box13',
                          name: 'Inner Box IB-013',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit25',
                              name: 'Unit U-025',
                              type: 'unit',
                              serial_number: 'SPEAKER0162.1001',
                              part_number: 'SPEAKER-016-2.1'
                            },
                            {
                              id: 'unit26',
                              name: 'Unit U-026',
                              type: 'unit',
                              serial_number: 'SPEAKER0162.1002',
                              part_number: 'SPEAKER-016-2.1'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      id: 'carton12',
                      name: 'Master Carton MC-012',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box14',
                          name: 'Inner Box IB-014',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit27',
                              name: 'Unit U-027',
                              type: 'unit',
                              serial_number: 'MIC017CONDENSER001',
                              part_number: 'MIC-017-CONDENSER'
                            },
                            {
                              id: 'unit28',
                              name: 'Unit U-028',
                              type: 'unit',
                              serial_number: 'MIC017CONDENSER002',
                              part_number: 'MIC-017-CONDENSER'
                            }
                          ]
                        },
                        {
                          id: 'box15',
                          name: 'Inner Box IB-015',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit29',
                              name: 'Unit U-029',
                              type: 'unit',
                              serial_number: 'WEBCAM0184K001',
                              part_number: 'WEBCAM-018-4K'
                            },
                            {
                              id: 'unit30',
                              name: 'Unit U-030',
                              type: 'unit',
                              serial_number: 'WEBCAM0184K002',
                              part_number: 'WEBCAM-018-4K'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      id: 'carton13',
                      name: 'Master Carton MC-013',
                      type: 'carton',
                      dimensions: '24in x 18in x 12in',
                      children: [
                        {
                          id: 'box16',
                          name: 'Inner Box IB-016',
                          type: 'box',
                          dimensions: '12in x 8in x 6in',
                          children: [
                            {
                              id: 'unit31',
                              name: 'Unit U-031',
                              type: 'unit',
                              serial_number: 'SPEAKER0162.1003',
                              part_number: 'SPEAKER-016-2.1'
                            },
                            {
                              id: 'unit32',
                              name: 'Unit U-032',
                              type: 'unit',
                              serial_number: 'SPEAKER0162.1004',
                              part_number: 'SPEAKER-016-2.1'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
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
      },
      {
        id: '4',
        buyer_identifier: 'GAMING_TECH',
        supplier_identifier: 'GRAPHICS_PRO',
        buyer_part_number: 'GPU-004-RTX',
        description: 'RTX 4070 Graphics Card 12GB GDDR6X',
        price: 599.99,
        dimensions: '285mm x 126mm x 50mm',
        created_date: new Date('2024-01-14'),
        updated_date: new Date('2024-01-24')
      },
      {
        id: '5',
        buyer_identifier: 'GAMING_TECH',
        supplier_identifier: 'GRAPHICS_PRO',
        buyer_part_number: 'MB-005-Z690',
        description: 'Intel Z690 Motherboard ATX',
        price: 249.99,
        dimensions: '305mm x 244mm x 6mm',
        created_date: new Date('2024-01-16'),
        updated_date: new Date('2024-01-26')
      },
      {
        id: '6',
        buyer_identifier: 'POWER_SOLUTIONS',
        supplier_identifier: 'ENERGY_TECH',
        buyer_part_number: 'PSU-006-850W',
        description: '850W Modular Power Supply 80+ Gold',
        price: 129.99,
        dimensions: '150mm x 86mm x 140mm',
        created_date: new Date('2024-01-18'),
        updated_date: new Date('2024-01-28')
      },
      {
        id: '7',
        buyer_identifier: 'POWER_SOLUTIONS',
        supplier_identifier: 'ENERGY_TECH',
        buyer_part_number: 'CASE-007-ATX',
        description: 'ATX Mid Tower Case with Tempered Glass',
        price: 89.99,
        dimensions: '450mm x 200mm x 450mm',
        created_date: new Date('2024-01-20'),
        updated_date: new Date('2024-01-30')
      },
      {
        id: '8',
        buyer_identifier: 'ACME_CORP',
        supplier_identifier: 'TECH_SUPPLY_001',
        buyer_part_number: 'COOL-008-AIO',
        description: '240mm All-in-One Liquid CPU Cooler',
        price: 119.99,
        dimensions: '280mm x 120mm x 27mm',
        created_date: new Date('2024-01-22'),
        updated_date: new Date('2024-02-01')
      },
      {
        id: '9',
        buyer_identifier: 'GAMING_TECH',
        supplier_identifier: 'GRAPHICS_PRO',
        buyer_part_number: 'FAN-009-120MM',
        description: '120mm PWM Case Fan with RGB',
        price: 24.99,
        dimensions: '120mm x 120mm x 25mm',
        created_date: new Date('2024-01-24'),
        updated_date: new Date('2024-02-03')
      },
      {
        id: '10',
        buyer_identifier: 'DISPLAY_TECH',
        supplier_identifier: 'MONITOR_PRO',
        buyer_part_number: 'MON-010-27IN',
        description: '27-inch 4K Ultra HD Monitor with HDR',
        price: 399.99,
        dimensions: '610mm x 360mm x 50mm',
        created_date: new Date('2024-01-26'),
        updated_date: new Date('2024-02-05')
      },
      {
        id: '11',
        buyer_identifier: 'INPUT_DEVICES',
        supplier_identifier: 'PERIPHERAL_PLUS',
        buyer_part_number: 'KB-011-MECH',
        description: 'Mechanical Gaming Keyboard with RGB Backlight',
        price: 149.99,
        dimensions: '440mm x 135mm x 35mm',
        created_date: new Date('2024-01-28'),
        updated_date: new Date('2024-02-07')
      },
      {
        id: '12',
        buyer_identifier: 'INPUT_DEVICES',
        supplier_identifier: 'PERIPHERAL_PLUS',
        buyer_part_number: 'MOUSE-012-WIRELESS',
        description: 'Wireless Gaming Mouse with 25K DPI Sensor',
        price: 79.99,
        dimensions: '125mm x 65mm x 40mm',
        created_date: new Date('2024-01-30'),
        updated_date: new Date('2024-02-09')
      },
      {
        id: '13',
        buyer_identifier: 'NETWORK_SOLUTIONS',
        supplier_identifier: 'CONNECT_TECH',
        buyer_part_number: 'NET-013-WIFI6',
        description: 'WiFi 6 PCIe Network Adapter',
        price: 59.99,
        dimensions: '120mm x 80mm x 15mm',
        created_date: new Date('2024-02-01'),
        updated_date: new Date('2024-02-11')
      },
      {
        id: '14',
        buyer_identifier: 'CABLE_SYSTEMS',
        supplier_identifier: 'WIRE_TECH',
        buyer_part_number: 'CABLE-014-USB-C',
        description: 'USB-C to USB-C Cable 3.2 Gen 2',
        price: 19.99,
        dimensions: '2000mm x 5mm x 5mm',
        created_date: new Date('2024-02-03'),
        updated_date: new Date('2024-02-13')
      },
      {
        id: '15',
        buyer_identifier: 'POWER_SOLUTIONS',
        supplier_identifier: 'ENERGY_TECH',
        buyer_part_number: 'ADAPTER-015-POWER',
        description: 'Universal Power Adapter 100W',
        price: 34.99,
        dimensions: '80mm x 40mm x 25mm',
        created_date: new Date('2024-02-05'),
        updated_date: new Date('2024-02-15')
      },
      {
        id: '16',
        buyer_identifier: 'AUDIO_TECH',
        supplier_identifier: 'SOUND_PRO',
        buyer_part_number: 'SPEAKER-016-2.1',
        description: '2.1 Channel Multimedia Speaker System',
        price: 89.99,
        dimensions: '120mm x 80mm x 100mm',
        created_date: new Date('2024-02-07'),
        updated_date: new Date('2024-02-17')
      },
      {
        id: '17',
        buyer_identifier: 'AUDIO_TECH',
        supplier_identifier: 'SOUND_PRO',
        buyer_part_number: 'MIC-017-CONDENSER',
        description: 'USB Condenser Microphone with Stand',
        price: 69.99,
        dimensions: '200mm x 50mm x 50mm',
        created_date: new Date('2024-02-09'),
        updated_date: new Date('2024-02-19')
      },
      {
        id: '18',
        buyer_identifier: 'CAMERA_TECH',
        supplier_identifier: 'VIDEO_PRO',
        buyer_part_number: 'WEBCAM-018-4K',
        description: '4K Webcam with Auto-Focus and Noise Cancellation',
        price: 199.99,
        dimensions: '100mm x 30mm x 30mm',
        created_date: new Date('2024-02-11'),
        updated_date: new Date('2024-02-21')
      }
    ];
  }
}

export const serialStore = new SerialStoreManager();