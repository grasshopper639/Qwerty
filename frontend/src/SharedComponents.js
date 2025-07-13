import React from "react";
import { useAuth } from "./AuthContext";

// User Profile Component
export const UserProfile = ({ onClose }) => {
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
        {user.vehicle_type && <p className="text-sm"><strong>Vehicle:</strong> {user.vehicle_type}</p>}
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

// Loading Component
export const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
};

// Status Color Helper
export const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Navigation Helper
export const openNavigation = (address) => {
  const encodedAddress = encodeURIComponent(address);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  window.open(googleMapsUrl, '_blank');
};