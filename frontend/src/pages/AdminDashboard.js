import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Users, 
  Package, 
  TrendingUp, 
  Wallet,
  Ticket,
  Mail,
  Settings,
  FileText,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [walletOffers, setWalletOffers] = useState([]);
  const [walletConfig, setWalletConfig] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);
  const [siteConfig, setSiteConfig] = useState({});
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Form states
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'flat',
    discount_value: '',
    min_cart_value: '',
    max_discount: '',
    expiry_date: '',
    usage_limit: ''
  });

  const [offerForm, setOfferForm] = useState({
    amount: '',
    cashback_percentage: '',
    max_cashback: ''
  });

  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    published: false
  });

  const [emailForm, setEmailForm] = useState({
    to_emails: '',
    subject: '',
    message: ''
  });

  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showBlogDialog, setShowBlogDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, couponsRes, offersRes, configRes, blogsRes, usersRes, productsRes, categoriesRes, bookingsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers }),
        axios.get(`${API_URL}/coupons`, { headers }),
        axios.get(`${API_URL}/wallet/offers`),
        axios.get(`${API_URL}/wallet/config`, { headers }),
        axios.get(`${API_URL}/blog?published_only=false`, { headers }),
        axios.get(`${API_URL}/admin/users`, { headers }),
        axios.get(`${API_URL}/admin/products`, { headers }),
        axios.get(`${API_URL}/admin/categories`, { headers }),
        axios.get(`${API_URL}/admin/bookings`, { headers })
      ]);

      setStats(statsRes.data);
      setCoupons(couponsRes.data);
      setWalletOffers(offersRes.data);
      setWalletConfig(configRes.data);
      setBlogPosts(blogsRes.data);
      setUsers(usersRes.data.users || usersRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setBookings(bookingsRes.data.bookings || bookingsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const createCoupon = async () => {
    if (!couponForm.code || !couponForm.discount_value) {
      toast.error('Please fill required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = {
        ...couponForm,
        discount_value: parseInt(couponForm.discount_value) * (couponForm.discount_type === 'flat' ? 100 : 1),
        min_cart_value: parseInt(couponForm.min_cart_value || 0) * 100,
        max_discount: couponForm.max_discount ? parseInt(couponForm.max_discount) * 100 : null,
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
        expiry_date: couponForm.expiry_date || null
      };

      await axios.post(`${API_URL}/coupons`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Coupon created successfully');
      setShowCouponDialog(false);
      setCouponForm({
        code: '',
        discount_type: 'flat',
        discount_value: '',
        min_cart_value: '',
        max_discount: '',
        expiry_date: '',
        usage_limit: ''
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create coupon:', error);
      toast.error(error.response?.data?.detail || 'Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  const toggleCoupon = async (couponId, active) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/coupons/${couponId}?active=${!active}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Coupon ${!active ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update coupon');
    }
  };

  const deleteCoupon = async (couponId) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Coupon deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const createWalletOffer = async () => {
    if (!offerForm.amount || !offerForm.cashback_percentage || !offerForm.max_cashback) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = {
        amount: parseInt(offerForm.amount) * 100,
        cashback_percentage: parseInt(offerForm.cashback_percentage),
        max_cashback: parseInt(offerForm.max_cashback) * 100
      };

      await axios.post(`${API_URL}/wallet/offers`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Wallet offer created');
      setShowOfferDialog(false);
      setOfferForm({ amount: '', cashback_percentage: '', max_cashback: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const updateWalletConfig = async () => {
    if (!walletConfig) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/wallet/config`, walletConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Wallet config updated');
    } catch (error) {
      toast.error('Failed to update config');
    } finally {
      setLoading(false);
    }
  };

  const createBlogPost = async () => {
    if (!blogForm.title || !blogForm.slug || !blogForm.content) {
      toast.error('Please fill required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/blog`, blogForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Blog post created');
      setShowBlogDialog(false);
      setBlogForm({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featured_image: '',
        meta_title: '',
        meta_description: '',
        published: false
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create blog post');
    } finally {
      setLoading(false);
    }
  };

  const updateSiteConfig = async (key, value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/config`,
        { key, value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Config updated');
      setSiteConfig({ ...siteConfig, [key]: value });
    } catch (error) {
      toast.error('Failed to update config');
    }
  };

  if (!stats) {
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Manage your platform</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Package className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_bookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.total_revenue / 100).toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.total_wallet_balance / 100).toFixed(0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="coupons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="mail">Mailing</TabsTrigger>
          </TabsList>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Coupons</h2>
              <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="create-coupon-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Coupon
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Coupon</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Coupon Code *</Label>
                      <Input
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                        placeholder="SAVE100"
                        data-testid="coupon-code-input"
                      />
                    </div>

                    <div>
                      <Label>Discount Type *</Label>
                      <select
                        value={couponForm.discount_type}
                        onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="flat">Flat (₹)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Discount Value *</Label>
                        <Input
                          type="number"
                          value={couponForm.discount_value}
                          onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                          placeholder={couponForm.discount_type === 'flat' ? '100' : '10'}
                        />
                      </div>
                      <div>
                        <Label>Min Cart (₹)</Label>
                        <Input
                          type="number"
                          value={couponForm.min_cart_value}
                          onChange={(e) => setCouponForm({ ...couponForm, min_cart_value: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Max Discount (₹)</Label>
                        <Input
                          type="number"
                          value={couponForm.max_discount}
                          onChange={(e) => setCouponForm({ ...couponForm, max_discount: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <Label>Usage Limit</Label>
                        <Input
                          type="number"
                          value={couponForm.usage_limit}
                          onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Expiry Date</Label>
                      <Input
                        type="datetime-local"
                        value={couponForm.expiry_date}
                        onChange={(e) => setCouponForm({ ...couponForm, expiry_date: e.target.value })}
                      />
                    </div>

                    <Button onClick={createCoupon} disabled={loading} className="w-full">
                      {loading ? 'Creating...' : 'Create Coupon'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {coupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl font-bold text-sky-600">{coupon.code}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            coupon.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {coupon.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            {coupon.discount_type === 'flat' 
                              ? `₹${coupon.discount_value / 100} off`
                              : `${coupon.discount_value}% off`}
                            {coupon.min_cart_value > 0 && ` on orders above ₹${coupon.min_cart_value / 100}`}
                          </p>
                          {coupon.usage_limit && (
                            <p>Used: {coupon.used_count} / {coupon.usage_limit}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={coupon.active}
                          onCheckedChange={() => toggleCoupon(coupon.id, coupon.active)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCoupon(coupon.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Wallet Configuration</h2>
              {walletConfig && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Welcome Bonus Enabled</Label>
                      <Switch
                        checked={walletConfig.welcome_bonus_enabled}
                        onCheckedChange={(checked) => 
                          setWalletConfig({ ...walletConfig, welcome_bonus_enabled: checked })
                        }
                      />
                    </div>
                    <div>
                      <Label>Welcome Bonus Amount (₹)</Label>
                      <Input
                        type="number"
                        value={walletConfig.welcome_bonus_amount / 100}
                        onChange={(e) => 
                          setWalletConfig({ ...walletConfig, welcome_bonus_amount: parseInt(e.target.value) * 100 })
                        }
                      />
                    </div>
                    <div>
                      <Label>Minimum Cart Value (₹)</Label>
                      <Input
                        type="number"
                        value={walletConfig.welcome_bonus_min_cart / 100}
                        onChange={(e) => 
                          setWalletConfig({ ...walletConfig, welcome_bonus_min_cart: parseInt(e.target.value) * 100 })
                        }
                      />
                    </div>
                    <div>
                      <Label>Maximum Deduction (₹)</Label>
                      <Input
                        type="number"
                        value={walletConfig.welcome_bonus_max_deduction / 100}
                        onChange={(e) => 
                          setWalletConfig({ ...walletConfig, welcome_bonus_max_deduction: parseInt(e.target.value) * 100 })
                        }
                      />
                    </div>
                    <Button onClick={updateWalletConfig} disabled={loading}>
                      Save Configuration
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Wallet Offers</h2>
                <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Offer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Wallet Offer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Topup Amount (₹) *</Label>
                        <Input
                          type="number"
                          value={offerForm.amount}
                          onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })}
                          placeholder="500"
                        />
                      </div>
                      <div>
                        <Label>Cashback Percentage (%) *</Label>
                        <Input
                          type="number"
                          value={offerForm.cashback_percentage}
                          onChange={(e) => setOfferForm({ ...offerForm, cashback_percentage: e.target.value })}
                          placeholder="20"
                        />
                      </div>
                      <div>
                        <Label>Max Cashback (₹) *</Label>
                        <Input
                          type="number"
                          value={offerForm.max_cashback}
                          onChange={(e) => setOfferForm({ ...offerForm, max_cashback: e.target.value })}
                          placeholder="100"
                        />
                      </div>
                      <Button onClick={createWalletOffer} disabled={loading} className="w-full">
                        {loading ? 'Creating...' : 'Create Offer'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {walletOffers.map((offer) => (
                  <Card key={offer.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-2xl font-bold">₹{offer.amount / 100}</p>
                          <p className="text-green-600 font-semibold">
                            {offer.cashback_percentage}% Cashback
                          </p>
                          <p className="text-sm text-gray-600">
                            Max: ₹{offer.max_cashback / 100}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          offer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {offer.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Blog Posts</h2>
              <Dialog open={showBlogDialog} onOpenChange={setShowBlogDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Blog Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={blogForm.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                          setBlogForm({ ...blogForm, title, slug });
                        }}
                        placeholder="Post title"
                      />
                    </div>
                    <div>
                      <Label>Slug *</Label>
                      <Input
                        value={blogForm.slug}
                        onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                        placeholder="post-slug"
                      />
                    </div>
                    <div>
                      <Label>Content *</Label>
                      <Textarea
                        value={blogForm.content}
                        onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                        rows={10}
                        placeholder="Post content (supports HTML)"
                      />
                    </div>
                    <div>
                      <Label>Excerpt</Label>
                      <Textarea
                        value={blogForm.excerpt}
                        onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                        rows={3}
                        placeholder="Short excerpt"
                      />
                    </div>
                    <div>
                      <Label>Featured Image URL</Label>
                      <Input
                        value={blogForm.featured_image}
                        onChange={(e) => setBlogForm({ ...blogForm, featured_image: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Meta Title (SEO)</Label>
                      <Input
                        value={blogForm.meta_title}
                        onChange={(e) => setBlogForm({ ...blogForm, meta_title: e.target.value })}
                        placeholder="SEO title"
                      />
                    </div>
                    <div>
                      <Label>Meta Description (SEO)</Label>
                      <Textarea
                        value={blogForm.meta_description}
                        onChange={(e) => setBlogForm({ ...blogForm, meta_description: e.target.value })}
                        rows={2}
                        placeholder="SEO description"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={blogForm.published}
                        onCheckedChange={(checked) => setBlogForm({ ...blogForm, published: checked })}
                      />
                      <Label>Publish immediately</Label>
                    </div>
                    <Button onClick={createBlogPost} disabled={loading} className="w-full">
                      {loading ? 'Creating...' : 'Create Post'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {blogPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{post.title}</h3>
                        <p className="text-sm text-gray-600">/{post.slug}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        post.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-4">
            <h2 className="text-2xl font-bold">Site Configuration</h2>
            <Card>
              <CardHeader>
                <CardTitle>Razorpay Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Razorpay Key ID</Label>
                  <Input
                    placeholder="rzp_test_..."
                    onBlur={(e) => updateSiteConfig('razorpay_key_id', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Razorpay Key Secret</Label>
                  <Input
                    type="password"
                    placeholder="Secret key"
                    onBlur={(e) => updateSiteConfig('razorpay_key_secret', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Google Maps</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Google Maps API Key</Label>
                  <Input
                    placeholder="AIza..."
                    onBlur={(e) => updateSiteConfig('google_maps_api_key', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mailtrap (Email Service)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Mailtrap API Token</Label>
                  <Input
                    placeholder="Token"
                    onBlur={(e) => updateSiteConfig('mailtrap_api_token', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Sender Email</Label>
                  <Input
                    placeholder="admin@intowns.in"
                    onBlur={(e) => updateSiteConfig('mailtrap_sender_email', e.target.value)}
                  />
                </div>
                <p className="text-sm text-amber-600">
                  📝 Configure Mailtrap templates at mailtrap.io dashboard
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Site Logo URL</Label>
                  <Input
                    placeholder="https://..."
                    onBlur={(e) => updateSiteConfig('site_logo', e.target.value)}
                  />
                </div>
                <div>
                  <Label>WhatsApp Support Number</Label>
                  <Input
                    placeholder="+919115503663"
                    defaultValue="+919115503663"
                    onBlur={(e) => updateSiteConfig('whatsapp_number', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mailing Tab */}
          <TabsContent value="mail" className="space-y-4">
            <h2 className="text-2xl font-bold">Mailing System</h2>
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  Configure Mailtrap credentials in the Config tab first
                </p>
                <p className="text-sm text-gray-500">
                  Automated emails for welcome, orders, and notifications will be sent automatically
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
