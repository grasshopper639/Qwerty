import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

// Restaurant Owner Dashboard
const RestaurantDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    order_id: ''
  });
  const [ws, setWs] = useState(null);

  useEffect(() => {
    fetchOrders();
    
    // Setup WebSocket connection
    const websocket = new WebSocket(`${WS_URL}/ws/owner/restaurant_owner`);
    
    websocket.onopen = () => {
      console.log('Owner WebSocket connected');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status_update') {
        // Update order status in real-time
        setOrders(prev => prev.map(order => 
          order.id === data.order_id 
            ? { ...order, status: data.status, assigned_to: data.agent_id }
            : order
        ));
      }
    };
    
    websocket.onclose = () => {
      console.log('Owner WebSocket disconnected');
    };
    
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
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
      const response = await axios.post(`${API}/orders`, newOrder);
      setOrders([response.data, ...orders]);
      setNewOrder({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        order_id: ''
      });
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleSendForDelivery = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/send-for-delivery`);
      
      // Send WebSocket message to delivery agents
      if (ws) {
        const order = orders.find(o => o.id === orderId);
        ws.send(JSON.stringify({
          type: 'send_for_delivery',
          order: order
        }));
      }
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'out_for_delivery' }
          : order
      ));
    } catch (error) {
      console.error('Error sending order for delivery:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Restaurant Dashboard</h1>
        
        {/* Create New Order Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Order</h2>
          <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
              <textarea
                value={newOrder.customer_address}
                onChange={(e) => setNewOrder({...newOrder, customer_address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
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
          <h2 className="text-xl font-semibold mb-4">Orders</h2>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{order.customer_name}</h3>
                    <p className="text-gray-600">Order ID: {order.order_id}</p>
                    <p className="text-gray-600">📞 {order.customer_phone}</p>
                    <p className="text-gray-600">📍 {order.customer_address}</p>
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
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    🚚 Send for Delivery
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Delivery Agent Interface
const DeliveryAgentApp = () => {
  const [orders, setOrders] = useState([]);
  const [ws, setWs] = useState(null);
  const [agentId] = useState('delivery_agent_1'); // In real app, this would be dynamic

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      // Filter orders that are relevant for delivery (pending or out_for_delivery)
      const deliveryOrders = response.data.filter(order => 
        order.status === 'pending' || order.status === 'out_for_delivery'
      );
      setOrders(deliveryOrders);
      console.log('Fetched orders for delivery agent:', deliveryOrders.length);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    // Fetch existing orders on component mount
    fetchOrders();
    
    // Set up polling as fallback to WebSocket (since WebSocket has connection issues)
    const pollInterval = setInterval(fetchOrders, 5000); // Poll every 5 seconds
    
    // Try WebSocket connection (but have polling as backup)
    const websocket = new WebSocket(`${WS_URL}/ws/delivery/${agentId}`);
    
    websocket.onopen = () => {
      console.log('Delivery Agent WebSocket connected');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_order') {
        // Add new order to list
        setOrders(prev => [data.order, ...prev]);
        
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('New Delivery Order!', {
            body: `Order for ${data.order.customer_name} at ${data.order.customer_address}`,
            icon: '/favicon.ico'
          });
        }
      }
    };
    
    websocket.onclose = () => {
      console.log('Delivery Agent WebSocket disconnected');
    };
    
    websocket.onerror = (error) => {
      console.log('WebSocket error, relying on polling:', error);
    };
    
    // Request notification permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    
    return () => {
      if (websocket) {
        websocket.close();
      }
      clearInterval(pollInterval);
    };
  }, [agentId]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}`, {
        status: status,
        assigned_to: agentId
      });
      
      // Send WebSocket message
      if (ws) {
        ws.send(JSON.stringify({
          type: 'status_update',
          order_id: orderId,
          status: status
        }));
      }
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: status, assigned_to: agentId }
          : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const openNavigation = (address) => {
    // For now, we'll use a simple Google Maps link
    // Later we'll replace this with proper Google Maps API integration
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Delivery Agent</h1>
        
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No orders yet. Waiting for new deliveries...</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{order.customer_name}</h3>
                    <p className="text-gray-600 text-sm">Order: {order.order_id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
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
                      Mark as Out for Delivery
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
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Restaurant Management System
          </h1>
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