import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { OrderStatus, DailyRevenue, SalesByProduct } from '../../types';
import { Button } from '../../components/Button';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const ReportsPage: React.FC = () => {
  const { orders, products, addNotification, loading } = useData();
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(thirtyDaysAgo);
  const [endDate, setEndDate] = useState<string>(today);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDateOnly = order.order_date.split('T')[0];
      return orderDateOnly >= startDate && orderDateOnly <= endDate && order.status === OrderStatus.COMPLETED;
    });
  }, [orders, startDate, endDate]);

  const dailyRevenueData: DailyRevenue[] = useMemo(() => {
    const revenueMap: { [date: string]: number } = {};
    filteredOrders.forEach(order => {
      const dateStr = formatDate(order.order_date); // Format for display
      revenueMap[dateStr] = (revenueMap[dateStr] || 0) + order.total_amount;
    });
    return Object.entries(revenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a,b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());
  }, [filteredOrders]);

  const salesByProductData: SalesByProduct[] = useMemo(() => {
    const salesMap: { [productId: string]: SalesByProduct } = {};
    filteredOrders.forEach(order => {
      (order.items || []).forEach(item => { // order.items is order_items from join
        const productInfo = item.products || products.find(p => p.id === item.product_id); // item.products is joined info
        if (!productInfo) return;

        if (!salesMap[item.product_id]) {
          salesMap[item.product_id] = { 
            product_id: item.product_id, 
            product_name: productInfo.name, 
            total_quantity_sold: 0, 
            total_revenue: 0 
          };
        }
        salesMap[item.product_id].total_quantity_sold += item.quantity;
        const itemSubtotal = item.quantity * item.unit_price;
        salesMap[item.product_id].total_revenue += itemSubtotal;
      });
    });
    return Object.values(salesMap).sort((a,b) => b.total_revenue - a.total_revenue);
  }, [filteredOrders, products]);
  
  const totalRevenueInRange = useMemo(() => dailyRevenueData.reduce((sum, item) => sum + item.revenue, 0), [dailyRevenueData]);
  const totalOrdersInRange = useMemo(() => filteredOrders.length, [filteredOrders]);
  const totalQuantitySoldInRange = useMemo(() => salesByProductData.reduce((sum, item) => sum + item.total_quantity_sold, 0), [salesByProductData]);


  const handleExportCSV = () => {
    if (dailyRevenueData.length === 0) {
        addNotification("Không có dữ liệu để xuất.", "warning");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,Ngày,Doanh Thu\n";
    dailyRevenueData.forEach(row => {
        csvContent += `${row.date},${row.revenue}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BaoCaoDoanhThu_${startDate}_den_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification("Đã xuất báo cáo doanh thu CSV.", "success");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Báo cáo Bán hàng</h1>

      <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Từ ngày</label>
          <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 input-style w-full"/>
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Đến ngày</label>
          <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 input-style w-full"/>
        </div>
        <Button onClick={handleExportCSV} variant="secondary">Xuất CSV Doanh Thu</Button>
         <style>{`.input-style { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); outline: none; transition: box-shadow 0.15s ease-in-out, border-color 0.15s ease-in-out; } .input-style:focus { border-color: #34D399; box-shadow: 0 0 0 0.2rem rgba(52, 211, 153, 0.25); }`}</style>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-100 p-4 rounded-lg shadow text-center">
                <p className="text-sm text-green-700">Tổng Doanh Thu</p>
                <p className="text-2xl font-bold text-green-800">{loading ? <LoadingSpinner size="sm"/> : formatCurrency(totalRevenueInRange)}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
                <p className="text-sm text-blue-700">Tổng Đơn Hàng</p>
                <p className="text-2xl font-bold text-blue-800">{loading ? <LoadingSpinner size="sm"/> : totalOrdersInRange}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg shadow text-center">
                <p className="text-sm text-yellow-700">Tổng Sản Phẩm Bán Ra</p>
                <p className="text-2xl font-bold text-yellow-800">{loading ? <LoadingSpinner size="sm"/> : totalQuantitySoldInRange.toLocaleString('vi-VN')}</p>
            </div>
        </div>


      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Biểu đồ Doanh thu theo Ngày</h2>
        {loading && dailyRevenueData.length === 0 ? <LoadingSpinner /> : dailyRevenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value, 'VND').replace('VND','').trim()}/>
              <Tooltip formatter={(value: number) => [formatCurrency(value), "Doanh thu"]}/>
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Doanh Thu" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-gray-500">Không có dữ liệu doanh thu trong khoảng thời gian này.</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Doanh thu theo Sản phẩm</h2>
         {loading && salesByProductData.length === 0 ? <LoadingSpinner /> : salesByProductData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng bán</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng doanh thu</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {salesByProductData.map(item => (
                    <tr key={item.product_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.total_quantity_sold.toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(item.total_revenue)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        ) : <p className="text-gray-500">Không có dữ liệu bán hàng theo sản phẩm.</p>}
      </div>
    </div>
  );
};
