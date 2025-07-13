import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { AuthProvider, useAuth } from "./AuthContext";
import { UserProfile, LoadingSpinner, getStatusColor } from "./SharedComponents";
import { RestaurantSelector } from "./RestaurantSelector";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Restaurant Owner Login Component
const RestaurantOwnerLogin = () => {
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
    phone: '',
    restaurant_name: '',
    restaurant_address: ''
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

    const result = await register(registerData);

    if (result.success) {
      setShowRegister(false);
      setError('');
      alert('Registration successful! Please login with your credentials.');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🏪</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Restaurant Owner {showRegister ? 'Registration' : 'Login'}
          </h1>
          <p className="text-gray-600">
            {showRegister ? 'Create your restaurant account' : 'Sign in to manage your restaurant'}
          </p>
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
                Restaurant Name
              </label>
              <input
                type="text"
                value={registerData.restaurant_name}
                onChange={(e) => setRegisterData({...registerData, restaurant_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Address
              </label>
              <textarea
                value={registerData.restaurant_address}
                onChange={(e) => setRegisterData({...registerData, restaurant_address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                required
              />
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
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Restaurant'}
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

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Are you a delivery agent?{' '}
            <a 
              href="/delivery" 
              className="text-blue-600 hover:underline"
            >
              Go to Delivery App
            </a>
          </p>
        </div>
      </div>
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
    return <LoadingSpinner message="Loading analytics..." />;
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

// Main App Component
function RestaurantApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading Restaurant App..." />;
  }

  return (
    <div className="RestaurantApp">
      {user ? <RestaurantDashboard /> : <RestaurantOwnerLogin />}
    </div>
  );
}

// Export with AuthProvider wrapper
export default function RestaurantAppWithAuth() {
  return (
    <AuthProvider userType="restaurant">
      <RestaurantApp />
    </AuthProvider>
  );
}