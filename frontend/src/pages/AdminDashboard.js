import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Package, Users, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', image: '', description: '' });
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    duration: '',
    category_id: '',
    type: 'product',
    image: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [statsRes, bookingsRes, categoriesRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers }),
        axios.get(`${API_URL}/bookings`, { headers }),
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/products`)
      ]);

      setStats(statsRes.data);
      setBookings(bookingsRes.data);
      setCategories(categoriesRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/categories`, newCategory, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category created successfully');
      setShowCategoryDialog(false);
      setNewCategory({ name: '', image: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleCreateProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/products`,
        { ...newProduct, price: parseInt(newProduct.price) * 100 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Product created successfully');
      setShowProductDialog(false);
      setNewProduct({
        name: '',
        price: '',
        duration: '',
        category_id: '',
        type: 'product',
        image: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to create product');
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
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        </div>
      </div>

      <div className="p-4 pb-24">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <Package size={24} className="text-sky-600 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.total_bookings}</p>
              <p className="text-xs text-slate-600">Total Bookings</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <Users size={24} className="text-green-600 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.total_users}</p>
              <p className="text-xs text-slate-600">Total Users</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <DollarSign size={24} className="text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-slate-900">
                ₹{(stats.total_revenue / 100).toFixed(0)}
              </p>
              <p className="text-xs text-slate-600">Revenue</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <TabsList className="w-full">
            <TabsTrigger value="bookings" className="flex-1" data-testid="tab-bookings">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1" data-testid="tab-categories">
              Categories
            </TabsTrigger>
            <TabsTrigger value="products" className="flex-1" data-testid="tab-products">
              Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="p-4">
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-slate-200 rounded-xl p-3"
                  data-testid={`admin-booking-${booking.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">{booking.product?.name}</p>
                      <p className="text-sm text-slate-600">{booking.user?.name}</p>
                    </div>
                    <Badge className={`${getStatusColor(booking.status)} capitalize text-xs`}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-1">{booking.address}</p>
                  <p className="text-sm font-bold text-sky-600 mt-2">
                    ₹{(booking.amount / 100).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="p-4">
            <Button
              onClick={() => setShowCategoryDialog(true)}
              className="w-full mb-4 rounded-full bg-sky-600 hover:bg-sky-700"
              data-testid="add-category-btn"
            >
              Add Category
            </Button>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="border border-slate-200 rounded-xl p-3">
                  <p className="font-semibold text-slate-900">{category.name}</p>
                  <p className="text-sm text-slate-600">{category.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="products" className="p-4">
            <Button
              onClick={() => setShowProductDialog(true)}
              className="w-full mb-4 rounded-full bg-sky-600 hover:bg-sky-700"
              data-testid="add-product-btn"
            >
              Add Product
            </Button>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div key={product.id} className="border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-600">{product.duration}</p>
                    </div>
                    <p className="font-bold text-sky-600">
                      ₹{(product.price / 100).toFixed(0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Category Name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
            <Input
              placeholder="Image URL"
              value={newCategory.image}
              onChange={(e) => setNewCategory({ ...newCategory, image: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
            <Button onClick={handleCreateCategory} className="w-full">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Price (in Rupees)"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <Input
              placeholder="Duration (e.g., 60 min)"
              value={newProduct.duration}
              onChange={(e) => setNewProduct({ ...newProduct, duration: e.target.value })}
            />
            <select
              value={newProduct.category_id}
              onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={newProduct.type}
              onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="product">Product</option>
              <option value="package">Package</option>
            </select>
            <Input
              placeholder="Image URL"
              value={newProduct.image}
              onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
            />
            <Button onClick={handleCreateProduct} className="w-full">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
