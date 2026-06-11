import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Camera, Droplets, Utensils,
  Pill, AlertTriangle, X, Clock, MapPin,
  Upload, Send, ChevronDown, Play, Video,
  CheckCircle2, Footprints, Sparkles,
  ChevronLeft, ChevronRight, Star, ArrowRight,
  ShieldCheck, User, Calendar,
} from 'lucide-react';
import { useAuthStore, useOrderStore } from '@/store';
import { getFeederById, getStatusText, mockFeedingRecords, getPetById, getServiceName } from '@/data/mockData';
import type { FeedingRecord, BowelStatus, Order, FulfillmentTimelineItem } from '@/data/types';
import { format } from 'date-fns';

interface ServiceNode {
  id: string;
  type: 'arrival' | 'feeding' | 'cleaning' | 'departure' | 'abnormal' | 'record_added';
  label: string;
  icon: typeof MapPin;
  time: string;
  photos: string[];
  videos: string[];
  details: { label: string; value: string }[];
  relatedRecordId?: string;
}

interface MediaInfo {
  type: 'photo' | 'video';
  url: string;
  orderId: string;
  orderPetName: string;
  serviceNode: string;
  uploaderName: string;
  timestamp: string;
  relatedRecordId?: string;
}

const timelineActionMap: Record<FulfillmentTimelineItem['action'], { label: string; icon: typeof MapPin; color: string }> = {
  order_created: { label: '订单创建', icon: Calendar, color: 'bg-gray-400' },
  payment_received: { label: '支付完成', icon: ShieldCheck, color: 'bg-green-500' },
  order_accepted: { label: '喂养员接单', icon: CheckCircle2, color: 'bg-secondary-500' },
  feeder_arrived: { label: '已到达服务地点', icon: MapPin, color: 'bg-blue-500' },
  record_uploaded: { label: '上传服务记录', icon: Camera, color: 'bg-primary-500' },
  service_completed: { label: '服务完成', icon: Footprints, color: 'bg-amber-500' },
  review_submitted: { label: '评价完成', icon: Star, color: 'bg-yellow-500' },
  order_cancelled: { label: '订单取消', icon: X, color: 'bg-red-500' },
  refund_requested: { label: '申请退款', icon: AlertTriangle, color: 'bg-orange-500' },
  refund_approved: { label: '退款已处理', icon: CheckCircle2, color: 'bg-green-600' },
};

const nodeColors: Record<ServiceNode['type'], { bg: string; dot: string; icon: string }> = {
  arrival: { bg: 'bg-secondary-50', dot: 'bg-secondary-500', icon: 'text-secondary-500' },
  feeding: { bg: 'bg-primary-50', dot: 'bg-primary-500', icon: 'text-primary-500' },
  cleaning: { bg: 'bg-amber-50', dot: 'bg-amber-500', icon: 'text-amber-500' },
  departure: { bg: 'bg-green-50', dot: 'bg-green-500', icon: 'text-green-500' },
  abnormal: { bg: 'bg-red-50', dot: 'bg-red-500', icon: 'text-red-500' },
  record_added: { bg: 'bg-warm-50', dot: 'bg-warm-600', icon: 'text-warm-600' },
};

function buildServiceNodes(order: Order, records: FeedingRecord[]): ServiceNode[] {
  const nodes: ServiceNode[] = [];
  const orderRecords = records
    .filter(r => r.orderId === order.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (orderRecords.length === 0) return nodes;

  const earliest = orderRecords[0];
  const latest = orderRecords[orderRecords.length - 1];

  const allPhotos: string[] = [];
  const allVideos: string[] = [];
  const allNotes: string[] = [];
  let totalFood = 0;
  let totalWater = 0;
  let bowelMax: BowelStatus = 'none';
  let anyMedGiven = false;
  const abnormalReports: string[] = [];

  orderRecords.forEach(r => {
    allPhotos.push(...r.photos);
    allVideos.push(...r.videos);
    if (r.notes?.trim()) allNotes.push(r.notes);
    totalFood += r.foodAmount || 0;
    totalWater += r.waterAmount || 0;
    if (r.bowelMovement === 'abnormal') bowelMax = 'abnormal';
    else if (r.bowelMovement === 'normal' && bowelMax !== 'abnormal') bowelMax = 'normal';
    if (r.medicationGiven) anyMedGiven = true;
    if (r.abnormalReport) abnormalReports.push(r.abnormalReport);
  });

  if (earliest.arrivalTime) {
    nodes.push({
      id: `${order.id}-arrival`,
      type: 'arrival',
      label: '喂养员到达',
      icon: MapPin,
      time: earliest.arrivalTime,
      photos: [],
      videos: [],
      details: [
        { label: '到达时间', value: format(new Date(earliest.arrivalTime), 'HH:mm') },
        { label: '喂养员', value: getFeederById(earliest.feederId)?.name || '未知' },
      ],
    });
  }

  nodes.push({
    id: `${order.id}-feeding`,
    type: 'feeding',
    label: '喂食与饮水',
    icon: Utensils,
    time: earliest.timestamp,
    photos: Array.from(new Set(allPhotos.slice(0, Math.ceil(allPhotos.length / 2)))),
    videos: Array.from(new Set(allVideos.slice(0, Math.ceil(allVideos.length / 2)))),
    details: [
      { label: '喂食总量', value: `${totalFood}g${orderRecords.length > 1 ? `（${orderRecords.length}次）` : ''}` },
      { label: '饮水总量', value: `${totalWater}ml` },
      { label: '排便情况', value: (bowelMax as BowelStatus) === 'normal' ? '正常' : (bowelMax as BowelStatus) === 'abnormal' ? '异常' : '无记录' },
      { label: '用药情况', value: anyMedGiven ? '已喂药' : '无需喂药' },
    ],
    relatedRecordId: earliest.id,
  });

  if (order.serviceType === 'cleaning' || order.serviceType === 'comprehensive' || order.serviceItems?.includes('cleaning')) {
    nodes.push({
      id: `${order.id}-cleaning`,
      label: '清洁打扫',
      icon: Sparkles,
      type: 'cleaning',
      time: earliest.timestamp,
      photos: Array.from(new Set(allPhotos.slice(Math.ceil(allPhotos.length / 2)))),
      videos: Array.from(new Set(allVideos.slice(Math.ceil(allVideos.length / 2)))),
      details: [
        { label: '清洁项目', value: '猫砂/窝垫/食盆' },
        { label: '清洁状态', value: '已完成' },
      ],
    });
  }

  if (orderRecords.length > 1) {
    nodes.push({
      id: `${order.id}-records-extra`,
      label: '补充记录',
      icon: Camera,
      type: 'record_added',
      time: latest.timestamp,
      photos: [],
      videos: [],
      details: [
        { label: '记录次数', value: `${orderRecords.length} 次上传` },
        { label: '首次记录', value: format(new Date(earliest.timestamp), 'MM-dd HH:mm') },
        { label: '最后记录', value: format(new Date(latest.timestamp), 'MM-dd HH:mm') },
      ],
    });
  }

  if (abnormalReports.length > 0) {
    nodes.push({
      id: `${order.id}-abnormal`,
      type: 'abnormal',
      label: '异常上报',
      icon: AlertTriangle,
      time: earliest.timestamp,
      photos: [],
      videos: [],
      details: abnormalReports.map(a => ({ label: '异常类型', value: a })),
    });
  }

  if (latest.departureTime) {
    nodes.push({
      id: `${order.id}-departure`,
      type: 'departure',
      label: '服务完成离开',
      icon: CheckCircle2,
      time: latest.departureTime,
      photos: [],
      videos: [],
      details: [
        { label: '离开时间', value: format(new Date(latest.departureTime), 'HH:mm') },
        { label: '服务总时长', value: earliest.arrivalTime
          ? `${Math.round((new Date(latest.departureTime).getTime() - new Date(earliest.arrivalTime).getTime()) / 60000)}分钟`
          : '未知' },
      ],
    });
  }

  if (allNotes.length > 0) {
    const merged = allNotes.join('；');
    const lastNode = nodes[nodes.length - 1];
    if (lastNode) {
      lastNode.details.push({ label: orderRecords.length > 1 ? '喂养员备注' : '服务备注', value: merged });
    }
  }

  return nodes;
}

export default function FeedingRecord() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { orders, feedingRecords, addFeedingRecord, getTimelineByOrder, hasReviewForOrder } = useOrderStore();
  const { currentUser } = useAuthStore();

  const [selectedOrder, setSelectedOrder] = useState<string>(orderId || 'all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [abnormalType, setAbnormalType] = useState('');
  const [abnormalDesc, setAbnormalDesc] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const [mediaList, setMediaList] = useState<MediaInfo[]>([]);
  const [mediaIndex, setMediaIndex] = useState<number>(-1);

  useEffect(() => {
    if (orderId) setSelectedOrder(orderId);
  }, [orderId]);

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
    const result: { order: Order; nodes: ServiceNode[]; timeline: FulfillmentTimelineItem[]; reviewed: boolean }[] = [];
    const targetOrders = selectedOrder !== 'all'
      ? displayOrders.filter(o => o.id === selectedOrder)
      : displayOrders;

    for (const order of targetOrders) {
      const nodes = buildServiceNodes(order, allRecords);
      if (nodes.length === 0) continue;

      const timeline = getTimelineByOrder(order.id);
      result.push({ order, nodes, timeline, reviewed: hasReviewForOrder(order.id) });
    }
    return result;
  }, [displayOrders, allRecords, selectedOrder, getTimelineByOrder, hasReviewForOrder]);

  useEffect(() => {
    const list: MediaInfo[] = [];
    orderServiceNodes.forEach(({ order, nodes }) => {
      const pet = getPetById(order.petId);
      nodes.forEach(n => {
        n.photos.forEach(url => {
          list.push({
            type: 'photo',
            url,
            orderId: order.id,
            orderPetName: pet?.name || '宠物',
            serviceNode: n.label,
            uploaderName: getFeederById(order.feederId)?.name || '喂养员',
            timestamp: n.time,
            relatedRecordId: n.relatedRecordId,
          });
        });
        n.videos.forEach(url => {
          list.push({
            type: 'video',
            url,
            orderId: order.id,
            orderPetName: pet?.name || '宠物',
            serviceNode: n.label,
            uploaderName: getFeederById(order.feederId)?.name || '喂养员',
            timestamp: n.time,
            relatedRecordId: n.relatedRecordId,
          });
        });
      });
    });
    setMediaList(list);
  }, [orderServiceNodes]);

  const allPhotos = useMemo(() => mediaList.filter(m => m.type === 'photo').map(m => m.url), [mediaList]);
  const allVideos = useMemo(() => mediaList.filter(m => m.type === 'video'), [mediaList]);

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

  const openMedia = (idx: number) => {
    setMediaIndex(idx);
  };
  const prevMedia = () => mediaIndex > 0 && setMediaIndex(mediaIndex - 1);
  const nextMedia = () => mediaIndex < mediaList.length - 1 && setMediaIndex(mediaIndex + 1);
  const closeMedia = () => setMediaIndex(-1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mediaIndex < 0) return;
      if (e.key === 'ArrowLeft') prevMedia();
      if (e.key === 'ArrowRight') nextMedia();
      if (e.key === 'Escape') closeMedia();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mediaIndex, mediaList.length]);

  const currentMedia = mediaIndex >= 0 ? mediaList[mediaIndex] : null;

  return (
    <div className="min-h-screen bg-warm-50 pb-8">
      <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white p-6 pt-10">
        <h1 className="text-2xl font-bold">喂养记录</h1>
        <p className="text-secondary-100 mt-1">查看宠物喂养详情和照片</p>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
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
            <span className="ml-auto text-xs text-warm-400">
              共 {orderServiceNodes.length} 个订单 · {mediaList.length} 个素材
            </span>
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
              <span className="text-xs text-warm-400 font-normal ml-auto">
                {allPhotos.length}张照片 · {allVideos.length}个视频
              </span>
            </h3>
            <div className="columns-2 sm:columns-3 gap-2">
              {mediaList.map((m, idx) => (
                <motion.div key={`${m.url}-${idx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }} className="mb-2 break-inside-avoid">
                  {m.type === 'photo' ? (
                    <img src={m.url} alt="" className="w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openMedia(idx)} />
                  ) : (
                    <div
                      className="w-full aspect-video rounded-xl bg-warm-800 flex flex-col items-center justify-center cursor-pointer hover:bg-warm-700 transition-colors relative overflow-hidden"
                      onClick={() => openMedia(idx)}
                    >
                      <Video className="w-8 h-8 text-white/60" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                      <span className="text-xs text-white/70 mt-1 absolute bottom-2">视频 {idx + 1}</span>
                    </div>
                  )}
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
            orderServiceNodes.map(({ order, nodes, timeline, reviewed }, oIdx) => {
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

                    {(order.status === 'completed' || order.status === 'reviewed') && (
                      <div className="mt-3 flex items-center gap-2">
                        {reviewed ? (
                          <button
                            onClick={() => navigate(`/review/${order.id}`)}
                            className="flex-1 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                            查看评价
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/review/${order.id}`)}
                            className="flex-1 py-2 rounded-xl bg-white text-secondary-600 hover:bg-white/90 transition-colors text-sm font-semibold flex items-center justify-center gap-2 shadow"
                          >
                            <Star className="w-4 h-4" />
                            去评价
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/order/${order.id}`)}
                          className="py-2 px-4 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium"
                        >
                          订单详情
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-warm-700 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-secondary-500" />
                        服务过程节点
                      </h4>
                      <span className="text-xs text-warm-400">{nodes.length} 个节点</span>
                    </div>
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
                              transition={{ delay: nIdx * 0.08 }}
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
                                    {node.photos.map((photo, pIdx) => {
                                      const gIdx = mediaList.findIndex(m => m.url === photo && m.type === 'photo');
                                      return (
                                        <div
                                          key={pIdx}
                                          className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => gIdx >= 0 && openMedia(gIdx)}
                                        >
                                          <img src={photo} alt="" className="w-full h-full object-cover" />
                                        </div>
                                      );
                                    })}
                                    {node.videos.map((video, vIdx) => {
                                      const gIdx = mediaList.findIndex(m => m.url === video && m.type === 'video');
                                      return (
                                        <div
                                          key={vIdx}
                                          className="w-16 h-16 rounded-lg bg-warm-700 flex flex-col items-center justify-center cursor-pointer hover:bg-warm-600 transition-colors relative"
                                          onClick={() => gIdx >= 0 && openMedia(gIdx)}
                                        >
                                          <Play className="w-5 h-5 text-white/70" />
                                          <span className="text-[10px] text-white/60 mt-0.5">视频</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {timeline.length > 0 && (
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-warm-700 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-primary-500" />
                          履约时间轴
                        </h4>
                        <span className="text-xs text-warm-400">{timeline.length} 条记录</span>
                      </div>
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
                                  <p className="text-xs text-warm-400 mt-0.5">
                                    — {item.actorName}
                                  </p>
                                )}
                              </div>
                              {tIdx < timeline.length - 1 && <div className="h-4" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
        {currentMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col"
            onClick={closeMedia}
          >
            <div className="flex items-center justify-between p-5 text-white flex-shrink-0">
              <div className="flex items-center gap-3 text-xs bg-white/10 px-4 py-2 rounded-full max-w-[70%]">
                <span className="text-warm-200 truncate">{currentMedia.orderPetName}的{currentMedia.serviceNode}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-white/70">
                  {mediaIndex + 1} / {mediaList.length}
                </span>
                <button onClick={closeMedia} className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-4 relative" onClick={e => e.stopPropagation()}>
              {mediaList.length > 1 && (
                <>
                  <button
                    onClick={prevMedia}
                    disabled={mediaIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/15 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={nextMedia}
                    disabled={mediaIndex === mediaList.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/15 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}

              {currentMedia.type === 'photo' ? (
                <motion.img
                  key={currentMedia.url}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  src={currentMedia.url}
                  alt=""
                  className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
                />
              ) : (
                <motion.div
                  key={currentMedia.url}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-warm-900 rounded-3xl p-10 text-center max-w-lg w-full shadow-2xl"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/15 flex items-center justify-center">
                    <Video className="w-10 h-10 text-white/80" />
                  </div>
                  <p className="text-white/90 text-xl font-semibold mb-2">视频素材预览</p>
                  <p className="text-white/50 text-sm mb-6 break-all">{currentMedia.url}</p>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="bg-white/8 p-3 rounded-xl">
                      <p className="text-white/40 text-xs">所属订单</p>
                      <p className="text-white/80 text-sm mt-0.5">#{currentMedia.orderId.slice(-8)}</p>
                    </div>
                    <div className="bg-white/8 p-3 rounded-xl">
                      <p className="text-white/40 text-xs">上传节点</p>
                      <p className="text-white/80 text-sm mt-0.5">{currentMedia.serviceNode}</p>
                    </div>
                    <div className="bg-white/8 p-3 rounded-xl">
                      <p className="text-white/40 text-xs">上传时间</p>
                      <p className="text-white/80 text-sm mt-0.5">{format(new Date(currentMedia.timestamp), 'yyyy-MM-dd HH:mm')}</p>
                    </div>
                    <div className="bg-white/8 p-3 rounded-xl">
                      <p className="text-white/40 text-xs">上传者</p>
                      <p className="text-white/80 text-sm mt-0.5">{currentMedia.uploaderName}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-xs">
                    <Play className="w-3.5 h-3.5" />
                    <span>点击播放（演示环境为素材占位）</span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-5 text-white text-sm flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-white/50">
                {currentMedia.type === 'photo' ? '照片素材' : '视频素材'} · {currentMedia.uploaderName}上传
              </div>
              <div className="text-xs text-white/50">
                ← → 切换  ·  Esc 关闭
              </div>
            </div>
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
