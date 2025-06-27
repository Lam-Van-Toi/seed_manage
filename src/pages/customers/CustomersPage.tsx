import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Customer } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { CustomerForm } from './CustomerForm';
import { PlusCircleIcon } from '../../components/icons/PlusCircleIcon';
import { PencilIcon } from '../../components/icons/PencilIcon';
import { TrashIcon } from '../../components/icons/TrashIcon';
import { UsersIcon } from '../../components/icons/UsersIcon';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const CustomersPage: React.FC = () => {
  const { customers, orders, deleteCustomer, loading } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const openModalForNew = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSaveCustomer = (_customer: Customer) => {
    closeModal();
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      await deleteCustomer(customerId);
    }
  };
  
  const getCustomerTotalSpent = (customerId: string): number => {
    return orders
      .filter(order => order.customer_id === customerId && order.status === 'Hoàn thành')
      .reduce((sum, order) => sum + order.total_amount, 0);
  };

  const getCustomerLastOrderDate = (customerId: string): string | null => {
    const customerOrders = orders
      .filter(order => order.customer_id === customerId)
      .sort((a,b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
    return customerOrders.length > 0 ? formatDate(customerOrders[0].order_date) : null;
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [customers, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý Khách hàng</h1>
        <Button onClick={openModalForNew} leftIcon={<PlusCircleIcon className="h-5 w-5" />}>
          Thêm Khách hàng
        </Button>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <input 
          type="text"
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu khách hàng...</p>
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng chi tiêu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn hàng cuối</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={customer.address}>{customer.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(getCustomerTotalSpent(customer.id))}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCustomerLastOrderDate(customer.id) || 'Chưa có'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openModalForEdit(customer)} title="Sửa">
                      <PencilIcon className="h-5 w-5 text-yellow-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomer(customer.id)} title="Xóa">
                      <TrashIcon className="h-5 w-5 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy khách hàng nào</h3>
            <p className="mt-1 text-sm text-gray-500">Hãy thử điều chỉnh tìm kiếm hoặc thêm khách hàng mới.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCustomer ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng Mới'}>
        <CustomerForm customer={editingCustomer} onSave={handleSaveCustomer} onCancel={closeModal} />
      </Modal>
    </div>
  );
};
