
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon } from './icons/HomeIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UsersIcon } from './icons/UsersIcon';
import { APP_NAME } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const navigationItems = [
  { name: 'Tổng quan', href: '/', icon: HomeIcon },
  { name: 'Quản lý Kho', href: '/inventory', icon: ArchiveBoxIcon },
  { name: 'Quản lý Đơn hàng', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Báo cáo', href: '/reports', icon: ChartBarIcon },
  { name: 'Khách hàng', href: '/customers', icon: UsersIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black opacity-50 lg:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-800 text-white p-4 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out flex flex-col shadow-lg`}
      >
        <div className="flex items-center justify-between mb-8 lg:mb-6">
          <NavLink to="/" className="flex items-center space-x-2">
            <span className="text-3xl">🌾</span>
            <h1 className="text-xl font-bold">{APP_NAME}</h1>
          </NavLink>
          <button onClick={toggleSidebar} className="lg:hidden text-white p-1">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-grow">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.name} className="mb-2">
                <NavLink
                  to={item.href}
                  onClick={() => isOpen && toggleSidebar()} // Close sidebar on mobile nav click
                  className={({ isActive }) =>
                    `flex items-center space-x-3 p-3 rounded-md hover:bg-green-700 transition-colors duration-150 ${
                      isActive ? 'bg-green-600 font-semibold shadow-inner' : ''
                    }`
                  }
                >
                  <item.icon className="h-6 w-6" />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-4 border-t border-green-700">
          <p className="text-xs text-green-300 text-center">&copy; {new Date().getFullYear()} {APP_NAME}</p>
        </div>
      </aside>
    </>
  );
};
