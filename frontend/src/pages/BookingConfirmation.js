import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home, Calendar } from 'lucide-react';

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingId = location.state?.booking_id;

  useEffect(() => {
    if (!bookingId) {
      navigate('/');
    }
  }, [bookingId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-gray-600">
              Your booking has been successfully confirmed.
            </p>
            <p className="text-sm text-gray-500">
              Booking ID: <span className="font-mono font-semibold">{bookingId?.slice(0, 8)}</span>
            </p>
          </div>

          <div className="bg-sky-50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-semibold text-sky-900">What's Next?</p>
            <ul className="text-sm text-sky-800 space-y-1 text-left">
              <li>• Our professional will contact you shortly</li>
              <li>• Track your booking in "My Bookings"</li>
              <li>• Service will be delivered at your address</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="flex-1"
              data-testid="go-home-btn"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button 
              onClick={() => navigate('/my-bookings')} 
              className="flex-1"
              data-testid="view-bookings-btn"
            >
              <Calendar className="w-4 h-4 mr-2" />
              My Bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingConfirmation;
