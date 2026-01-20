import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Home, User, Calendar, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useRazorpay } from 'react-razorpay';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filter, setFilter] = useState('all');
  const [address, setAddress] = useState('');
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { Razorpay } = useRazorpay();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async (categoryId) => {
    try {
      const response = await axios.get(`${API_URL}/products?category_id=${categoryId}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    fetchProducts(category.id);
    setFilter('all');
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

  const handleAddressSubmit = async () => {
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
          address: address
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { razorpay_order_id, amount, key_id, booking_id } = response.data;

      const options = {
        key: key_id,
        amount: amount,
        currency: 'INR',
        order_id: razorpay_order_id,
        name: 'Intowns',
        description: selectedProduct.name,
        handler: async (paymentResponse) => {
          try {
            await axios.post(
              `${API_URL}/orders/verify`,
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                booking_id: booking_id
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Booking confirmed!');
            navigate('/booking-confirmation?booking_id=' + booking_id);
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

      const rzp = new Razorpay(options);
      rzp.open();
      
      setShowAddressDialog(false);
      setAddress('');
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pwa-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="app-title">Intowns</h1>
            <p className="text-sm text-slate-600">Home massage & spa services</p>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border-2 border-sky-500" />
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Categories</h2>
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="category-card relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md border border-slate-200/50 aspect-square flex flex-col justify-end p-4 cursor-pointer"
              data-testid={`category-${category.name.toLowerCase()}`}
            >
              <img
                src={category.image}
                alt={category.name}
                className="category-card-image"
              />
              <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-xl p-3">
                <h3 className="font-semibold text-slate-900">{category.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Sheet */}
      <Sheet open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-[2rem] p-0 overflow-hidden">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="text-2xl">{selectedCategory?.name}</SheetTitle>
            <SheetDescription>{selectedCategory?.description}</SheetDescription>
          </SheetHeader>

          {/* Filters */}
          <div className="px-6 py-4 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`filter-pill px-6 py-2 rounded-full whitespace-nowrap font-medium ${
                filter === 'all'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              data-testid="filter-all"
            >
              All
            </button>
            <button
              onClick={() => setFilter('products')}
              className={`filter-pill px-6 py-2 rounded-full whitespace-nowrap font-medium ${
                filter === 'products'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              data-testid="filter-products"
            >
              Products
            </button>
            <button
              onClick={() => setFilter('packages')}
              className={`filter-pill px-6 py-2 rounded-full whitespace-nowrap font-medium ${
                filter === 'packages'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              data-testid="filter-packages"
            >
              Packages
            </button>
          </div>

          {/* Products List */}
          <div className="px-6 pb-6 overflow-y-auto" style={{ height: 'calc(90vh - 200px)' }}>
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card flex gap-4 p-4 rounded-xl bg-white border border-slate-200/50 cursor-pointer"
                  onClick={() => handleProductSelect(product)}
                  data-testid={`product-${product.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{product.name}</h4>
                    {product.description && (
                      <p className="text-sm text-slate-600 mt-1">{product.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-lg font-bold text-sky-600">
                        ₹{(product.price / 100).toFixed(0)}
                      </span>
                      {product.duration && (
                        <span className="text-sm text-slate-500">{product.duration}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Service Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder="Enter your complete address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={4}
              data-testid="address-input"
            />
            <Button
              onClick={handleAddressSubmit}
              disabled={loading}
              className="w-full btn-primary rounded-full bg-sky-600 hover:bg-sky-700"
              data-testid="proceed-payment-btn"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 h-16 flex justify-around items-center z-50 max-w-md mx-auto">
        <button
          className="bottom-nav-item flex flex-col items-center gap-1 text-sky-600"
          data-testid="nav-home"
        >
          <Home size={24} />
          <span className="text-xs">Home</span>
        </button>
        <button
          onClick={() => navigate('/my-bookings')}
          className="bottom-nav-item flex flex-col items-center gap-1 text-slate-600 hover:text-sky-600"
          data-testid="nav-bookings"
        >
          <Calendar size={24} />
          <span className="text-xs">Bookings</span>
        </button>
        {user && (user.role === 'admin' || user.role === 'professional') && (
          <button
            onClick={() => navigate(user.role === 'admin' ? '/admin' : '/professional')}
            className="bottom-nav-item flex flex-col items-center gap-1 text-slate-600 hover:text-sky-600"
            data-testid="nav-dashboard"
          >
            <Settings size={24} />
            <span className="text-xs">Dashboard</span>
          </button>
        )}
        {user && (
          <button
            className="bottom-nav-item flex flex-col items-center gap-1 text-slate-600 hover:text-sky-600"
            data-testid="nav-profile"
          >
            <User size={24} />
            <span className="text-xs">Profile</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default HomePage;
