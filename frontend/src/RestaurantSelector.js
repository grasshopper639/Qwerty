import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Restaurant Selection Component
export const RestaurantSelector = ({ onRestaurantSelect, userType }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get(`${API}/restaurants`);
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/restaurants`, newRestaurant);
      setRestaurants([...restaurants, response.data]);
      setNewRestaurant({
        name: '',
        address: '',
        phone: '',
        email: '',
        description: ''
      });
      setShowCreateForm(false);
      alert('Restaurant created successfully!');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create restaurant');
    } finally {
      setCreateLoading(false);
    }
  };

  const roleIcon = userType === 'restaurant' ? '🏪' : '🚚';
  const roleTitle = userType === 'restaurant' ? 'Restaurant Owner' : 'Delivery Agent';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">{roleIcon}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Select Your Restaurant
          </h1>
          <p className="text-gray-600">
            {userType === 'restaurant' 
              ? 'Choose your restaurant to manage' 
              : 'Choose the restaurant you work for'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {restaurants.map((restaurant) => (
            <button
              key={restaurant.id}
              onClick={() => onRestaurantSelect(restaurant)}
              className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
              <p className="text-sm text-gray-600">{restaurant.address}</p>
              {restaurant.phone && (
                <p className="text-sm text-gray-500">📞 {restaurant.phone}</p>
              )}
            </button>
          ))}
        </div>

        {userType === 'restaurant' && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors mb-4"
          >
            + Create New Restaurant
          </button>
        )}

        {showCreateForm && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Create New Restaurant</h3>
            <form onSubmit={handleCreateRestaurant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newRestaurant.phone}
                  onChange={(e) => setNewRestaurant({...newRestaurant, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newRestaurant.email}
                  onChange={(e) => setNewRestaurant({...newRestaurant, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {userType === 'delivery' && restaurants.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No restaurants available yet.</p>
            <p className="text-sm text-gray-400">
              Please contact your restaurant owner to set up the system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};