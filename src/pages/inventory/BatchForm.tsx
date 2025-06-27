
import React, { useState, useEffect } from 'react';
import { InventoryBatch, InventoryBatchFormData, SelectOption, Product } from '../../types';
import { Button } from '../../components/Button';
import { useData } from '../../contexts/DataContext';
import { formatDate } from '../../utils/helpers';

interface BatchFormProps {
  batch?: InventoryBatch | null;
  onSave: (batch: InventoryBatch) => void;
  onCancel: () => void;
}

export const BatchForm: React.FC<BatchFormProps> = ({ batch, onSave, onCancel }) => {
  const { products, addInventoryBatch, updateInventoryBatch, addStockToBatch, removeStockFromBatch, addNotification } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InventoryBatchFormData>({
    product_id: '',
    batch_no: '',
    initial_quantity: 0,
    min_threshold: 0,
    // entry_date and production_date removed
  });
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');

  const productOptions: SelectOption[] = products.map(p => ({ value: p.id, label: `${p.name} (${p.code})` }));

  useEffect(() => {
    if (batch) {
      setFormData({
        product_id: batch.product_id,
        batch_no: batch.batch_no,
        initial_quantity: batch.initial_quantity,
        min_threshold: batch.min_threshold,
        quantity: batch.quantity, // current quantity
        // created_at is part of 'batch' object, can be displayed directly
      });
    } else {
        setFormData({
            product_id: productOptions.length > 0 ? productOptions[0].value : '',
            batch_no: '', 
            initial_quantity: 0, 
            min_threshold: 0,
        });
    }
  }, [batch, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: (name === 'initial_quantity' || name === 'min_threshold') ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     if (formData.product_id.trim() === '' || formData.batch_no.trim() === '') {
        addNotification('Sản phẩm và Số lô không được để trống.', 'warning');
        return;
    }
    setIsSubmitting(true);
    let result: InventoryBatch | null = null;
    if (batch) { 
      // Exclude created_at from update payload as it shouldn't be changed
      const { created_at, id, ...updateDataPayload } = { ...batch, ...formData };
      result = await updateInventoryBatch({ ...updateDataPayload, id: batch.id });
    } else { 
      result = await addInventoryBatch(formData); // formData no longer contains entry_date/production_date
    }
    setIsSubmitting(false);
    if (result) {
      onSave(result);
    }
  };

  const handleStockAdjustment = async () => {
    if (!batch || stockAdjustment === 0) return;
    setIsSubmitting(true);
    let result: InventoryBatch | null = null;
    if (adjustmentType === 'add') {
      result = await addStockToBatch(batch.id, stockAdjustment);
    } else {
      result = await removeStockFromBatch(batch.id, stockAdjustment, "Điều chỉnh thủ công");
    }
    setIsSubmitting(false);
    if (result) {
      setFormData(prev => ({ ...prev, quantity: result?.quantity })); 
      onSave(result); 
    }
    setStockAdjustment(0);
  };
  
  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";
  const currentBatchProduct = products.find(p => p.id === (batch?.product_id || formData.product_id));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {batch && (
        <div>
            <label className="block text-sm font-medium text-gray-700">Ngày tạo lô (Ngày nhập)</label>
            <p className="mt-1 text-sm text-gray-800 bg-gray-100 p-2 rounded-md">{formatDate(batch.created_at)}</p>
        </div>
      )}
      <div>
        <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">Sản phẩm (Giống)</label>
        <select name="product_id" id="product_id" value={formData.product_id} onChange={handleChange} className={inputClass} required disabled={!!batch || isSubmitting}>
          <option value="">Chọn giống lúa</option>
          {productOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="batch_no" className="block text-sm font-medium text-gray-700">Số Lô</label>
        <input type="text" name="batch_no" id="batch_no" value={formData.batch_no} onChange={handleChange} className={inputClass} required disabled={!!batch || isSubmitting}/>
      </div>
      <div>
        <label htmlFor="initial_quantity" className="block text-sm font-medium text-gray-700">Số lượng ban đầu</label>
        <input type="number" name="initial_quantity" id="initial_quantity" value={formData.initial_quantity} onChange={handleChange} className={inputClass} min="0" required disabled={!!batch || isSubmitting}/>
      </div>
      {batch && (
         <div>
            <label className="block text-sm font-medium text-gray-700">Số lượng hiện tại</label>
            <p className="mt-1 text-lg font-semibold">{batch.quantity} {currentBatchProduct?.unit || ''}</p>
        </div>
      )}
      {/* Entry Date and Production Date fields removed */}
      <div>
        <label htmlFor="min_threshold" className="block text-sm font-medium text-gray-700">Ngưỡng tồn kho tối thiểu</label>
        <input type="number" name="min_threshold" id="min_threshold" value={formData.min_threshold} onChange={handleChange} className={inputClass} min="0" disabled={isSubmitting} />
      </div>

      {batch && (
        <div className="pt-4 border-t mt-4">
          <h4 className="text-md font-semibold mb-2">Điều chỉnh tồn kho</h4>
          <div className="flex items-center space-x-2">
            <input 
              type="number" 
              value={stockAdjustment} 
              onChange={(e) => setStockAdjustment(parseFloat(e.target.value) || 0)}
              className={`${inputClass} w-1/3`}
              placeholder="Số lượng"
              disabled={isSubmitting}
            />
            <select value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'remove')} className={`${inputClass} w-1/3`} disabled={isSubmitting}>
              <option value="add">Nhập thêm</option>
              <option value="remove">Xuất bớt</option>
            </select>
            <Button type="button" variant="secondary" onClick={handleStockAdjustment} disabled={stockAdjustment === 0 || isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : 'Áp dụng'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Hủy</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (batch ? 'Đang cập nhật...' : 'Đang thêm...') : (batch ? 'Cập nhật Lô' : 'Thêm Lô Mới')}
        </Button>
      </div>
    </form>
  );
};