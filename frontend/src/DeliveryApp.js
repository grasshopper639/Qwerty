import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
  const [token, setToken] = useState(localStorage.getItem('delivery_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.role === 'delivery_agent') {
            setUser(response.data);
          } else {
            // Not a delivery agent, clear token
            localStorage.removeItem('delivery_token');
            setToken(null);
          }
        } catch (error) {
          localStorage.removeItem('delivery_token');
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
      
      if (user.role !== 'delivery_agent') {
        return { 
          success: false, 
          error: 'This login is only for delivery agents. Please use the restaurant owner app.' 
        };
      }
      
      setUser(user);
      setToken(newToken);
      localStorage.setItem('delivery_token', newToken);
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
      const registrationData = {
        ...userData,
        role: 'delivery_agent'
      };
      await axios.post(`${API}/auth/register`, registrationData);
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
      localStorage.removeItem('delivery_token');
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

// Delivery Agent Login Component
const DeliveryAgentLogin = () => {
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
    vehicle_type: 'bike'
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
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🚚</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Delivery Agent {showRegister ? 'Registration' : 'Login'}
          </h1>
          <p className="text-gray-600">
            {showRegister ? 'Create your delivery agent account' : 'Sign in to start delivering'}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          // Registration Form
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type
              </label>
              <select
                value={registerData.vehicle_type}
                onChange={(e) => setRegisterData({...registerData, vehicle_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="bike">🚲 Bike</option>
                <option value="motorcycle">🏍️ Motorcycle</option>
                <option value="car">🚗 Car</option>
                <option value="walking">🚶 Walking</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              {loading ? 'Registering...' : 'Register as Delivery Agent'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          {!showRegister ? (
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setShowRegister(true)}
                className="text-green-600 hover:underline"
              >
                Register here
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => setShowRegister(false)}
                className="text-green-600 hover:underline"
              >
                Login here
              </button>
            </p>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Are you a restaurant owner?{' '}
            <a 
              href="/restaurant" 
              className="text-green-600 hover:underline"
            >
              Go to Restaurant App
            </a>
          </p>
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
        <p className="text-sm"><strong>Phone:</strong> {user.phone}</p>
        <p className="text-sm"><strong>Vehicle:</strong> {user.vehicle_type || 'Not specified'}</p>
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

// Main Delivery Agent Dashboard
const DeliveryAgentDashboard = () => {
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
    
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchOrders();
      if (currentTab === 'history') {
        fetchOrderHistory();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentTab, user.id]);

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
      
      // Calculate stats
      const totalEarnings = deliveredOrders.reduce((sum, order) => sum + (order.order_value || 0), 0);
      const deliveredCount = deliveredOrders.filter(order => order.status === 'delivered').length;
      const avgTime = deliveredOrders.length > 0 
        ? deliveredOrders.reduce((sum, order) => sum + (order.actual_delivery_time || 0), 0) / deliveredOrders.length
        : 0;
      
      setAgentStats({
        totalDeliveries: deliveredCount,
        avgDeliveryTime: Math.round(avgTime),
        successRate: deliveredOrders.length > 0 ? Math.round((deliveredCount / deliveredOrders.length) * 100) : 0,
        totalEarnings: totalEarnings.toFixed(2)
      });
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
            <div>
              <h1 className="text-xl font-bold text-gray-900">🚚 Delivery Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.name}!</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-2 text-sm"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>
              
              {showProfile && (
                <UserProfile onClose={() => setShowProfile(false)} />
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xl font-bold text-blue-600">{agentStats.totalDeliveries}</p>
              <p className="text-xs text-blue-600">Completed</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xl font-bold text-green-600">₹{agentStats.totalEarnings}</p>
              <p className="text-xs text-green-600">Earnings</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xl font-bold text-purple-600">{agentStats.avgDeliveryTime}m</p>
              <p className="text-xs text-purple-600">Avg Time</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-xl font-bold text-yellow-600">{agentStats.successRate}%</p>
              <p className="text-xs text-yellow-600">Success Rate</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-200 rounded-lg p-1 mb-4">
          <button
            onClick={() => setCurrentTab('active')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              currentTab === 'active' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎯 Active Orders ({orders.length})
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              currentTab === 'history' 
                ? 'bg-white text-green-600 shadow-sm' 
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
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Orders</h3>
                <p className="text-gray-500">Waiting for new delivery assignments...</p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">Orders will appear here when restaurants assign them to you</p>
                </div>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-l-green-500">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{order.customer_name}</h3>
                      <p className="text-gray-600 text-sm">Order: {order.order_id}</p>
                      {order.order_value > 0 && (
                        <p className="text-green-600 font-semibold">💰 ₹{order.order_value}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {order.estimated_delivery_time && (
                        <p className="text-xs text-purple-600 mt-1">⏱️ ETA: {order.estimated_delivery_time} min</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center p-2 bg-blue-50 rounded">
                      <span className="text-blue-600 mr-2">📞</span>
                      <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline font-medium">
                        {order.customer_phone}
                      </a>
                    </div>
                    <div className="flex items-start p-2 bg-green-50 rounded">
                      <span className="text-green-600 mr-2 mt-1">📍</span>
                      <p className="text-gray-700 text-sm leading-relaxed">{order.customer_address}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => openNavigation(order.customer_address)}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
                    >
                      🗺️ Open Navigation
                    </button>
                    
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                        className="w-full bg-yellow-500 text-white py-3 px-4 rounded-md hover:bg-yellow-600 transition-colors font-medium"
                      >
                        🚀 Start Delivery
                      </button>
                    )}
                    
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
                      >
                        ✅ Mark as Delivered
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
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Delivery History</h3>
                <p className="text-gray-500">Your completed deliveries will appear here</p>
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
                      <p className="text-xs text-gray-500 mt-1">
                        {order.delivered_at && new Date(order.delivered_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-600 mr-2">📍</span>
                      <p className="text-gray-700">{order.customer_address}</p>
                    </div>
                    {order.actual_delivery_time && (
                      <div className="flex items-center text-sm">
                        <span className="text-purple-600 mr-2">⏱️</span>
                        <p className="text-purple-600">Delivery Time: {order.actual_delivery_time} min</p>
                      </div>
                    )}
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
function DeliveryApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Delivery App...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="DeliveryApp">
      <AuthProvider>
        {user ? <DeliveryAgentDashboard /> : <DeliveryAgentLogin />}
      </AuthProvider>
    </div>
  );
}

export default DeliveryApp;