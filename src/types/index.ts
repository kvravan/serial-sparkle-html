export type SerialStatus = 'unassigned' | 'blocked' | 'assigned';

export interface SerialInventory {
  id: string;
  supplier_id: string;
  buyer_id: string;
  part_number_id: string;
  serial_number: string;
  status: SerialStatus;
  asn_id?: string;
  attributes_json?: Record<string, any>;
  parent_serial_id?: string;
  parent_serial_number?: string;
  expiry_date?: Date;
  created_date: Date;
  updated_date: Date;
  created_by: string;
  updated_by: string;
}

export interface Product {
  id: string;
  buyer_identifier: string;
  supplier_identifier: string;
  buyer_part_number: string;
  description: string;
  price?: number;
  dimensions?: string;
  created_date: Date;
  updated_date: Date;
}

export interface ASN {
  id: string;
  supplier_id: string;
  buyer_id: string;
  asn_number: string;
  status: 'draft' | 'submitted' | 'received';
  ship_date?: Date;
  delivery_date?: Date;
  created_date: Date;
  updated_date: Date;
  items: ASNItem[];
}

export interface ASNItem {
  id: string;
  asn_id: string;
  part_number_id: string;
  buyer_part_number: string;
  ship_quantity: number;
  lots: ASNLot[];
}

export interface ASNLot {
  id: string;
  item_id: string;
  lot_number: string;
  quantity: number;
}

export interface ASNSerialAssignment {
  id: string;
  serial_id: string;
  supplier_id: string;
  part_number_id: string;
  serial_number: string;
  user_doc_id: string;
  line_id: string;
  lot_line_id: string;
  package_id: string;
  assigned_date: Date;
}