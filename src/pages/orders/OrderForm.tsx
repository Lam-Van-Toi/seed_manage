import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderFormData, OrderItem as OrderItemType, SelectOption, OrderStatus, OrderFormDataItem } from '../../types';
import { Button } from '../../components/Button';
import { useData } from '../../contexts/DataContext';
import { PlusCircleIcon } from '../../components/icons/PlusCircleIcon';
import { TrashIcon } from '../../components/icons/TrashIcon';
import { formatCurrency } from '../../utils/helpers';
import { ORDER_STATUS_OPTIONS } from '../../constants';

interface OrderFormProps {
  order?: Order | null;
  onSave: (order: Order) => void;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ order, onSave, onCancel }) => {
  const { customers, products, inventoryBatches, placeOrder, updateOrderStatus, getProductById, getCustomerById, addNotification } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialItem: OrderFormDataItem = { product_id: '', quantity: 1, unit_price: 0 };
  const [formData, setFormData] = useState<OrderFormData>({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    status: OrderStatus.PENDING,
    items: [initialItem],
    shipping_fee: 0,
    discount: 0,
    notes: '',
  });

  const customerOptions: SelectOption[] = customers.map(c => ({ value: c.id, label: `${c.name} (${c.phone})` }));
  
  const getAvailableStock = useCallback((productId: string): number => {
    return inventoryBatches
      .filter(batch => batch.product_id === productId)
      .reduce((sum, batch) => sum + batch.quantity, 0);
  }, [inventoryBatches]);

  const productOptions: SelectOption[] = products.map(p => ({ value: p.id, label: `${p.name} (${p.code}) - Tồn: ${getAvailableStock(p.id)} ${p.unit}`}));


  useEffect(() => {
    if (order) {
      setFormData({
        customer_id: order.customer_id,
        order_date: order.order_date.split('T')[0],
        status: order.status,
        items: order.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          batch_id: item.batch_id,
        })),
        shipping_fee: order.shipping_fee || 0,
        discount: order.discount || 0,
        notes: order.notes || '',
      });
    } else {
       setFormData({
        customer_id: customerOptions.length > 0 ? customerOptions[0].value : '',
        order_date: new Date().toISOString().split('T')[0],
        status: OrderStatus.PENDING,
        items: [initialItem],
        shipping_fee: 0, discount: 0, notes: '',
      });
    }
  }, [order, customers, products, getAvailableStock]); // Added dependencies

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'shipping_fee' || name === 'discount') ? parseFloat(value) || 0 : value 
    }));
  };

  const handleItemChange = (index: number, field: keyof OrderFormDataItem, value: string | number) => {
    const newItems = [...formData.items];
    const currentItem = { ...newItems[index] };
    
    if (field === 'product_id') {
        currentItem.product_id = value as string;
        const product = getProductById(value as string);
        currentItem.unit_price = product ? product.sell_price : 0;
    } else if (field === 'quantity') {
        currentItem.quantity = Math.max(0, Number(value)); 
    } else if (field === 'unit_price') {
        currentItem.unit_price = Math.max(0, Number(value));
    }
    
    newItems[index] = currentItem;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, initialItem] }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) {
      addNotification("Đơn hàng phải có ít nhất một sản phẩm.", "warning");
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const calculateTotalAmount = useCallback(() => {
    let subtotalAgg = formData.items.reduce((sum, item) => {
        const product = getProductById(item.product_id);
        const price = item.unit_price > 0 ? item.unit_price : (product ? product.sell_price : 0);
        return sum + (item.quantity * price);
    }, 0);
    subtotalAgg += (formData.shipping_fee || 0);
    subtotalAgg -= (formData.discount || 0);
    return Math.max(0, subtotalAgg);
  }, [formData.items, formData.shipping_fee, formData.discount, getProductById]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) {
        addNotification("Vui lòng chọn khách hàng.", "error");
        return;
    }
    if (formData.items.some(item => !item.product_id || item.quantity <= 0)) {
        addNotification("Vui lòng kiểm tra lại sản phẩm và số lượng trong đơn hàng.", "error");
        return;
    }
    setIsSubmitting(true);
    let result: Order | null = null;
    if (order) { 
      result = await updateOrderStatus(order.id, formData.status);
    } else { 
      result = await placeOrder(formData);
    }
    setIsSubmitting(false);
    if (result) {
      onSave(result);
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";
  const totalAmount = calculateTotalAmount();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">Khách hàng</label>
          <select name="customer_id" id="customer_id" value={formData.customer_id} onChange={handleInputChange} className={inputClass} required disabled={!!order || isSubmitting}>
            <option value="">Chọn khách hàng</option>
            {customerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="order_date" className="block text-sm font-medium text-gray-700">Ngày đặt hàng</label>
          <input type="date" name="order_date" id="order_date" value={formData.order_date} onChange={handleInputChange} className={inputClass} required disabled={!!order || isSubmitting}/>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Chi tiết sản phẩm</h3>
        {formData.items.map((item, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-md grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50">
            <div className="md:col-span-5">
              <label htmlFor={`product-${index}`} className="block text-xs font-medium text-gray-600">Sản phẩm</label>
              <select 
                id={`product-${index}`}
                value={item.product_id} 
                onChange={(e) => handleItemChange(index, 'product_id', e.target.value)} 
                className={inputClass}
                disabled={!!order || isSubmitting}
              >
                <option value="">Chọn sản phẩm</option>
                {productOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor={`quantity-${index}`} className="block text-xs font-medium text-gray-600">Số lượng</label>
              <input 
                type="number" 
                id={`quantity-${index}`}
                value={item.quantity} 
                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))} 
                className={inputClass} 
                min="1"
                disabled={!!order || isSubmitting}
              />
            </div>
            <div className="md:col-span-3">
              <label htmlFor={`price-${index}`} className="block text-xs font-medium text-gray-600">Đơn giá</label>
              <input 
                type="number" 
                id={`price-${index}`}
                value={item.unit_price} 
                onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))} 
                className={inputClass} 
                min="0"
                disabled={!!order || isSubmitting}
              />
            </div>
             <div className="md:col-span-2 text-right">
              {!order && (
                <Button type="button" variant="danger" size="sm" onClick={() => removeItem(index)} className="w-full md:w-auto" disabled={isSubmitting}>
                    <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {!order && (
            <Button type="button" variant="secondary" onClick={addItem} leftIcon={<PlusCircleIcon className="w-5 h-5"/>} disabled={isSubmitting}>
                Thêm sản phẩm
            </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="shipping_fee" className="block text-sm font-medium text-gray-700">Phí vận chuyển</label>
          <input type="number" name="shipping_fee" id="shipping_fee" value={formData.shipping_fee} onChange={handleInputChange} className={inputClass} min="0" disabled={!!order || isSubmitting}/>
        </div>
        <div>
          <label htmlFor="discount" className="block text-sm font-medium text-gray-700">Giảm giá</label>
          <input type="number" name="discount" id="discount" value={formData.discount} onChange={handleInputChange} className={inputClass} min="0" disabled={!!order || isSubmitting}/>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Trạng thái đơn hàng</label>
          <select name="status" id="status" value={formData.status} onChange={handleInputChange} className={inputClass} required disabled={isSubmitting}>
            {ORDER_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Ghi chú</label>
        <textarea name="notes" id="notes" value={formData.notes} onChange={handleInputChange} rows={3} className={inputClass} disabled={!!order || isSubmitting}></textarea>
      </div>

      <div className="p-4 bg-green-50 rounded-md text-right">
        <span className="text-xl font-semibold text-green-700">Tổng cộng: {formatCurrency(totalAmount)}</span>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Hủy</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (order ? 'Đang cập nhật...' : 'Đang tạo...') : (order ? 'Cập nhật Trạng Thái' : 'Tạo Đơn Hàng')}
        </Button>
      </div>
    </form>
  );
};
