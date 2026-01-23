import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const WhatsAppButton = ({ phoneNumber = '+919115535739' }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Show prompt for non-logged-in users after 2 minutes
    if (!user) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 120000); // 2 minutes

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClick = () => {
    const message = user 
      ? `Hi, I need help with my booking.`
      : `Hi, I'd like to know more about your services.`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`, '_blank');
    setShowPrompt(false);
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        aria-label="Contact on WhatsApp"
        data-testid="whatsapp-button"
      >
        <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
      </button>

      {/* Prompt for non-logged users */}
      {showPrompt && !user && (
        <div className="fixed bottom-24 right-6 z-40 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">Need help?</p>
              <p className="text-sm text-gray-600 mb-3">
                Chat with us on WhatsApp for instant support!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClick}
                  className="text-sm bg-green-500 text-white px-4 py-1 rounded-full hover:bg-green-600 transition-colors"
                >
                  Chat Now
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Maybe Later
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WhatsAppButton;
