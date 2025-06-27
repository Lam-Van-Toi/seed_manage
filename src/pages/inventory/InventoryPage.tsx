import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Product } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { ProductForm } from './ProductForm';
import { PlusCircleIcon } from '../../components/icons/PlusCircleIcon';
import { PencilIcon } from '../../components/icons/PencilIcon';
import { TrashIcon } from '../../components/icons/TrashIcon';
import { ArchiveBoxIcon } from '../../components/icons/ArchiveBoxIcon';
import { formatCurrency } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const InventoryPage: React.FC = () => {
  const { products, deleteProduct, inventoryBatches, loading, addNotification } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const openModalForNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = (_product: Product) => {
    // Notification is handled by context, Form calls onSave which only closes modal here
    closeModal();
    // Data is refreshed by context generally, or a specific fetch could be triggered if needed
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.')) {
      const success = await deleteProduct(productId);
      // Notification is handled by context
      if (!success && products.find(p => p.id === productId)) { // If delete failed but product still exists
         // Potentially show a more specific error if context didn't
      }
    }
  };

  const getProductStock = (productId: string): number => {
    return inventoryBatches
      .filter(batch => batch.product_id === productId)
      .reduce((sum, batch) => sum + batch.quantity, 0);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [products, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý Giống Lúa</h1>
        <div className="flex space-x-3">
           <Link to="/inventory/batches">
            <Button variant="secondary" leftIcon={<ArchiveBoxIcon className="h-5 w-5"/>}>Xem Lô Hàng</Button>
          </Link>
          <Button onClick={openModalForNew} leftIcon={<PlusCircleIcon className="h-5 w-5" />}>
            Thêm Giống Mới
          </Button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <input 
          type="text"
          placeholder="Tìm kiếm theo tên hoặc mã giống..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu giống lúa...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Giống</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Giống</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ĐVT</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá Vốn</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá Bán</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn Kho</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(product.cost_price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(product.sell_price)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getProductStock(product.id) <= 0 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                    {getProductStock(product.id)} {product.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openModalForEdit(product)} title="Sửa">
                      <PencilIcon className="h-5 w-5 text-yellow-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)} title="Xóa">
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
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy giống lúa nào</h3>
            <p className="mt-1 text-sm text-gray-500">Hãy thử điều chỉnh tìm kiếm hoặc thêm giống lúa mới.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? 'Chỉnh sửa Giống Lúa' : 'Thêm Giống Lúa Mới'}>
        <ProductForm product={editingProduct} onSave={handleSaveProduct} onCancel={closeModal} />
      </Modal>
    </div>
  );
};
