
import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { InventoryBatch, Product, SelectOption } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { BatchForm } from './BatchForm';
import { PlusCircleIcon } from '../../components/icons/PlusCircleIcon';
import { PencilIcon } from '../../components/icons/PencilIcon';
import { TrashIcon } from '../../components/icons/TrashIcon';
import { ExclamationTriangleIcon } from '../../components/icons/ExclamationTriangleIcon';
import { ArchiveBoxIcon } from '../../components/icons/ArchiveBoxIcon';
import { formatDate } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/LoadingSpinner';


export const BatchListPage: React.FC = () => {
  const { inventoryBatches, products, deleteInventoryBatch, loading } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<InventoryBatch | null>(null);
  
  const [filterProductId, setFilterProductId] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>(''); // Stores date as YYYY-MM-DD

  const productOptions: SelectOption[] = [{ value: '', label: 'Tất cả giống' }, ...products.map(p => ({ value: p.id, label: `${p.name} (${p.code})` }))];

  const openModalForNew = () => {
    setEditingBatch(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (batch: InventoryBatch) => {
    setEditingBatch(batch);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBatch(null);
  };

  const handleSaveBatch = (_batch: InventoryBatch) => {
    closeModal();
  };
  
  const handleDeleteBatch = async (batchId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lô hàng này?')) {
      await deleteInventoryBatch(batchId);
    }
  };

  const getProductInfoFromBatch = (batch: InventoryBatch): Product | undefined => {
    return batch.products || products.find(p => p.id === batch.product_id);
  };
  
  const filteredBatches = useMemo(() => {
    return inventoryBatches.filter(batch => {
      const productMatch = filterProductId ? batch.product_id === filterProductId : true;
      // Compare only date part of created_at (which is ISO string) with filterDate (YYYY-MM-DD)
      const dateMatch = filterDate ? batch.created_at.startsWith(filterDate) : true;
      return productMatch && dateMatch;
    }); // Already sorted by created_at desc from context
  }, [inventoryBatches, filterProductId, filterDate]);

  const totalStockBySelectedProduct = useMemo(() => {
    if (!filterProductId) return null; 
    const selectedProduct = products.find(p => p.id === filterProductId);
    if (!selectedProduct) return null;

    const totalStock = inventoryBatches
        .filter(b => b.product_id === filterProductId)
        .reduce((sum, batch) => sum + batch.quantity, 0);
    return { name: selectedProduct.name, unit: selectedProduct.unit, total: totalStock };
  }, [inventoryBatches, filterProductId, products]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý Lô Hàng</h1>
        <div className="flex space-x-3">
          <Link to="/inventory">
            <Button variant="secondary" leftIcon={<ArchiveBoxIcon className="h-5 w-5" />}>Xem Giống Lúa</Button>
          </Link>
          <Button onClick={openModalForNew} leftIcon={<PlusCircleIcon className="h-5 w-5" />}>
            Thêm Lô Mới
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:space-x-4 md:items-end">
        <div className="flex-1">
          <label htmlFor="filterProduct" className="block text-sm font-medium text-gray-700">Lọc theo giống</label>
          <select 
            id="filterProduct"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            value={filterProductId}
            onChange={(e) => setFilterProductId(e.target.value)}
          >
            {productOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700">Lọc theo ngày nhập</label>
          <input 
            type="date"
            id="filterDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
         <div className="flex items-end">
            <Button variant="ghost" onClick={() => {setFilterProductId(''); setFilterDate('');}}>Xóa bộ lọc</Button>
        </div>
      </div>
      
      {totalStockBySelectedProduct && (
        <div className="bg-blue-50 p-3 rounded-lg text-blue-700 font-medium">
            Tổng tồn kho cho {totalStockBySelectedProduct.name}: {totalStockBySelectedProduct.total} {totalStockBySelectedProduct.unit}
        </div>
      )}

      {loading && filteredBatches.length === 0 ? (
         <div className="text-center py-12 bg-white rounded-lg shadow">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu lô hàng...</p>
        </div>
      ) : filteredBatches.length > 0 ? (
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số Lô</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giống Lúa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL Hiện Tại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Nhập (Tạo)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngưỡng Tối Thiểu</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBatches.map((batch) => {
                const product = getProductInfoFromBatch(batch);
                const isLowStock = batch.quantity <= batch.min_threshold && batch.min_threshold > 0;
                return (
                  <tr key={batch.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {batch.batch_no}{' '}
                      {isLowStock && (
                        <span title={`Tồn kho thấp (dưới ${batch.min_threshold} ${product?.unit || ''})`}>
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500 inline ml-1" />
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.quantity} {product?.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(batch.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.min_threshold} {product?.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openModalForEdit(batch)} title="Chi tiết/Sửa">
                        <PencilIcon className="h-5 w-5 text-yellow-600" />
                      </Button>
                       <Button variant="ghost" size="sm" onClick={() => handleDeleteBatch(batch.id)} title="Xóa Lô">
                         <TrashIcon className="h-5 w-5 text-red-600" />
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
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy lô hàng nào</h3>
            <p className="mt-1 text-sm text-gray-500">Hãy thử điều chỉnh bộ lọc hoặc thêm lô hàng mới.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingBatch ? `Chi tiết Lô Hàng: ${editingBatch.batch_no}` : 'Thêm Lô Hàng Mới'} size="lg">
        <BatchForm batch={editingBatch} onSave={handleSaveBatch} onCancel={closeModal} />
      </Modal>
    </div>
  );
};