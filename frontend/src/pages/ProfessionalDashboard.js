import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const ProfessionalDashboard = () => {
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

  const updateStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status updated successfully');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openGoogleMaps = (address) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
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
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        </div>
      </div>

      <div className="p-4 pb-24">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-slate-600">No orders assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                data-testid={`professional-booking-${booking.id}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{booking.product?.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {booking.user?.name} • {booking.user?.email}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(booking.status)} capitalize`}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                      <p className="text-slate-700">{booking.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      onClick={() => openGoogleMaps(booking.address)}
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full"
                      data-testid="open-maps-btn"
                    >
                      <Navigation size={16} className="mr-2" />
                      Open Maps
                    </Button>
                  </div>

                  {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <Button
                          onClick={() => updateStatus(booking.id, 'accepted')}
                          className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
                          data-testid="accept-btn"
                        >
                          Accept
                        </Button>
                      )}
                      {booking.status === 'accepted' && (
                        <Button
                          onClick={() => updateStatus(booking.id, 'on_the_way')}
                          className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700"
                          data-testid="on-the-way-btn"
                        >
                          On the Way
                        </Button>
                      )}
                      {booking.status === 'on_the_way' && (
                        <Button
                          onClick={() => updateStatus(booking.id, 'completed')}
                          className="flex-1 rounded-full bg-sky-600 hover:bg-sky-700"
                          data-testid="complete-btn"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100">
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

export default ProfessionalDashboard;
