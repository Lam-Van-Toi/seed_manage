import React, { useState, useEffect } from 'react';
import { Product, ProductFormData } from '../../types';
import { Button } from '../../components/Button';
import { useData } from '../../contexts/DataContext';

interface ProductFormProps {
  product?: Product | null;
  onSave: (product: Product) => void; // Callback after successful save
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const { addProduct, updateProduct: updateProductContext, addNotification } = useData();
  const [formData, setFormData] = useState<ProductFormData>({
    code: '',
    name: '',
    unit: 'kg',
    cost_price: 0,
    sell_price: 0,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code,
        name: product.name,
        unit: product.unit,
        cost_price: product.cost_price,
        sell_price: product.sell_price,
        description: product.description || '',
      });
    } else {
       setFormData({
        code: '', name: '', unit: 'kg', cost_price: 0, sell_price: 0, description: '',
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: (name === 'cost_price' || name === 'sell_price') ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '' || formData.code.trim() === '') {
        addNotification('Mã giống và Tên giống không được để trống.', 'warning');
        return;
    }
    setIsSubmitting(true);
    let result: Product | null = null;
    if (product) {
      result = await updateProductContext({ ...formData, id: product.id });
    } else {
      result = await addProduct(formData);
    }
    setIsSubmitting(false);
    if (result) {
      onSave(result); // Trigger callback which usually closes modal and refreshes list
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">Mã Giống</label>
        <input type="text" name="code" id="code" value={formData.code} onChange={handleChange} className={inputClass} required disabled={isSubmitting} />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên Giống</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputClass} required disabled={isSubmitting}/>
      </div>
      <div>
        <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Đơn vị tính</label>
        <select name="unit" id="unit" value={formData.unit} onChange={handleChange} className={inputClass} disabled={isSubmitting}>
          <option value="kg">kg</option>
          <option value="bao">Bao</option>
          <option value="tấn">Tấn</option>
        </select>
      </div>
      <div>
        <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700">Giá vốn</label>
        <input type="number" name="cost_price" id="cost_price" value={formData.cost_price} onChange={handleChange} className={inputClass} min="0" step="any" disabled={isSubmitting}/>
      </div>
      <div>
        <label htmlFor="sell_price" className="block text-sm font-medium text-gray-700">Giá bán</label>
        <input type="number" name="sell_price" id="sell_price" value={formData.sell_price} onChange={handleChange} className={inputClass} min="0" step="any" disabled={isSubmitting}/>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className={inputClass} disabled={isSubmitting}></textarea>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Hủy</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? (product ? 'Đang cập nhật...' : 'Đang thêm...') : (product ? 'Cập nhật' : 'Thêm mới')}</Button>
      </div>
    </form>
  );
};
