import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './styles.css';
import Landing from './components/Landing';
import ServiceList from './components/ServiceList';
import ServiceDetail from './components/ServiceDetail';
import BookingCalendar from './components/BookingCalendar';
import BookingForm from './components/BookingForm';
import Success from './components/Success';
import MyAppointments from './components/MyAppointments';
import Login from './components/admin/Login';
import AdminLayout from './components/admin/AdminLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/services" element={<ServiceList />} />
      <Route path="/service/:id" element={<ServiceDetail />} />
      <Route path="/booking/:serviceId" element={<BookingCalendar />} />
      <Route path="/booking/confirm" element={<BookingForm />} />
      <Route path="/success" element={<Success />} />
      <Route path="/my" element={<MyAppointments />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/*" element={<AdminLayout />} />
    </Routes>
  );
}

export default App;