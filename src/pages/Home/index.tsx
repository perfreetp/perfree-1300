import { motion } from 'framer-motion';
import { UtensilsCrossed, Droplets, Trash2, Footprints, Camera, Heart, Star, ChevronRight, Calendar, Shield, MapPin } from 'lucide-react';
import { mockServices, mockFeeders, mockReviews } from '@/data/mockData';
import type { ServiceItem, Feeder, Review } from '@/data/types';
import { useAuthStore } from '@/store/authStore';
import { usePetStore } from '@/store/petStore';
import StarRating from '@/components/ui/StarRating';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  UtensilsCrossed,
  Droplets,
  Trash2,
  Footprints,
  Camera,
  Heart,
};

const stats = [
  { icon: Calendar, value: '10万+', label: '服务订单', color: 'primary' },
  { icon: Star, value: '98.6%', label: '好评率', color: 'secondary' },
  { icon: Shield, value: '500+', label: '认证喂养员', color: 'primary' },
  { icon: MapPin, value: '30+', label: '覆盖城市', color: 'secondary' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function Home() {
  useAuthStore();
  usePetStore();

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-primary-100 text-primary-600';
      case 'secondary':
        return 'bg-secondary-100 text-secondary-600';
      case 'warm':
        return 'bg-warm-100 text-warm-700';
      default:
        return 'bg-primary-100 text-primary-600';
    }
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 text-white py-16 md:py-24 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-400/20" />
        <div className="container relative px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow">
              让爱宠得到专业照料
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              专业喂养员上门服务，出差上班不再担心
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              立即预约
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      <section className="py-12 md:py-16">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-warm-900 mb-4">
              我们的服务
            </h2>
            <p className="text-warm-600 text-lg">为您的爱宠提供全方位的专业照料</p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
          >
            {mockServices.map((service: ServiceItem) => {
              const IconComponent = iconMap[service.icon] || Heart;
              return (
                <motion.div
                  key={service.id}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="card card-hover cursor-pointer text-center"
                >
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${getColorClasses(service.color)} flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-warm-900 mb-2">{service.name}</h3>
                  <p className="text-warm-600 text-sm mb-3 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-primary-600 font-bold text-xl">¥{service.price}</span>
                    <span className="text-warm-500 text-sm">{service.duration}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-warm-900 mb-2">喂养员风采</h2>
              <p className="text-warm-600">专业认证，用心呵护每一只爱宠</p>
            </div>
            <button className="hidden md:flex items-center text-primary-600 font-medium hover:text-primary-700">
              查看全部 <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </motion.div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            {mockFeeders.map((feeder: Feeder, index: number) => (
              <motion.div
                key={feeder.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="flex-shrink-0 w-64 md:w-72 card card-hover cursor-pointer"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={feeder.avatar}
                    alt={feeder.name}
                    className="w-14 h-14 rounded-full border-3 border-primary-200"
                  />
                  <div className="ml-4">
                    <h3 className="font-bold text-warm-900 text-lg">{feeder.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-medium text-warm-700">{feeder.rating}</span>
                      <span className="text-warm-500 text-sm">({feeder.reviewCount}评价)</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {feeder.qualifications.slice(0, 3).map((qual, i) => (
                    <span key={i} className="badge badge-secondary text-xs">
                      {qual}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-warm-100 flex justify-between text-sm">
                  <span className="text-warm-600">服务 {feeder.orderCount} 单</span>
                  <span className="text-warm-600">{feeder.experience}年经验</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-warm-900 mb-4">用户好评</h2>
            <p className="text-warm-600 text-lg">听听其他宠物主人怎么说</p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {mockReviews.map((review: Review, index: number) => (
              <motion.div
                key={review.id}
                variants={itemVariants}
                transition={{ delay: index * 0.15 }}
                whileHover={{ y: -4 }}
                className="card"
              >
                <StarRating rating={review.overallRating} readonly size="sm" />
                <p className="text-warm-700 mt-4 line-clamp-4 leading-relaxed">
                  "{review.content}"
                </p>
                {review.photos.length > 0 && (
                  <div className="mt-4">
                    <img
                      src={review.photos[0]}
                      alt="宠物照片"
                      className="w-full h-32 object-cover rounded-xl"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <div className="container px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-white/80">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
