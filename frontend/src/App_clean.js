import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

// Analytics Dashboard Component
const AnalyticsDashboard = ({ onBack }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`);
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
  const [agents, setAgents] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchAgents();
    fetchOrders();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${API}/delivery-agents`);
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders?status=out_for_delivery`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

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
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    order_id: '',
    order_value: '',
    priority: 'normal'
  });
  const [currentView, setCurrentView] = useState('orders');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        ...newOrder,
        order_value: parseFloat(newOrder.order_value) || 0
      };
      const response = await axios.post(`${API}/orders`, orderData);
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
    }
  };

  const handleSendForDelivery = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/send-for-delivery`);
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'out_for_delivery' }
          : order
      ));
      alert('Order sent for delivery successfully!');
    } catch (error) {
      console.error('Error sending order for delivery:', error);
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
                      🚚 Send for Delivery
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Delivery Agent Interface
const DeliveryAgentApp = () => {
  const [orders, setOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentTab, setCurrentTab] = useState('active');
  const [agentStats, setAgentStats] = useState({
    totalDeliveries: 0,
    avgDeliveryTime: 0,
    successRate: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    fetchOrders();
    fetchOrderHistory();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const deliveryOrders = response.data.filter(order => 
        order.status === 'pending' || order.status === 'out_for_delivery'
      );
      setOrders(deliveryOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const deliveredOrders = response.data.filter(order => 
        order.status === 'delivered' || order.status === 'cancelled'
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
        assigned_to: 'delivery_agent_1'
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
            <div className="text-right">
              <p className="text-xs text-gray-500">Agent Dashboard</p>
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

// Main App Component
function App() {
  const [userType, setUserType] = useState(null);

  if (!userType) {
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
              onClick={() => setUserType('owner')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
            >
              🏪 Restaurant Owner
            </button>
            <button
              onClick={() => setUserType('delivery')}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
            >
              🚚 Delivery Agent
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            userType === 'owner' ? <RestaurantDashboard /> : <DeliveryAgentApp />
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;