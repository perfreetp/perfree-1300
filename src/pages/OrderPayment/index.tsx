import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Clock, User, CreditCard,
  CheckCircle, Ticket, X, ChevronRight, ShieldCheck,
  ClipboardCheck, Navigation, Package, Star, ArrowRight,
  Eye,
} from 'lucide-react';
import { useAuthStore, useOrderStore } from '@/store';
import { getFeederById, getPetById, getStatusText, mockCoupons, mockServices } from '@/data/mockData';
import type { PaymentMethod, Coupon, OrderStatus, FulfillmentTimelineItem } from '@/data/types';
import { format } from 'date-fns';

const timelineActionMap: Record<FulfillmentTimelineItem['action'], { label: string; icon: typeof ClipboardCheck; color: string }> = {
  order_created: { label: '订单创建', icon: Calendar, color: 'bg-gray-400' },
  payment_received: { label: '支付完成', icon: ShieldCheck, color: 'bg-green-500' },
  order_accepted: { label: '喂养员接单', icon: ClipboardCheck, color: 'bg-secondary-500' },
  feeder_arrived: { label: '已到达', icon: MapPin, color: 'bg-blue-500' },
  record_uploaded: { label: '上传服务记录', icon: Eye, color: 'bg-primary-500' },
  service_completed: { label: '服务完成', icon: CheckCircle, color: 'bg-amber-500' },
  review_submitted: { label: '评价完成', icon: Star, color: 'bg-yellow-500' },
  order_cancelled: { label: '订单取消', icon: X, color: 'bg-red-500' },
  refund_requested: { label: '申请退款', icon: Ticket, color: 'bg-orange-500' },
  refund_approved: { label: '退款已处理', icon: CheckCircle, color: 'bg-green-600' },
};

const STATUS_STEPS: { key: OrderStatus; label: string; icon: typeof ClipboardCheck; desc: string; nextHint?: string }[] = [
  { key: 'pending', label: '待接单', icon: Package, desc: '等待喂养员确认接单', nextHint: '等待喂养员确认接单' },
  { key: 'accepted', label: '已接单', icon: ClipboardCheck, desc: '喂养员已确认，准备上门', nextHint: '喂养员将按时上门服务' },
  { key: 'in_progress', label: '已到达', icon: Navigation, desc: '喂养员已到达服务地点', nextHint: '服务进行中，请耐心等待' },
  { key: 'completed', label: '服务完成', icon: CheckCircle, desc: '服务已完成，等待评价', nextHint: '去评价喂养员的服务' },
  { key: 'reviewed', label: '已评价', icon: Star, desc: '感谢您的评价，服务闭环完成', nextHint: '服务已圆满完成' },
];

function OrderStatusFlow({
  status,
  onGoReview,
  reviewed,
}: { status: OrderStatus; onGoReview?: () => void; reviewed: boolean }) {
  const stepOrder: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'completed', 'reviewed'];
  const actualStatus = reviewed && status === 'completed' ? 'reviewed' : status;
  const currentIndex = stepOrder.indexOf(actualStatus);
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
        const isReviewStep = step.key === 'completed' && !reviewed && status === 'completed';

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
            <div className="pb-6 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-medium text-sm ${
                  isCompleted ? 'text-secondary-600' : isCurrent ? 'text-primary-600' : 'text-gray-400'
                }`}>
                  {step.key === 'completed' && reviewed ? '已评价' : step.label}
                </p>
                {isReviewStep && onGoReview && (
                  <button
                    onClick={onGoReview}
                    className="px-3 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1 hover:shadow-md transition-shadow"
                  >
                    <Star className="w-3 h-3" /> 去评价
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {(step.key === 'reviewed' && reviewed) && (
                  <span className="px-3 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 已评价
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${
                isPending ? 'text-gray-300' : 'text-gray-500'
              }`}>
                {isCurrent ? step.desc : isCompleted ? '已完成' : step.desc}
              </p>
              {isCurrent && isReviewStep && onGoReview && (
                <button
                  onClick={onGoReview}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  下一步：去评价服务 →
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderPayment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, payOrder, selectCoupon, currentOrder, setCurrentOrder, getTimelineByOrder, hasReviewForOrder } = useOrderStore();
  const { currentUser } = useAuthStore();

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCouponPicker, setShowCouponPicker] = useState(false);

  const order = (id ? orders.find(o => o.id === id) : null) || currentOrder || orders[0];
  const feeder = order ? getFeederById(order.feederId) : null;
  const pet = order ? getPetById(order.petId) : null;

  const reviewed = order ? hasReviewForOrder(order.id) : false;
  const timeline = order ? getTimelineByOrder(order.id) : [];

  const serviceItems = useMemo(() =>
    order?.serviceItems.map(sid => mockServices.find(s => s.id === sid)).filter(Boolean) || [],
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

  const handleGoReview = () => {
    if (!order) return;
    navigate(`/review/${order.id}`);
  };

  const handleGoRecords = () => {
    if (!order) return;
    navigate(`/records/${order.id}`);
  };

  const paymentMethods = [
    { id: 'wechat' as PaymentMethod, name: '微信支付', color: 'bg-green-500' },
    { id: 'alipay' as PaymentMethod, name: '支付宝', color: 'bg-blue-500' },
    { id: 'card' as PaymentMethod, name: '银行卡', color: 'bg-gray-600' },
  ];

  const shouldShowPayment = order && (order.paymentStatus === 'unpaid' && order.status !== 'cancelled');
  const canGoReview = order && (order.status === 'completed' || order.status === 'reviewed');
  const canGoRecords = order && (order.status !== 'pending' && order.status !== 'cancelled');

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 pt-10">
        <h1 className="text-2xl font-bold">{shouldShowPayment ? '订单支付' : '订单详情'}</h1>
        <p className="text-primary-100 mt-1">
          {shouldShowPayment ? '请确认订单信息并完成支付' : `订单编号：${order?.id.slice(-8) || ''}`}
        </p>
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
              <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center overflow-hidden">
                {pet?.photo ? (
                  <img src={pet.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🐾</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{pet?.name} · {pet?.breed}</p>
                <p className="text-gray-500 text-xs mt-0.5">{serviceItems.map(s => s?.name).join('、')}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                order?.status === 'reviewed' || reviewed
                  ? 'bg-yellow-100 text-yellow-700'
                  : order?.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : order?.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-700'
                  : order?.status === 'accepted'
                  ? 'bg-secondary-100 text-secondary-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order ? (reviewed && order.status === 'completed' ? '已评价' : getStatusText(order.status)) : ''}
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

            <div className="flex gap-2 mt-2">
              {canGoReview && (
                <button
                  onClick={handleGoReview}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${
                    reviewed
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md shadow-yellow-500/20'
                  }`}
                >
                  <Star className={`w-4 h-4 ${reviewed ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  {reviewed ? '查看我的评价' : '去评价服务'}
                </button>
              )}
              {canGoRecords && (
                <button
                  onClick={handleGoRecords}
                  className="flex-1 py-2 rounded-xl bg-primary-50 text-primary-600 border border-primary-200 text-sm font-semibold hover:bg-primary-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" /> 喂养记录
                </button>
              )}
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
            <OrderStatusFlow status={order.status} onGoReview={canGoReview ? handleGoReview : undefined} reviewed={reviewed} />
          </motion.div>
        )}

        {order && timeline.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl p-5 shadow-card"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary-500" />
              履约时间轴
              <span className="text-xs text-warm-400 font-normal ml-auto">{timeline.length} 条</span>
            </h3>
            <div className="p-4 bg-warm-50 rounded-xl space-y-3">
              {timeline.map((item, tIdx) => {
                const conf = timelineActionMap[item.action] || { label: item.action, icon: Clock, color: 'bg-gray-400' };
                const TIcon = conf.icon;
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full ${conf.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <TIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-warm-800">{conf.label}</p>
                        <span className="text-xs text-warm-400 flex-shrink-0">
                          {format(new Date(item.timestamp), 'MM-dd HH:mm')}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-warm-500 mt-0.5">{item.description}</p>
                      )}
                      {item.actorName && (
                        <p className="text-xs text-warm-400 mt-0.5">— {item.actorName}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
            {order?.paymentStatus === 'paid' && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  已通过{order.paymentMethod === 'wechat' ? '微信' : order.paymentMethod === 'alipay' ? '支付宝' : '银行卡'}支付
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {shouldShowPayment && (
          <>
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
          </>
        )}
      </div>

      {shouldShowPayment && (
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
      )}

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
              <div className="space-y-2">
                {canGoRecords && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowSuccessModal(false); handleGoRecords(); }}
                    className="w-full py-3 bg-white border-2 border-primary-500 text-primary-600 rounded-full font-semibold mb-2">
                    查看订单详情
                  </motion.button>
                )}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-semibold">
                  完成
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
