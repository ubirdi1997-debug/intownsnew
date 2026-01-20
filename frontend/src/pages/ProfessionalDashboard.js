import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Package, 
  Play, 
  CheckCircle, 
  QrCode,
  ExternalLink,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';
const GOOGLE_REVIEW_URL = 'https://g.page/r/YOUR_GOOGLE_BUSINESS_ID/review'; // Replace with actual URL

const ProfessionalDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [timer, setTimer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !['professional', 'admin'].includes(user.role)) {
      navigate('/');
      return;
    }
    fetchBookings();
  }, [user]);

  useEffect(() => {
    let interval;
    if (timer) {
      interval = setInterval(() => {
        const start = new Date(timer.started_at);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000); // seconds
        setElapsedTime(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Booking ${status}`);
      
      if (status === 'in_progress') {
        const booking = bookings.find(b => b.id === bookingId);
        setTimer({ ...booking, started_at: new Date().toISOString() });
      }
      
      if (status === 'completed') {
        setTimer(null);
        setElapsedTime(0);
        const booking = bookings.find(b => b.id === bookingId);
        setSelectedBooking(booking);
        setShowQRDialog(true);
      }
      
      fetchBookings();
    } catch (error) {
      console.error('Failed to update booking:', error);
      toast.error('Failed to update booking status');
    } finally {
      setLoading(false);
    }
  };

  const confirmReview = async (bookingId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/bookings/${bookingId}/confirm-review`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('₹100 credited to customer wallet!');
      setShowQRDialog(false);
      fetchBookings();
    } catch (error) {
      console.error('Failed to confirm review:', error);
      toast.error(error.response?.data?.detail || 'Failed to confirm review');
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = (address) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      on_the_way: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const upcomingBookings = bookings.filter(b => 
    ['accepted', 'on_the_way', 'in_progress'].includes(b.status)
  );
  
  const completedBookings = bookings.filter(b => 
    b.status === 'completed'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Professional Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your bookings</p>
            </div>
          </div>
          
          {timer && (
            <div className="flex items-center gap-3 bg-orange-100 text-orange-800 px-4 py-2 rounded-full">
              <Clock className="w-5 h-5 animate-pulse" />
              <span className="font-mono text-lg font-bold">{formatTime(elapsedTime)}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Upcoming Bookings */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Upcoming Orders ({upcomingBookings.length})
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBookings.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-gray-500">
                  No upcoming orders
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{booking.product?.name}</CardTitle>
                        <CardDescription>
                          {new Date(booking.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{booking.user?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{booking.product?.duration}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span className="flex-1">{booking.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Package className="w-4 h-4" />
                        <span className="font-semibold text-sky-600">
                          ₹{booking.amount / 100}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <Button
                        onClick={() => openGoogleMaps(booking.address)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                        data-testid={`open-maps-${booking.id}`}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in Maps
                      </Button>

                      {booking.status === 'accepted' && (
                        <Button
                          onClick={() => updateBookingStatus(booking.id, 'on_the_way')}
                          disabled={loading}
                          className="w-full"
                          size="sm"
                          data-testid={`start-journey-${booking.id}`}
                        >
                          Start Journey
                        </Button>
                      )}

                      {booking.status === 'on_the_way' && (
                        <Button
                          onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                          disabled={loading}
                          className="w-full"
                          size="sm"
                          data-testid={`start-service-${booking.id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Service
                        </Button>
                      )}

                      {booking.status === 'in_progress' && (
                        <Button
                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                          disabled={loading}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="sm"
                          data-testid={`complete-service-${booking.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Completed Bookings */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Completed Orders ({completedBookings.length})
          </h2>
          
          <div className="space-y-3">
            {completedBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No completed orders yet
                </CardContent>
              </Card>
            ) : (
              completedBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(booking.status)}>
                          Completed
                        </Badge>
                        <div>
                          <p className="font-semibold">{booking.product?.name}</p>
                          <p className="text-sm text-gray-600">
                            {booking.user?.name} • {booking.product?.duration}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(booking.completed_at || booking.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-sky-600">
                          ₹{booking.amount / 100}
                        </p>
                        {booking.review_given && (
                          <Badge variant="outline" className="mt-1">
                            <Star className="w-3 h-3 mr-1" />
                            Review Given
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </main>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Google Review</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 text-center">
            <div className="p-6 bg-gray-100 rounded-xl">
              <QrCode className="w-32 h-32 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600">
                Show this QR code to the customer
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Or share the direct link:
              </p>
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium"
              >
                Open Review Page
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-700 mb-4">
                Has the customer given a Google review?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowQRDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Not Yet
                </Button>
                <Button
                  onClick={() => confirmReview(selectedBooking?.id)}
                  disabled={loading || selectedBooking?.review_given}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="confirm-review-btn"
                >
                  {selectedBooking?.review_given ? 'Already Confirmed' : 'Yes, Credit ₹100'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessionalDashboard;
