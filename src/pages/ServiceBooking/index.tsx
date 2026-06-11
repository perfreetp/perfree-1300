import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, Check, X,
  ChevronLeft, ChevronRight, UtensilsCrossed,
  Droplets, Trash2, Footprints, Camera, Heart,
  MessageSquare, CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, usePetStore, useOrderStore } from '@/store';
import { mockServices, mockFeeders } from '@/data/mockData';
import type { ServiceType, Feeder } from '@/data/types';
import StarRating from '@/components/ui/StarRating';

const serviceIcons: Record<string, typeof UtensilsCrossed> = {
  feeding: UtensilsCrossed, water: Droplets, cleaning: Trash2,
  walking: Footprints, photo: Camera, comprehensive: Heart,
};

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const inputClass = 'w-full px-4 py-3 border border-warm-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none';

export default function ServiceBookingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { pets } = usePetStore();
  const { updateBooking, createOrder, setCurrentOrder } = useOrderStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [selectedFeeder, setSelectedFeeder] = useState<Feeder | null>(null);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const userPets = pets.filter((p) => p.userId === currentUser?.id);
  const availableFeeders = mockFeeders.filter((f) => f.status === 'available');

  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear(), m = date.getMonth();
    const first = new Date(y, m, 1).getDay(), last = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: 42 }, (_, i) => {
      const d = i - first + 1;
      return d > 0 && d <= last ? new Date(y, m, d) : null;
    });
  };

  const toggleService = (id: ServiceType) => {
    setSelectedServices((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const total = selectedServices.reduce((sum, id) => sum + (mockServices.find((s) => s.id === id)?.price || 0), 0);

  const handleSubmit = () => {
    if (selectedServices.length === 0 || !selectedDate || !selectedTime || !selectedPetId || !selectedFeeder) {
      alert('请填写完整预约信息');
      return;
    }
    updateBooking({
      selectedServices, selectedDate, selectedTime,
      selectedFeederId: selectedFeeder.id, selectedPetId, notes,
    });
    const order = createOrder();
    if (order) {
      setCurrentOrder(order);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate(`/order/${order.id}`);
      }, 1500);
    }
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-warm-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-warm-900 mb-6">服务预约</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="text-lg font-semibold text-warm-900 mb-4">选择服务类型</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mockServices.map((s) => {
                  const Icon = serviceIcons[s.id] || UtensilsCrossed;
                  const sel = selectedServices.includes(s.id as ServiceType);
                  return (
                    <motion.button key={s.id} type="button" whileTap={{ scale: 0.95 }} onClick={() => toggleService(s.id as ServiceType)} className={`p-4 rounded-xl border-2 text-left ${sel ? 'border-primary-500 bg-primary-50' : 'border-warm-200 hover:border-primary-300'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2 rounded-lg ${sel ? 'bg-primary-500 text-white' : 'bg-warm-100 text-warm-600'}`}><Icon className="w-5 h-5" /></div>
                        {sel && <Check className="w-5 h-5 text-primary-500" />}
                      </div>
                      <h3 className={`font-medium ${sel ? 'text-primary-700' : 'text-warm-900'}`}>{s.name}</h3>
                      <p className="text-xs text-warm-400 mt-1">{s.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-primary-500">¥{s.price}</span>
                        <span className="text-xs text-warm-400">{s.duration}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="text-lg font-semibold text-warm-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary-500" />选择日期</h2>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-warm-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-warm-700" /></button>
                <span className="font-medium text-warm-900">{currentDate.getFullYear()}年{currentDate.getMonth() + 1}月</span>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-warm-100 rounded-lg"><ChevronRight className="w-5 h-5 text-warm-700" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">{weekDays.map((d) => <div key={d} className="text-center text-sm text-warm-400 py-2">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((date, idx) => {
                  if (!date) return <div key={idx} className="aspect-square" />;
                  const ds = date.toISOString().split('T')[0];
                  const sel = selectedDate === ds;
                  const past = date < new Date(new Date().setHours(0, 0, 0, 0));
                  return (
                    <motion.button key={idx} type="button" whileTap={{ scale: 0.9 }} disabled={past} onClick={() => !past && setSelectedDate(ds)} className={`aspect-square rounded-lg text-sm font-medium ${sel ? 'bg-primary-500 text-white' : past ? 'text-warm-200 cursor-not-allowed' : 'hover:bg-warm-100 text-warm-700'}`}>
                      {date.getDate()}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="text-lg font-semibold text-warm-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-secondary-500" />选择时间段</h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {timeSlots.map((t) => (
                  <motion.button key={t} type="button" whileTap={{ scale: 0.9 }} onClick={() => setSelectedTime(t)} className={`py-2 rounded-xl font-medium ${selectedTime === t ? 'bg-secondary-500 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}>
                    {t}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="text-lg font-semibold text-warm-900 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary-500" />选择喂养员</h2>
              <div className="space-y-3">
                {availableFeeders.map((f) => {
                  const sel = selectedFeeder?.id === f.id;
                  return (
                    <motion.div key={f.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedFeeder(f)} className={`p-4 rounded-xl border-2 cursor-pointer ${sel ? 'border-primary-500 bg-primary-50' : 'border-warm-200 hover:border-primary-300'}`}>
                      <div className="flex items-center gap-4">
                        <img src={f.avatar} alt={f.name} className="w-14 h-14 rounded-full object-cover" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-warm-900">{f.name}</h3>
                            {sel && <Check className="w-4 h-4 text-primary-500" />}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={f.rating} readonly size="sm" />
                            <span className="text-sm text-warm-500">{f.rating} ({f.reviewCount}评价)</span>
                          </div>
                          <div className="flex gap-1 mt-2 flex-wrap">{f.qualifications.slice(0, 2).map((q, i) => <span key={i} className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full">{q}</span>)}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-warm-400">可服务时段</span>
                          <div className="flex gap-1 mt-1 flex-wrap justify-end">{f.availableSlots.slice(0, 3).map((s) => <span key={s} className="text-xs px-1.5 py-0.5 bg-warm-100 text-warm-600 rounded">{s}</span>)}</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="text-lg font-semibold text-warm-900 mb-4">选择宠物</h2>
              <select value={selectedPetId} onChange={(e) => setSelectedPetId(e.target.value)} className={inputClass}>
                <option value="">请选择宠物</option>
                {userPets.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.breed}，{p.age}岁)</option>)}
              </select>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="text-lg font-semibold text-warm-900 mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-warm-500" />备注说明</h2>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="请输入特殊要求或注意事项..." rows={4} className={`${inputClass} resize-none`} />
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-card p-5 sticky top-6">
              <h2 className="text-lg font-semibold text-warm-900 mb-4">预约摘要</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-warm-400">已选服务</span><span className="text-warm-700">{selectedServices.length}项</span></div>
                <div className="flex justify-between"><span className="text-warm-400">预约日期</span><span className="text-warm-700">{selectedDate || '未选择'}</span></div>
                <div className="flex justify-between"><span className="text-warm-400">预约时间</span><span className="text-warm-700">{selectedTime || '未选择'}</span></div>
                <div className="flex justify-between"><span className="text-warm-400">喂养员</span><span className="text-warm-700">{selectedFeeder?.name || '未选择'}</span></div>
                <div className="flex justify-between"><span className="text-warm-400">宠物</span><span className="text-warm-700">{userPets.find((p) => p.id === selectedPetId)?.name || '未选择'}</span></div>
              </div>
              <div className="border-t border-warm-100 my-4 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-warm-400">合计金额</span>
                  <span className="text-2xl font-bold text-primary-500">¥{total}</span>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={total === 0} className="w-full bg-primary-500 text-white py-4 rounded-xl font-semibold shadow-soft hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  确认预约
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="bg-white rounded-2xl p-8 text-center">
                <motion.div animate={{ rotate: [0, 360], transition: { duration: 0.5 } }} className="w-20 h-20 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-warm-900 mb-2">预约成功！</h3>
                <p className="text-warm-500">正在跳转到支付页面...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
