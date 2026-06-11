import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronUp, Syringe, Ban, Pill, Phone, Key, Lock, FileText, Upload, Camera } from 'lucide-react';
import type { Pet } from '@/data/types';
import { useAuthStore } from '@/store/authStore';
import { usePetStore } from '@/store/petStore';

const emptyPet: Omit<Pet, 'id' | 'userId'> = {
  name: '',
  breed: '',
  age: 0,
  gender: 'male',
  weight: 0,
  photo: '',
  allergies: [],
  medications: [],
  vaccineRecord: '',
  notes: '',
  temper: 'friendly',
};

export default function PetProfile() {
  const { currentUser } = useAuthStore();
  const { addPet, updatePet, deletePet, getPetsByUser } = usePetStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState(emptyPet);

  const userPets = currentUser ? getPetsByUser(currentUser.id) : [];

  const openModal = (pet?: Pet) => {
    setEditingPet(pet || null);
    setFormData(pet || emptyPet);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPet(null);
    setFormData(emptyPet);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPet) {
      updatePet(editingPet.id, formData);
    } else {
      addPet(formData);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这只宠物的档案吗？')) {
      deletePet(id);
    }
  };

  const contactItems = [
    { icon: Phone, label: '紧急联系人', value: currentUser?.emergencyContact || '-' },
    { icon: Key, label: '备用钥匙', value: '请与管理员联系' },
    { icon: Lock, label: '门禁密码', value: currentUser?.doorPassword || '-' },
    { icon: FileText, label: '特殊说明', value: '请在备注中填写' },
  ];

  const InputField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-warm-700 font-medium mb-2">{label}</label>
      <input className="input-field" {...props} />
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-50 py-8">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-warm-900 mb-2">宠物档案</h1>
            <p className="text-warm-600">管理您的爱宠信息，让喂养更贴心</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">新增宠物</span>
          </motion.button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
              className="space-y-4"
            >
              {userPets.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card text-center py-16"
                >
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-10 h-10 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-bold text-warm-900 mb-2">还没有宠物档案</h3>
                  <p className="text-warm-600 mb-6">点击上方按钮添加您的爱宠信息</p>
                  <button onClick={() => openModal()} className="btn-primary">立即添加</button>
                </motion.div>
              ) : (
                userPets.map((pet: Pet) => (
                  <motion.div
                    key={pet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    layout
                    className="card overflow-hidden"
                  >
                    <div onClick={() => setExpandedId(expandedId === pet.id ? null : pet.id)} className="flex items-center gap-4 cursor-pointer">
                      <img src={pet.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=pet'} alt={pet.name} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover" />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-warm-900">{pet.name}</h3>
                        <p className="text-warm-600">{pet.breed} · {pet.age}岁 · {pet.gender === 'male' ? '公' : '母'}</p>
                        <p className="text-sm text-warm-500">{pet.weight}kg</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openModal(pet); }} className="p-2 hover:bg-primary-100 rounded-xl text-primary-600">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(pet.id); }} className="p-2 hover:bg-red-100 rounded-xl text-red-500">
                          <Trash2 className="w-5 h-5" />
                        </button>
                        {expandedId === pet.id ? <ChevronUp className="w-6 h-6 text-warm-400" /> : <ChevronDown className="w-6 h-6 text-warm-400" />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedId === pet.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 pt-6 border-t border-warm-100">
                            <h4 className="font-bold text-warm-900 mb-4">健康信息</h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="p-4 bg-primary-50 rounded-xl">
                                <div className="flex items-center gap-2 mb-2"><Syringe className="w-5 h-5 text-primary-600" /><span className="font-medium text-warm-700">疫苗记录</span></div>
                                <p className="text-sm text-warm-600">{pet.vaccineRecord || '暂无记录'}</p>
                              </div>
                              <div className="p-4 bg-red-50 rounded-xl">
                                <div className="flex items-center gap-2 mb-2"><Ban className="w-5 h-5 text-red-500" /><span className="font-medium text-warm-700">忌口食物</span></div>
                                <div className="flex flex-wrap gap-1">
                                  {pet.allergies.length > 0 ? pet.allergies.map((a, i) => (
                                    <span key={i} className="badge badge-danger text-xs">{a}</span>
                                  )) : <span className="text-sm text-warm-500">无</span>}
                                </div>
                              </div>
                              <div className="p-4 bg-secondary-50 rounded-xl">
                                <div className="flex items-center gap-2 mb-2"><Pill className="w-5 h-5 text-secondary-600" /><span className="font-medium text-warm-700">服用药品</span></div>
                                <div className="flex flex-wrap gap-1">
                                  {pet.medications.length > 0 ? pet.medications.map((m, i) => (
                                    <span key={i} className="badge badge-secondary text-xs">{m}</span>
                                  )) : <span className="text-sm text-warm-500">无</span>}
                                </div>
                              </div>
                              <div className="p-4 bg-warm-100 rounded-xl">
                                <div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-warm-700" /><span className="font-medium text-warm-700">备注</span></div>
                                <p className="text-sm text-warm-600">{pet.notes || '暂无备注'}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card"
            >
              <h3 className="text-lg font-bold text-warm-900 mb-4">联系人信息</h3>
              <div className="space-y-4">
                {contactItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-warm-500">{item.label}</p>
                      <p className="text-warm-800 font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold mb-2">温馨提示</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                完善宠物档案可以帮助喂养员更好地了解您的爱宠，提供更贴心的服务。
              </p>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white border-b border-warm-100 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-warm-900">{editingPet ? '编辑宠物' : '新增宠物'}</h2>
                  <button onClick={closeModal} className="p-2 hover:bg-warm-100 rounded-xl">
                    <X className="w-6 h-6 text-warm-600" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <img src={formData.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=pet'} alt="宠物照片" className="w-24 h-24 rounded-2xl object-cover border-4 border-primary-100" />
                      <button type="button" className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg">
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <InputField label="宠物姓名" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="请输入宠物姓名" required />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="品种" value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} placeholder="如：金毛" required />
                    <InputField label="年龄" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })} placeholder="岁" min="0" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-warm-700 font-medium mb-2">性别</label>
                      <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })} className="input-field">
                        <option value="male">公</option>
                        <option value="female">母</option>
                      </select>
                    </div>
                    <InputField label="体重 (kg)" type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })} placeholder="kg" min="0" required />
                  </div>
                  <div>
                    <label className="block text-warm-700 font-medium mb-2">疫苗记录</label>
                    <textarea value={formData.vaccineRecord} onChange={(e) => setFormData({ ...formData, vaccineRecord: e.target.value })} className="input-field min-h-[60px] resize-none" placeholder="请填写疫苗接种情况" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="过敏食物" value={formData.allergies.join(', ')} onChange={(e) => setFormData({ ...formData, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="多个用逗号分隔" />
                    <InputField label="服用药品" value={formData.medications.join(', ')} onChange={(e) => setFormData({ ...formData, medications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="多个用逗号分隔" />
                  </div>
                  <div>
                    <label className="block text-warm-700 font-medium mb-2">备注</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field min-h-[60px] resize-none" placeholder="性格特点、生活习惯等" />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={closeModal} className="btn-outline flex-1">取消</button>
                    <button type="submit" className="btn-primary flex-1">{editingPet ? '保存修改' : '确认添加'}</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
