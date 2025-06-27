
import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Order, OrderStatus, SelectOption } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { OrderForm } from './OrderForm';
import { PlusCircleIcon } from '../../components/icons/PlusCircleIcon';
import { EyeIcon } from '../../components/icons/EyeIcon';
import { PencilIcon } from '../../components/icons/PencilIcon';
import { ShoppingCartIcon } from '../../components/icons/ShoppingCartIcon';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { ORDER_STATUS_OPTIONS } from '../../constants';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const OrdersPage: React.FC = () => {
  const { orders, customers, loading } = useData(); // getCustomerById removed as customer info is joined
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterCustomerId, setFilterCustomerId] = useState<string>('');

  const customerOptions: SelectOption[] = [{value: '', label: 'Tất cả khách hàng'}, ...customers.map(c => ({ value: c.id, label: c.name }))];
  const statusOptions: SelectOption[] = [{value: '', label: 'Tất cả trạng thái'}, ...ORDER_STATUS_OPTIONS];

  const openModalForNew = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const openModalForEditStatus = (order: Order) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const handleSaveOrder = (_order: Order) => {
    closeModal();
  };
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const statusMatch = filterStatus ? order.status === filterStatus : true;
      const dateMatch = filterDate ? order.order_date.startsWith(filterDate) : true;
      const customerMatch = filterCustomerId ? order.customer_id === filterCustomerId : true;
      return statusMatch && dateMatch && customerMatch;
    }); // Already sorted by order_date desc from context
  }, [orders, filterStatus, filterDate, filterCustomerId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý Đơn Hàng</h1>
        <Button onClick={openModalForNew} leftIcon={<PlusCircleIcon className="h-5 w-5" />}>
          Tạo Đơn Hàng Mới
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4 md:items-end">
        <div>
          <label htmlFor="filterCustomer" className="block text-sm font-medium text-gray-700">Khách hàng</label>
          <select id="filterCustomer" value={filterCustomerId} onChange={(e) => setFilterCustomerId(e.target.value)} className="mt-1 block w-full input-style">
            {customerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700">Trạng thái</label>
          <select id="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="mt-1 block w-full input-style">
            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="flex-grow">
          <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700">Ngày đặt</label>
          <input type="date" id="filterDate" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="mt-1 block w-full input-style"/>
        </div>
         <div className="md:col-span-3 flex justify-end mt-4 md:mt-0">
            <Button variant="ghost" onClick={() => {setFilterStatus(''); setFilterDate(''); setFilterCustomerId('');}}>Xóa bộ lọc</Button>
        </div>
        <style>{`.input-style { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); outline: none; transition: box-shadow 0.15s ease-in-out, border-color 0.15s ease-in-out; } .input-style:focus { border-color: #34D399; box-shadow: 0 0 0 0.2rem rgba(52, 211, 153, 0.25); }`}</style>
      </div>

      {loading && filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
            <LoadingSpinner size="lg"/>
            <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu đơn hàng...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã ĐH</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Đặt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng Tiền</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const customerName = order.customers?.name || 'N/A'; // customers is the joined table alias
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link to={`/orders/${order.id}`} className="hover:underline">
                            ĐH-{String(order.id).substring(0,8)}
                        </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.order_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                        order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                        order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-800' :
                        order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(order.total_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" title="Xem Chi Tiết">
                            <EyeIcon className="h-5 w-5 text-blue-600" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => openModalForEditStatus(order)} title="Sửa Trạng Thái">
                        <PencilIcon className="h-5 w-5 text-yellow-600" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
         <div className="text-center py-12 bg-white rounded-lg shadow">
            <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy đơn hàng nào</h3>
            <p className="mt-1 text-sm text-gray-500">Hãy thử điều chỉnh bộ lọc hoặc tạo đơn hàng mới.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingOrder ? `Cập nhật Trạng thái ĐH-${String(editingOrder.id).substring(0,8)}` : 'Tạo Đơn Hàng Mới'} size="2xl">
        <OrderForm order={editingOrder} onSave={handleSaveOrder} onCancel={closeModal} />
      </Modal>
    </div>
  );
};
