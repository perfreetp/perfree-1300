import { create } from 'zustand';
import type { Order, FeedingRecord, Review, Notification, FeedingPlan, Coupon, ServiceType, PaymentMethod, ServiceItem, RefundRequest, Complaint } from '@/data/types';
import { mockOrders, mockFeedingRecords, mockReviews, mockNotifications, mockFeedingPlans, mockCoupons, mockServices } from '@/data/mockData';
import { useAuthStore } from './authStore';

interface BookingState {
  selectedServices: ServiceType[];
  selectedDate: string;
  selectedTime: string;
  selectedFeederId: string | null;
  selectedPetId: string | null;
  notes: string;
  selectedCouponId: string | null;
}

interface AdminConfig {
  servicePrices: Record<string, number>;
  platformFeeRate: number;
}

interface OrderState {
  orders: Order[];
  feedingRecords: FeedingRecord[];
  reviews: Review[];
  notifications: Notification[];
  feedingPlans: FeedingPlan[];
  coupons: Coupon[];
  refundRequests: RefundRequest[];
  currentOrder: Order | null;
  booking: BookingState;
  adminConfig: AdminConfig;
  deletedNotificationIds: string[];
  
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
  deleteNotification: (id: string) => void;
  selectCoupon: (couponId: string | null) => void;
  calculateTotal: () => number;
  getOrdersByUser: (userId: string) => Order[];
  getRecordsByOrder: (orderId: string) => FeedingRecord[];
  getUnreadNotificationCount: () => number;
  
  addFeedingPlan: (plan: Omit<FeedingPlan, 'id' | 'userId'>) => void;
  updateFeedingPlan: (id: string, updates: Partial<FeedingPlan>) => void;
  deleteFeedingPlan: (id: string) => void;
  togglePlanStatus: (id: string) => void;
  
  requestRefund: (orderId: string, reason: string, amount: number, description: string) => void;
  updateReviewAfterSales: (reviewId: string, status: Review['afterSalesStatus'], refundReason?: string, refundAmount?: number) => void;
  processRefund: (orderId: string, approve: boolean) => void;
  
  updateServicePrice: (serviceId: string, price: number) => void;
  getServicePrices: () => ServiceItem[];
  
  feederAcceptOrder: (orderId: string, feederId: string) => void;
  feederConfirmArrival: (orderId: string) => void;
  feederCompleteService: (orderId: string, recordData: Omit<FeedingRecord, 'id' | 'orderId' | 'feederId'>) => void;
  
  getComplaints: () => Complaint[];
  updateComplaintStatus: (complaintId: string, status: Complaint['status'], handlerNote?: string) => void;
  getComplaintById: (complaintId: string) => Complaint | undefined;
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

const initialRefundRequests: RefundRequest[] = [
  {
    orderId: 'order-5',
    reason: '服务质量不满意',
    amount: 50,
    description: '喂养员迟到了很久，而且没有拍照片',
    status: 'pending',
    createdAt: '2026-06-10T14:30:00',
  },
];

const initialAdminConfig: AdminConfig = {
  servicePrices: mockServices.reduce((acc, s) => {
    acc[s.id] = s.price;
    return acc;
  }, {} as Record<string, number>),
  platformFeeRate: 0.15,
};

const complaints: Complaint[] = [
  { id: 'comp-1', orderId: 'order-5', userId: 'user-3', content: '喂养员迟到，服务态度不好', status: 'pending', type: 'service', createdAt: '2026-06-10T15:00:00' },
  { id: 'comp-2', orderId: 'order-3', userId: 'user-2', content: '宠物回家后状态不对', status: 'processing', type: 'service', createdAt: '2026-06-12T09:00:00' },
  { id: 'comp-3', orderId: 'order-5', userId: 'user-3', content: '退款申请已提交一周，还未处理', status: 'pending', type: 'refund', createdAt: '2026-06-11T10:00:00' },
];

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: mockOrders,
  feedingRecords: mockFeedingRecords,
  reviews: mockReviews,
  notifications: mockNotifications,
  feedingPlans: mockFeedingPlans,
  coupons: mockCoupons,
  refundRequests: initialRefundRequests,
  currentOrder: null,
  booking: initialBooking,
  adminConfig: initialAdminConfig,
  deletedNotificationIds: [],
  
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
        content: `您的订单支付成功，已为您分配喂养员`,
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
    
    const order = get().orders.find(o => o.id === recordData.orderId);
    if (order) {
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        userId: order.userId,
        type: 'feeding',
        title: '喂养记录已更新',
        content: '您的宠物喂养记录已上传，点击查看详情和照片',
        read: false,
        timestamp: new Date().toISOString(),
        relatedId: recordData.orderId,
      };
      set((state) => ({ notifications: [notification, ...state.notifications] }));
    }
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
    const { currentUser } = useAuthStore.getState();
    if (!currentUser) return;
    
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.userId === currentUser.id ? { ...n, read: true } : n
      ),
    }));
  },
  
  deleteNotification: (id) => {
    set((state) => ({
      deletedNotificationIds: [...state.deletedNotificationIds, id],
    }));
  },
  
  selectCoupon: (couponId) => {
    set((state) => ({ booking: { ...state.booking, selectedCouponId: couponId } }));
  },
  
  calculateTotal: () => {
    const { booking, coupons, adminConfig } = get();
    let total = 0;
    
    booking.selectedServices.forEach((serviceId) => {
      const price = adminConfig.servicePrices[serviceId];
      if (price !== undefined) {
        total += price;
      } else {
        const service = mockServices.find(s => s.id === serviceId);
        if (service) total += service.price;
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
    const { notifications, deletedNotificationIds } = get();
    if (!currentUser) return 0;
    return notifications.filter(
      (n) => n.userId === currentUser.id && !n.read && !deletedNotificationIds.includes(n.id)
    ).length;
  },
  
  addFeedingPlan: (planData) => {
    const { currentUser } = useAuthStore.getState();
    if (!currentUser) return;
    
    const newPlan: FeedingPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      userId: currentUser.id,
    };
    set((state) => ({ feedingPlans: [newPlan, ...state.feedingPlans] }));
  },
  
  updateFeedingPlan: (id, updates) => {
    set((state) => ({
      feedingPlans: state.feedingPlans.map((plan) =>
        plan.id === id ? { ...plan, ...updates } : plan
      ),
    }));
  },
  
  deleteFeedingPlan: (id) => {
    set((state) => ({
      feedingPlans: state.feedingPlans.filter((plan) => plan.id !== id),
    }));
  },
  
  togglePlanStatus: (id) => {
    set((state) => ({
      feedingPlans: state.feedingPlans.map((plan) => {
        if (plan.id === id) {
          return { ...plan, status: plan.status === 'active' ? 'paused' : 'active' };
        }
        return plan;
      }),
    }));
  },
  
  requestRefund: (orderId, reason, amount, description) => {
    const { currentUser } = useAuthStore.getState();
    if (!currentUser) return;
    
    const refundRequest: RefundRequest = {
      orderId,
      reason,
      amount,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    set((state) => ({
      refundRequests: [refundRequest, ...state.refundRequests],
      reviews: state.reviews.map((review) =>
        review.orderId === orderId
          ? { ...review, afterSalesStatus: 'pending' as const, refundReason: reason, refundAmount: amount }
          : review
      ),
    }));
    
    const existingReview = get().reviews.find(r => r.orderId === orderId);
    if (!existingReview) {
      const newReview: Review = {
        id: `review-${Date.now()}`,
        orderId,
        userId: currentUser.id,
        overallRating: 0,
        attitudeRating: 0,
        professionalRating: 0,
        punctualityRating: 0,
        content: description,
        photos: [],
        isAnonymous: false,
        afterSalesStatus: 'pending',
        refundReason: reason,
        refundAmount: amount,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ reviews: [newReview, ...state.reviews] }));
    }
  },
  
  updateReviewAfterSales: (reviewId, status, refundReason, refundAmount) => {
    set((state) => ({
      reviews: state.reviews.map((review) =>
        review.id === reviewId
          ? { ...review, afterSalesStatus: status, refundReason, refundAmount }
          : review
      ),
    }));
  },
  
  processRefund: (orderId, approve) => {
    set((state) => ({
      refundRequests: state.refundRequests.map((r) =>
        r.orderId === orderId
          ? { ...r, status: approve ? 'approved' : 'rejected' }
          : r
      ),
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, status: approve ? 'refunded' as const : order.status, paymentStatus: approve ? 'refunded' as const : order.paymentStatus }
          : order
      ),
      reviews: state.reviews.map((review) =>
        review.orderId === orderId
          ? { ...review, afterSalesStatus: approve ? 'resolved' as const : 'rejected' as const }
          : review
      ),
    }));
  },
  
  updateServicePrice: (serviceId, price) => {
    set((state) => ({
      adminConfig: {
        ...state.adminConfig,
        servicePrices: {
          ...state.adminConfig.servicePrices,
          [serviceId]: price,
        },
      },
    }));
  },
  
  getServicePrices: () => {
    const { adminConfig } = get();
    return mockServices.map((s) => ({
      ...s,
      price: adminConfig.servicePrices[s.id] ?? s.price,
    }));
  },
  
  feederAcceptOrder: (orderId, feederId) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, feederId, status: 'accepted' as const }
          : order
      ),
    }));
    
    const order = get().orders.find(o => o.id === orderId);
    if (order) {
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        userId: order.userId,
        type: 'order',
        title: '订单已接单',
        content: `您的订单已被接单，喂养员会按时到达`,
        read: false,
        timestamp: new Date().toISOString(),
        relatedId: orderId,
      };
      set((state) => ({ notifications: [notification, ...state.notifications] }));
    }
  },
  
  feederConfirmArrival: (orderId) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, status: 'in_progress' as const }
          : order
      ),
    }));
    
    const order = get().orders.find(o => o.id === orderId);
    if (order) {
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        userId: order.userId,
        type: 'feeding',
        title: '喂养员已到达',
        content: '喂养员已到达您家，开始为您的宠物提供服务',
        read: false,
        timestamp: new Date().toISOString(),
        relatedId: orderId,
      };
      set((state) => ({ notifications: [notification, ...state.notifications] }));
    }
  },
  
  feederCompleteService: (orderId, recordData) => {
    const { currentUser } = useAuthStore.getState();
    if (!currentUser) return;
    
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, status: 'completed' as const }
          : order
      ),
    }));
    
    const newRecord: FeedingRecord = {
      ...recordData,
      id: `record-${Date.now()}`,
      orderId,
      feederId: currentUser.id,
    };
    set((state) => ({ feedingRecords: [newRecord, ...state.feedingRecords] }));
    
    const order = get().orders.find(o => o.id === orderId);
    if (order) {
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        userId: order.userId,
        type: 'review',
        title: '服务已完成',
        content: '服务已完成，欢迎您评价反馈',
        read: false,
        timestamp: new Date().toISOString(),
        relatedId: orderId,
      };
      set((state) => ({ notifications: [notification, ...state.notifications] }));
    }
  },
  
  getComplaints: () => complaints,
  updateComplaintStatus: (complaintId, status, handlerNote) => {
    const idx = complaints.findIndex(c => c.id === complaintId);
    if (idx >= 0) {
      complaints[idx] = {
        ...complaints[idx],
        status,
        handledAt: new Date().toISOString(),
        handlerNote,
      };
    }
    set({});
  },
  getComplaintById: (complaintId) => complaints.find(c => c.id === complaintId),
}));
