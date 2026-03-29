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
  upiId?: string;
  is_email_verified?: boolean;
  is_mobile_verified?: boolean;
  is_gstin_verified?: boolean;
  is_pan_verified?: boolean;
  is_bank_verified?: boolean;
  has_notifications_allowed?: boolean;
  plan?: "free" | "paid";
  plan_status?: "free" | "trial" | "paid";
  plan_is_limited?: boolean;
  plan_trial_ends_at?: ISODate;
  plan_trial_days_left?: number;
  plan_limits?: {
    trucks: number;
    drivers: number;
    clients: number;
    bankVerifications: number;
    gstPanVerifications: number;
    rcVerificationsPerYear: number;
  };
  plan_usage?: {
    trucks: number;
    drivers: number;
    clients: number;
    bankVerifications: number;
    gstPanVerifications: number;
    rcVerificationsCurrentYear: number;
    rcYear: number;
  };
  plan_remaining?: {
    trucks: number;
    drivers: number;
    clients: number;
    bankVerifications: number;
    gstPanVerifications: number;
    rcVerificationsCurrentYear: number;
  } | null;
  plan_owner_id?: ObjectId;
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
  profile_picture_url?: string;
  assigned_truck_id?: ObjectId | Truck | null;
  
  // OCR extracted fields
  aadhaar_number?: string;
  driving_license_number?: string;
  kyc_data?: {
    aadhaar_ocr?: any;
    driving_license_ocr?: any;
  };
  
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
  
  // New Master Finance Fields
  tripId?: ObjectId;
  truckId?: ObjectId;
  clientId?: ObjectId;
  invoiceId?: ObjectId;
  category?: string;
  sourceModule?: string;
  transactionSubtype?: string; // e.g. "OWNER_TO_DRIVER"
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  source?: "OLD" | "NEW";
  
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 5.5 Finance Transaction (New Master Model)
// ===============================

export interface FinanceTransaction {
  _id: ObjectId;
  user: ObjectId | User;
  date: ISODate;
  amount: number;
  direction: 'INCOME' | 'EXPENSE';
  sourceModule: 'DRIVER_KHATA' | 'CLIENT_PAYMENT' | 'RUNNING_EXPENSE' | 'MAINTENANCE' | 'MISC';
  category: string;
  subcategory?: string;
  
  transactionSubtype: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  
  paymentMode: string;
  notes?: string;
  attachmentUrl?: string;
  createdBy: 'OWNER' | 'DRIVER' | 'SYSTEM';
  
  driverId?: ObjectId;
  truckId?: ObjectId;
  tripId?: ObjectId;
  clientId?: ObjectId;
  invoiceId?: ObjectId;
  vendorId?: ObjectId;
  
  // Fuel/Maintenance specific
  litres?: number;
  kmReading?: number;
  serviceType?: string; // DOCUMENT, SERVICE, REPAIR
  
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
  gstin?: string;
  gstin_details?: any;
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 7. Client Ledger (Mongoose)

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
  source?: "OLD" | "NEW";
  payment_mode?: string;
  payment_type?: "FULL" | "PARTIAL";
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
  place_id?: string;

  latitude?: number;
  longitude?: number;
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 9. Trip (Mongoose)
// ===============================

export type InvoicedStatus = "not_invoiced" | "invoiced";

export interface TripEditHistoryEntry {
  edited_at: ISODate;
  edited_by?: ObjectId | User;
  snapshot: {
    trip_date?: ISODate;
    truck?: ObjectId | Truck;
    driver?: ObjectId | Driver;
    client?: ObjectId | Client;
    start_location?: ObjectId | Location;
    end_location?: ObjectId | Location;
    cost_of_trip?: number;
    miscellaneous_expense?: number;
    notes?: string;
    invoiced_status?: InvoicedStatus;
    public_id?: string;
  };
}

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
  public_id?: string;
  edit_history?: TripEditHistoryEntry[];
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 10. Invoice (Mongoose)
// ===============================

export type InvoiceStatus = "pending" | "paid" | "partially_paid" | "cancelled";

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
  subtotal_amount?: number;
  tax_type?: "none" | "igst" | "cgst_sgst";
  tax_percentage?: number;
  tax_amount?: number;
  total_amount: number;

  due_date?: ISODate;
  status: InvoiceStatus;
  items: InvoiceItem[];
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

// ===============================
// 11. Bilty (Bill of Lading)
// ===============================

export type BiltyStatus = "draft" | "generated" | "finalized" | "cancelled";
export type BiltyPaymentType = "to_pay" | "paid" | "billed";
export type BiltyGstPaidBy = "consignor" | "consignee";
export type BiltyGstType = "gst" | "igst";

export interface BiltyParty {
  _id?: ObjectId;
  type?: "consignor" | "consignee" | "both";
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  contact_person?: string;
  gstin_details?: any;
  quick_fill_source?: "client" | "manual";
  source_client_id?: ObjectId;
}

export interface BiltyGoodsRow {
  sr_no: number;
  description?: string;
  quantity?: number;
  unit?: string;
  actual_weight?: number;
  rate?: number;
  total?: number;
}

export interface BiltyCharges {
  freight?: number;
  loading?: number;
  unloading?: number;
  other?: number;
  total?: number;
  advance?: number;
  balance?: number;
}

export interface BiltyShipment {
  from_location?: string;
  to_location?: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  eway_bill_no?: string;
  invoice_no?: string;
  invoice_value?: number;
  shipment_date?: ISODate;
}

export interface BiltyInsurance {
  policy_number?: string;
  insurer_name?: string;
  coverage_amount?: number;
  expiry_date?: ISODate;
}

export interface Bilty {
  _id: ObjectId;
  user: ObjectId | User;
  trip?: ObjectId | Trip;
  client?: ObjectId | Client;

  bilty_number: string;
  bilty_date?: ISODate;

  status: BiltyStatus;

  consignor_party?: ObjectId | BiltyParty;
  consignee_party?: ObjectId | BiltyParty;

  consignor: BiltyParty;
  consignee: BiltyParty;

  shipment?: BiltyShipment;

  goods_rows?: BiltyGoodsRow[];

  charges?: BiltyCharges;
  payment_type?: BiltyPaymentType;
  gst_paid_by?: BiltyGstPaidBy;
  gst_percentage?: 0 | 5 | 18;
  gst_type?: BiltyGstType;
  insurance?: BiltyInsurance;
  signature_url?: string;
  notes?: string;

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
