
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/Button';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { OrderStatus, OrderItem } from '../../types';
// import { PencilIcon } from '../../components/icons/PencilIcon'; // Not used for now

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  // getOrderById gets data from local state, which is populated with joins
  // setLoading is used to simulate async nature if needed, or rely on context's global loading
  const { getOrderById, setLoading, loading, fetchInitialData } = useData(); 
  const navigate = useNavigate();

  // The order detail might need a specific fetch if not all data is included in list joins,
  // or if we want the absolute latest version. For now, using context's getOrderById.
  // A dedicated fetch for a single order could be: supabase.from('orders').select('*, customers(*), order_items(*, products(*))').eq('id', orderId).single()
  
  const order = orderId ? getOrderById(orderId) : undefined;

  useEffect(() => {
    // If order is not found in context, it might be a direct link access before data is loaded, or invalid ID.
    // Trigger a general data fetch which should include orders.
    if (!order && orderId) {
      setLoading(true);
      fetchInitialData().finally(() => setLoading(false));
    }
  }, [orderId, order, fetchInitialData, setLoading]);


  if (loading && !order) { // Show loading only if order is not yet available
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-red-600">Không tìm thấy đơn hàng</h2>
        <p className="text-gray-600 mt-2">Đơn hàng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => navigate('/orders')} className="mt-4">Quay lại Danh sách Đơn hàng</Button>
      </div>
    );
  }

  const customer = order.customers; // Joined customer data
  const orderItems = order.items || []; // Joined order_items data (aliased to items)

  const calculateItemSubtotal = (item: OrderItem): number => {
    return item.quantity * item.unit_price;
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Chi tiết Đơn hàng: ĐH-{String(order.id).substring(0,8)}</h1>
          <p className="text-sm text-gray-500">Ngày đặt: {formatDate(order.order_date)}</p>
        </div>
        <span className={`mt-2 sm:mt-0 px-4 py-1.5 text-sm font-semibold rounded-full ${
            order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' :
            order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-700' :
            order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-700' :
            order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
        }`}>
            {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Thông tin Khách hàng</h2>
          {customer ? (
            <div className="space-y-1 text-gray-600">
              <p><strong>Tên:</strong> {customer.name}</p>
              <p><strong>Điện thoại:</strong> {customer.phone}</p>
              <p><strong>Địa chỉ:</strong> {customer.address}</p>
            </div>
          ) : <p className="text-gray-500">Không tìm thấy thông tin khách hàng.</p>}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Thông tin Giao hàng</h2>
          <div className="space-y-1 text-gray-600">
             <p><strong>Địa chỉ giao:</strong> {customer?.address || 'N/A'}</p>
             <p><strong>Ghi chú đơn hàng:</strong> {order.notes || 'Không có'}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Sản phẩm đã đặt</h2>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn giá</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orderItems.map(item => {
                const productInfo = item.products; // Joined product data for the item
                const subtotal = calculateItemSubtotal(item);
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{productInfo?.name || 'Sản phẩm không xác định'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity} {productInfo?.unit}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium text-right">{formatCurrency(subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="pt-6 border-t border-gray-200 space-y-3 text-right">
        {order.shipping_fee && <p className="text-gray-600">Phí vận chuyển: <span className="font-medium">{formatCurrency(order.shipping_fee)}</span></p>}
        {order.discount && <p className="text-red-600">Giảm giá: <span className="font-medium">-{formatCurrency(order.discount)}</span></p>}
        <p className="text-2xl font-bold text-green-600">Tổng cộng: {formatCurrency(order.total_amount)}</p>
      </div>

      <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
        <Button variant="secondary" onClick={() => navigate('/orders')}>
          Quay lại Danh sách
        </Button>
      </div>
    </div>
  );
};
