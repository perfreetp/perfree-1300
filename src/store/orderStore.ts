import { create } from 'zustand';
import type { Order, FeedingRecord, Review, Notification, FeedingPlan, Coupon, ServiceType, PaymentMethod } from '@/data/types';
import { mockOrders, mockFeedingRecords, mockReviews, mockNotifications, mockFeedingPlans, mockCoupons, mockServices } from '@/data/mockData';

interface BookingState {
  selectedServices: ServiceType[];
  selectedDate: string;
  selectedTime: string;
  selectedFeederId: string | null;
  selectedPetId: string | null;
  notes: string;
  selectedCouponId: string | null;
}

interface OrderState {
  orders: Order[];
  feedingRecords: FeedingRecord[];
  reviews: Review[];
  notifications: Notification[];
  feedingPlans: FeedingPlan[];
  coupons: Coupon[];
  currentOrder: Order | null;
  booking: BookingState;
  
  setCurrentOrder: (order: Order | null) => void;
  updateBooking: (updates: Partial<BookingState>) => void;
  resetBooking: () => void;
  createOrder: () => Order | null;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  payOrder: (id: string, method: PaymentMethod) => boolean;
  addFeedingRecord: (record: Omit<FeedingRecord, 'id'>) => void;
  addReview: (review: Omit<Review, 'id' | 'userId' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  selectCoupon: (couponId: string | null) => void;
  calculateTotal: () => number;
  getOrdersByUser: (userId: string) => Order[];
  getRecordsByOrder: (orderId: string) => FeedingRecord[];
  getUnreadNotificationCount: () => number;
}

const initialBooking: BookingState = {
  selectedServices: [],
  selectedDate: '',
  selectedTime: '',
  selectedFeederId: null,
  selectedPetId: null,
  notes: '',
  selectedCouponId: null,
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: mockOrders,
  feedingRecords: mockFeedingRecords,
  reviews: mockReviews,
  notifications: mockNotifications,
  feedingPlans: mockFeedingPlans,
  coupons: mockCoupons,
  currentOrder: null,
  booking: initialBooking,
  
  setCurrentOrder: (order) => set({ currentOrder: order }),
  
  updateBooking: (updates) => {
    set((state) => ({ booking: { ...state.booking, ...updates } }));
  },
  
  resetBooking: () => {
    set({ booking: initialBooking });
  },
  
  createOrder: () => {
    const { currentUser } = useAuthStore.getState();
    const { booking, calculateTotal } = get();
    
    if (!currentUser || !booking.selectedPetId || booking.selectedServices.length === 0) {
      return null;
    }
    
    const total = calculateTotal();
    const primaryService = booking.selectedServices.length > 1 
      ? 'comprehensive' 
      : booking.selectedServices[0];
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      userId: currentUser.id,
      feederId: booking.selectedFeederId || 'feeder-1',
      petId: booking.selectedPetId,
      serviceType: primaryService,
      serviceItems: booking.selectedServices,
      scheduledDate: booking.selectedDate,
      scheduledTime: booking.selectedTime,
      totalPrice: total,
      status: 'pending',
      address: currentUser.address,
      notes: booking.notes,
      paymentMethod: 'wechat',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      couponDiscount: booking.selectedCouponId 
        ? get().coupons.find(c => c.id === booking.selectedCouponId)?.discount 
        : undefined,
    };
    
    set((state) => ({ orders: [newOrder, ...state.orders] }));
    return newOrder;
  },
  
  updateOrderStatus: (id, status) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id ? { ...order, status } : order
      ),
    }));
  },
  
  payOrder: (id, method) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id 
          ? { ...order, paymentMethod: method, paymentStatus: 'paid' as const, status: 'accepted' as const } 
          : order
      ),
    }));
    
    const order = get().orders.find(o => o.id === id);
    if (order) {
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        userId: order.userId,
        type: 'order',
        title: '支付成功',
        content: `您的订单支付成功，等待喂养员接单`,
        read: false,
        timestamp: new Date().toISOString(),
        relatedId: id,
      };
      set((state) => ({ notifications: [notification, ...state.notifications] }));
    }
    
    return true;
  },
  
  addFeedingRecord: (recordData) => {
    const newRecord: FeedingRecord = {
      ...recordData,
      id: `record-${Date.now()}`,
    };
    set((state) => ({ feedingRecords: [newRecord, ...state.feedingRecords] }));
    
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      userId: get().orders.find(o => o.id === recordData.orderId)?.userId || '',
      type: 'feeding',
      title: '喂养记录已更新',
      content: '您的宠物喂养记录已上传，点击查看详情',
      read: false,
      timestamp: new Date().toISOString(),
      relatedId: recordData.orderId,
    };
    set((state) => ({ notifications: [notification, ...state.notifications] }));
  },
  
  addReview: (reviewData) => {
    const { currentUser } = useAuthStore.getState();
    if (!currentUser) return;
    
    const newReview: Review = {
      ...reviewData,
      id: `review-${Date.now()}`,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ reviews: [newReview, ...state.reviews] }));
  },
  
  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },
  
  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
  
  selectCoupon: (couponId) => {
    set((state) => ({ booking: { ...state.booking, selectedCouponId: couponId } }));
  },
  
  calculateTotal: () => {
    const { booking, coupons } = get();
    let total = 0;
    
    booking.selectedServices.forEach((serviceId) => {
      const service = mockServices.find(s => s.id === serviceId);
      if (service) {
        total += service.price;
      }
    });
    
    if (booking.selectedCouponId) {
      const coupon = coupons.find(c => c.id === booking.selectedCouponId && !c.used);
      if (coupon && total >= coupon.minAmount) {
        total -= coupon.discount;
      }
    }
    
    return Math.max(0, total);
  },
  
  getOrdersByUser: (userId) => {
    return get().orders.filter((order) => order.userId === userId);
  },
  
  getRecordsByOrder: (orderId) => {
    return get().feedingRecords.filter((record) => record.orderId === orderId);
  },
  
  getUnreadNotificationCount: () => {
    const { currentUser } = useAuthStore.getState();
    if (!currentUser) return 0;
    return get().notifications.filter((n) => n.userId === currentUser.id && !n.read).length;
  },
}));

import { useAuthStore } from './authStore';
