import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, ClipboardCheck, Clock, Camera, Droplets, UtensilsCrossed,
  Pill, Smile, CheckCircle, MapPin, Calendar, Star, Navigation,
  Package, DollarSign, TrendingUp, X, Send, Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuthStore, useOrderStore } from '@/store';
import { getPetById, getServiceName } from '@/data/mockData';
import StarRating from '@/components/ui/StarRating';
import type { Order, BowelStatus, OrderStatus } from '@/data/types';

type TabId = 'orders' | 'records' | 'earnings';

const tabs = [
  { id: 'orders', label: '待接订单', icon: ClipboardList },
  { id: 'records', label: '服务记录', icon: Package },
  { id: 'earnings', label: '收入统计', icon: DollarSign },
] as const;

export default function FeederDashboard() {
  const { currentUser } = useAuthStore();
  const { 
    orders, 
    feedingRecords, 
    feederAcceptOrder, 
    feederConfirmArrival, 
    feederCompleteService 
  } = useOrderStore();
  
  const [activeTab, setActiveTab] = useState<TabId>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'photo' | 'video'; url: string } | null>(null);
  const [recordForm, setRecordForm] = useState({
    foodAmount: '',
    waterAmount: '',
    bowelMovement: 'normal' as BowelStatus,
    medicationGiven: false,
    notes: '',
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const acceptedOrders = orders.filter(o => o.status === 'accepted' && o.feederId === currentUser?.id);
  const inProgressOrders = orders.filter(o => o.status === 'in_progress' && o.feederId === currentUser?.id);
  const completedOrders = orders.filter(o => o.status === 'completed' && o.feederId === currentUser?.id);
  const myRecords = feedingRecords.filter(r => r.feederId === currentUser?.id);

  const totalEarnings = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const todayEarnings = completedOrders
    .filter(o => o.scheduledDate === format(new Date(), 'yyyy-MM-dd'))
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const handleAcceptOrder = (orderId: string) => {
    if (!currentUser) return;
    feederAcceptOrder(orderId, currentUser.id);
    setSelectedOrder(null);
  };

  const handleConfirmArrival = (orderId: string) => {
    feederConfirmArrival(orderId);
    setSelectedOrder(null);
    setShowRecordForm(true);
    const order = orders.find(o => o.id === orderId);
    if (order) setSelectedOrder(order);
  };

  const handleCompleteService = () => {
    if (!selectedOrder) return;
    feederCompleteService(selectedOrder.id, {
      timestamp: new Date().toISOString(),
      photos: uploadedPhotos,
      videos: uploadedVideos,
      foodAmount: parseFloat(recordForm.foodAmount) || 0,
      waterAmount: parseFloat(recordForm.waterAmount) || 0,
      bowelMovement: recordForm.bowelMovement,
      medicationGiven: recordForm.medicationGiven,
      notes: recordForm.notes,
      arrivalTime: new Date().toISOString(),
      departureTime: new Date().toISOString(),
    });
    setShowRecordForm(false);
    setSelectedOrder(null);
    setRecordForm({
      foodAmount: '',
      waterAmount: '',
      bowelMovement: 'normal',
      medicationGiven: false,
      notes: '',
    });
    setUploadedPhotos([]);
    setUploadedVideos([]);
  };

  const fmt = (d: string, p: string) => format(new Date(d), p, { locale: zhCN });

  const renderOrderCard = (order: Order, status: string) => {
    const pet = getPetById(order.petId);
    const statusColors: Record<string, string> = {
      pending: 'badge-warning',
      accepted: 'badge-primary',
      in_progress: 'badge-secondary',
      completed: 'badge-success',
    };

    return (
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card cursor-pointer card-hover"
        onClick={() => setSelectedOrder(order)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {pet?.photo ? (
              <img src={pet.photo} alt={pet.name} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-primary-500" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-warm-800">{pet?.name || '未知宠物'}</h3>
              <p className="text-sm text-warm-500">{getServiceName(order.serviceType)}</p>
            </div>
          </div>
          <span className={`badge ${statusColors[status] || 'badge-primary'}`}>
            {status === 'pending' ? '待接单' : status === 'accepted' ? '已接单' : status === 'in_progress' ? '进行中' : '已完成'}
          </span>
        </div>
        <div className="space-y-2 text-sm text-warm-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-400" />
            <span>{order.scheduledDate} {order.scheduledTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-400" />
            <span className="line-clamp-1">{order.address}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-warm-100">
          <span className="text-lg font-bold text-primary-500">¥{order.totalPrice}</span>
          {status === 'pending' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order.id); }}
              className="btn-primary text-sm px-4 py-2"
            >
              立即接单
            </button>
          )}
          {status === 'accepted' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleConfirmArrival(order.id); }}
              className="btn-secondary text-sm px-4 py-2"
            >
              确认到达
            </button>
          )}
          {status === 'in_progress' && (
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setShowRecordForm(true); }}
              className="btn-secondary text-sm px-4 py-2"
            >
              上传记录
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  const renderOrdersTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-warm-700 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          待接订单 ({pendingOrders.length})
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {pendingOrders.length === 0 ? (
            <div className="col-span-2 card text-center py-12">
              <ClipboardList className="w-16 h-16 text-warm-300 mx-auto mb-3" />
              <p className="text-warm-500">暂无新订单</p>
            </div>
          ) : (
            pendingOrders.map(order => renderOrderCard(order, 'pending'))
          )}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-warm-700 mb-3 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary-500" />
          进行中 ({[...acceptedOrders, ...inProgressOrders].length})
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[...acceptedOrders, ...inProgressOrders].length === 0 ? (
            <div className="col-span-2 card text-center py-12">
              <Package className="w-16 h-16 text-warm-300 mx-auto mb-3" />
              <p className="text-warm-500">暂无进行中的订单</p>
            </div>
          ) : (
            [...acceptedOrders, ...inProgressOrders].map(order =>
              renderOrderCard(order, order.status)
            )
          )}
        </div>
      </div>
    </div>
  );

  const renderRecordsTab = () => (
    <div className="space-y-4">
      {myRecords.length === 0 ? (
        <div className="card text-center py-16">
          <Package className="w-16 h-16 text-warm-300 mx-auto mb-4" />
          <p className="text-warm-500">暂无服务记录</p>
        </div>
      ) : (
        myRecords.map((record, idx) => {
          const order = orders.find(o => o.id === record.orderId);
          const pet = order ? getPetById(order.petId) : null;
          return (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {pet?.photo ? (
                    <img src={pet.photo} alt={pet.name} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-secondary-500" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-warm-800">{pet?.name || '未知宠物'}</h4>
                    <p className="text-xs text-warm-400">{fmt(record.timestamp, 'yyyy-MM-dd HH:mm')}</p>
                  </div>
                </div>
                <span className="badge badge-success">已完成</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-3 bg-warm-50 rounded-xl text-center">
                  <UtensilsCrossed className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                  <p className="text-xs text-warm-500">喂食</p>
                  <p className="font-medium text-warm-700">{record.foodAmount}g</p>
                </div>
                <div className="p-3 bg-warm-50 rounded-xl text-center">
                  <Droplets className="w-5 h-5 text-secondary-500 mx-auto mb-1" />
                  <p className="text-xs text-warm-500">饮水</p>
                  <p className="font-medium text-warm-700">{record.waterAmount}ml</p>
                </div>
                <div className="p-3 bg-warm-50 rounded-xl text-center">
                  <Smile className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs text-warm-500">排便</p>
                  <p className="font-medium text-warm-700">
                    {record.bowelMovement === 'normal' ? '正常' : record.bowelMovement === 'abnormal' ? '异常' : '无'}
                  </p>
                </div>
              </div>
              
              {record.notes && (
                <p className="text-sm text-warm-500 mt-2">{record.notes}</p>
              )}

              {(record.photos.length > 0 || record.videos.length > 0) && (
                <div className="mt-3 pt-3 border-t border-warm-100">
                  <p className="text-xs text-warm-400 mb-2">服务素材</p>
                  <div className="flex gap-2 flex-wrap">
                    {record.photos.map((photo, pIdx) => (
                      <div
                        key={`p-${pIdx}`}
                        className="w-20 h-20 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedMedia({ type: 'photo', url: photo })}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {record.videos.map((video, vIdx) => (
                      <div
                        key={`v-${vIdx}`}
                        className="w-20 h-20 rounded-xl bg-warm-800 flex flex-col items-center justify-center cursor-pointer hover:bg-warm-700 transition-colors relative overflow-hidden"
                        onClick={() => setSelectedMedia({ type: 'video', url: video })}
                      >
                        <Camera className="w-8 h-8 text-white/80" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5" />
                          </div>
                        </div>
                        <span className="text-xs text-white/80 mt-1">视频{vIdx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );

  const renderEarningsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white"
        >
          <DollarSign className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-80">今日收入</p>
          <p className="text-2xl font-bold">¥{todayEarnings}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-secondary-500 to-secondary-600 text-white"
        >
          <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-80">累计收入</p>
          <p className="text-2xl font-bold">¥{totalEarnings}</p>
        </motion.div>
      </div>
      
      <div className="card">
        <h3 className="font-medium text-warm-800 mb-4">服务数据</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-500">{completedOrders.length}</p>
            <p className="text-sm text-warm-500">完成订单</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary-500">{myRecords.length}</p>
            <p className="text-sm text-warm-500">服务记录</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-2xl font-bold text-warm-700">4.9</span>
            </div>
            <p className="text-sm text-warm-500">服务评分</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-medium text-warm-800 mb-4">最近完成</h3>
        <div className="space-y-3">
          {completedOrders.slice(0, 5).map(order => (
            <div key={order.id} className="flex items-center justify-between py-2 border-b border-warm-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-warm-700">
                  {getPetById(order.petId)?.name || '未知'} - {getServiceName(order.serviceType)}
                </p>
                <p className="text-xs text-warm-400">{order.scheduledDate}</p>
              </div>
              <span className="text-primary-500 font-medium">+¥{order.totalPrice}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOrderDetail = () => (
    <AnimatePresence>
      {selectedOrder && !showRecordForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display text-warm-800">订单详情</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-warm-400 hover:text-warm-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {(() => {
              const pet = getPetById(selectedOrder.petId);
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-warm-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      {pet?.photo ? (
                        <img src={pet.photo} alt={pet.name} className="w-16 h-16 rounded-xl object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center">
                          <UtensilsCrossed className="w-8 h-8 text-primary-500" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-warm-800">{pet?.name || '未知宠物'}</h4>
                        <p className="text-sm text-warm-500">{pet?.breed} · {pet?.age}岁</p>
                        <StarRating rating={4.9} readonly size="sm" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary-500" />
                      <div>
                        <p className="text-sm text-warm-500">服务时间</p>
                        <p className="text-warm-800">{selectedOrder.scheduledDate} {selectedOrder.scheduledTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary-500" />
                      <div>
                        <p className="text-sm text-warm-500">服务地址</p>
                        <p className="text-warm-800">{selectedOrder.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-5 h-5 text-primary-500" />
                      <div>
                        <p className="text-sm text-warm-500">服务项目</p>
                        <p className="text-warm-800">{getServiceName(selectedOrder.serviceType)}</p>
                      </div>
                    </div>
                    {selectedOrder.notes && (
                      <div className="p-3 bg-amber-50 rounded-xl">
                        <p className="text-sm text-amber-700">备注：{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  {pet?.notes && (
                    <div className="p-4 bg-secondary-50 rounded-xl">
                      <p className="text-sm text-secondary-700 font-medium mb-1">宠物注意事项</p>
                      <p className="text-sm text-secondary-600">{pet.notes}</p>
                    </div>
                  )}
                  
                  <div className="p-4 bg-warm-50 rounded-xl">
                    <p className="text-sm font-medium text-warm-700 mb-3 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-primary-500" />
                      履约状态
                    </p>
                    <FeederOrderStatusFlow status={selectedOrder.status} />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-warm-100">
                    <div>
                      <p className="text-sm text-warm-500">服务费用</p>
                      <p className="text-2xl font-bold text-primary-500">¥{selectedOrder.totalPrice}</p>
                    </div>
                    {selectedOrder.status === 'pending' && (
                      <button onClick={() => handleAcceptOrder(selectedOrder.id)} className="btn-primary">
                        立即接单
                      </button>
                    )}
                    {selectedOrder.status === 'accepted' && (
                      <button onClick={() => handleConfirmArrival(selectedOrder.id)} className="btn-secondary">
                        确认到达
                      </button>
                    )}
                    {selectedOrder.status === 'in_progress' && (
                      <button onClick={() => setShowRecordForm(true)} className="btn-secondary">
                        上传记录
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderRecordForm = () => (
    <AnimatePresence>
      {showRecordForm && selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRecordForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display text-warm-800">上传喂养记录</h3>
              <button onClick={() => setShowRecordForm(false)} className="text-warm-400 hover:text-warm-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="p-4 bg-primary-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Camera className="w-6 h-6 text-primary-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary-700">拍照回传</p>
                    <p className="text-xs text-primary-500">上传宠物照片和视频</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mb-3">
                  {uploadedPhotos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <img src={photo} alt="" className="w-20 h-20 rounded-xl object-cover" />
                      <button
                        onClick={() => setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {uploadedVideos.map((_, idx) => (
                    <div key={`video-${idx}`} className="relative w-20 h-20 rounded-xl bg-warm-200 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-warm-500" />
                      <span className="absolute bottom-1 text-xs text-warm-600">视频{idx + 1}</span>
                      <button
                        onClick={() => setUploadedVideos(uploadedVideos.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newPhoto = `https://picsum.photos/400/300?random=${Date.now()}`;
                      setUploadedPhotos([...uploadedPhotos, newPhoto]);
                    }}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-primary-300 flex flex-col items-center justify-center text-primary-500 hover:bg-primary-100 transition-colors"
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-xs mt-1">加照片</span>
                  </button>
                  <button
                    onClick={() => {
                      const petName = selectedOrder ? getPetById(selectedOrder.petId)?.name || 'pet' : 'pet';
                      setUploadedVideos([...uploadedVideos, `video://${petName}-service-${Date.now()}.mp4`]);
                    }}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-secondary-300 flex flex-col items-center justify-center text-secondary-500 hover:bg-secondary-100 transition-colors"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs mt-1">加视频</span>
                  </button>
                </div>
                {(uploadedPhotos.length > 0 || uploadedVideos.length > 0) && (
                  <p className="text-xs text-primary-600">
                    已上传 {uploadedPhotos.length} 张照片，{uploadedVideos.length} 个视频
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-2">
                    <UtensilsCrossed className="w-4 h-4 inline mr-1 text-primary-500" />
                    喂食量 (g)
                  </label>
                  <input
                    type="number"
                    value={recordForm.foodAmount}
                    onChange={(e) => setRecordForm({ ...recordForm, foodAmount: e.target.value })}
                    placeholder="例如：200"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-2">
                    <Droplets className="w-4 h-4 inline mr-1 text-secondary-500" />
                    饮水量 (ml)
                  </label>
                  <input
                    type="number"
                    value={recordForm.waterAmount}
                    onChange={(e) => setRecordForm({ ...recordForm, waterAmount: e.target.value })}
                    placeholder="例如：500"
                    className="input-field"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  <Smile className="w-4 h-4 inline mr-1 text-amber-500" />
                  排便情况
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'abnormal', 'none'] as BowelStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setRecordForm({ ...recordForm, bowelMovement: status })}
                      className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                        recordForm.bowelMovement === status
                          ? 'bg-primary-500 text-white'
                          : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                      }`}
                    >
                      {status === 'normal' ? '正常' : status === 'abnormal' ? '异常' : '无'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordForm.medicationGiven}
                    onChange={(e) => setRecordForm({ ...recordForm, medicationGiven: e.target.checked })}
                    className="w-5 h-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500"
                  />
                  <Pill className="w-5 h-5 text-secondary-500" />
                  <span className="text-warm-700">已按要求喂药</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  服务备注
                </label>
                <textarea
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  placeholder="记录宠物状态、特殊情况等..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
              
              <button onClick={handleCompleteService} className="btn-primary w-full flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                完成服务并提交记录
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-warm-50 pb-8">
      <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 pt-8 pb-6 px-4 text-white">
        <div className="container mx-auto">
          <div className="flex items-center gap-4">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="w-16 h-16 rounded-2xl border-4 border-white/30 shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-display">{currentUser?.name}</h1>
              <p className="text-secondary-100 text-sm">喂养员工作台</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="text-sm">4.9 分 · 已服务 {completedOrders.length} 单</span>
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
                    ? 'bg-white text-secondary-600'
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
            {activeTab === 'orders' && renderOrdersTab()}
            {activeTab === 'records' && renderRecordsTab()}
            {activeTab === 'earnings' && renderEarningsTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      {renderOrderDetail()}
      {renderRecordForm()}

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            {selectedMedia.type === 'photo' ? (
              <motion.img
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                src={selectedMedia.url}
                alt=""
                className="max-w-full max-h-full rounded-2xl object-contain"
              />
            ) : (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="bg-warm-900 rounded-2xl p-8 text-center"
              >
                <Camera className="w-16 h-16 text-white/60 mx-auto mb-4" />
                <p className="text-white/80 text-lg font-medium mb-2">视频素材</p>
                <p className="text-white/50 text-sm mb-4">{selectedMedia.url}</p>
                <div className="flex items-center justify-center gap-4 text-white/40 text-sm">
                  <span>提交时间：{fmt(new Date().toISOString(), 'yyyy-MM-dd HH:mm')}</span>
                </div>
                <div className="mt-6 p-4 bg-white/10 rounded-xl">
                  <p className="text-white/60 text-xs">视频文件信息</p>
                  <p className="text-white/80 text-sm mt-1">格式：MP4 · 来源：喂养员上传</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FEEDER_STATUS_STEPS: { key: OrderStatus; label: string; icon: typeof ClipboardCheck; desc: string }[] = [
  { key: 'pending', label: '待接单', icon: Package, desc: '等待确认接单' },
  { key: 'accepted', label: '已接单', icon: ClipboardCheck, desc: '已确认，准备上门' },
  { key: 'in_progress', label: '已到达', icon: Navigation, desc: '已到达服务地点' },
  { key: 'completed', label: '服务完成', icon: CheckCircle, desc: '服务已完成' },
];

function FeederOrderStatusFlow({ status }: { status: OrderStatus }) {
  const stepOrder: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'completed'];
  const currentIndex = stepOrder.indexOf(status);

  if (status === 'cancelled' || status === 'refunded') {
    return (
      <div className="p-3 bg-red-50 rounded-xl text-center">
        <X className="w-6 h-6 text-red-400 mx-auto mb-1" />
        <p className="text-sm text-red-600">{status === 'cancelled' ? '订单已取消' : '已退款'}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {FEEDER_STATUS_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isPending = idx > currentIndex;
        const StepIcon = step.icon;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isCompleted
                  ? 'bg-secondary-500 text-white'
                  : isCurrent
                  ? 'bg-primary-500 text-white'
                  : 'bg-warm-100 text-warm-300'
              }`}>
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
              </div>
              <p className={`text-[10px] mt-1 text-center ${
                isCompleted ? 'text-secondary-600' : isCurrent ? 'text-primary-600 font-medium' : 'text-warm-300'
              }`}>
                {step.label}
              </p>
            </div>
            {idx < FEEDER_STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 -mt-3 ${
                isCompleted ? 'bg-secondary-400' : 'bg-warm-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
