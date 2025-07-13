import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Authentication Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, userType = 'any' }) => {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [token, setToken] = useState(
    userType === 'delivery' 
      ? localStorage.getItem('delivery_token')
      : localStorage.getItem('restaurant_token')
  );
  const [loading, setLoading] = useState(true);

  const getTokenKey = (role) => {
    return role === 'delivery_agent' ? 'delivery_token' : 'restaurant_token';
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const userData = response.data;
          
          // Check if user role matches the app type
          if (userType === 'delivery' && userData.role !== 'delivery_agent') {
            localStorage.removeItem('delivery_token');
            setToken(null);
          } else if (userType === 'restaurant' && userData.role !== 'restaurant_owner') {
            localStorage.removeItem('restaurant_token');
            setToken(null);
          } else {
            setUser(userData);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Fetch restaurant info
            if (userData.restaurant_id) {
              try {
                const restaurantResponse = await axios.get(`${API}/restaurants/${userData.restaurant_id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                setRestaurant(restaurantResponse.data);
              } catch (error) {
                console.error('Error fetching restaurant:', error);
              }
            }
          }
        } catch (error) {
          const tokenKey = getTokenKey(userType === 'delivery' ? 'delivery_agent' : 'restaurant_owner');
          localStorage.removeItem(tokenKey);
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token, userType]);

  const login = async (username, password, restaurantId) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password,
        restaurant_id: restaurantId
      });
      const { user: userData, token: newToken } = response.data;
      
      // Check if user role matches the app type
      if (userType === 'delivery' && userData.role !== 'delivery_agent') {
        return { 
          success: false, 
          error: 'This login is only for delivery agents. Please use the restaurant owner app.' 
        };
      } else if (userType === 'restaurant' && userData.role !== 'restaurant_owner') {
        return { 
          success: false, 
          error: 'This login is only for restaurant owners. Please use the delivery agent app.' 
        };
      }
      
      setUser(userData);
      setToken(newToken);
      
      const tokenKey = getTokenKey(userData.role);
      localStorage.setItem(tokenKey, newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Fetch restaurant info
      if (userData.restaurant_id) {
        try {
          const restaurantResponse = await axios.get(`${API}/restaurants/${userData.restaurant_id}`, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          setRestaurant(restaurantResponse.data);
        } catch (error) {
          console.error('Error fetching restaurant:', error);
        }
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData, restaurantId) => {
    try {
      const registrationData = {
        ...userData,
        role: userType === 'delivery' ? 'delivery_agent' : 'restaurant_owner',
        restaurant_id: restaurantId
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
      setRestaurant(null);
      
      // Clear both tokens to be safe
      localStorage.removeItem('delivery_token');
      localStorage.removeItem('restaurant_token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const value = {
    user,
    restaurant,
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