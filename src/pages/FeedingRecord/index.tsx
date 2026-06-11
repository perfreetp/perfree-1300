import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Camera, Droplets, Utensils,
  Pill, AlertTriangle, X, Clock, MapPin,
  Upload, Send, ChevronDown, Play, Video,
  CheckCircle2, Footprints, Sparkles,
} from 'lucide-react';
import { useAuthStore, useOrderStore } from '@/store';
import { getFeederById, getStatusText, mockFeedingRecords, getPetById, getServiceName } from '@/data/mockData';
import type { FeedingRecord, BowelStatus, Order } from '@/data/types';
import { format } from 'date-fns';

interface ServiceNode {
  id: string;
  type: 'arrival' | 'feeding' | 'cleaning' | 'departure' | 'abnormal';
  label: string;
  icon: typeof MapPin;
  time: string;
  photos: string[];
  videos: string[];
  details: { label: string; value: string }[];
}

function buildServiceNodes(order: Order, records: FeedingRecord[]): ServiceNode[] {
  const nodes: ServiceNode[] = [];
  const orderRecords = records.filter(r => r.orderId === order.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (orderRecords.length === 0) return nodes;

  const mainRecord = orderRecords[0];

  if (mainRecord.arrivalTime) {
    nodes.push({
      id: `${order.id}-arrival`,
      type: 'arrival',
      label: '喂养员到达',
      icon: MapPin,
      time: mainRecord.arrivalTime,
      photos: [],
      videos: [],
      details: [
        { label: '到达时间', value: format(new Date(mainRecord.arrivalTime), 'HH:mm') },
        { label: '喂养员', value: getFeederById(mainRecord.feederId)?.name || '未知' },
      ],
    });
  }

  nodes.push({
    id: `${order.id}-feeding`,
    type: 'feeding',
    label: '喂食与饮水',
    icon: Utensils,
    time: mainRecord.timestamp,
    photos: mainRecord.photos.slice(0, Math.ceil(mainRecord.photos.length / 2)),
    videos: mainRecord.videos.slice(0, Math.ceil(mainRecord.videos.length / 2)),
    details: [
      { label: '喂食量', value: `${mainRecord.foodAmount}g` },
      { label: '饮水量', value: `${mainRecord.waterAmount}ml` },
      { label: '排便情况', value: mainRecord.bowelMovement === 'normal' ? '正常' : mainRecord.bowelMovement === 'abnormal' ? '异常' : '无记录' },
      { label: '用药情况', value: mainRecord.medicationGiven ? '已喂药' : '无需喂药' },
    ],
  });

  if (order.serviceType === 'cleaning' || order.serviceType === 'comprehensive' || order.serviceItems?.includes('cleaning')) {
    nodes.push({
      id: `${order.id}-cleaning`,
      label: '清洁打扫',
      icon: Sparkles,
      type: 'cleaning',
      time: mainRecord.timestamp,
      photos: mainRecord.photos.slice(Math.ceil(mainRecord.photos.length / 2)),
      videos: mainRecord.videos.slice(Math.ceil(mainRecord.videos.length / 2)),
      details: [
        { label: '清洁项目', value: '猫砂/窝垫/食盆' },
        { label: '清洁状态', value: '已完成' },
      ],
    });
  }

  if (mainRecord.departureTime) {
    nodes.push({
      id: `${order.id}-departure`,
      type: 'departure',
      label: '服务完成离开',
      icon: CheckCircle2,
      time: mainRecord.departureTime,
      photos: [],
      videos: [],
      details: [
        { label: '离开时间', value: format(new Date(mainRecord.departureTime), 'HH:mm') },
        { label: '服务总时长', value: mainRecord.arrivalTime
          ? `${Math.round((new Date(mainRecord.departureTime).getTime() - new Date(mainRecord.arrivalTime).getTime()) / 60000)}分钟`
          : '未知' },
      ],
    });
  }

  if (mainRecord.abnormalReport) {
    nodes.push({
      id: `${order.id}-abnormal`,
      type: 'abnormal',
      label: '异常上报',
      icon: AlertTriangle,
      time: mainRecord.timestamp,
      photos: [],
      videos: [],
      details: [
        { label: '异常类型', value: mainRecord.abnormalReport },
      ],
    });
  }

  if (mainRecord.notes) {
    const lastNode = nodes[nodes.length - 1];
    if (lastNode) {
      lastNode.details.push({ label: '服务备注', value: mainRecord.notes });
    }
  }

  return nodes;
}

const nodeColors: Record<ServiceNode['type'], { bg: string; dot: string; icon: string }> = {
  arrival: { bg: 'bg-secondary-50', dot: 'bg-secondary-500', icon: 'text-secondary-500' },
  feeding: { bg: 'bg-primary-50', dot: 'bg-primary-500', icon: 'text-primary-500' },
  cleaning: { bg: 'bg-amber-50', dot: 'bg-amber-500', icon: 'text-amber-500' },
  departure: { bg: 'bg-green-50', dot: 'bg-green-500', icon: 'text-green-500' },
  abnormal: { bg: 'bg-red-50', dot: 'bg-red-500', icon: 'text-red-500' },
};

export default function FeedingRecord() {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders, feedingRecords, addFeedingRecord } = useOrderStore();
  const { currentUser } = useAuthStore();

  const [selectedOrder, setSelectedOrder] = useState<string>(orderId || 'all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [abnormalType, setAbnormalType] = useState('');
  const [abnormalDesc, setAbnormalDesc] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const userOrders = useMemo(() => 
    currentUser ? orders.filter(o => o.userId === currentUser.id) : orders,
    [currentUser, orders]
  );

  const allRecords = useMemo(() => {
    const combined = [...mockFeedingRecords, ...feedingRecords];
    return Array.from(new Map(combined.map(r => [r.id, r])).values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [feedingRecords]);

  const displayOrders = useMemo(() => {
    let filtered = userOrders;
    if (selectedDate) {
      filtered = filtered.filter(o => o.scheduledDate === selectedDate);
    }
    return filtered.filter(o => o.status !== 'pending' && o.status !== 'cancelled');
  }, [userOrders, selectedDate]);

  const orderServiceNodes = useMemo(() => {
    const result: { order: Order; nodes: ServiceNode[] }[] = [];
    const targetOrders = selectedOrder !== 'all'
      ? displayOrders.filter(o => o.id === selectedOrder)
      : displayOrders;

    for (const order of targetOrders) {
      const nodes = buildServiceNodes(order, allRecords);
      if (nodes.length > 0) {
        result.push({ order, nodes });
      }
    }
    return result;
  }, [displayOrders, allRecords, selectedOrder]);

  const allPhotos = useMemo(() => 
    [...new Set(orderServiceNodes.flatMap(({ nodes }) => nodes.flatMap(n => n.photos)))],
    [orderServiceNodes]
  );

  const allVideos = useMemo(() =>
    [...new Set(orderServiceNodes.flatMap(({ nodes }) => nodes.flatMap(n => n.videos)))],
    [orderServiceNodes]
  );

  const handlePhotoUpload = () => {
    const newPhoto = `https://picsum.photos/400/300?random=${Date.now()}`;
    setUploadedPhotos([...uploadedPhotos, newPhoto]);
  };

  const handleSubmitReport = () => {
    if (!abnormalType || !abnormalDesc) return;
    const firstOrder = userOrders[0];
    if (firstOrder) {
      addFeedingRecord({
        orderId: firstOrder.id,
        feederId: firstOrder.feederId,
        timestamp: new Date().toISOString(),
        photos: uploadedPhotos,
        videos: [],
        foodAmount: 0,
        waterAmount: 0,
        bowelMovement: 'abnormal' as BowelStatus,
        medicationGiven: false,
        notes: abnormalDesc,
        abnormalReport: abnormalType,
      });
    }
    setShowReport(false);
    setAbnormalType('');
    setAbnormalDesc('');
    setUploadedPhotos([]);
  };

  return (
    <div className="min-h-screen bg-warm-50 pb-8">
      <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white p-6 pt-10">
        <h1 className="text-2xl font-bold">喂养记录</h1>
        <p className="text-secondary-100 mt-1">查看宠物喂养详情和照片</p>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-warm-100 rounded-full text-sm font-medium text-warm-700">
              <Filter className="w-4 h-4" /> 筛选
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
            </button>
            {selectedOrder !== 'all' && (
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                订单: {selectedOrder.slice(-4)}
              </span>
            )}
            {selectedDate && (
              <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs">
                {selectedDate}
              </span>
            )}
          </div>
          <AnimatePresence>
            {showFilter && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs text-warm-500 mb-1 block">按订单筛选</label>
                    <select value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)}
                      className="w-full px-3 py-2 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-secondary-500">
                      <option value="all">全部订单</option>
                      {userOrders.map(order => (
                        <option key={order.id} value={order.id}>
                          {format(new Date(order.scheduledDate), 'MM-dd')} - {getStatusText(order.status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-warm-500 mb-1 block">按日期筛选</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-secondary-500" />
                  </div>
                  <button onClick={() => { setSelectedOrder('all'); setSelectedDate(''); }}
                    className="text-sm text-secondary-600 font-medium">重置筛选</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {(allPhotos.length > 0 || allVideos.length > 0) && (
          <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
            <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
              <Camera className="w-5 h-5 text-secondary-500" /> 照片墙
              <span className="text-xs text-warm-400 font-normal ml-auto">{allPhotos.length}张照片 · {allVideos.length}个视频</span>
            </h3>
            <div className="columns-2 sm:columns-3 gap-2">
              {allPhotos.map((photo, idx) => (
                <motion.div key={`photo-${idx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }} className="mb-2 break-inside-avoid">
                  <img src={photo} alt="" className="w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedPhoto(photo)} />
                </motion.div>
              ))}
              {allVideos.map((video, idx) => (
                <motion.div key={`video-${idx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }} className="mb-2 break-inside-avoid">
                  <div
                    className="w-full aspect-video rounded-xl bg-warm-800 flex flex-col items-center justify-center cursor-pointer hover:bg-warm-700 transition-colors relative overflow-hidden"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <Video className="w-8 h-8 text-white/60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                    <span className="text-xs text-white/70 mt-1 absolute bottom-2">视频 {idx + 1}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {orderServiceNodes.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 shadow-card text-center py-16">
              <Clock className="w-16 h-16 text-warm-300 mx-auto mb-4" />
              <p className="text-warm-500">暂无服务记录</p>
            </div>
          ) : (
            orderServiceNodes.map(({ order, nodes }, oIdx) => {
              const pet = getPetById(order.petId);
              const feeder = getFeederById(order.feederId);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: oIdx * 0.1 }}
                  className="bg-white rounded-2xl shadow-card overflow-hidden"
                >
                  <div className="p-4 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {pet?.photo ? (
                          <img src={pet.photo} alt={pet.name} className="w-10 h-10 rounded-xl object-cover border-2 border-white/30" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">🐾</div>
                        )}
                        <div>
                          <h3 className="font-semibold">{pet?.name || '未知'}</h3>
                          <p className="text-xs text-secondary-100">
                            {getServiceName(order.serviceType)} · {order.scheduledDate}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-secondary-100">喂养员</p>
                        <p className="text-sm font-medium">{feeder?.name || '待分配'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="relative">
                      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-warm-200" />
                      <div className="space-y-1">
                        {nodes.map((node, nIdx) => {
                          const colors = nodeColors[node.type];
                          const NodeIcon = node.icon;
                          return (
                            <motion.div
                              key={node.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: nIdx * 0.1 }}
                              className="relative pl-10"
                            >
                              <div className={`absolute left-[7px] top-3 w-[17px] h-[17px] rounded-full ${colors.dot} border-[3px] border-white shadow-sm z-10`} />
                              <div className={`${colors.bg} rounded-xl p-4`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <NodeIcon className={`w-4 h-4 ${colors.icon}`} />
                                    <span className="font-medium text-warm-800 text-sm">{node.label}</span>
                                  </div>
                                  <span className="text-xs text-warm-400">
                                    {format(new Date(node.time), 'HH:mm')}
                                  </span>
                                </div>

                                {node.details.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                    {node.details.map((detail, dIdx) => (
                                      <div key={dIdx} className="text-xs">
                                        <span className="text-warm-400">{detail.label}：</span>
                                        <span className="text-warm-700 font-medium">{detail.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {(node.photos.length > 0 || node.videos.length > 0) && (
                                  <div className="flex gap-2 flex-wrap mt-2">
                                    {node.photos.map((photo, pIdx) => (
                                      <div
                                        key={pIdx}
                                        className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setSelectedPhoto(photo)}
                                      >
                                        <img src={photo} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                    {node.videos.map((video, vIdx) => (
                                      <div
                                        key={vIdx}
                                        className="w-16 h-16 rounded-lg bg-warm-700 flex flex-col items-center justify-center cursor-pointer hover:bg-warm-600 transition-colors relative"
                                        onClick={() => setSelectedVideo(video)}
                                      >
                                        <Play className="w-5 h-5 text-white/70" />
                                        <span className="text-[10px] text-white/60 mt-0.5">视频</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <button
          onClick={() => setShowReport(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-red-500 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors z-40"
        >
          <AlertTriangle className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}>
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              src={selectedPhoto} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
            <button onClick={() => setSelectedPhoto(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <X className="w-6 h-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedVideo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              className="bg-warm-900 rounded-2xl p-8 text-center max-w-md"
              onClick={e => e.stopPropagation()}>
              <Video className="w-16 h-16 text-white/60 mx-auto mb-4" />
              <p className="text-white/80 text-lg font-medium mb-2">视频素材</p>
              <p className="text-white/50 text-sm mb-4">{selectedVideo}</p>
              <div className="p-4 bg-white/10 rounded-xl">
                <p className="text-white/60 text-xs">视频文件信息</p>
                <p className="text-white/80 text-sm mt-1">格式：MP4 · 来源：喂养员上传</p>
              </div>
              <button onClick={() => setSelectedVideo(null)}
                className="mt-6 px-6 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors">
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowReport(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">异常上报</h3>
                <button onClick={() => setShowReport(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">异常类型</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['食欲不振', '呕吐腹泻', '精神萎靡', '其他异常'].map(type => (
                      <button key={type} onClick={() => setAbnormalType(type)}
                        className={`p-3 rounded-xl text-sm font-medium border-2 transition-all ${
                          abnormalType === type ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-600'
                        }`}>{type}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">照片证据</label>
                  <div className="flex gap-2 flex-wrap">
                    {uploadedPhotos.map((photo, idx) => (
                      <div key={idx} className="relative">
                        <img src={photo} alt="" className="w-20 h-20 rounded-xl object-cover" />
                        <button onClick={() => setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    <button onClick={handlePhotoUpload}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                      <Upload className="w-5 h-5" />
                      <span className="text-xs mt-1">上传</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">详细描述</label>
                  <textarea value={abnormalDesc} onChange={e => setAbnormalDesc(e.target.value)}
                    placeholder="请详细描述宠物的异常情况..." rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 resize-none" />
                </div>
                <button onClick={handleSubmitReport} disabled={!abnormalType || !abnormalDesc}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> 提交上报
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
