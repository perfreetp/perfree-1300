import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Camera, X, Send, ImageIcon, CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore, useOrderStore } from '@/store';
import StarRating from '@/components/ui/StarRating';
import { getFeederById, getPetById, getServiceName } from '@/data/mockData';

type FormData = {
  overallRating: number;
  attitudeRating: number;
  professionalRating: number;
  punctualityRating: number;
  content: string;
  photos: string[];
  isAnonymous: boolean;
};

const initForm: FormData = {
  overallRating: 5,
  attitudeRating: 5,
  professionalRating: 5,
  punctualityRating: 5,
  content: '',
  photos: [],
  isAnonymous: false,
};

const ratingGroups = [
  { key: 'overallRating' as const, label: '总体评分' },
  { key: 'attitudeRating' as const, label: '服务态度' },
  { key: 'professionalRating' as const, label: '专业程度' },
  { key: 'punctualityRating' as const, label: '准时程度' },
];

const tagSuggestions = ['准时到达', '态度很好', '专业细心', '宠物很乖', '照片很多', '下次还约', '沟通顺畅', '清理到位'];

export default function ReviewSubmitPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { orders, submitReview, getReviewByOrder, feedingRecords } = useOrderStore();

  const order = orderId ? orders.find(o => o.id === orderId) : null;
  const existingReview = orderId ? getReviewByOrder(orderId) : undefined;
  const pet = order ? getPetById(order.petId) : null;
  const feeder = order ? getFeederById(order.feederId) : null;

  const hasExistingRecords = useMemo(
    () => (orderId ? feedingRecords.filter(r => r.orderId === orderId).length > 0 : false),
    [feedingRecords, orderId]
  );

  const [formData, setFormData] = useState<FormData>(
    existingReview
      ? {
          overallRating: existingReview.overallRating,
          attitudeRating: existingReview.attitudeRating,
          professionalRating: existingReview.professionalRating,
          punctualityRating: existingReview.punctualityRating,
          content: existingReview.content,
          photos: existingReview.photos,
          isAnonymous: existingReview.isAnonymous,
        }
      : initForm
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!order) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-card text-center">
          <p className="text-warm-500 mb-4">订单不存在或已失效</p>
          <button onClick={() => navigate('/reviews')} className="btn-primary">
            返回评价中心
          </button>
        </div>
      </div>
    );
  }

  if (order.userId !== currentUser?.id) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-card text-center">
          <p className="text-warm-500 mb-4">您无权限评价此订单</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const canReview =
    order.status === 'completed' || order.status === 'reviewed';

  const handleAddPhoto = () => {
    const newPhoto = `https://picsum.photos/600/400?random=${Date.now()}`;
    setFormData({ ...formData, photos: [...formData.photos, newPhoto] });
  };

  const handleRemovePhoto = (idx: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== idx),
    });
  };

  const handleTagClick = (tag: string) => {
    const cur = formData.content;
    setFormData({
      ...formData,
      content: cur ? `${cur}，${tag}` : tag,
    });
  };

  const handleSubmit = () => {
    if (!canReview || existingReview) return;
    submitReview(order.id, {
      ...formData,
      afterSalesStatus: 'none',
    });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate(`/order/${order.id}`);
    }, 1500);
  };

  const avgScore = Math.round(
    (formData.overallRating + formData.attitudeRating + formData.professionalRating + formData.punctualityRating) / 4 * 10
  ) / 10;

  return (
    <div className="min-h-screen bg-warm-50 pb-28">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 pt-10">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {existingReview ? '查看评价' : '发表评价'}
            </h1>
            <p className="text-primary-100 text-sm mt-0.5">
              订单 {order.id.slice(-6)} · {format(new Date(order.scheduledDate), 'MM-dd HH:mm')}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-card"
        >
          <div className="flex items-center gap-4">
            {pet?.photo ? (
              <img src={pet.photo} alt={pet.name} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-secondary-100 flex items-center justify-center text-2xl">🐾</div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-warm-800">{pet?.name || '未知'}</h3>
              <p className="text-sm text-warm-500">{getServiceName(order.serviceType)} · 喂养员 {feeder?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-warm-400">综合评分</p>
              <p className="text-2xl font-bold text-primary-500">{avgScore}</p>
            </div>
          </div>

          {existingReview ? (
            <div className="mt-4 p-3 bg-green-50 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700">
                评价于 {format(new Date(existingReview.createdAt), 'yyyy-MM-dd HH:mm')}
              </p>
            </div>
          ) : (
            hasExistingRecords || order.status === 'completed' ? (
              <div className="mt-4 p-3 bg-secondary-50 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary-500" />
                <p className="text-sm text-secondary-700">
                  服务已完成，感谢您的宝贵评价
                </p>
              </div>
            ) : null
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 shadow-card space-y-5"
        >
          {ratingGroups.map((g) => (
            <div key={g.key} className="flex items-center justify-between">
              <span className="text-sm text-warm-700">{g.label}</span>
              <div className={existingReview ? 'pointer-events-none' : ''}>
                <StarRating
                  rating={formData[g.key]}
                  onRatingChange={(v) => setFormData({ ...formData, [g.key]: v })}
                  size="md"
                />
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-card"
        >
          <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary-500" /> 评价内容
          </h3>

          {!existingReview && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tagSuggestions.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-3 py-1.5 rounded-full bg-warm-50 border border-warm-100 text-warm-600 text-xs hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}

          <textarea
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            placeholder={existingReview ? '' : '分享一下您的服务体验吧，会帮助其他宠物主做出更好的选择~'}
            readOnly={!!existingReview}
            rows={5}
            className="w-full px-4 py-3 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 resize-none bg-warm-50/40"
          />
          <p className="text-right text-xs text-warm-400 mt-1">{formData.content.length} / 500</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 shadow-card"
        >
          <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
            <Camera className="w-5 h-5 text-secondary-500" /> 上传照片
            <span className="text-xs text-warm-400 font-normal ml-auto">
              {formData.photos.length} / 9
            </span>
          </h3>
          <div className="flex gap-2 flex-wrap">
            {formData.photos.map((photo, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden">
                <img
                  src={photo}
                  alt=""
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedPhoto(photo)}
                />
                {!existingReview && (
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            ))}
            {!existingReview && formData.photos.length < 9 && (
              <button
                onClick={handleAddPhoto}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-warm-300 flex flex-col items-center justify-center text-warm-400 hover:bg-warm-50 transition-colors"
              >
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs mt-1">加照片</span>
              </button>
            )}
          </div>
        </motion.div>

        {!existingReview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-card"
          >
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={e => setFormData({ ...formData, isAnonymous: e.target.checked })}
                className="w-5 h-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-warm-700">匿名评价（喂养员不会看到您的昵称）</span>
            </label>
          </motion.div>
        )}
      </div>

      {!existingReview && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-100 p-4 pb-6">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleSubmit}
              disabled={!canReview || formData.content.trim().length === 0}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {canReview ? '提交评价' : '请等待服务完成后再评价'}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={selectedPhoto}
              alt=""
              className="max-w-full max-h-full rounded-2xl object-contain"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-warm-800 mb-1">评价提交成功</h3>
              <p className="text-warm-500 text-sm">感谢您的反馈，即将返回订单详情...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
