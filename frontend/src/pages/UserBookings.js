import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, Clock, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      on_the_way: 'bg-blue-100 text-blue-800',
      completed: 'bg-slate-100 text-slate-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="pwa-container flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="pwa-container min-h-screen bg-slate-50">
      <div className="bg-white px-4 py-6 sticky top-0 z-10 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-sky-600"
            data-testid="back-btn"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
        </div>
      </div>

      <div className="p-4 pb-24">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Package size={64} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                data-testid={`booking-${booking.id}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{booking.product?.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{booking.product?.duration}</p>
                    </div>
                    <Badge className={`${getStatusColor(booking.status)} capitalize`}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-slate-600 mb-2">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <p className="line-clamp-2">{booking.address}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={16} />
                    <p>{new Date(booking.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-lg font-bold text-sky-600">
                      ₹{(booking.amount / 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBookings;
