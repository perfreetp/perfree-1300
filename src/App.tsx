import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout/Layout';
import Home from '@/pages/Home';
import PetProfile from '@/pages/PetProfile';
import FeedingPlan from '@/pages/FeedingPlan';
import ServiceBooking from '@/pages/ServiceBooking';
import OrderPayment from '@/pages/OrderPayment';
import FeedingRecord from '@/pages/FeedingRecord';
import Notification from '@/pages/Notification';
import ReviewAftersales from '@/pages/ReviewAftersales';
import FeederDashboard from '@/pages/FeederDashboard';
import AdminDashboard from '@/pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/pets" element={<PetProfile />} />
            <Route path="/plans" element={<FeedingPlan />} />
            <Route path="/booking" element={<ServiceBooking />} />
            <Route path="/order/:id" element={<OrderPayment />} />
            <Route path="/records" element={<FeedingRecord />} />
            <Route path="/notifications" element={<Notification />} />
            <Route path="/reviews" element={<ReviewAftersales />} />
            <Route path="/feeder-dashboard" element={<FeederDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </Router>
  );
}
