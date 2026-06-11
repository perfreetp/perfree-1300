import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, Clock, MessageSquare, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuthStore, useOrderStore } from '@/store';
import { mockNotifications } from '@/data/mockData';
import type { NotificationType, Notification } from '@/data/types';

const tabs: { type: NotificationType | 'all'; label: string; icon: typeof Bell }[] = [
  { type: 'all', label: '全部', icon: Bell },
  { type: 'system', label: '系统通知', icon: Bell },
  { type: 'order', label: '订单通知', icon: ShoppingBag },
  { type: 'feeding', label: '喂养提醒', icon: Clock },
  { type: 'review', label: '评价提醒', icon: MessageSquare },
];

export default function NotificationPage() {
  const { currentUser } = useAuthStore();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useOrderStore();
  const [activeTab, setActiveTab] = useState<NotificationType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(
    notifications.filter(n => n.userId === currentUser?.id)
  );

  const allNotifications = currentUser
    ? [...mockNotifications.filter(n => n.userId === currentUser.id), ...localNotifications]
    : localNotifications;

  const filteredNotifications = activeTab === 'all'
    ? allNotifications
    : allNotifications.filter(n => n.type === activeTab);

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
      setLocalNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }
    setExpandedId(expandedId === notification.id ? null : notification.id);
  };

  const handleDelete = (id: string) => {
    setLocalNotifications(prev => prev.filter(n => n.id !== id));
    setSwipedId(null);
  };

  const handleTouchStart = useRef<{ x: number; y: number } | null>(null);

  const getTypeColor = (type: NotificationType) => {
    const colors: Record<NotificationType, string> = {
      system: 'bg-primary-100 text-primary-600',
      order: 'bg-secondary-100 text-secondary-600',
      feeding: 'bg-amber-100 text-amber-600',
      review: 'bg-green-100 text-green-600',
    };
    return colors[type];
  };

  return (
    <div className="min-h-screen bg-warm-50 pb-8">
      <div className="gradient-bg pt-8 pb-6 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-display text-warm-800">消息通知</h1>
            {unreadCount > 0 && (
              <span className="badge badge-danger">
                {unreadCount} 条未读
              </span>
            )}
          </div>
          <p className="text-warm-500">及时了解订单状态和服务动态</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.type;
              return (
                <motion.button
                  key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-soft'
                      : 'bg-white text-warm-600 hover:bg-warm-100'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-600 hover:text-secondary-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              全部已读
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card text-center py-16"
              >
                <Bell className="w-16 h-16 text-warm-300 mx-auto mb-4" />
                <p className="text-warm-500">暂无消息</p>
              </motion.div>
            ) : (
              filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative overflow-hidden"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center"
                    style={{ transform: swipedId === notification.id ? 'translateX(0)' : 'translateX(100%)' }}
                  >
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="text-white p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <motion.div
                    className="card cursor-pointer"
                    style={{ transform: swipedId === notification.id ? 'translateX(-80px)' : 'translateX(0)' }}
                    onClick={() => handleNotificationClick(notification)}
                    onTouchStart={(e) => {
                      handleTouchStart.current = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY,
                      };
                    }}
                    onTouchEnd={(e) => {
                      if (!handleTouchStart.current) return;
                      const deltaX = e.changedTouches[0].clientX - handleTouchStart.current.x;
                      const deltaY = e.changedTouches[0].clientY - handleTouchStart.current.y;
                      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < -50) {
                        setSwipedId(swipedId === notification.id ? null : notification.id);
                      } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
                        setSwipedId(null);
                      }
                      handleTouchStart.current = null;
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${getTypeColor(notification.type)}`}>
                        {tabs.find(t => t.type === notification.type)?.icon && (
                          <>{(() => {
                            const Icon = tabs.find(t => t.type === notification.type)!.icon;
                            return <Icon className="w-5 h-5" />;
                          })()}</>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                            )}
                            <h3 className={`font-medium truncate ${notification.read ? 'text-warm-500' : 'text-warm-800'}`}>
                              {notification.title}
                            </h3>
                          </div>
                          <span className="text-xs text-warm-400 flex-shrink-0">
                            {format(new Date(notification.timestamp), 'MM-dd HH:mm', { locale: zhCN })}
                          </span>
                        </div>

                        <p className={`text-sm mt-1 line-clamp-2 ${notification.read ? 'text-warm-400' : 'text-warm-600'}`}>
                          {notification.content}
                        </p>

                        <AnimatePresence>
                          {expandedId === notification.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-warm-100">
                                <p className="text-sm text-warm-600">
                                  {notification.content}
                                </p>
                                <div className="flex items-center gap-2 mt-3 text-xs text-warm-400">
                                  <span className={`px-2 py-1 rounded-full ${getTypeColor(notification.type)}`}>
                                    {tabs.find(t => t.type === notification.type)?.label}
                                  </span>
                                  <span>
                                    {format(new Date(notification.timestamp), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex-shrink-0 text-warm-300">
                        {expandedId === notification.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
