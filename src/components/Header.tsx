
import React from 'react';
import { MenuIcon } from './icons/MenuIcon';
import { BellIcon } from './icons/BellIcon';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'Tổng quan';
  if (pathname.startsWith('/inventory')) return 'Quản lý Kho';
  if (pathname.startsWith('/orders')) return 'Quản lý Đơn hàng';
  if (pathname.startsWith('/reports')) return 'Báo cáo';
  if (pathname.startsWith('/customers')) return 'Khách hàng';
  return 'Trang không xác định';
};


export const Header: React.FC<HeaderProps> = ({ toggleSidebar, sidebarOpen }) => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="bg-white shadow-md p-4 sticky top-0 z-20">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar} 
            className="text-gray-600 mr-4 p-2 rounded-md hover:bg-gray-100 lg:hidden"
            aria-label={sidebarOpen ? "Đóng menu" : "Mở menu"}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">{pageTitle}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative text-gray-600 hover:text-green-600 p-2 rounded-full hover:bg-gray-100">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center space-x-2">
            <img 
              src="https://picsum.photos/seed/useravatar/40/40" 
              alt="User Avatar" 
              className="h-10 w-10 rounded-full border-2 border-green-500"
            />
            <div>
                 <p className="text-sm font-medium text-gray-700">Chủ Doanh nghiệp</p>
                 <p className="text-xs text-gray-500">Quản trị viên</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
