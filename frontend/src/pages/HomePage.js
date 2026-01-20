import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Home, User, Calendar, Wallet, Menu, Sparkles, Clock, MapPin, Star, Shield, Heart, Zap, Mail, Phone, Facebook, Instagram, Twitter } from 'lucide-react';
import { toast } from 'sonner';
import { useRazorpay } from 'react-razorpay';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import WhatsAppButton from '../components/WhatsAppButton';
import CookieConsent from '../components/CookieConsent';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const HomePage = () => {
  const [searchParams] = useSearchParams();
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // Address form
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Coupon & Wallet
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [useWallet, setUseWallet] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const { Razorpay } = useRazorpay();

  useEffect(() => {
    // Handle OAuth redirect token
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, '', '/');
      window.location.reload();
    }
    
    fetchMainCategories();
    if (user) {
      fetchWalletInfo();
    }
  }, [user]);

  const fetchMainCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories?level=1`);
      setMainCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch main categories:', error);
    }
  };

  const fetchSubCategories = async (parentId) => {
    try {
      const response = await axios.get(`${API_URL}/categories?parent_id=${parentId}`);
      setSubCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch sub-categories:', error);
    }
  };

  const fetchProducts = async (subCategoryId) => {
    try {
      const response = await axios.get(`${API_URL}/products?sub_category_id=${subCategoryId}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchWalletInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
    }
  };

  const searchAddress = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/address/search?query=${encodeURIComponent(query)}`);
      setAddressSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to search address:', error);
    }
  };

  const handleAddressChange = (value) => {
    setAddress(value);
    searchAddress(value);
  };

  const selectAddress = (suggestion) => {
    setAddress(suggestion.description);
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  const handleMainCategoryClick = (category) => {
    setSelectedMainCategory(category);
    setSelectedSubCategory(null);
    setProducts([]);
    fetchSubCategories(category.id);
  };

  const handleSubCategoryClick = (subCategory) => {
    setSelectedSubCategory(subCategory);
    fetchProducts(subCategory.id);
    setFilter('all');
  };

  const handleBackFromSubCategory = () => {
    setSelectedSubCategory(null);
    setProducts([]);
  };

  const handleBackFromProducts = () => {
    setSelectedSubCategory(null);
    setProducts([]);
  };

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'packages') return p.type === 'package';
    if (filter === 'products') return p.type === 'product';
    return true;
  });

  const handleProductSelect = (product) => {
    if (!user) {
      toast.error('Please login to book');
      login();
      return;
    }
    setSelectedProduct(product);
    setShowAddressDialog(true);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/coupons/validate`,
        {
          code: couponCode,
          cart_value: selectedProduct.price
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAppliedCoupon(response.data);
      toast.success(`Coupon applied! Discount: ₹${response.data.discount_amount / 100}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const handleBooking = async () => {
    if (!address.trim()) {
      toast.error('Please enter your address');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/orders/create`,
        {
          product_id: selectedProduct.id,
          address: address,
          landmark: landmark,
          pincode: pincode,
          coupon_code: appliedCoupon ? couponCode : null,
          use_wallet: useWallet
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { razorpay_order_id, amount, key_id, booking_id } = response.data;

      // If amount is 0 (fully paid by wallet), directly confirm
      if (amount === 0) {
        navigate('/booking-confirmation', { state: { booking_id } });
        return;
      }

      // Initialize Razorpay
      const options = {
        key: key_id,
        amount: amount,
        currency: 'INR',
        order_id: razorpay_order_id,
        name: 'Intowns',
        description: selectedProduct.name,
        handler: async function (response) {
          try {
            await axios.post(
              `${API_URL}/orders/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: booking_id
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            navigate('/booking-confirmation', { state: { booking_id } });
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
      console.error('Booking failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    let total = selectedProduct?.price || 0;
    let discount = 0;
    let walletDeduction = 0;

    if (appliedCoupon) {
      discount = appliedCoupon.discount_amount;
      total -= discount;
    }

    if (useWallet && walletInfo) {
      const availableWallet = walletInfo.balance;
      const lockedWallet = walletInfo.locked_balance;

      // Check if we can use locked balance
      if (lockedWallet > 0 && selectedProduct.price >= 20000) {
        walletDeduction += Math.min(lockedWallet, 20000, total);
        total -= Math.min(lockedWallet, 20000, total);
      }

      // Use regular wallet
      if (availableWallet > 0 && total > 0) {
        const regularUse = Math.min(availableWallet, total);
        walletDeduction += regularUse;
        total -= regularUse;
      }
    }

    return {
      subtotal: selectedProduct?.price || 0,
      discount,
      walletDeduction,
      total: Math.max(total, 0)
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-sky-600" />
            <h1 className="text-2xl font-bold text-gray-900">intowns.in</h1>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/wallet')}
                className="flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden md:inline">₹{((walletInfo?.balance || 0) / 100).toFixed(0)}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/my-bookings')}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden md:inline">My Bookings</span>
              </Button>
              <div className="flex items-center gap-2">
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                <span className="hidden md:inline text-sm font-medium">{user.name.split(' ')[0]}</span>
              </div>
              {user.role === 'admin' && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  Admin
                </Button>
              )}
              {['professional', 'admin'].includes(user.role) && (
                <Button variant="outline" size="sm" onClick={() => navigate('/professional')}>
                  Professional
                </Button>
              )}
            </div>
          ) : (
            <Button onClick={login} className="rounded-full">
              Login with Google
            </Button>
          )}
        </div>
      </header>

      {/* Desktop Hero Section - Only for non-selected category */}
      {!selectedMainCategory && (
        <div className="hidden md:block relative overflow-hidden bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-96 h-96 bg-white/10 rounded-full -top-20 -left-20 animate-pulse"></div>
            <div className="absolute w-72 h-72 bg-white/5 rounded-full top-40 right-20 animate-pulse delay-1000"></div>
            <div className="absolute w-48 h-48 bg-white/10 rounded-full bottom-20 left-1/2 animate-pulse delay-500"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-fade-in">
                <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  ✨ Premium Wellness Services
                </div>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  Professional Spa & Massage
                  <span className="block text-sky-200">At Your Doorstep</span>
                </h1>
                <p className="text-xl text-sky-100">
                  Experience luxury spa treatments in the comfort of your home. 
                  Expert therapists, premium products, guaranteed satisfaction.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    size="lg" 
                    className="bg-white text-sky-600 hover:bg-sky-50 rounded-full px-8"
                    onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Book Now
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10 rounded-full px-8"
                  >
                    Learn More
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8">
                  <div>
                    <p className="text-3xl font-bold">500+</p>
                    <p className="text-sky-200 text-sm">Happy Customers</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">50+</p>
                    <p className="text-sky-200 text-sm">Services</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">4.9★</p>
                    <p className="text-sky-200 text-sm">Average Rating</p>
                  </div>
                </div>
              </div>

              <div className="relative hidden lg:block animate-slide-in">
                <div className="relative z-10">
                  <img 
                    src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=800&fit=crop" 
                    alt="Spa"
                    className="rounded-3xl shadow-2xl"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-white/20 backdrop-blur-lg rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">4.9/5</p>
                      <p className="text-sm text-sky-100">Rating</p>
                    </div>
                  </div>
                  <p className="text-sm">Trusted by 500+ customers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(248 250 252)"/>
            </svg>
          </div>
        </div>
      )}

      {/* Features Section - Desktop Only */}
      {!selectedMainCategory && (
        <div className="hidden md:block py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Intowns?</h2>
              <p className="text-gray-600">Experience the difference with our premium services</p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-sky-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">100% Safe</h3>
                <p className="text-sm text-gray-600">Verified professionals with background checks</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8 text-sky-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Premium Quality</h3>
                <p className="text-sm text-gray-600">Top-grade products and expert therapists</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-sky-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Booking</h3>
                <p className="text-sm text-gray-600">Book in minutes, service at your time</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Star className="w-8 h-8 text-sky-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Best Rated</h3>
                <p className="text-sm text-gray-600">4.9/5 rating from 500+ customers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8" id="categories">
        {/* Step 1: Main Categories (4 Tiles) */}
        {!selectedMainCategory && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Home Spa & Massage
              </h2>
              <p className="text-lg text-gray-600">
                Professional wellness services at your doorstep
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12">
              {mainCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleMainCategoryClick(category)}
                  className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                  data-testid={`main-category-${category.name.toLowerCase()}`}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-1">{category.name}</h3>
                    <p className="text-sm opacity-90">{category.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Sub-Categories (Tiles) */}
        {selectedMainCategory && !selectedSubCategory && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setSelectedMainCategory(null)}>
                ← Back
              </Button>
              <h2 className="text-3xl font-bold text-gray-900">
                {selectedMainCategory.name}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subCategories.map((subCat) => (
                <button
                  key={subCat.id}
                  onClick={() => handleSubCategoryClick(subCat)}
                  className="group relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  data-testid={`sub-category-${subCat.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <img
                    src={subCat.image}
                    alt={subCat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-semibold">{subCat.name}</h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Product List */}
        {selectedSubCategory && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBackFromProducts}>
                ← Back
              </Button>
              <h2 className="text-3xl font-bold text-gray-900">
                {selectedSubCategory.name}
              </h2>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="rounded-full whitespace-nowrap"
                data-testid="filter-all"
              >
                All
              </Button>
              <Button
                variant={filter === 'products' ? 'default' : 'outline'}
                onClick={() => setFilter('products')}
                className="rounded-full whitespace-nowrap"
                data-testid="filter-products"
              >
                Products
              </Button>
              <Button
                variant={filter === 'packages' ? 'default' : 'outline'}
                onClick={() => setFilter('packages')}
                className="rounded-full whitespace-nowrap"
                data-testid="filter-packages"
              >
                Packages
              </Button>
            </div>

            {/* Product List */}
            <div className="grid gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="flex gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-sky-300 hover:shadow-lg transition-all duration-200 text-left"
                  data-testid={`product-${product.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {product.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {product.duration}
                        </span>
                      )}
                      <span className="text-lg font-bold text-sky-600">
                        ₹{(product.price / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{selectedProduct?.name}</h3>
              <p className="text-2xl font-bold text-sky-600">
                ₹{((selectedProduct?.price || 0) / 100).toFixed(0)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address *</label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your complete address"
                rows={3}
                data-testid="address-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Landmark</label>
                <Input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Optional"
                  data-testid="landmark-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pincode</label>
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Optional"
                  data-testid="pincode-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Coupon Code</label>
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  data-testid="coupon-input"
                />
                <Button onClick={validateCoupon} variant="outline" data-testid="apply-coupon-btn">
                  Apply
                </Button>
              </div>
              {appliedCoupon && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Discount: ₹{(appliedCoupon.discount_amount / 100).toFixed(0)}
                </p>
              )}
            </div>

            {walletInfo && (walletInfo.balance > 0 || walletInfo.locked_balance > 0) && (
              <div className="flex items-center gap-2 p-3 bg-sky-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="w-4 h-4"
                  data-testid="use-wallet-checkbox"
                />
                <label className="text-sm">
                  Use Wallet Balance: ₹{((walletInfo.balance + walletInfo.locked_balance) / 100).toFixed(0)}
                  {walletInfo.locked_balance > 0 && (
                    <span className="text-xs text-gray-500">
                      {' '}(including ₹{(walletInfo.locked_balance / 100).toFixed(0)} bonus)
                    </span>
                  )}
                </label>
              </div>
            )}

            {walletInfo && walletInfo.locked_balance > 0 && selectedProduct && selectedProduct.price < 20000 && useWallet && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                Add ₹{((20000 - selectedProduct.price) / 100).toFixed(0)} more to use your welcome bonus
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{(calculateTotal().subtotal / 100).toFixed(0)}</span>
              </div>
              {calculateTotal().discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{(calculateTotal().discount / 100).toFixed(0)}</span>
                </div>
              )}
              {calculateTotal().walletDeduction > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Wallet Used</span>
                  <span>-₹{(calculateTotal().walletDeduction / 100).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>₹{(calculateTotal().total / 100).toFixed(0)}</span>
              </div>
            </div>

            <Button
              onClick={handleBooking}
              disabled={loading}
              className="w-full rounded-full"
              size="lg"
              data-testid="confirm-booking-btn"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop Footer */}
      {!selectedMainCategory && (
        <footer className="hidden md:block bg-gray-900 text-white mt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-8 h-8 text-sky-400" />
                  <h3 className="text-xl font-bold">intowns.in</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Premium home spa and massage services across India. Experience luxury wellness at your doorstep.
                </p>
                <div className="flex gap-3">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Services</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">Massage Therapy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Spa Treatments</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Wellness Packages</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Therapy Sessions</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Gift Vouchers</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Contact Us</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href="mailto:admin@intowns.in" className="hover:text-white transition-colors">admin@intowns.in</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href="tel:+919115503663" className="hover:text-white transition-colors">+91 91155 03663</a>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>India</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
              <p>© 2025 Intowns.in. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* PWA & Components */}
      <PWAInstallPrompt />
      <WhatsAppButton />
      <CookieConsent />
    </div>
  );
};

export default HomePage;
