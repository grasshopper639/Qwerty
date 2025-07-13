import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

// Authentication Context
const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password
      });
      const { user, token: newToken } = response.data;
      setUser(user);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      await axios.post(`${API}/auth/register`, userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${API}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const LoginForm = ({ userType, onBack }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(formData.username, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const result = await register({
      username: registerData.username,
      email: registerData.email,
      password: registerData.password,
      name: registerData.name,
      phone: registerData.phone,
      role: userType === 'owner' ? 'restaurant_owner' : 'delivery_agent'
    });

    if (result.success) {
      setShowRegister(false);
      setError('');
      alert('Registration successful! Please login with your credentials.');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const roleTitle = userType === 'owner' ? 'Restaurant Owner' : 'Delivery Agent';
  const roleIcon = userType === 'owner' ? '🏪' : '🚚';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 mb-4 text-sm"
          >
            ← Back to Selection
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {roleIcon} {roleTitle} {showRegister ? 'Registration' : 'Login'}
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!showRegister ? (
          // Login Form
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          // Registration Form
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength="6"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength="6"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          {!showRegister ? (
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setShowRegister(true)}
                className="text-blue-600 hover:underline"
              >
                Register here
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => setShowRegister(false)}
                className="text-blue-600 hover:underline"
              >
                Login here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// User Profile Component
const UserProfile = ({ onClose }) => {
  const { user, logout } = useAuth();

  return (
    <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border p-4 min-w-64 z-50">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Profile</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ×
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm"><strong>Name:</strong> {user.name}</p>
        <p className="text-sm"><strong>Username:</strong> {user.username}</p>
        <p className="text-sm"><strong>Email:</strong> {user.email}</p>
        <p className="text-sm"><strong>Role:</strong> {user.role.replace('_', ' ').toUpperCase()}</p>
        {user.phone && <p className="text-sm"><strong>Phone:</strong> {user.phone}</p>}
      </div>
      
      <button
        onClick={logout}
        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
      >
        Logout
      </button>
    </div>
  );
};

// Analytics Dashboard Component
const AnalyticsDashboard = ({ onBack }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
        </div>
        
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Analytics Data Yet</h2>
          <p className="text-gray-500 mb-6">Start taking orders to see your business analytics and insights.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₹0</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-600">0%</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
                  <p className="text-2xl font-bold text-purple-600">0 min</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <span className="text-2xl">⏱️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// GPS Tracking Component
const GPSTrackingMap = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">📍 Real-time GPS Tracking</h1>
        </div>
        
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Tracking Data</h2>
          <p className="text-gray-500">GPS tracking will appear here when delivery agents are active.</p>
        </div>
      </div>
    </div>
  );
};

// API Management Component
const APIManagement = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">🔑 API Management</h1>
        </div>
        
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔑</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">API Management</h2>
          <p className="text-gray-500">API integration features will be available here.</p>
        </div>
      </div>
    </div>
  );
};

// Restaurant Owner Dashboard
const RestaurantDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    order_id: '',
    order_value: '',
    priority: 'normal'
  });
  const [currentView, setCurrentView] = useState('orders');
  const [showProfile, setShowProfile] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const { user, token } = useAuth();

  useEffect(() => {
    fetchOrders();
    fetchDeliveryAgents();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchDeliveryAgents = async () => {
    try {
      const response = await axios.get(`${API}/delivery-agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveryAgents(response.data);
    } catch (error) {
      console.error('Error fetching delivery agents:', error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        ...newOrder,
        order_value: parseFloat(newOrder.order_value) || 0
      };
      const response = await axios.post(`${API}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders([response.data, ...orders]);
      setNewOrder({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        order_id: '',
        order_value: '',
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    }
  };

  const handleSendForDelivery = (orderId) => {
    setSelectedOrderId(orderId);
    setShowAgentModal(true);
  };

  const assignOrderToAgent = async () => {
    try {
      const data = selectedAgentId ? { agent_id: selectedAgentId } : {};
      await axios.post(`${API}/orders/${selectedOrderId}/send-for-delivery`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrders(prev => prev.map(order => 
        order.id === selectedOrderId 
          ? { 
              ...order, 
              status: 'out_for_delivery',
              assigned_to: selectedAgentId || null
            }
          : order
      ));
      
      setShowAgentModal(false);
      setSelectedOrderId(null);
      setSelectedAgentId('');
      
      const assignmentMessage = selectedAgentId 
        ? `Order assigned to ${deliveryAgents.find(a => a.id === selectedAgentId)?.name} successfully!`
        : 'Order sent to all available delivery agents!';
      alert(assignmentMessage);
    } catch (error) {
      console.error('Error sending order for delivery:', error);
      alert('Error sending order for delivery. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgentName = (agentId) => {
    const agent = deliveryAgents.find(a => a.id === agentId);
    return agent ? agent.name : 'Unassigned';
  };

  if (currentView === 'analytics') {
    return <AnalyticsDashboard onBack={() => setCurrentView('orders')} />;
  }

  if (currentView === 'tracking') {
    return <GPSTrackingMap onBack={() => setCurrentView('orders')} />;
  }

  if (currentView === 'api') {
    return <APIManagement onBack={() => setCurrentView('orders')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('orders')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  currentView === 'orders' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                📋 Orders
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  currentView === 'analytics' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setCurrentView('tracking')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  currentView === 'tracking' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                📍 Tracking
              </button>
              <button
                onClick={() => setCurrentView('api')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  currentView === 'api' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                🔑 API
              </button>
            </div>
            
            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.name}</span>
              </button>
              
              {showProfile && (
                <UserProfile onClose={() => setShowProfile(false)} />
              )}
            </div>
          </div>
        </div>
        
        {/* Create New Order Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Order</h2>
          <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={newOrder.customer_name}
                onChange={(e) => setNewOrder({...newOrder, customer_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={newOrder.customer_phone}
                onChange={(e) => setNewOrder({...newOrder, customer_phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
              <input
                type="text"
                value={newOrder.order_id}
                onChange={(e) => setNewOrder({...newOrder, order_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
              <textarea
                value={newOrder.customer_address}
                onChange={(e) => setNewOrder({...newOrder, customer_address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Value (₹)</label>
              <input
                type="number"
                step="0.01"
                value={newOrder.order_value}
                onChange={(e) => setNewOrder({...newOrder, order_value: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Order
              </button>
            </div>
          </form>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Orders ({orders.length})</h2>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders yet. Create your first order above.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{order.customer_name}</h3>
                      <p className="text-gray-600">Order ID: {order.order_id}</p>
                      <p className="text-gray-600">📞 {order.customer_phone}</p>
                      <p className="text-gray-600">📍 {order.customer_address}</p>
                      {order.order_value > 0 && (
                        <p className="text-gray-600">💰 ₹{order.order_value}</p>
                      )}
                      {order.assigned_to && (
                        <p className="text-purple-600">👤 Assigned to: {getAgentName(order.assigned_to)}</p>
                      )}
                      {order.estimated_delivery_time && (
                        <p className="text-blue-600">⏱️ ETA: {order.estimated_delivery_time} min</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleSendForDelivery(order.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      🚚 Assign & Send for Delivery
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Agent Assignment Modal */}
        {showAgentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Assign Delivery Agent</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Delivery Agent (or leave blank to send to all available agents)
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">🎯 Send to All Available Agents</option>
                  {deliveryAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      👤 {agent.name} {agent.is_online ? '(Online)' : '(Offline)'} 
                      {agent.phone && ` - ${agent.phone}`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAgentId && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Agent Details:</h4>
                  {(() => {
                    const selectedAgent = deliveryAgents.find(a => a.id === selectedAgentId);
                    return selectedAgent ? (
                      <div className="text-sm text-blue-800">
                        <p>Name: {selectedAgent.name}</p>
                        <p>Phone: {selectedAgent.phone || 'Not provided'}</p>
                        <p>Status: {selectedAgent.is_online ? '🟢 Online' : '🔴 Offline'}</p>
                        <p>Vehicle: {selectedAgent.vehicle_type || 'Not specified'}</p>
                        {selectedAgent.total_deliveries && (
                          <p>Total Deliveries: {selectedAgent.total_deliveries}</p>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAgentModal(false);
                    setSelectedOrderId(null);
                    setSelectedAgentId('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={assignOrderToAgent}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  {selectedAgentId ? 'Assign to Agent' : 'Send to All'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Delivery Agent Interface
const DeliveryAgentApp = () => {
  const [orders, setOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentTab, setCurrentTab] = useState('active');
  const [showProfile, setShowProfile] = useState(false);
  const [agentStats, setAgentStats] = useState({
    totalDeliveries: 0,
    avgDeliveryTime: 0,
    successRate: 0,
    totalEarnings: 0
  });
  const { user, token } = useAuth();

  useEffect(() => {
    fetchOrders();
    fetchOrderHistory();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter orders for this delivery agent or unassigned orders
      const deliveryOrders = response.data.filter(order => 
        (order.status === 'pending' || order.status === 'out_for_delivery') &&
        (!order.assigned_to || order.assigned_to === user.id)
      );
      setOrders(deliveryOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter delivered orders assigned to this agent
      const deliveredOrders = response.data.filter(order => 
        (order.status === 'delivered' || order.status === 'cancelled') &&
        order.assigned_to === user.id
      );
      setOrderHistory(deliveredOrders);
    } catch (error) {
      console.error('Error fetching order history:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}`, {
        status: status,
        assigned_to: user.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: status }
          : order
      ));

      if (status === 'delivered') {
        setTimeout(() => {
          fetchOrderHistory();
          fetchOrders();
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const openNavigation = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4">
        {/* Header with Stats */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl font-bold text-gray-900">Delivery Agent</h1>
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-2 text-sm"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.name}</span>
              </button>
              
              {showProfile && (
                <UserProfile onClose={() => setShowProfile(false)} />
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-2">
              <p className="text-lg font-bold text-blue-600">{agentStats.totalDeliveries}</p>
              <p className="text-xs text-blue-600">Total Deliveries</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-lg font-bold text-green-600">₹{agentStats.totalEarnings}</p>
              <p className="text-xs text-green-600">Total Earnings</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-200 rounded-lg p-1 mb-4">
          <button
            onClick={() => setCurrentTab('active')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              currentTab === 'active' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🚚 Active Orders ({orders.length})
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              currentTab === 'history' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 History ({orderHistory.length})
          </button>
        </div>
        
        {/* Active Orders Tab */}
        {currentTab === 'active' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-gray-500">No active orders</p>
                <p className="text-sm text-gray-400">Waiting for new deliveries...</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{order.customer_name}</h3>
                      <p className="text-gray-600 text-sm">Order: {order.order_id}</p>
                      {order.order_value > 0 && (
                        <p className="text-green-600 text-sm font-medium">💰 ₹{order.order_value}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-2">📞</span>
                      <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">
                        {order.customer_phone}
                      </a>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1">📍</span>
                      <p className="text-gray-700 text-sm leading-relaxed">{order.customer_address}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => openNavigation(order.customer_address)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      🗺️ Open Navigation
                    </button>
                    
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                        className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors"
                      >
                        Start Delivery
                      </button>
                    )}
                    
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Order History Tab */}
        {currentTab === 'history' && (
          <div className="space-y-4">
            {orderHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-500">No delivery history yet</p>
                <p className="text-sm text-gray-400">Complete your first delivery to see history</p>
              </div>
            ) : (
              orderHistory.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{order.customer_name}</h3>
                      <p className="text-gray-600 text-sm">Order: {order.order_id}</p>
                      {order.order_value > 0 && (
                        <p className="text-green-600 text-sm font-medium">💰 ₹{order.order_value}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">📍</span>
                      <p className="text-gray-700 text-sm leading-relaxed">{order.customer_address}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openNavigation(order.customer_address)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-200 transition-colors text-sm"
                    >
                      🗺️ View Location
                    </button>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-md hover:bg-blue-200 transition-colors text-sm text-center"
                    >
                      📞 Call Customer
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// User Type Selection Component
const UserTypeSelection = ({ onSelectType }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Restaurant Management System
        </h1>
        <p className="text-center text-gray-600 mb-8">
          AI-Powered Delivery Management Platform
        </p>
        <div className="space-y-4">
          <button
            onClick={() => onSelectType('owner')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
          >
            🏪 Restaurant Owner
          </button>
          <button
            onClick={() => onSelectType('delivery')}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
          >
            🚚 Delivery Agent
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [selectedUserType, setSelectedUserType] = useState(null);

  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppContent selectedUserType={selectedUserType} setSelectedUserType={setSelectedUserType} />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

// App Content Component
const AppContent = ({ selectedUserType, setSelectedUserType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show appropriate dashboard
  if (user) {
    if (user.role === 'restaurant_owner') {
      return <RestaurantDashboard />;
    } else if (user.role === 'delivery_agent') {
      return <DeliveryAgentApp />;
    }
  }

  // If no user type selected, show selection screen
  if (!selectedUserType) {
    return <UserTypeSelection onSelectType={setSelectedUserType} />;
  }

  // Show login form for selected user type
  return (
    <LoginForm 
      userType={selectedUserType} 
      onBack={() => setSelectedUserType(null)} 
    />
  );
};

export default App;