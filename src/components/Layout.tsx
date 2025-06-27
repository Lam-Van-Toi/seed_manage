
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useData, AppNotification, NotificationType } from '../contexts/DataContext';
import { XMarkIcon } from './icons/XMarkIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

// Placeholder icons - consider creating them as separate files if they grow complex
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InformationCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);


const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    case 'error':
      return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
    case 'warning':
      return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    case 'info':
    default:
      return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
  }
};


export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { notifications, removeNotification } = useData();
  const location = useLocation(); // Get location from react-router-dom

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Now location.pathname is correctly sourced

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>

      {/* Global Notification Area */}
      <div className="fixed top-20 right-6 z-50 w-full max-w-sm space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start p-4 rounded-lg shadow-lg text-sm bg-white border-l-4 ${
              notification.type === 'success' ? 'border-green-500' :
              notification.type === 'error'   ? 'border-red-500' :
              notification.type === 'warning' ? 'border-yellow-500' :
                                                'border-blue-500'
            }`}
          >
            <div className="flex-shrink-0">
              <NotificationIcon type={notification.type} />
            </div>
            <div className="ml-3 flex-1 pt-0.5">
              <p className={`font-medium ${
                notification.type === 'success' ? 'text-green-800' :
                notification.type === 'error'   ? 'text-red-800' :
                notification.type === 'warning' ? 'text-yellow-800' :
                                                  'text-blue-800'
              }`}>{notification.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => removeNotification(notification.id)}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  notification.type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                  notification.type === 'error'   ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                  notification.type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
                                                    'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                }`}
              >
                <span className="sr-only">Đóng</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
