import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, Clock, Repeat, X, Check,
  ChevronLeft, ChevronRight, UtensilsCrossed,
  Droplets, Trash2, Footprints, Camera, Heart,
  Pause, Play, CheckCircle2,
} from 'lucide-react';
import { useAuthStore, usePetStore, useOrderStore } from '@/store';
import { mockServices } from '@/data/mockData';
import type { FeedingPlan, ServiceType } from '@/data/types';

const statusConfig = {
  active: { label: '进行中', color: 'bg-secondary-500', icon: Play },
  paused: { label: '已暂停', color: 'bg-amber-500', icon: Pause },
  completed: { label: '已完成', color: 'bg-gray-400', icon: CheckCircle2 },
};

const serviceIcons: Record<string, typeof UtensilsCrossed> = {
  feeding: UtensilsCrossed, water: Droplets, cleaning: Trash2,
  walking: Footprints, photo: Camera, comprehensive: Heart,
};

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const timeSlots = ['07:00', '09:00', '12:00', '14:00', '18:00', '20:00'];
const inputClass = 'w-full px-4 py-3 border border-warm-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none';

export default function FeedingPlanPage() {
  const { currentUser } = useAuthStore();
  const { pets } = usePetStore();
  const { feedingPlans, addFeedingPlan } = useOrderStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<FeedingPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '', startDate: '', endDate: '', petId: '', notes: '',
    serviceItems: [] as ServiceType[],
    frequency: 'daily' as 'daily' | 'weekly' | 'custom',
    weekDays: [] as number[], timeSlots: [] as string[],
  });

  const userPets = pets.filter((p) => p.userId === currentUser?.id);
  const userPlans = feedingPlans.filter((p) => p.userId === currentUser?.id);
  const petName = (id: string) => pets.find((p) => p.id === id)?.name;
  const svcName = (id: string) => mockServices.find((s) => s.id === id)?.name;

  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear(), m = date.getMonth();
    const first = new Date(y, m, 1).getDay(), last = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: 42 }, (_, i) => {
      const d = i - first + 1;
      return d > 0 && d <= last ? new Date(y, m, d) : null;
    });
  };

  const getPlansForDate = (date: Date) => {
    const ds = date.toISOString().split('T')[0];
    return userPlans.filter((p) => {
      if (ds < p.startDate || ds > p.endDate) return false;
      return p.frequency === 'daily' || p.frequency === 'weekly' && p.weekDays?.includes(date.getDay());
    });
  };

  const toggleItem = <T,>(key: string, value: T) => {
    setFormData((prev) => {
      const arr = prev[key as keyof typeof prev] as unknown as T[];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const handleSubmit = () => {
    const { name, startDate, endDate, petId, serviceItems, frequency, weekDays, timeSlots, notes } = formData;
    if (!name || !startDate || !endDate || !petId || serviceItems.length === 0) {
      alert('请填写完整信息');
      return;
    }
    addFeedingPlan({
      name,
      petId,
      startDate,
      endDate,
      serviceItems: serviceItems as string[],
      frequency,
      weekDays: frequency === 'weekly' ? weekDays : undefined,
      timeSlots,
      status: 'active',
      notes,
    });
    setShowForm(false);
    setFormData({
      name: '', startDate: '', endDate: '', petId: '', notes: '',
      serviceItems: [],
      frequency: 'daily',
      weekDays: [],
      timeSlots: [],
    });
  };

  const days = getDaysInMonth(currentDate);

  const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {children}
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-warm-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-warm-900">喂养计划</h1>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl shadow-soft hover:bg-primary-600">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">创建计划</span>
          </motion.button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-warm-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                日历视图
              </h2>
              <div className="flex gap-1">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-warm-100 rounded-lg">
                  <ChevronLeft className="w-5 h-5 text-warm-700" />
                </button>
                <span className="px-3 py-2 text-warm-900 font-medium">{currentDate.getFullYear()}年{currentDate.getMonth() + 1}月</span>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-warm-100 rounded-lg">
                  <ChevronRight className="w-5 h-5 text-warm-700" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((d) => <div key={d} className="text-center text-sm text-warm-400 py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, idx) => {
                if (!date) return <div key={idx} className="aspect-square" />;
                const plans = getPlansForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <motion.div key={idx} whileHover={{ scale: 1.05 }} className={`aspect-square p-1 rounded-lg cursor-pointer ${isToday ? 'bg-primary-100' : 'hover:bg-warm-100'}`} onClick={() => plans.length > 0 && setSelectedPlan(plans[0])}>
                    <div className="text-center">
                      <span className={`text-sm ${isToday ? 'text-primary-600 font-bold' : 'text-warm-700'}`}>{date.getDate()}</span>
                      <div className="flex justify-center gap-0.5 mt-1">
                        {plans.slice(0, 2).map((p) => <div key={p.id} className={`w-2 h-2 rounded-full ${statusConfig[p.status].color}`} />)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-card p-5">
            <h2 className="text-lg font-semibold text-warm-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary-500" />
              计划列表
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {userPlans.length === 0 ? (
                <div className="text-center py-12 text-warm-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无喂养计划</p>
                </div>
              ) : (
                userPlans.map((plan, idx) => {
                  const StatusIcon = statusConfig[plan.status].icon;
                  return (
                    <motion.div key={plan.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="p-4 rounded-xl border border-warm-100 hover:border-primary-200 hover:shadow-soft cursor-pointer" onClick={() => setSelectedPlan(plan)}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-warm-900">{plan.name}</h3>
                          <p className="text-sm text-warm-400">{petName(plan.petId) || '未知宠物'}</p>
                        </div>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${statusConfig[plan.status].color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[plan.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-warm-500">
                        <Calendar className="w-4 h-4" />
                        <span>{plan.startDate} ~ {plan.endDate}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {plan.serviceItems.map((item) => {
                          const Icon = serviceIcons[item] || UtensilsCrossed;
                          return (
                            <span key={item} className="inline-flex items-center gap-1 px-2 py-0.5 bg-warm-100 rounded-full text-xs text-warm-600">
                              <Icon className="w-3 h-3" />{svcName(item)}
                            </span>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {showForm && (
            <Modal onClose={() => setShowForm(false)}>
              <div className="p-5 border-b border-warm-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-warm-900">创建喂养计划</h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-warm-100 rounded-lg"><X className="w-5 h-5 text-warm-500" /></button>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-2">计划名称</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="例如：出差期间每日喂养" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-2">开始日期</label>
                    <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-2">结束日期</label>
                    <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-2">关联宠物</label>
                  <select value={formData.petId} onChange={(e) => setFormData({ ...formData, petId: e.target.value })} className={inputClass}>
                    <option value="">请选择宠物</option>
                    {userPets.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-2">服务类型</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {mockServices.map((s) => {
                      const Icon = serviceIcons[s.id] || UtensilsCrossed;
                      const sel = formData.serviceItems.includes(s.id as ServiceType);
                      return (
                        <motion.button key={s.id} type="button" whileTap={{ scale: 0.95 }} onClick={() => toggleItem('serviceItems', s.id as ServiceType)} className={`flex items-center gap-2 p-3 rounded-xl border-2 ${sel ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-warm-200 hover:border-primary-300'}`}>
                          <Icon className="w-5 h-5" />
                          <span className="text-sm">{s.name}</span>
                          {sel && <Check className="w-4 h-4 ml-auto" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-2"><Repeat className="w-4 h-4 inline mr-1" />周期设置</label>
                  <div className="flex gap-2 mb-3">
                    {(['daily', 'weekly'] as const).map((f) => (
                      <motion.button key={f} type="button" whileTap={{ scale: 0.95 }} onClick={() => setFormData({ ...formData, frequency: f })} className={`flex-1 py-2 px-4 rounded-xl font-medium ${formData.frequency === f ? 'bg-secondary-500 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}>
                        {f === 'daily' ? '按日重复' : '按周重复'}
                      </motion.button>
                    ))}
                  </div>
                  {formData.frequency === 'weekly' && (
                    <div className="flex gap-2 flex-wrap">
                      {weekDays.map((d, i) => (
                        <motion.button key={d} type="button" whileTap={{ scale: 0.9 }} onClick={() => toggleItem('weekDays', i)} className={`w-10 h-10 rounded-full font-medium ${formData.weekDays.includes(i) ? 'bg-secondary-500 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}>
                          {d}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-2"><Clock className="w-4 h-4 inline mr-1" />时间段</label>
                  <div className="flex gap-2 flex-wrap">
                    {timeSlots.map((t) => (
                      <motion.button key={t} type="button" whileTap={{ scale: 0.9 }} onClick={() => toggleItem('timeSlots', t)} className={`px-4 py-2 rounded-xl font-medium ${formData.timeSlots.includes(t) ? 'bg-primary-500 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}>
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-2">备注</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="特殊要求..." rows={3} className={`${inputClass} resize-none`} />
                </div>
              </div>
              <div className="p-5 border-t border-warm-100 sticky bottom-0 bg-white">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold shadow-soft hover:bg-primary-600">
                  创建计划
                </motion.button>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        <AnimatePresence>{selectedPlan && (
          <Modal onClose={() => setSelectedPlan(null)}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-warm-900">{selectedPlan.name}</h3>
                <button onClick={() => setSelectedPlan(null)} className="p-2 hover:bg-warm-100 rounded-lg"><X className="w-5 h-5 text-warm-500" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                  {(() => {
                    const pet = pets.find(p => p.id === selectedPlan.petId);
                    return (
                      <>
                        {pet?.photo ? (
                          <img src={pet.photo} alt={pet.name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                            <UtensilsCrossed className="w-6 h-6 text-primary-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-warm-800">{pet?.name || '未知宠物'}</p>
                          <p className="text-xs text-warm-500">{pet?.breed}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-3 text-warm-700">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-warm-400">服务周期</p>
                      <p className="font-medium">{selectedPlan.startDate} ~ {selectedPlan.endDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Repeat className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-warm-400">重复频率</p>
                      <p className="font-medium">
                        {selectedPlan.frequency === 'daily' ? '每日' : '每周'}
                      </p>
                      {selectedPlan.frequency === 'weekly' && selectedPlan.weekDays && selectedPlan.weekDays.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {weekDays.map((d, i) => (
                            <span
                              key={d}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                selectedPlan.weekDays?.includes(i)
                                  ? 'bg-secondary-500 text-white'
                                  : 'bg-warm-100 text-warm-300'
                              }`}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-warm-400">服务时段</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPlan.timeSlots.map(t => (
                          <span key={t} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary-50 rounded-xl">
                  <p className="text-sm font-medium text-primary-700 mb-2">服务项目</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPlan.serviceItems.map((item) => {
                      const Icon = serviceIcons[item] || UtensilsCrossed;
                      return (
                        <div key={item} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                          <Icon className="w-4 h-4 text-primary-500" />
                          <span className="text-sm text-warm-700">{svcName(item)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedPlan.notes && (
                  <div className="p-4 bg-warm-50 rounded-xl">
                    <p className="text-sm font-medium text-warm-700 mb-1">备注说明</p>
                    <p className="text-sm text-warm-600">{selectedPlan.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}</AnimatePresence>
      </div>
    </div>
  );
}
