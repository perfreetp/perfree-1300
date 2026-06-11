import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Camera, Droplets, Utensils,
  Pill, AlertTriangle, X, Clock,
  Upload, Send, ChevronDown,
} from 'lucide-react';
import { useAuthStore, useOrderStore } from '@/store';
import { getFeederById, getStatusText, mockFeedingRecords } from '@/data/mockData';
import type { FeedingRecord, BowelStatus } from '@/data/types';
import { format } from 'date-fns';

export default function FeedingRecord() {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders, feedingRecords, addFeedingRecord } = useOrderStore();
  const { currentUser } = useAuthStore();

  const [selectedOrder, setSelectedOrder] = useState<string>(orderId || 'all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [abnormalType, setAbnormalType] = useState('');
  const [abnormalDesc, setAbnormalDesc] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const userOrders = useMemo(() => 
    currentUser ? orders.filter(o => o.userId === currentUser.id) : orders,
    [currentUser, orders]
  );

  const filteredRecords = useMemo(() => {
    const allRecords = [...mockFeedingRecords, ...feedingRecords];
    const uniqueRecords = Array.from(new Map(allRecords.map(r => [r.id, r])).values());
    return uniqueRecords.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).filter(r => {
      if (selectedOrder !== 'all' && r.orderId !== selectedOrder) return false;
      if (selectedDate && format(new Date(r.timestamp), 'yyyy-MM-dd') !== selectedDate) return false;
      return true;
    });
  }, [selectedOrder, selectedDate, feedingRecords]);

  const allPhotos = useMemo(() => 
    [...new Set(filteredRecords.flatMap(r => r.photos))],
    [filteredRecords]
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

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white p-6 pt-10">
        <h1 className="text-2xl font-bold">喂养记录</h1>
        <p className="text-secondary-100 mt-1">查看宠物喂养详情和照片</p>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
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
                    <label className="text-xs text-gray-500 mb-1 block">按订单筛选</label>
                    <select value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-secondary-500">
                      <option value="all">全部订单</option>
                      {userOrders.map(order => (
                        <option key={order.id} value={order.id}>
                          {format(new Date(order.scheduledDate), 'MM-dd')} - {getStatusText(order.status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">按日期筛选</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-secondary-500" />
                  </div>
                  <button onClick={() => { setSelectedOrder('all'); setSelectedDate(''); }}
                    className="text-sm text-secondary-600 font-medium">重置筛选</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {allPhotos.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Camera className="w-5 h-5 text-secondary-500" /> 照片墙
            </h3>
            <div className="columns-2 sm:columns-3 gap-2">
              {allPhotos.map((photo, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }} className="mb-2 break-inside-avoid">
                  <img src={photo} alt="" className="w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedPhoto(photo)} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary-500" /> 记录时间线
            </h3>
            <button onClick={() => setShowReport(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">
              <AlertTriangle className="w-3 h-3" /> 异常上报
            </button>
          </div>
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200" />
            {filteredRecords.map((record) => (
              <RecordItem key={record.id} record={record} variants={itemVariants} />
            ))}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}>
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              src={selectedPhoto} alt="" className="max-w-full max-h-full rounded-2xl" />
            <button onClick={() => setSelectedPhoto(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <X className="w-6 h-6 text-white" />
            </button>
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

function RecordItem({ record, variants }: {
  record: FeedingRecord; variants: any;
}) {
  const feeder = getFeederById(record.feederId);
  const bowelMap = { normal: '正常', abnormal: '异常', none: '无' };
  const bowelColor = { normal: 'bg-green-100 text-green-700', abnormal: 'bg-red-100 text-red-700', none: 'bg-gray-100 text-gray-500' };

  return (
    <motion.div variants={variants} className="relative pl-12 pb-6 last:pb-0">
      <div className="absolute left-3 top-1 w-4 h-4 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 border-4 border-white shadow" />
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-800">{format(new Date(record.timestamp), 'MM月dd日 HH:mm')}</span>
          <span className="text-xs text-gray-500">{feeder?.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Utensils className="w-4 h-4 text-primary-500" /><span>食量: {record.foodAmount}g</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Droplets className="w-4 h-4 text-blue-500" /><span>饮水: {record.waterAmount}ml</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs w-fit ${bowelColor[record.bowelMovement]}`}>{bowelMap[record.bowelMovement]}</span>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Pill className={`w-4 h-4 ${record.medicationGiven ? 'text-green-500' : 'text-gray-400'}`} />
            <span>{record.medicationGiven ? '已用药' : '未用药'}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">{record.notes}</p>
        {record.photos.length > 0 && (
          <div className="flex gap-2 mt-3">
            {record.photos.slice(0, 3).map((photo, idx) => (
              <img key={idx} src={photo} alt="" className="w-16 h-16 rounded-lg object-cover" />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
