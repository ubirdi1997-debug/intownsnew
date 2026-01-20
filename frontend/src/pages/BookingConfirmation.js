import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, MapPin, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooking(response.data);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    }
  };

  if (!booking) {
    return (
      <div className="pwa-container flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="pwa-container min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="p-6">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-sky-600"
          data-testid="back-home-btn"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2" data-testid="confirmation-title">
            Booking Confirmed!
          </h1>
          <p className="text-slate-600 mb-8">
            Your booking has been successfully confirmed
          </p>

          <div className="bg-sky-50 rounded-xl p-6 mb-6 text-left">
            <h2 className="font-semibold text-slate-900 mb-4">Booking Details</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden">
                  <img
                    src={booking.product?.image}
                    alt={booking.product?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{booking.product?.name}</p>
                  <p className="text-sm text-slate-600">{booking.product?.duration}</p>
                  <p className="text-lg font-bold text-sky-600 mt-1">
                    ₹{(booking.amount / 100).toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-3 border-t border-slate-200">
                <MapPin size={20} className="text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Service Address</p>
                  <p className="text-sm text-slate-600">{booking.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                <Clock size={20} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Status</p>
                  <p className="text-sm text-sky-600 font-semibold capitalize">{booking.status}</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6">
            Our professional will arrive at your location soon. You'll receive updates on your booking status.
          </p>

          <Button
            onClick={() => navigate('/my-bookings')}
            className="w-full rounded-full bg-sky-600 hover:bg-sky-700"
            data-testid="view-bookings-btn"
          >
            View My Bookings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
