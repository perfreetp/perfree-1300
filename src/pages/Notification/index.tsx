import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, Clock, MessageSquare, Check, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuthStore, useOrderStore } from '@/store';
import type { NotificationType } from '@/data/types';

const tabs: { type: NotificationType | 'all'; label: string; icon: typeof Bell }[] = [
  { type: 'all', label: '全部', icon: Sparkles },
  { type: 'system', label: '系统通知', icon: Bell },
  { type: 'order', label: '订单通知', icon: ShoppingBag },
  { type: 'feeding', label: '喂养提醒', icon: Clock },
  { type: 'review', label: '评价提醒', icon: MessageSquare },
];

export default function NotificationPage() {
  const { currentUser } = useAuthStore();
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    deleteNotification,
    deletedNotificationIds,
  } = useOrderStore();
  
  const [activeTab, setActiveTab] = useState<NotificationType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const userNotifications = currentUser
    ? notifications.filter(
        (n) => n.userId === currentUser.id && !deletedNotificationIds.includes(n.id)
      )
    : [];

  const filteredNotifications = activeTab === 'all'
    ? userNotifications
    : userNotifications.filter((n) => n.type === activeTab);

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const handleNotificationClick = (notification: typeof userNotifications[0]) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
    setExpandedId(expandedId === notification.id ? null : notification.id);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    setSwipedId(null);
    if (expandedId === id) {
      setExpandedId(null);
    }
  };

  const getTypeColor = (type: NotificationType) => {
    const colors: Record<NotificationType, string> = {
      system: 'bg-primary-100 text-primary-600',
      order: 'bg-secondary-100 text-secondary-600',
      feeding: 'bg-amber-100 text-amber-600',
      review: 'bg-green-100 text-green-600',
    };
    return colors[type];
  };

  const getTypeIcon = (type: NotificationType | 'all') => {
    const tab = tabs.find(t => t.type === type);
    return tab?.icon || Bell;
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
              const tabUnreadCount = tab.type === 'all'
                ? unreadCount
                : userNotifications.filter(n => n.type === tab.type && !n.read).length;
              
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
                  {tabUnreadCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/30 text-white' : 'bg-primary-100 text-primary-600'
                    }`}>
                      {tabUnreadCount}
                    </span>
                  )}
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
              filteredNotifications.map((notification, index) => {
                const Icon = getTypeIcon(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative overflow-hidden rounded-2xl"
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center z-10"
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
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${getTypeColor(notification.type)}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <motion.span
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0"
                                />
                              )}
                              <h3 className={`font-medium truncate ${
                                notification.read ? 'text-warm-500' : 'text-warm-800'
                              }`}>
                                {notification.title}
                              </h3>
                            </div>
                            <span className="text-xs text-warm-400 flex-shrink-0">
                              {format(new Date(notification.timestamp), 'MM-dd HH:mm', { locale: zhCN })}
                            </span>
                          </div>

                          <p className={`text-sm mt-1 line-clamp-2 ${
                            notification.read ? 'text-warm-400' : 'text-warm-600'
                          }`}>
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
                                  <p className="text-sm text-warm-600 leading-relaxed">
                                    {notification.content}
                                  </p>
                                  <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2 text-xs text-warm-400">
                                      <span className={`px-2 py-1 rounded-full ${getTypeColor(notification.type)}`}>
                                        {tabs.find(t => t.type === notification.type)?.label}
                                      </span>
                                      <span>
                                        {format(new Date(notification.timestamp), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                                      </span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(notification.id);
                                      }}
                                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      删除
                                    </button>
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
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
