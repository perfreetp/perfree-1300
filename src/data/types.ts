export interface User {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  role: 'owner' | 'feeder' | 'admin';
  address: string;
  doorPassword: string;
  emergencyContact: string;
}

export interface Pet {
  id: string;
  userId: string;
  name: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  weight: number;
  photo: string;
  allergies: string[];
  medications: string[];
  vaccineRecord: string;
  notes: string;
  temper?: string;
}

export interface Feeder {
  id: string;
  name: string;
  avatar: string;
  qualifications: string[];
  rating: number;
  reviewCount: number;
  orderCount: number;
  status: 'available' | 'busy' | 'offline';
  availableSlots: string[];
  bio: string;
  experience: number;
}

export type ServiceType = 'feeding' | 'water' | 'cleaning' | 'walking' | 'photo' | 'comprehensive';
export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'wechat' | 'alipay' | 'card';

export interface Order {
  id: string;
  userId: string;
  feederId: string;
  petId: string;
  serviceType: ServiceType;
  serviceItems: string[];
  scheduledDate: string;
  scheduledTime: string;
  totalPrice: number;
  status: OrderStatus;
  address: string;
  notes: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  couponDiscount?: number;
}

export type BowelStatus = 'normal' | 'abnormal' | 'none';

export interface FeedingRecord {
  id: string;
  orderId: string;
  feederId: string;
  timestamp: string;
  photos: string[];
  videos: string[];
  foodAmount: number;
  waterAmount: number;
  bowelMovement: BowelStatus;
  medicationGiven: boolean;
  notes: string;
  abnormalReport?: string;
  arrivalTime?: string;
  departureTime?: string;
}

export type AfterSalesStatus = 'none' | 'pending' | 'processing' | 'resolved' | 'rejected';

export interface Review {
  id: string;
  orderId: string;
  userId: string;
  overallRating: number;
  attitudeRating: number;
  professionalRating: number;
  punctualityRating: number;
  content: string;
  photos: string[];
  isAnonymous: boolean;
  afterSalesStatus: AfterSalesStatus;
  refundReason?: string;
  refundAmount?: number;
  createdAt: string;
}

export type NotificationType = 'system' | 'order' | 'feeding' | 'review';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  timestamp: string;
  relatedId?: string;
}

export interface FeedingPlan {
  id: string;
  userId: string;
  petId: string;
  name: string;
  startDate: string;
  endDate: string;
  serviceItems: string[];
  frequency: 'daily' | 'weekly' | 'custom';
  weekDays?: number[];
  timeSlots: string[];
  status: 'active' | 'paused' | 'completed';
  notes: string;
}

export interface ServiceItem {
  id: ServiceType;
  name: string;
  description: string;
  price: number;
  duration: string;
  icon: string;
  color: string;
}

export interface Coupon {
  id: string;
  name: string;
  discount: number;
  minAmount: number;
  expiryDate: string;
  used: boolean;
}
