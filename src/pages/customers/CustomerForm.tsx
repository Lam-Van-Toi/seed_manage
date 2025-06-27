import React, { useState, useEffect } from 'react';
import { Customer, CustomerFormData } from '../../types';
import { Button } from '../../components/Button';
import { useData } from '../../contexts/DataContext';

interface CustomerFormProps {
  customer?: Customer | null;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSave, onCancel }) => {
  const { addCustomer, updateCustomer: updateCustomerContext, addNotification } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      });
    } else {
        setFormData({ name: '', phone: '', address: '' });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '' || formData.phone.trim() === '') {
        addNotification('Tên khách hàng và Số điện thoại không được để trống.', 'warning');
        return;
    }
    setIsSubmitting(true);
    let result: Customer | null = null;
    if (customer) {
      result = await updateCustomerContext({ ...formData, id: customer.id });
    } else {
      result = await addCustomer(formData);
    }
    setIsSubmitting(false);
    if (result) {
      onSave(result);
    }
  };
  
  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên Khách hàng</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputClass} required disabled={isSubmitting}/>
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className={inputClass} required disabled={isSubmitting}/>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Địa chỉ</label>
        <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={3} className={inputClass} disabled={isSubmitting}></textarea>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Hủy</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (customer ? 'Đang cập nhật...' : 'Đang thêm...') : (customer ? 'Cập nhật' : 'Thêm mới')}
        </Button>
      </div>
    </form>
  );
};
