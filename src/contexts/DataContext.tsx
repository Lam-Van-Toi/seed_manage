
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Product, Customer, InventoryBatch, Order, OrderItem, OrderStatus, ProductFormData, CustomerFormData, InventoryBatchFormData, OrderFormData, OrderFormDataItem } from '../types';
import { generateId } from '../utils/helpers'; // Keep for client-side non-db IDs if needed

// Initial Empty States
const initialProducts: Product[] = [];
const initialCustomers: Customer[] = [];
const initialInventoryBatches: InventoryBatch[] = [];
const initialOrders: Order[] = [];

interface DataContextType {
  products: Product[];
  customers: Customer[];
  inventoryBatches: InventoryBatch[];
  orders: Order[];
  addProduct: (productData: ProductFormData) => Promise<Product | null>;
  updateProduct: (updatedProductData: Partial<Product> & { id: string }) => Promise<Product | null>;
  deleteProduct: (productId: string) => Promise<boolean>;
  addCustomer: (customerData: CustomerFormData) => Promise<Customer | null>;
  updateCustomer: (updatedCustomerData: Partial<Customer> & { id: string }) => Promise<Customer | null>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  addInventoryBatch: (batchData: InventoryBatchFormData) => Promise<InventoryBatch | null>;
  updateInventoryBatch: (updatedBatchData: Partial<InventoryBatch> & { id: string }) => Promise<InventoryBatch | null>;
  deleteInventoryBatch: (batchId: string) => Promise<boolean>;
  addStockToBatch: (batchId: string, quantityToAdd: number) => Promise<InventoryBatch | null>;
  removeStockFromBatch: (batchId: string, quantityToRemove: number, reason?: string) => Promise<InventoryBatch | null>;
  placeOrder: (orderData: OrderFormData) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<Order | null>;
  getProductById: (productId: string) => Product | undefined; // Searches local state
  getCustomerById: (customerId: string) => Customer | undefined; // Searches local state
  getBatchById: (batchId: string) => InventoryBatch | undefined; // Searches local state
  getOrderById: (orderId: string) => Order | undefined; // Searches local state, includes items and customer if fetched that way
  loading: boolean;
  setLoading: (loading: boolean) => void; // Allow manual loading state control
  notifications: AppNotification[];
  addNotification: (message: string, type?: NotificationType) => void;
  removeNotification: (id: string) => void;
  fetchInitialData: () => Promise<void>;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [inventoryBatches, setInventoryBatches] = useState<InventoryBatch[]>(initialInventoryBatches);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState<boolean>(true); // Start with loading true
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = generateId(); // Client-side ID for notification
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: productsData, error: productsError },
        { data: customersData, error: customersError },
        { data: inventoryBatchesData, error: inventoryBatchesError },
        { data: ordersData, error: ordersError },
      ] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('customers').select('*').order('name'),
        supabase.from('inventory_batches').select('*, products(name, code, unit)').order('created_at', { ascending: false }), // Use created_at for ordering
        supabase.from('orders').select('*, customers(name, phone), order_items(*, products(name, unit))').order('order_date', { ascending: false })
      ]);

      if (productsError) throw productsError;
      setProducts(productsData || []);
      
      if (customersError) throw customersError;
      setCustomers(customersData || []);
      
      if (inventoryBatchesError) throw inventoryBatchesError;
      setInventoryBatches(inventoryBatchesData || []);

      if (ordersError) throw ordersError;
       // Process orders to ensure items is an array, even if null from DB join
      const processedOrders = (ordersData || []).map(o => ({
        ...o,
        items: o.order_items || [], // Supabase returns joined table as property name
      }));
      setOrders(processedOrders);

    } catch (error: any) {
      console.error("Error fetching initial data (raw error object):", error);
      
      let displayErrorMessage = 'Đã xảy ra lỗi không xác định khi tải dữ liệu.'; 
      
      if (typeof error === 'string') {
        displayErrorMessage = error;
      } else if (error && typeof error.message === 'string') {
        displayErrorMessage = error.message;
        // Append details and hint if they are strings and exist (common in PostgrestError)
        if (typeof error.details === 'string') {
          displayErrorMessage += ` Chi tiết: ${error.details}`;
        }
        if (typeof error.hint === 'string') {
          displayErrorMessage += ` Gợi ý: ${error.hint}`;
        }
      }
      addNotification(`Lỗi tải dữ liệu: ${displayErrorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Product CRUD
  const addProduct = async (productData: ProductFormData): Promise<Product | null> => {
    setLoading(true);
    try {
      // created_at is handled by DB
      const { data, error } = await supabase.from('products').insert([{ ...productData }]).select().single();
      if (error) throw error;
      if (data) {
        setProducts(prev => [...prev, data]);
        addNotification(`Đã thêm sản phẩm: ${data.name}`, 'success');
        return data;
      }
      return null;
    } catch (error: any) {
      addNotification(`Lỗi thêm sản phẩm: ${error.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (updatedProductData: Partial<Product> & { id: string }): Promise<Product | null> => {
    setLoading(true);
    try {
      const { created_at, ...updatePayload } = updatedProductData; // Do not update created_at
      const { data, error } = await supabase.from('products').update(updatePayload).eq('id', updatedProductData.id).select().single();
      if (error) throw error;
      if (data) {
        setProducts(prev => prev.map(p => p.id === data.id ? data : p));
        addNotification(`Đã cập nhật sản phẩm: ${data.name}`, 'success');
        return data;
      }
      return null;
    } catch (error: any) {
      addNotification(`Lỗi cập nhật sản phẩm: ${error.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Check dependencies
      const { data: batches, error: batchError } = await supabase.from('inventory_batches').select('id').eq('product_id', productId).limit(1);
      if (batchError) throw batchError;
      if (batches && batches.length > 0) {
        addNotification('Không thể xóa sản phẩm đã có trong lô hàng tồn kho.', 'error');
        return false;
      }
      const { data: orderItems, error: itemError } = await supabase.from('order_items').select('id').eq('product_id', productId).limit(1);
      if (itemError) throw itemError;
      if (orderItems && orderItems.length > 0) {
        addNotification('Không thể xóa sản phẩm đã có trong đơn hàng.', 'error');
        return false;
      }

      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== productId));
      addNotification('Đã xóa sản phẩm.', 'success');
      return true;
    } catch (error: any) {
      addNotification(`Lỗi xóa sản phẩm: ${error.message}`, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };
  const getProductById = (productId: string) => products.find(p => p.id === productId);

  // Customer CRUD
  const addCustomer = async (customerData: CustomerFormData): Promise<Customer | null> => {
    setLoading(true);
    try {
      // created_at is handled by DB
      const { data, error } = await supabase.from('customers').insert([{ ...customerData }]).select().single();
      if (error) throw error;
      if (data) {
        setCustomers(prev => [...prev, data]);
        addNotification(`Đã thêm khách hàng: ${data.name}`, 'success');
        return data;
      }
      return null;
    } catch (error: any) {
      addNotification(`Lỗi thêm khách hàng: ${error.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };
  const updateCustomer = async (updatedCustomerData: Partial<Customer> & { id: string }): Promise<Customer | null> => {
     setLoading(true);
    try {
      const { created_at, ...updatePayload } = updatedCustomerData; // Do not update created_at
      const { data, error } = await supabase.from('customers').update(updatePayload).eq('id', updatedCustomerData.id).select().single();
      if (error) throw error;
      if (data) {
        setCustomers(prev => prev.map(c => c.id === data.id ? data : c));
        addNotification(`Đã cập nhật khách hàng: ${data.name}`, 'success');
        return data;
      }
      return null;
    } catch (error: any) {
      addNotification(`Lỗi cập nhật khách hàng: ${error.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };
  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data: customerOrders, error: orderError } = await supabase.from('orders').select('id').eq('customer_id', customerId).limit(1);
      if (orderError) throw orderError;
      if (customerOrders && customerOrders.length > 0) {
        addNotification('Không thể xóa khách hàng đã có đơn hàng.', 'error');
        return false;
      }
      const { error } = await supabase.from('customers').delete().eq('id', customerId);
      if (error) throw error;
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      addNotification('Đã xóa khách hàng.', 'success');
      return true;
    } catch (error: any) {
      addNotification(`Lỗi xóa khách hàng: ${error.message}`, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };
  const getCustomerById = (customerId: string) => customers.find(c => c.id === customerId);

  // InventoryBatch CRUD
  const addInventoryBatch = async (batchData: InventoryBatchFormData): Promise<InventoryBatch | null> => {
    setLoading(true);
    try {
      const newBatchPayload = { 
        ...batchData, 
        quantity: batchData.initial_quantity, // current quantity is initial on creation
        // created_at is handled by the database
      };
      const { data, error } = await supabase.from('inventory_batches').insert([newBatchPayload]).select('*, products(name, code, unit)').single();
      if (error) throw error;
      if (data) {
        setInventoryBatches(prev => [data, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())); // Sort by created_at
        addNotification(`Đã thêm lô hàng mới: ${data.batch_no}`, 'success');
        return data;
      }
      return null;
    } catch (error: any) {
      addNotification(`Lỗi thêm lô hàng: ${error.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };
  const updateInventoryBatch = async (updatedBatchData: Partial<InventoryBatch> & { id: string }): Promise<InventoryBatch | null> => {
     setLoading(true);
    try {
      const { created_at, ...updatePayload } = updatedBatchData; // Do not update created_at
      const { data, error } = await supabase.from('inventory_batches').update(updatePayload).eq('id', updatedBatchData.id).select('*, products(name, code, unit)').single();
      if (error) throw error;
      if (data) {
        setInventoryBatches(prev => prev.map(b => b.id === data.id ? data : b).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())); // Sort by created_at
        addNotification(`Đã cập nhật lô hàng: ${data.batch_no}`, 'success');
        return data;
      }
      return null;
    } catch (error: any)
    {
      addNotification(`Lỗi cập nhật lô hàng: ${error.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };
  const deleteInventoryBatch = async (batchId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const batch = inventoryBatches.find(b => b.id === batchId);
      if (batch && batch.quantity < batch.initial_quantity) {
          addNotification('Không thể xóa lô hàng đã có giao dịch xuất kho (số lượng hiện tại < số lượng ban đầu).', 'error');
          return false;
      }
      // Further check: is this batch_id in any order_items?
      const { data: orderItems, error: itemError } = await supabase.from('order_items').select('id').eq('batch_id', batchId).limit(1);
      if (itemError) throw itemError;
      if (orderItems && orderItems.length > 0) {
           addNotification('Không thể xóa lô hàng đã được sử dụng trong đơn hàng.', 'error');
           return false;
      }

      const { error } = await supabase.from('inventory_batches').delete().eq('id', batchId);
      if (error) throw error;
      setInventoryBatches(prev => prev.filter(b => b.id !== batchId));
      addNotification('Đã xóa lô hàng.', 'success');
      return true;
    } catch (error: any) {
      addNotification(`Lỗi xóa lô hàng: ${error.message}`, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };
  const getBatchById = (batchId: string) => inventoryBatches.find(b => b.id === batchId);

  const addStockToBatch = async (batchId: string, quantityToAdd: number): Promise<InventoryBatch | null> => {
    setLoading(true);
    try {
      const batch = getBatchById(batchId);
      if (!batch) throw new Error("Lô hàng không tồn tại.");
      if (quantityToAdd <= 0) throw new Error("Số lượng nhập thêm phải lớn hơn 0.");

      const newQuantity = batch.quantity + quantityToAdd;
      const newInitialQuantity = batch.initial_quantity + quantityToAdd; 
      
      const { data, error } = await supabase.from('inventory_batches')
        .update({ quantity: newQuantity, initial_quantity: newInitialQuantity })
        .eq('id', batchId)
        .select('*, products(name, code, unit)')
        .single();
      
      if (error) throw error;
      if (data) {
        setInventoryBatches(prev => prev.map(b => b.id === data.id ? data : b).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())); // Sort by created_at
        addNotification(`Đã nhập ${quantityToAdd} vào lô ${data.batch_no}`, 'success');
        return data;
      }
      return null;
    } catch (error: any) {
      addNotification(`Lỗi nhập kho: ${error.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeStockFromBatch = async (batchId: string, quantityToRemove: number, _reason: string = "Xuất kho"): Promise<InventoryBatch | null> => {
    setLoading(true);
    try {
      const batch = getBatchById(batchId);
      if (!batch) throw new Error("Lô hàng không tồn tại.");
      if (quantityToRemove <= 0) throw new Error("Số lượng xuất phải lớn hơn 0.");
      if (batch.quantity < quantityToRemove) {
        throw new Error(`Không đủ hàng trong lô ${batch.batch_no} để xuất.`);
      }

      const newQuantity = batch.quantity - quantityToRemove;
      const { data, error } = await supabase.from('inventory_batches')
        .update({ quantity: newQuantity })
        .eq('id', batchId)
        .select('*, products(name, code, unit)')
        .single();

      if (error) throw error;
      if (data) {
        setInventoryBatches(prev => prev.map(b => b.id === data.id ? data : b).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())); // Sort by created_at
        addNotification(`Đã xuất ${quantityToRemove} từ lô ${data.batch_no}`, 'success');
        return data;
      }
      return null;
    } catch (error: any) {
      addNotification(`Lỗi xuất kho: ${error.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Order Management
  const placeOrder = async (orderData: OrderFormData): Promise<Order | null> => {
    setLoading(true);
    try {
      // TODO: Implement this as a Supabase Edge Function for transactional integrity.
      // For now, sequential operations:
      // 1. Calculate total amount
      let calculatedTotalAmount = 0;
      for (const item of orderData.items) {
          const product = getProductById(item.product_id); // Assumes products are loaded
          if (!product) throw new Error(`Sản phẩm ID ${item.product_id} không tìm thấy.`);
          const price = item.unit_price > 0 ? item.unit_price : product.sell_price;
          calculatedTotalAmount += item.quantity * price;
      }
      calculatedTotalAmount += (orderData.shipping_fee || 0);
      calculatedTotalAmount -= (orderData.discount || 0);
      calculatedTotalAmount = Math.max(0, calculatedTotalAmount);

      // 2. Create Order record
      const orderPayload = {
        customer_id: orderData.customer_id,
        order_date: orderData.order_date || new Date().toISOString(),
        status: orderData.status || OrderStatus.PENDING,
        total_amount: calculatedTotalAmount,
        shipping_fee: orderData.shipping_fee,
        discount: orderData.discount,
        notes: orderData.notes,
        // created_at is handled by DB for orders table
      };
      const { data: newOrderData, error: orderError } = await supabase.from('orders').insert(orderPayload).select().single();
      if (orderError) throw orderError;
      if (!newOrderData) throw new Error("Không thể tạo đơn hàng.");

      // 3. Create OrderItem records and update inventory
      const orderItemsToInsert: Omit<OrderItem, 'id' | 'products'>[] = [];
      const batchUpdates: Array<{id: string, quantity: number}> = [];

      for (const item of orderData.items) {
        // Find suitable batches (FIFO using created_at)
        const productBatches = inventoryBatches
          .filter(b => b.product_id === item.product_id && b.quantity > 0)
          .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // FIFO by created_at
        
        let remainingQtyToFulfill = item.quantity;
        let batchIdForOrderItem : string | undefined = undefined;

        for (const batch of productBatches) {
          if (remainingQtyToFulfill <= 0) break;
          const qtyFromThisBatch = Math.min(remainingQtyToFulfill, batch.quantity);
          
          batchUpdates.push({ id: batch.id, quantity: batch.quantity - qtyFromThisBatch });
          remainingQtyToFulfill -= qtyFromThisBatch;
          if (!batchIdForOrderItem) batchIdForOrderItem = batch.id; // Assign first batch used
        }

        if (remainingQtyToFulfill > 0) {
          throw new Error(`Không đủ tồn kho cho sản phẩm ${getProductById(item.product_id)?.name}. Cần ${item.quantity}, chỉ có ${item.quantity - remainingQtyToFulfill} khả dụng.`);
        }
        
        const product = getProductById(item.product_id);
        orderItemsToInsert.push({
          order_id: newOrderData.id,
          product_id: item.product_id,
          batch_id: batchIdForOrderItem, 
          quantity: item.quantity,
          unit_price: item.unit_price > 0 ? item.unit_price : (product?.sell_price || 0),
        });
      }

      const { data: insertedItems, error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert).select('*, products(name, unit)');
      if (itemsError) throw itemsError;
      if (!insertedItems) throw new Error("Không thể thêm chi tiết đơn hàng.");

      for (const update of batchUpdates) {
        const { error: batchUpdateError } = await supabase.from('inventory_batches').update({ quantity: update.quantity }).eq('id', update.id);
        if (batchUpdateError) console.error(`Lỗi cập nhật lô ${update.id}: ${batchUpdateError.message}`); 
      }
      
      await fetchInitialData(); 
      addNotification(`Đơn hàng ${String(newOrderData.id).substring(0,8)} đã được tạo.`, 'success');
      const finalNewOrder = (await supabase.from('orders').select('*, customers(name, phone), order_items(*, products(name, unit))').eq('id', newOrderData.id).single()).data;
      if (finalNewOrder) {
        finalNewOrder.items = finalNewOrder.order_items || [];
      }
      return finalNewOrder || null;

    } catch (error: any) {
      addNotification(`Lỗi tạo đơn hàng: ${error.message}`, 'error');
      await fetchInitialData();
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select('*, customers(name, phone), order_items(*, products(name, unit))').single();
      if (error) throw error;
      if (data) {
        data.items = data.order_items || [];
        setOrders(prev => prev.map(o => o.id === data.id ? data : o).sort((a,b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime()));
        addNotification(`Cập nhật trạng thái đơn hàng ${String(orderId).substring(0,8)} thành ${status}.`, 'success');
        return data;
      }
      return null;
    } catch (error: any) {
      addNotification(`Lỗi cập nhật trạng thái đơn hàng: ${error.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };
  const getOrderById = (orderId: string) => {
    const order = orders.find(o => String(o.id) === String(orderId)); // Ensure comparison works if IDs are numbers
    if (order && !order.items) return { ...order, items: [] };
    return order;
  };


  const value = {
    products, customers, inventoryBatches, orders,
    addProduct, updateProduct, deleteProduct, getProductById,
    addCustomer, updateCustomer, deleteCustomer, getCustomerById,
    addInventoryBatch, updateInventoryBatch, deleteInventoryBatch, getBatchById,
    addStockToBatch, removeStockFromBatch,
    placeOrder, updateOrderStatus, getOrderById,
    loading, setLoading,
    notifications, addNotification, removeNotification,
    fetchInitialData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
