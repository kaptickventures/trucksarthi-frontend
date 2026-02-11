// ===============================
// Shared Types
// ===============================

export type ObjectId = string;
export type ISODate = string | Date;

// ===============================
// 1. User (Mongoose)
// ===============================

export interface User {
  _id: ObjectId;

  name: string;
  email: string;
  password?: string;

  phone?: string;
  firebase_uid?: string;

  company_name?: string;
  address?: string;
  date_of_birth?: ISODate;
  profile_picture_url?: string;
  license_card_url?: string;
  identity_card_url?: string;

  gstin?: string;
  pan_number?: string;
  name_as_on_pan?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  is_gstin_verified?: boolean;
  is_pan_verified?: boolean;
  is_bank_verified?: boolean;
  kyc_data?: {
    pan_details?: any;
    gstin_details?: any;
    bank_details?: any;
  };

  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 2. Truck (Mongoose)
// ===============================

export interface Truck {
  _id: ObjectId;
  user: ObjectId | User;

  registration_number: string;

  chassis_number?: string;
  engine_number?: string;
  registered_owner_name?: string;

  make?: string;
  vehicle_model?: string;
  vehicle_class?: string;
  fuel_type?: string;
  fuel_norms?: string;

  unladen_weight?: number;
  registered_rto?: string;
  container_dimension?: string;
  loading_capacity?: number;

  registration_date?: ISODate;
  fitness_upto?: ISODate;
  pollution_upto?: ISODate;
  road_tax_upto?: ISODate;
  insurance_upto?: ISODate;
  permit_upto?: ISODate;
  national_permit_upto?: ISODate;
  rc_details?: Record<string, any>;
}

// ===============================
// 3. Truck Document (Mongoose)
// ===============================

export type TruckDocumentStatus = "active" | "expired";

export interface TruckDocument {
  _id: ObjectId;
  user: ObjectId | User;
  truck: ObjectId | Truck;

  document_type: string;
  file_url: string;

  expiry_date?: ISODate;
  status?: TruckDocumentStatus;
}

// ===============================
// 4. Driver (Mongoose)
// ===============================

export interface Driver {
  _id: ObjectId;
  user: ObjectId | User;

  name?: string;
  phone?: string;
  driver_name?: string;
  contact_number?: string;

  identity_card_url?: string;
  license_card_url?: string;
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 5. Driver Ledger (Mongoose)
// ===============================

export type TransactionNature =
  | "paid_by_driver"
  | "received_by_driver";

export type CounterpartyType =
  | "owner"
  | "vendor"
  | "client";

export type LedgerDirection =
  | "to"
  | "from";

export interface DriverLedger {
  _id: ObjectId;
  user: ObjectId | User;
  driver: ObjectId | Driver;

  transaction_nature: TransactionNature;
  counterparty_type: CounterpartyType;
  counterparty_id?: ObjectId;

  direction: LedgerDirection;
  amount: number;

  remarks?: string;
  title?: string;
  entry_date: ISODate;
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 6. Client (Mongoose)
// ===============================

export interface Client {
  _id: ObjectId;
  user: ObjectId | User;

  client_name: string;
  contact_person_name: string;
  contact_number: string;
  email_address: string;

  alternate_contact_number?: string;
  office_address?: string;
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 7. Client Ledger (Mongoose)
// ===============================

export type ClientLedgerEntryType = "debit" | "credit";

export interface ClientLedger {
  _id: ObjectId;
  user: ObjectId | User;
  client: ObjectId | Client;

  invoice?: ObjectId | Invoice;

  entry_type: ClientLedgerEntryType;
  amount: number;
  remarks?: string;
  entry_date: ISODate;
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 8. Location (Mongoose)
// ===============================

export interface Location {
  _id: ObjectId;
  user: ObjectId | User;

  location_name: string;
  complete_address?: string;

  latitude?: number;
  longitude?: number;
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 9. Trip (Mongoose)
// ===============================

export type InvoicedStatus = "not_invoiced" | "invoiced";

export interface Trip {
  _id: ObjectId;
  user: ObjectId | User;

  trip_date?: ISODate;

  truck: ObjectId | Truck;
  driver: ObjectId | Driver;
  client: ObjectId | Client;

  start_location: ObjectId | Location;
  end_location: ObjectId | Location;

  cost_of_trip: number;
  miscellaneous_expense?: number;

  notes?: string;
  invoiced_status?: InvoicedStatus;
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 10. Invoice (Mongoose)
// ===============================

export type InvoiceStatus = "pending" | "paid" | "cancelled";

export interface InvoiceItem {
  trip: ObjectId | Trip;
  trip_cost: number;
  misc_expense: number;
  total: number;
}

export interface Invoice {
  _id: ObjectId;
  user: ObjectId | User;
  client: ObjectId | Client;

  invoice_number: string;
  total_amount: number;

  due_date?: ISODate;
  status: InvoiceStatus;
  items: InvoiceItem[];
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// Legacy SQL Entities (PostgreSQL)
// ===============================

// ---- Driver Financial (SQL) ----

export type DriverFinancialEntryType =
  | "advance"
  | "expense"
  | "salary"
  | "per_trip";

export interface DriverFinancialSQL {
  driver_id: number;
  trip_id?: number;

  entry_type: DriverFinancialEntryType;
  amount: number;

  remarks?: string;
  entry_date: ISODate;

  firebase_uid: string;
}

// ---- Driver Payroll (SQL) ----

export interface DriverPayrollSQL {
  payroll_id: number;
  driver_id: number;

  period_start: ISODate;
  period_end: ISODate;

  total_amount: number;
  status: string;
}
