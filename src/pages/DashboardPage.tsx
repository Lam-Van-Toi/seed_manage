
import React, { useMemo } from 'react';
import { StatCard } from '../components/StatCard';
import { HomeIcon } from '../components/icons/HomeIcon';
import { ArchiveBoxIcon } from '../components/icons/ArchiveBoxIcon';
import { ShoppingCartIcon } from '../components/icons/ShoppingCartIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { useData } from '../contexts/DataContext';
import { OrderStatus, Product, Order } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { inventoryBatches, orders, products, loading } = useData();

  const totalInventoryValue = useMemo(() => {
    return inventoryBatches.reduce((sum, batch) => {
      // batch.products contains joined product info if fetched correctly
      const productInfo = batch.products || products.find(p => p.id === batch.product_id);
      return sum + (productInfo ? batch.quantity * productInfo.cost_price : 0);
    }, 0);
  }, [inventoryBatches, products]);

  const processingOrdersCount = useMemo(() => {
    return orders.filter(order => 
      order.status === OrderStatus.PENDING || 
      order.status === OrderStatus.PROCESSING ||
      order.status === OrderStatus.PACKING
    ).length;
  }, [orders]);

  const monthlyRevenue = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return orders
      .filter(order => {
        const orderDateObj = new Date(order.order_date);
        return order.status === OrderStatus.COMPLETED &&
               orderDateObj.getMonth() === currentMonth &&
               orderDateObj.getFullYear() === currentYear;
      })
      .reduce((sum, order) => sum + order.total_amount, 0);
  }, [orders]);

  const dailyRevenueData = useMemo(() => {
    const data: { [key: string]: number } = {};
    const today = new Date();
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);

    orders
      .filter(order => new Date(order.order_date) >= last30Days && order.status === OrderStatus.COMPLETED)
      .forEach(order => {
        const dateStr = formatDate(order.order_date);
        data[dateStr] = (data[dateStr] || 0) + order.total_amount;
      });
    
    return Object.entries(data)
      .map(([name, revenue]) => ({ name, DoanhThu: revenue }))
      .sort((a,b) => new Date(a.name.split('/').reverse().join('-')).getTime() - new Date(b.name.split('/').reverse().join('-')).getTime()) 
      .slice(-15); 
  }, [orders]);

  const topSellingProducts = useMemo(() => {
    const productSales: { [productId: string]: { product: Product | undefined, quantity: number } } = {};
    orders.forEach(order => {
      if (order.status === OrderStatus.COMPLETED) {
        (order.items || []).forEach(item => { // order.items might be order.order_items from Supabase join
          // Always use the full product from the main products list
          const fullProduct = products.find(p => p.id === item.product_id);
          
          if (fullProduct) { // Ensure product exists in our main list
            if (!productSales[item.product_id]) {
              productSales[item.product_id] = { product: fullProduct, quantity: 0 };
            }
            productSales[item.product_id].quantity += item.quantity;
          }
        });
      }
    });
    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders, products]);

  const recentOrders = useMemo(() => {
    return [...orders] // orders already sorted by date desc in context
      .slice(0, 5);
  }, [orders]);

  if (loading && products.length === 0) { // Show full page loader only on initial load
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng giá trị tồn kho" 
          value={formatCurrency(totalInventoryValue)} 
          icon={<ArchiveBoxIcon />}
          description="Dựa trên giá vốn"
          bgColorClass="bg-blue-500"
        />
        <StatCard 
          title="Đơn hàng đang xử lý" 
          value={processingOrdersCount} 
          icon={<ShoppingCartIcon />}
          description="Chờ xử lý, đóng gói, giao hàng"
          bgColorClass="bg-yellow-500"
          textColorClass="text-gray-900"
        />
        <StatCard 
          title="Doanh thu tháng này" 
          value={formatCurrency(monthlyRevenue)} 
          icon={<ChartBarIcon />}
          description={`Tính đến ${formatDate(new Date())}`}
          bgColorClass="bg-green-500"
        />
         <StatCard 
          title="Tổng số sản phẩm" 
          value={products.length} 
          icon={<HomeIcon />} 
          description="Các loại giống đang quản lý"
          bgColorClass="bg-purple-500"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Xu hướng doanh thu (15 ngày gần nhất)</h2>
        {dailyRevenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value, 'VND').replace('VND','').trim()}/>
              <Tooltip formatter={(value: number) => [formatCurrency(value), "Doanh thu"]}/>
              <Legend />
              <Bar dataKey="DoanhThu" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">Chưa có đủ dữ liệu doanh thu để hiển thị biểu đồ.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Sản phẩm bán chạy (Top 5)</h2>
          {topSellingProducts.length > 0 ? (
            <ul className="space-y-3">
              {topSellingProducts.map(({ product, quantity }) => product && (
                <li key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                  <span className="font-medium text-gray-700">{product.name}</span>
                  <span className="text-green-600 font-semibold">{quantity} {product.unit}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Chưa có dữ liệu sản phẩm bán chạy.</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Đơn hàng mới nhất (5 đơn)</h2>
          {recentOrders.length > 0 ? (
          <ul className="space-y-3">
            {recentOrders.map((order: Order) => (
              <li key={order.id} className="p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                <Link to={`/orders/${order.id}`} className="block">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-600 hover:underline">ĐH-{String(order.id).substring(0,8)}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                      order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Ngày: {formatDate(order.order_date)} - Tổng: {formatCurrency(order.total_amount)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
           ) : (
            <p className="text-gray-500">Chưa có đơn hàng nào.</p>
          )}
        </div>
      </div>
    </div>
  );
};
