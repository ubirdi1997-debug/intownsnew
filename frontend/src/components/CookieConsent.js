import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, X } from 'lucide-react';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show after 2 seconds
      setTimeout(() => {
        setShowConsent(true);
      }, 2000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowConsent(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <Card className="max-w-4xl mx-auto shadow-2xl border-2 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Cookie className="w-6 h-6 text-sky-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">We use cookies</h3>
              <p className="text-sm text-gray-600 mb-4">
                We use cookies and similar technologies to help personalize content, tailor and measure ads, 
                and provide a better experience. By clicking accept, you agree to this, as outlined in our Cookie Policy.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleAccept}
                  size="sm"
                  data-testid="accept-cookies-btn"
                >
                  Accept All
                </Button>
                <Button 
                  onClick={handleDecline}
                  size="sm"
                  variant="outline"
                >
                  Decline
                </Button>
                <a 
                  href="/privacy-policy" 
                  className="text-sm text-sky-600 hover:text-sky-700 flex items-center"
                >
                  Learn More
                </a>
              </div>
            </div>
            <button
              onClick={handleDecline}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsent;
