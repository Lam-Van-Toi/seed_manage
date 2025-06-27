
import { OrderStatus } from './types';

export const APP_NAME = "Quản lý Lúa Giống";

export const ORDER_STATUS_OPTIONS = [
  { value: OrderStatus.PENDING, label: 'Chờ xử lý' },
  { value: OrderStatus.PROCESSING, label: 'Đang xử lý' },
  { value: OrderStatus.PACKING, label: 'Đóng gói' },
  { value: OrderStatus.SHIPPED, label: 'Đang giao' },
  { value: OrderStatus.COMPLETED, label: 'Hoàn thành' },
  { value: OrderStatus.CANCELLED, label: 'Đã hủy' },
];

export const DEFAULT_NOTIFICATION_DURATION = 3000; // ms
