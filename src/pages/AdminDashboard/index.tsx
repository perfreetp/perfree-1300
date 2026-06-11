import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, DollarSign, Users, FileText, Settings,
  X, Check, XCircle, AlertTriangle, TrendingUp,
  Package, Star, Download, ChevronRight, Tag, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useOrderStore } from '@/store';
import { getPetById, getServiceName, mockFeeders } from '@/data/mockData';
import type { RefundRequest, ServiceType, Review } from '@/data/types';

type TabId = 'refunds' | 'complaints' | 'prices' | 'finance';

const tabs = [
  { id: 'refunds', label: '退款处理', icon: DollarSign },
  { id: 'complaints', label: '投诉管理', icon: AlertTriangle },
  { id: 'prices', label: '价格配置', icon: Tag },
  { id: 'finance', label: '对账中心', icon: FileText },
] as const;

export default function AdminDashboard() {
  const { 
    refundRequests, 
    orders, 
    reviews, 
    processRefund, 
    updateServicePrice, 
    getServicePrices,
  } = useOrderStore();
  
  const [activeTab, setActiveTab] = useState<TabId>('refunds');
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [priceForm, setPriceForm] = useState(() => {
    const prices = getServicePrices();
    const map: Record<string, number> = {};
    prices.forEach(p => { map[p.id] = p.price; });
    return map;
  });
  const [showPriceSuccess, setShowPriceSuccess] = useState(false);
  
  const pendingRefunds = refundRequests.filter(r => r.status === 'pending');
  const completedRefunds = refundRequests.filter(r => r.status !== 'pending');
  const complaints = reviews.filter(r => r.overallRating <= 2);
  
  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalPrice, 0);
  const totalRefunded = refundRequests.filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);
  const netRevenue = totalRevenue - totalRefunded;
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  const fmt = (d: string, p: string) => format(new Date(d), p, { locale: zhCN });

  const handleApproveRefund = (orderId: string) => {
    processRefund(orderId, true);
    setSelectedRefund(null);
  };

  const handleRejectRefund = (orderId: string) => {
    processRefund(orderId, false);
    setSelectedRefund(null);
  };

  const handleUpdatePrices = () => {
    Object.entries(priceForm).forEach(([key, value]) => {
      updateServicePrice(key as ServiceType, value);
    });
    setShowPriceSuccess(true);
    setTimeout(() => setShowPriceSuccess(false), 2000);
  };

  const handleExport = () => {
    const data = {
      exportTime: new Date().toISOString(),
      totalOrders: orders.length,
      completedOrders,
      totalRevenue,
      totalRefunded,
      netRevenue,
      orders: orders.map(o => ({
        id: o.id,
        pet: getPetById(o.petId)?.name || '未知',
        service: getServiceName(o.serviceType),
        amount: o.totalPrice,
        status: o.status,
        date: o.scheduledDate,
      })),
      refunds: refundRequests.map(r => ({
        orderId: r.orderId,
        amount: r.amount,
        reason: r.reason,
        status: r.status,
        date: r.createdAt,
      })),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `对账数据_${format(new Date(), 'yyyyMMdd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderRefundsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-800">{pendingRefunds.length}</p>
              <p className="text-sm text-warm-500">待处理</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-800">
                {refundRequests.filter(r => r.status === 'approved').length}
              </p>
              <p className="text-sm text-warm-500">已通过</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-800">
                {refundRequests.filter(r => r.status === 'rejected').length}
              </p>
              <p className="text-sm text-warm-500">已拒绝</p>
            </div>
          </div>
        </motion.div>
      </div>

      {pendingRefunds.length > 0 && (
        <div>
          <h3 className="font-medium text-warm-700 mb-3">待处理退款</h3>
          <div className="space-y-3">
            {pendingRefunds.map((refund, idx) => {
              const order = orders.find(o => o.id === refund.orderId);
              const pet = order ? getPetById(order.petId) : null;
              return (
                <motion.div
                  key={refund.orderId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card cursor-pointer card-hover"
                  onClick={() => setSelectedRefund(refund)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-warm-800">
                          {pet?.name || '未知'} - {order ? getServiceName(order.serviceType) : '未知服务'}
                        </p>
                        <p className="text-sm text-warm-500">
                          退款金额：<span className="text-primary-500 font-medium">¥{refund.amount}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-warning">待处理</span>
                      <ChevronRight className="w-5 h-5 text-warm-400" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {completedRefunds.length > 0 && (
        <div>
          <h3 className="font-medium text-warm-700 mb-3">历史记录</h3>
          <div className="space-y-3">
            {completedRefunds.map((refund, idx) => {
              const order = orders.find(o => o.id === refund.orderId);
              const pet = order ? getPetById(order.petId) : null;
              return (
                <motion.div
                  key={refund.orderId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card opacity-80"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-warm-700">
                        {pet?.name || '未知'} - {order ? getServiceName(order.serviceType) : '未知服务'}
                      </p>
                      <p className="text-sm text-warm-400">
                        ¥{refund.amount} · {fmt(refund.createdAt, 'MM-dd HH:mm')}
                      </p>
                    </div>
                    <span className={`badge ${refund.status === 'approved' ? 'badge-success' : 'badge-error'}`}>
                      {refund.status === 'approved' ? '已通过' : '已拒绝'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {refundRequests.length === 0 && (
        <div className="card text-center py-16">
          <DollarSign className="w-16 h-16 text-warm-300 mx-auto mb-4" />
          <p className="text-warm-500">暂无退款申请</p>
        </div>
      )}
    </div>
  );

  const renderComplaintsTab = () => (
    <div className="space-y-4">
      {complaints.length === 0 ? (
        <div className="card text-center py-16">
          <Star className="w-16 h-16 text-warm-300 mx-auto mb-4" />
          <p className="text-warm-500">暂无投诉记录</p>
        </div>
      ) : (
        complaints.map((review: Review, idx: number) => {
          const order = orders.find(o => o.id === review.orderId);
          const pet = order ? getPetById(order.petId) : null;
          const feeder = order?.feederId 
            ? mockFeeders.find(f => f.id === order.feederId) || null
            : null;
          
          return (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {feeder?.avatar ? (
                    <img src={feeder.avatar} alt={feeder.name} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-warm-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-warm-800">{feeder?.name || '未知喂养员'}</p>
                    <p className="text-xs text-warm-400">服务：{pet?.name || '未知'}</p>
                  </div>
                </div>
                <span className="badge badge-error">投诉</span>
              </div>
              
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.overallRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-warm-200'
                    }`}
                  />
                ))}
              </div>
              
              <p className="text-sm text-warm-600 mb-2">{review.content}</p>
              
              {review.afterSalesStatus !== 'none' && (
                <div className="p-3 bg-red-50 rounded-xl">
                  <p className="text-sm text-red-700 font-medium">
                    售后状态：{review.afterSalesStatus === 'pending' ? '待处理' : review.afterSalesStatus === 'processing' ? '处理中' : review.afterSalesStatus === 'resolved' ? '已解决' : '已拒绝'}
                  </p>
                  {review.refundReason && (
                    <p className="text-sm text-red-600 mt-1">退款原因：{review.refundReason}</p>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-warm-100">
                <p className="text-xs text-warm-400">{fmt(review.createdAt, 'yyyy-MM-dd HH:mm')}</p>
                <div className="flex gap-2">
                  <button className="text-sm text-secondary-600 hover:text-secondary-700">
                    查看详情
                  </button>
                  <button className="text-sm text-primary-600 hover:text-primary-700">
                    处理
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );

  const renderPricesTab = () => {
    const serviceNames: Record<string, string> = {
      feeding: '上门喂食',
      water: '换水服务',
      cleaning: '清洁打扫',
      walking: '遛宠服务',
      photo: '拍照回传',
      comprehensive: '综合服务',
    };

    return (
      <div className="space-y-6">
        <div className="card">
          <h3 className="font-medium text-warm-800 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-500" />
            服务价格配置
          </h3>
          
          <div className="space-y-4">
            {(Object.keys(serviceNames) as ServiceType[]).map((type, idx) => (
              <motion.div
                key={type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 bg-warm-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-warm-700">{serviceNames[type]}</p>
                  <p className="text-xs text-warm-400">单次服务价格</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary-500 font-medium">¥</span>
                  <input
                    type="number"
                    value={priceForm[type] || 0}
                    onChange={(e) => setPriceForm({
                      ...priceForm,
                      [type]: parseFloat(e.target.value) || 0,
                    })}
                    className="w-20 input-field text-right"
                  />
                  <span className="text-warm-500">元</span>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleUpdatePrices}
            className="btn-primary w-full mt-6"
          >
            {showPriceSuccess ? '✓ 已保存' : '保存价格配置'}
          </motion.button>
        </div>
        
        <div className="card">
          <h3 className="font-medium text-warm-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-secondary-500" />
            平台设置
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-warm-50 rounded-xl">
              <div>
                <p className="font-medium text-warm-700">平台服务费</p>
                <p className="text-xs text-warm-400">每笔订单收取的平台佣金</p>
              </div>
              <span className="text-primary-500 font-bold">10%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-warm-50 rounded-xl">
              <div>
                <p className="font-medium text-warm-700">退款审核时效</p>
                <p className="text-xs text-warm-400">最长处理时间</p>
              </div>
              <span className="text-secondary-500 font-medium">24小时内</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinanceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white"
        >
          <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-80">总营收</p>
          <p className="text-2xl font-bold">¥{totalRevenue}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-secondary-500 to-secondary-600 text-white"
        >
          <Package className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-80">完成订单</p>
          <p className="text-2xl font-bold">{completedOrders}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <DollarSign className="w-8 h-8 mb-2 text-green-500" />
          <p className="text-sm text-warm-500">净收入</p>
          <p className="text-2xl font-bold text-warm-800">¥{netRevenue}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <XCircle className="w-8 h-8 mb-2 text-red-500" />
          <p className="text-sm text-warm-500">退款金额</p>
          <p className="text-2xl font-bold text-warm-800">¥{totalRefunded}</p>
        </motion.div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-warm-800">订单明细</h3>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
        
        <div className="space-y-3">
          {orders.map((order, idx) => {
            const pet = getPetById(order.petId);
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center justify-between py-3 border-b border-warm-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-warm-500" />
                  </div>
                  <div>
                    <p className="font-medium text-warm-700">
                      {pet?.name || '未知'} - {getServiceName(order.serviceType)}
                    </p>
                    <p className="text-xs text-warm-400">{order.scheduledDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    order.paymentStatus === 'paid' ? 'text-green-600' : 'text-warm-500'
                  }`}>
                    {order.paymentStatus === 'paid' ? '+' : '−'}¥{order.totalPrice}
                  </p>
                  <p className="text-xs text-warm-400">
                    {order.status === 'completed' ? '已完成' : order.status === 'pending' ? '待接单' : '进行中'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderRefundDetail = () => (
    <AnimatePresence>
      {selectedRefund && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRefund(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display text-warm-800">退款详情</h3>
              <button onClick={() => setSelectedRefund(null)} className="text-warm-400 hover:text-warm-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {(() => {
              const order = orders.find(o => o.id === selectedRefund.orderId);
              const pet = order ? getPetById(order.petId) : null;
              
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-warm-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-warm-500">退款金额</span>
                      <span className="text-2xl font-bold text-primary-500">¥{selectedRefund.amount}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-warm-500">宠物</span>
                      <span className="text-warm-800">{pet?.name || '未知'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-500">服务类型</span>
                      <span className="text-warm-800">{order ? getServiceName(order.serviceType) : '未知'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-500">申请时间</span>
                      <span className="text-warm-800">{fmt(selectedRefund.createdAt, 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-xl">
                    <p className="text-sm font-medium text-amber-700 mb-1">退款原因</p>
                    <p className="text-sm text-amber-600">{selectedRefund.reason}</p>
                  </div>
                  
                  {selectedRefund.description && (
                    <div className="p-4 bg-warm-50 rounded-xl">
                      <p className="text-sm font-medium text-warm-700 mb-1">详细说明</p>
                      <p className="text-sm text-warm-600">{selectedRefund.description}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleRejectRefund(selectedRefund.orderId)}
                      className="flex-1 py-3 rounded-xl border-2 border-warm-200 text-warm-600 font-medium hover:bg-warm-50 transition-colors"
                    >
                      拒绝退款
                    </button>
                    <button
                      onClick={() => handleApproveRefund(selectedRefund.orderId)}
                      className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                    >
                      批准退款
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-warm-50 pb-8">
      <div className="bg-gradient-to-br from-warm-700 to-warm-800 pt-8 pb-6 px-4 text-white">
        <div className="container mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white/30 shadow-lg">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-display">管理员后台</h1>
              <p className="text-warm-200 text-sm">平台运营管理中心</p>
              <div className="flex items-center gap-4 mt-1 text-sm">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {mockFeeders.length} 位喂养员
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {orders.length} 笔订单
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex gap-2 mb-6 -mt-4 overflow-x-auto scrollbar-hide py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl whitespace-nowrap transition-all shadow-sm ${
                  isActive
                    ? 'bg-white text-warm-700'
                    : 'bg-white/60 text-warm-600 hover:bg-white'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'refunds' && renderRefundsTab()}
            {activeTab === 'complaints' && renderComplaintsTab()}
            {activeTab === 'prices' && renderPricesTab()}
            {activeTab === 'finance' && renderFinanceTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      {renderRefundDetail()}
    </div>
  );
}
