import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Clock, User, CreditCard,
  CheckCircle, Ticket, X, ChevronRight, ShieldCheck,
  ClipboardCheck, Navigation, Package, Star,
} from 'lucide-react';
import { useAuthStore, useOrderStore } from '@/store';
import { getFeederById, getPetById, getStatusText, mockCoupons, mockServices } from '@/data/mockData';
import type { PaymentMethod, Coupon, OrderStatus } from '@/data/types';
import { format } from 'date-fns';

export default function OrderPayment() {
  const { id } = useParams<{ id: string }>();
  const { orders, payOrder, selectCoupon, currentOrder, setCurrentOrder } = useOrderStore();
  const { currentUser } = useAuthStore();
  
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCouponPicker, setShowCouponPicker] = useState(false);

  const order = (id ? orders.find(o => o.id === id) : null) || currentOrder || orders[0];
  const feeder = order ? getFeederById(order.feederId) : null;
  const pet = order ? getPetById(order.petId) : null;

  const serviceItems = useMemo(() => 
    order?.serviceItems.map(id => mockServices.find(s => s.id === id)).filter(Boolean) || [],
    [order]
  );

  const subtotal = serviceItems.reduce((sum, item) => sum + (item?.price || 0), 0);
  const couponDiscount = selectedCoupon?.discount || 0;
  const finalAmount = Math.max(0, subtotal - couponDiscount);

  const handleSelectCoupon = (coupon: Coupon) => {
    if (coupon.used || subtotal < coupon.minAmount) return;
    setSelectedCoupon(coupon);
    selectCoupon(coupon.id);
    setShowCouponPicker(false);
  };

  const handlePayment = () => {
    if (!order || !currentUser) return;
    payOrder(order.id, paymentMethod);
    setShowSuccessModal(true);
    setCurrentOrder(null);
  };

  const paymentMethods = [
    { id: 'wechat' as PaymentMethod, name: '微信支付', color: 'bg-green-500' },
    { id: 'alipay' as PaymentMethod, name: '支付宝', color: 'bg-blue-500' },
    { id: 'card' as PaymentMethod, name: '银行卡', color: 'bg-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 pt-10">
        <h1 className="text-2xl font-bold">订单支付</h1>
        <p className="text-primary-100 mt-1">请确认订单信息并完成支付</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-card"
        >
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-secondary-500" />
            订单摘要
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center">
                <span className="text-2xl">{pet?.name?.[0] || '🐾'}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{pet?.name} · {pet?.breed}</p>
                <p className="text-gray-500 text-xs mt-0.5">{serviceItems.map(s => s?.name).join('、')}</p>
              </div>
              <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                {order ? getStatusText(order.status) : ''}
              </span>
            </div>
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex items-center gap-3 text-gray-600">
              <User className="w-4 h-4 text-primary-500" />
              <span>喂养员：{feeder?.name} · {feeder?.rating}分</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-4 h-4 text-primary-500" />
              <span>{order ? format(new Date(order.scheduledDate), 'yyyy-MM-dd') : ''} {order?.scheduledTime}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-4 h-4 text-primary-500" />
              <span className="flex-1">{order?.address}</span>
            </div>
          </div>
        </motion.div>

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-card"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary-500" />
              履约状态
            </h3>
            <OrderStatusFlow status={order.status} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-card"
        >
          <h3 className="font-semibold text-gray-800 mb-4">价格明细</h3>
          <div className="space-y-3">
            {serviceItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600">{item?.name}</span>
                <span className="text-gray-800">¥{item?.price}</span>
              </div>
            ))}
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">服务小计</span>
              <span className="text-gray-800">¥{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">优惠券抵扣</span>
              <span className="text-primary-500">-¥{couponDiscount}</span>
            </div>
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex justify-between">
              <span className="font-semibold text-gray-800">实付金额</span>
              <span className="text-2xl font-bold text-primary-500">¥{finalAmount}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-card"
        >
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowCouponPicker(true)}
          >
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-primary-500" />
              <div>
                <span className="font-medium text-gray-800">优惠券</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedCoupon ? `${selectedCoupon.name} -¥${selectedCoupon.discount}` : `${mockCoupons.filter(c => !c.used).length} 张可用`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 shadow-card"
        >
          <h3 className="font-semibold text-gray-800 mb-4">支付方式</h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === method.id 
                    ? 'bg-primary-50 border-2 border-primary-500' 
                    : 'bg-gray-50 border-2 border-transparent'
                }`}
                onClick={() => setPaymentMethod(method.id)}
              >
                <div className={`w-10 h-10 ${method.color} rounded-xl flex items-center justify-center`}>
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-800 flex-1">{method.name}</span>
                {paymentMethod === method.id && (
                  <CheckCircle className="w-5 h-5 text-primary-500" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">实付金额</p>
            <p className="text-2xl font-bold text-primary-500">¥{finalAmount}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-semibold shadow-lg shadow-primary-500/30"
          >
            确认支付
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showCouponPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCouponPicker(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full bg-white rounded-t-3xl max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold">选择优惠券</h3>
                <button onClick={() => setShowCouponPicker(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
                {mockCoupons.map((coupon) => (
                  <motion.div key={coupon.id} whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-xl border-2 cursor-pointer ${
                      coupon.used ? 'bg-gray-50 border-gray-200 opacity-60' :
                      subtotal < coupon.minAmount ? 'bg-gray-50 border-gray-200' :
                      selectedCoupon?.id === coupon.id ? 'bg-primary-50 border-primary-500' :
                      'bg-white border-gray-200 hover:border-primary-300'
                    }`} onClick={() => handleSelectCoupon(coupon)}>
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                        coupon.used ? 'bg-gray-300' : 'bg-gradient-to-br from-primary-400 to-primary-600'
                      } text-white`}>
                        <span className="text-xl font-bold">¥{coupon.discount}</span>
                        <span className="text-xs">满{coupon.minAmount}可用</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{coupon.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            coupon.used ? 'bg-gray-200 text-gray-500' :
                            subtotal < coupon.minAmount ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {coupon.used ? '已使用' : subtotal < coupon.minAmount ? `未满${coupon.minAmount}元` : '可用'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">有效期至 {format(new Date(coupon.expiryDate), 'yyyy-MM-dd')}</p>
                      </div>
                      {selectedCoupon?.id === coupon.id && <CheckCircle className="w-6 h-6 text-primary-500" />}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-8 text-center max-w-sm w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">支付成功</h3>
              <p className="text-gray-500 mb-6">订单已提交，等待喂养员接单</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-semibold">
                完成
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: typeof ClipboardCheck; desc: string }[] = [
  { key: 'pending', label: '待接单', icon: Package, desc: '等待喂养员确认接单' },
  { key: 'accepted', label: '已接单', icon: ClipboardCheck, desc: '喂养员已确认，准备上门' },
  { key: 'in_progress', label: '已到达', icon: Navigation, desc: '喂养员已到达服务地点' },
  { key: 'completed', label: '服务完成', icon: CheckCircle, desc: '服务已完成，待评价' },
];

function OrderStatusFlow({ status }: { status: OrderStatus }) {
  const stepOrder: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'completed'];
  const currentIndex = stepOrder.indexOf(status);
  const isCancelled = status === 'cancelled';
  const isRefunded = status === 'refunded';

  if (isCancelled || isRefunded) {
    return (
      <div className="p-4 bg-red-50 rounded-xl text-center">
        <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="font-medium text-red-600">{isCancelled ? '订单已取消' : '已退款'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {STATUS_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isPending = idx > currentIndex;
        const StepIcon = step.icon;

        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted
                    ? 'bg-secondary-500 text-white'
                    : isCurrent
                    ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </motion.div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`w-0.5 h-8 ${
                  isCompleted ? 'bg-secondary-400' : 'bg-gray-200'
                }`} />
              )}
            </div>
            <div className="pb-6">
              <p className={`font-medium text-sm ${
                isCompleted ? 'text-secondary-600' : isCurrent ? 'text-primary-600' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
              <p className={`text-xs mt-0.5 ${
                isPending ? 'text-gray-300' : 'text-gray-500'
              }`}>
                {isCurrent ? step.desc : isCompleted ? '已完成' : step.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
