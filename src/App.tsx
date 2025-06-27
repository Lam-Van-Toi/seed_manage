
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { BatchListPage } from './pages/inventory/BatchListPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { DataProvider } from './contexts/DataContext';

const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="inventory/batches" element={<BatchListPage />} />
            {/* Add forms for product/batch here if needed as separate routes, or use modals */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetailPage />} /> 
            {/* Order form is typically a modal or part of OrdersPage for creation */}
            <Route path="reports" element={<ReportsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            {/* Catch-all for undefined routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
};

export default App;
