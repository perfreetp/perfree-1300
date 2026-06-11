import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-warm-50">
      <Header />
      
      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          <Outlet />
        </motion.div>
      </main>
      
      <footer className="bg-warm-700 text-warm-100 py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-display text-xl text-white mb-4">宠心守护</h3>
              <p className="text-sm text-warm-300 leading-relaxed">
                专业的宠物上门喂养服务平台，让您的爱宠在熟悉的环境中得到悉心照料。
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">服务项目</h4>
              <ul className="space-y-2 text-sm text-warm-300">
                <li className="hover:text-primary-300 cursor-pointer transition-colors">上门喂食</li>
                <li className="hover:text-primary-300 cursor-pointer transition-colors">遛狗陪玩</li>
                <li className="hover:text-primary-300 cursor-pointer transition-colors">清理铲屎</li>
                <li className="hover:text-primary-300 cursor-pointer transition-colors">拍照回传</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">关于我们</h4>
              <ul className="space-y-2 text-sm text-warm-300">
                <li className="hover:text-primary-300 cursor-pointer transition-colors">平台介绍</li>
                <li className="hover:text-primary-300 cursor-pointer transition-colors">加入我们</li>
                <li className="hover:text-primary-300 cursor-pointer transition-colors">联系客服</li>
                <li className="hover:text-primary-300 cursor-pointer transition-colors">帮助中心</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">联系方式</h4>
              <ul className="space-y-2 text-sm text-warm-300">
                <li>客服热线：400-888-8888</li>
                <li>服务时间：7:00 - 22:00</li>
                <li>邮箱：service@chongxin.com</li>
                <li>地址：北京市朝阳区宠物大厦</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-warm-600 mt-8 pt-6 text-center text-sm text-warm-400">
            <p>© 2026 宠心守护 版权所有 | 京ICP备12345678号</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
