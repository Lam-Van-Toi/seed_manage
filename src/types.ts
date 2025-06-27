
export interface Product {
  id: string; // Typically UUID from Supabase, or auto-increment
  code: string;
  name: string;
  unit: string; // e.g., kg, bao
  cost_price: number;
  sell_price: number;
  description?: string;
  created_at: string; // ISO date string
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

export interface InventoryBatch {
  id: string;
  product_id: string;
  batch_no: string;
  initial_quantity: number; // Quantity at the time of batch creation
  quantity: number; // Current quantity in stock for this batch
  min_threshold: number;
  warehouse_id?: string;
  created_at: string; // ISO date string, will serve as entry date
  // For UI display, if fetching with joins
  products?: Product; // product information
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
  // purchase_history is not directly stored but can be derived
}

export enum OrderStatus {
  PENDING = 'Chờ xử lý',
  PROCESSING = 'Đang xử lý',
  PACKING = 'Đóng gói',
  SHIPPED = 'Đang giao',
  COMPLETED = 'Hoàn thành',
  CANCELLED = 'Đã hủy',
}

export interface OrderItem {
  id: string; // Primary key for order_items table
  order_id: string;
  product_id: string;
  batch_id?: string; // To track which batch stock was taken from (can be complex if multiple batches)
  quantity: number;
  unit_price: number; // Price at the time of order
  // subtotal is calculated: quantity * unit_price
  // For UI display, if fetching with joins
  products?: Pick<Product, 'name' | 'unit' | 'code'>; // or full Product
}

export interface Order {
  id: string;
  customer_id: string;
  order_date: string; // ISO date string
  status: OrderStatus;
  items: OrderItem[]; // This will be fetched separately or joined
  total_amount: number; // This might be calculated or stored
  shipping_fee?: number;
  discount?: number;
  notes?: string;
  created_at: string;
  // For UI display, if fetching with joins
  customers?: Pick<Customer, 'name' | 'phone' | 'address'>; // or full Customer
}

// For creating/editing forms - using snake_case
export type ProductFormData = Omit<Product, 'id' | 'created_at'>;
export type CustomerFormData = Omit<Customer, 'id' | 'created_at'>;
// initial_quantity is required on creation, quantity (current) is managed by transactions
// created_at is omitted as it's set by DB. entry_date and production_date removed from InventoryBatch.
export type InventoryBatchFormData = Omit<InventoryBatch, 'id' | 'created_at' | 'quantity' | 'products'> & { quantity?: number };
export type OrderFormDataItem = Omit<OrderItem, 'id' | 'order_id' | 'products' >;
export type OrderFormData = {
  customer_id: string;
  order_date: string;
  status: OrderStatus;
  items: Array<OrderFormDataItem>;
  shipping_fee?: number;
  discount?: number;
  notes?: string;
};


export interface DailyRevenue {
  date: string; // Formatted date string for chart
  revenue: number;
}

export interface SalesByProduct {
  product_id: string;
  product_name: string; // Likely joined or resolved
  total_quantity_sold: number;
  total_revenue: number;
}

export interface SelectOption {
  value: string;
  label: string;
}