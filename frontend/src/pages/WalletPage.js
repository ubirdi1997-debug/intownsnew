import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Wallet as WalletIcon, Plus, TrendingUp, Gift, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRazorpay } from 'react-razorpay';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const WalletPage = () => {
  const [walletData, setWalletData] = useState(null);
  const [offers, setOffers] = useState([]);
  const [showTopupDialog, setShowTopupDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { Razorpay } = useRazorpay();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchWalletData();
    fetchOffers();
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletData(response.data);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      toast.error('Failed to load wallet data');
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await axios.get(`${API_URL}/wallet/offers`);
      setOffers(response.data);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    }
  };

  const handleTopup = async (offer) => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/wallet/topup`,
        { offer_id: offer.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { razorpay_order_id, amount, key_id, cashback, offer_id } = response.data;

      const options = {
        key: key_id,
        amount: amount,
        currency: 'INR',
        order_id: razorpay_order_id,
        name: 'Intowns Wallet Topup',
        description: `Add ₹${amount / 100} + ₹${cashback / 100} cashback`,
        handler: async function (razorpayResponse) {
          try {
            await axios.post(
              `${API_URL}/wallet/topup/verify`,
              {
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                offer_id: offer_id
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(`₹${(amount + cashback) / 100} added to wallet!`);
            setShowTopupDialog(false);
            fetchWalletData();
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#0284c7'
        }
      };

      const razorpayInstance = new Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error('Topup failed:', error);
      toast.error('Failed to initiate topup');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'credit':
      case 'topup':
      case 'cashback':
      case 'welcome_bonus':
      case 'review_reward':
        return <ArrowDownRight className="w-5 h-5 text-green-600" />;
      case 'debit':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      default:
        return <WalletIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    return ['credit', 'topup', 'cashback', 'welcome_bonus', 'review_reward'].includes(type)
      ? 'text-green-600'
      : 'text-red-600';
  };

  if (!walletData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Balance Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-sky-600 to-blue-600 text-white border-0 shadow-xl">
            <CardHeader>
              <CardDescription className="text-sky-100">Available Balance</CardDescription>
              <CardTitle className="text-4xl font-bold">
                ₹{(walletData.balance / 100).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowTopupDialog(true)}
                className="bg-white text-sky-600 hover:bg-sky-50 w-full"
                data-testid="topup-wallet-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Money
              </Button>
            </CardContent>
          </Card>

          {walletData.locked_balance > 0 && (
            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
              <CardHeader>
                <CardDescription className="text-amber-100">Welcome Bonus</CardDescription>
                <CardTitle className="text-4xl font-bold">
                  ₹{(walletData.locked_balance / 100).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-100">
                  Usable on orders ≥ ₹200 (max ₹200 deduction)
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Topup Offers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-600" />
              Wallet Topup Offers
            </CardTitle>
            <CardDescription>Get instant cashback on topup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {offers.map((offer) => {
                const cashback = Math.min(
                  Math.floor((offer.amount * offer.cashback_percentage) / 100),
                  offer.max_cashback
                );
                return (
                  <button
                    key={offer.id}
                    onClick={() => handleTopup(offer)}
                    disabled={loading}
                    className="p-4 border-2 border-sky-200 rounded-xl hover:border-sky-400 hover:bg-sky-50 transition-all text-left group"
                    data-testid={`topup-offer-${offer.amount / 100}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{offer.amount / 100}
                        </p>
                        <p className="text-sm text-gray-600">Topup Amount</p>
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        +{offer.cashback_percentage}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                      <Gift className="w-4 h-4" />
                      <span>Get ₹{cashback / 100} Cashback</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Total: ₹{(offer.amount + cashback) / 100}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {walletData.transactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No transactions yet</p>
              ) : (
                walletData.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                        {transaction.amount >= 0 ? '+' : ''}₹{Math.abs(transaction.amount) / 100}
                      </p>
                      <p className="text-xs text-gray-500">
                        Bal: ₹{transaction.balance_after / 100}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Custom Topup Dialog */}
      <Dialog open={showTopupDialog} onOpenChange={setShowTopupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Money to Wallet</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select a topup offer to get instant cashback
            </p>

            <div className="grid grid-cols-2 gap-3">
              {offers.slice(0, 4).map((offer) => {
                const cashback = Math.min(
                  Math.floor((offer.amount * offer.cashback_percentage) / 100),
                  offer.max_cashback
                );
                return (
                  <button
                    key={offer.id}
                    onClick={() => handleTopup(offer)}
                    disabled={loading}
                    className="p-3 border-2 border-gray-200 rounded-xl hover:border-sky-400 hover:bg-sky-50 transition-all"
                  >
                    <p className="text-xl font-bold">₹{offer.amount / 100}</p>
                    <p className="text-xs text-green-600 font-semibold">
                      +₹{cashback / 100} CB
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletPage;
