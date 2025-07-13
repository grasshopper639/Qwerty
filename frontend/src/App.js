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
  const [heatMapData, setHeatMapData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchHeatMapData();
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

  const fetchHeatMapData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/heat-map`);
      setHeatMapData(response.data.heat_map_data);
    } catch (error) {
      console.error('Error fetching heat map data:', error);
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
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
        </div>
        
        {analytics && analytics.total_orders ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.total_orders}</p>
                    <p className="text-sm text-green-600">+{analytics.weekly_growth}% this week</p>
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
                    <p className="text-2xl font-bold text-green-600">₹{analytics.total_revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Avg: ₹{analytics.avg_order_value}</p>
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
                    <p className="text-2xl font-bold text-blue-600">{((analytics.completed_orders / analytics.total_orders) * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">{analytics.completed_orders} delivered</p>
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
                    <p className="text-2xl font-bold text-purple-600">{Math.round(analytics.avg_delivery_time)} min</p>
                    <p className="text-sm text-gray-600">Customer Rating: {analytics.customer_satisfaction}⭐</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <span className="text-2xl">⏱️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">📈 Business Growth</h3>
                <p className="text-3xl font-bold">+{analytics.weekly_growth}%</p>
                <p className="text-blue-100">Weekly growth rate</p>
                <p className="text-sm mt-2">🎯 Target: 15% weekly</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">🕐 Peak Hours</h3>
                <div className="space-y-1">
                  {analytics.peak_hours.map((hour, index) => (
                    <p key={index} className="text-lg font-medium">{hour}</p>
                  ))}
                </div>
                <p className="text-green-100 text-sm">Highest order volume</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">👥 Customer Loyalty</h3>
                <p className="text-3xl font-bold">{analytics.repeat_customer_rate}%</p>
                <p className="text-purple-100">Repeat customers</p>
                <p className="text-sm mt-2">⭐ {analytics.customer_satisfaction}/5.0 satisfaction</p>
              </div>
            </div>

            {/* Daily Revenue Trend */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">📈 Daily Revenue Trend (Last 7 Days)</h2>
              <div className="flex items-end space-x-2 h-40">
                {analytics.daily_stats.map((day, index) => {
                  const maxRevenue = Math.max(...analytics.daily_stats.map(d => d.revenue));
                  const height = (day.revenue / maxRevenue) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-t" style={{ height: '120px' }}>
                        <div 
                          className="bg-gradient-to-t from-green-500 to-green-400 w-full rounded-t flex items-end justify-center"
                          style={{ height: `${height}%` }}
                        >
                          <span className="text-white text-xs font-medium pb-1">₹{day.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-center mt-2">
                        <p className="text-xs font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                        <p className="text-xs text-gray-500">{day.orders} orders</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Agent Performance */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">🚚 Agent Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Agent</th>
                      <th className="text-left py-2">Total Orders</th>
                      <th className="text-left py-2">Completed</th>
                      <th className="text-left py-2">Success Rate</th>
                      <th className="text-left py-2">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.agent_performance.map((agent) => (
                      <tr key={agent.agent_id} className="border-b">
                        <td className="py-2 font-medium">{agent.name}</td>
                        <td className="py-2">{agent.total_orders}</td>
                        <td className="py-2">{agent.completed_orders}</td>
                        <td className="py-2">{agent.success_rate.toFixed(1)}%</td>
                        <td className="py-2">{Math.round(agent.avg_delivery_time)} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Delivery Zones */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">🗺️ Top Delivery Zones</h2>
              <div className="space-y-3">
                {analytics.top_delivery_zones.map((zone, index) => {
                  const maxCount = Math.max(...analytics.top_delivery_zones.map(z => z.count));
                  const percentage = (zone.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-blue-500 mr-3 text-white text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-700">{zone.zone}</span>
                          <span className="text-sm text-gray-500">{zone.count} orders</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-3 text-sm font-medium text-blue-600">
                        {((zone.count / analytics.total_orders) * 100).toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hourly Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">📈 Hourly Order Distribution</h2>
              <div className="flex items-end space-x-1 h-32 mb-4">
                {Object.entries(analytics.hourly_distribution).map(([hour, count]) => {
                  const maxCount = Math.max(...Object.values(analytics.hourly_distribution));
                  const height = Math.max((count / maxCount) * 100, 5);
                  const isPeakHour = count > maxCount * 0.7;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center">
                      <div 
                        className={`w-full rounded-t transition-all duration-300 ${
                          isPeakHour ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs mt-1 font-medium">{hour}h</span>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  <span>Normal Hours</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                  <span>Peak Hours</span>
                </div>
              </div>
            </div>

            {/* Business Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">💡 Business Insights</h3>
                <div className="space-y-2 text-sm">
                  <p>• Peak hours: 12PM-1PM & 7PM-8PM</p>
                  <p>• {analytics.top_delivery_zones[0].zone} is your top delivery area</p>
                  <p>• Average order value: ₹{analytics.avg_order_value}</p>
                  <p>• {analytics.repeat_customer_rate}% customer retention rate</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">🎯 Recommendations</h3>
                <div className="space-y-2 text-sm">
                  <p>• Add more delivery agents during peak hours</p>
                  <p>• Focus marketing on {analytics.top_delivery_zones[4].zone} area</p>
                  <p>• Target lunch promotions (11AM-2PM)</p>
                  <p>• Improve delivery time to under 25 minutes</p>
                </div>
              </div>
            </div>
          </>
        ) : (
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
        )}
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.total_orders}</p>
                    <p className="text-sm text-green-600">+{analytics.weekly_growth}% this week</p>
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
                    <p className="text-2xl font-bold text-green-600">₹{analytics.total_revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Avg: ₹{analytics.avg_order_value}</p>
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
                    <p className="text-2xl font-bold text-blue-600">{((analytics.completed_orders / analytics.total_orders) * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">{analytics.completed_orders} delivered</p>
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
                    <p className="text-2xl font-bold text-purple-600">{Math.round(analytics.avg_delivery_time)} min</p>
                    <p className="text-sm text-gray-600">Customer Rating: {analytics.customer_satisfaction}⭐</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <span className="text-2xl">⏱️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">📈 Business Growth</h3>
                <p className="text-3xl font-bold">+{analytics.weekly_growth}%</p>
                <p className="text-blue-100">Weekly growth rate</p>
                <p className="text-sm mt-2">🎯 Target: 15% weekly</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">🕐 Peak Hours</h3>
                <div className="space-y-1">
                  {analytics.peak_hours.map((hour, index) => (
                    <p key={index} className="text-lg font-medium">{hour}</p>
                  ))}
                </div>
                <p className="text-green-100 text-sm">Highest order volume</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">👥 Customer Loyalty</h3>
                <p className="text-3xl font-bold">{analytics.repeat_customer_rate}%</p>
                <p className="text-purple-100">Repeat customers</p>
                <p className="text-sm mt-2">⭐ {analytics.customer_satisfaction}/5.0 satisfaction</p>
              </div>
            </div>

            {/* Daily Revenue Trend */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">📈 Daily Revenue Trend (Last 7 Days)</h2>
              <div className="flex items-end space-x-2 h-40">
                {analytics.daily_stats.map((day, index) => {
                  const maxRevenue = Math.max(...analytics.daily_stats.map(d => d.revenue));
                  const height = (day.revenue / maxRevenue) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-t" style={{ height: '120px' }}>
                        <div 
                          className="bg-gradient-to-t from-green-500 to-green-400 w-full rounded-t flex items-end justify-center"
                          style={{ height: `${height}%` }}
                        >
                          <span className="text-white text-xs font-medium pb-1">₹{day.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-center mt-2">
                        <p className="text-xs font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                        <p className="text-xs text-gray-500">{day.orders} orders</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Agent Performance */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">🚚 Agent Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Agent</th>
                      <th className="text-left py-2">Total Orders</th>
                      <th className="text-left py-2">Completed</th>
                      <th className="text-left py-2">Success Rate</th>
                      <th className="text-left py-2">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.agent_performance.map((agent) => (
                      <tr key={agent.agent_id} className="border-b">
                        <td className="py-2 font-medium">{agent.name}</td>
                        <td className="py-2">{agent.total_orders}</td>
                        <td className="py-2">{agent.completed_orders}</td>
                        <td className="py-2">{agent.success_rate.toFixed(1)}%</td>
                        <td className="py-2">{Math.round(agent.avg_delivery_time)} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Delivery Zones */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">🗺️ Top Delivery Zones</h2>
              <div className="space-y-3">
                {analytics.top_delivery_zones.map((zone, index) => {
                  const maxCount = Math.max(...analytics.top_delivery_zones.map(z => z.count));
                  const percentage = (zone.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-blue-500 mr-3 text-white text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-700">{zone.zone}</span>
                          <span className="text-sm text-gray-500">{zone.count} orders</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-3 text-sm font-medium text-blue-600">
                        {((zone.count / analytics.total_orders) * 100).toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hourly Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">📈 Hourly Order Distribution</h2>
              <div className="flex items-end space-x-1 h-32 mb-4">
                {Object.entries(analytics.hourly_distribution).map(([hour, count]) => {
                  const maxCount = Math.max(...Object.values(analytics.hourly_distribution));
                  const height = Math.max((count / maxCount) * 100, 5);
                  const isPeakHour = count > maxCount * 0.7;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center">
                      <div 
                        className={`w-full rounded-t transition-all duration-300 ${
                          isPeakHour ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs mt-1 font-medium">{hour}h</span>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  <span>Normal Hours</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                  <span>Peak Hours</span>
                </div>
              </div>
            </div>

            {/* Business Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">💡 Business Insights</h3>
                <div className="space-y-2 text-sm">
                  <p>• Peak hours: 12PM-1PM & 7PM-8PM</p>
                  <p>• {analytics.top_delivery_zones[0].zone} is your top delivery area</p>
                  <p>• Average order value: ₹{analytics.avg_order_value}</p>
                  <p>• {analytics.repeat_customer_rate}% customer retention rate</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">🎯 Recommendations</h3>
                <div className="space-y-2 text-sm">
                  <p>• Add more delivery agents during peak hours</p>
                  <p>• Focus marketing on {analytics.top_delivery_zones[4].zone} area</p>
                  <p>• Target lunch promotions (11AM-2PM)</p>
                  <p>• Improve delivery time to under 25 minutes</p>
                </div>
              </div>
            </div>
          </>
        ) : (
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
        )}
      </div>
    </div>
  );
};

// GPS Tracking Component
const GPSTrackingMap = ({ onBack }) => {
  const [agents, setAgents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    fetchAgents();
    fetchOrders();
    
    const interval = setInterval(() => {
      fetchAgents(); // Update agent locations
    }, 5000);
    
    return () => clearInterval(interval);
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
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">📍 Real-time GPS Tracking</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🚚 Active Agents</h2>
            <div className="space-y-3">
              {agents.filter(agent => agent.is_online).map((agent) => (
                <div 
                  key={agent.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAgent?.id === agent.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-gray-600">{agent.vehicle_type}</p>
                      {agent.current_location && (
                        <p className="text-xs text-green-600">📍 Location updated</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <p className="text-xs text-gray-500 mt-1">Online</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🗺️ Live Map</h2>
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl mb-4 block">🗺️</span>
                <p className="text-gray-600 mb-2">Interactive Map Integration Ready</p>
                <p className="text-sm text-gray-500">Will show real-time agent locations and delivery routes</p>
                {selectedAgent && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium">Selected: {selectedAgent.name}</p>
                    {selectedAgent.current_location ? (
                      <p className="text-sm">Location: {selectedAgent.current_location.latitude?.toFixed(6)}, {selectedAgent.current_location.longitude?.toFixed(6)}</p>
                    ) : (
                      <p className="text-sm text-gray-500">No location data available</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Deliveries */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🚚 Active Deliveries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{order.customer_name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Order: {order.order_id}</p>
                <p className="text-sm text-gray-600 mb-2">📍 {order.customer_address}</p>
                {order.assigned_to && (
                  <p className="text-sm text-green-600">👤 Agent: {order.assigned_to}</p>
                )}
                {order.estimated_delivery_time && (
                  <p className="text-sm text-purple-600">⏱️ ETA: {order.estimated_delivery_time} min</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// API Management Component
const APIManagement = ({ onBack }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const permissions = [
    'pos_integration',
    'accounting_integration',
    'webhook_access',
    'analytics_read',
    'order_management'
  ];

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      const response = await axios.get(`${API}/api-keys`);
      setApiKeys(response.data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const createAPIKey = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api-keys`, {
        name: newKeyName,
        permissions: selectedPermissions
      });
      setNewKeyName('');
      setSelectedPermissions([]);
      fetchAPIKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const deleteAPIKey = async (keyId) => {
    try {
      await axios.delete(`${API}/api-keys/${keyId}`);
      fetchAPIKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">🔑 API Management</h1>
        </div>
        
        {/* Create New API Key */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New API Key</h2>
          <form onSubmit={createAPIKey} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., POS Integration Key"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {permissions.map((permission) => (
                  <label key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, permission]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{permission.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create API Key
            </button>
          </form>
        </div>

        {/* API Keys List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">API Keys</h2>
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div key={key.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{key.name}</h3>
                    <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded mt-2">
                      {key.key}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Permissions:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {key.permissions.map((permission) => (
                          <span key={permission} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {permission.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Created: {new Date(key.created_at).toLocaleDateString()}
                      {key.last_used && (
                        <span> • Last used: {new Date(key.last_used).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteAPIKey(key.id)}
                    className="ml-4 text-red-600 hover:text-red-800 text-sm"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Examples */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🔗 Integration Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">POS System Integration</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`POST ${API}/integrations/pos/orders
Headers:
  X-API-Key: your_api_key_here
  Content-Type: application/json

Body:
{
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "customer_address": "123 Main St",
  "external_order_id": "POS-001",
  "total_amount": 25.99
}`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Webhook for Order Updates</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`GET ${API}/integrations/webhook/orders/{order_id}
Headers:
  X-API-Key: your_api_key_here

Response:
{
  "id": "order_id",
  "status": "delivered",
  "customer_name": "John Doe",
  "delivered_at": "2024-01-01T12:00:00Z"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Restaurant Owner Dashboard
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
  const [ws, setWs] = useState(null);
  const [filter, setFilter] = useState({
    status: '',
    date_from: '',
    date_to: '',
    customer_name: ''
  });
  const [currentView, setCurrentView] = useState('orders');

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
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.date_from) params.append('date_from', filter.date_from);
      if (filter.date_to) params.append('date_to', filter.date_to);
      if (filter.customer_name) params.append('customer_name', filter.customer_name);
      
      const response = await axios.get(`${API}/orders?${params.toString()}`);
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
      await axios.put(`${API}/orders/${orderId}`, {
        status: 'out_for_delivery',
        assigned_to: 'delivery_agent_1'
      });
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        const order = orders.find(o => o.id === orderId);
        ws.send(JSON.stringify({
          type: 'send_for_delivery',
          order: { ...order, status: 'out_for_delivery' }
        }));
      }
      
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'out_for_delivery' }
          : order
      ));
      
      alert('Order sent for delivery successfully!');
    } catch (error) {
      console.error('Error sending order for delivery:', error);
      alert('Error sending order for delivery. Please try again.');
    }
  };

  const getEstimateDeliveryTime = async (orderId) => {
    try {
      const response = await axios.post(`${API}/orders/${orderId}/estimate-delivery`);
      alert(`Estimated delivery time: ${response.data.estimated_time_minutes} minutes\nConfidence: ${(response.data.confidence_score * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('Error getting delivery estimate:', error);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-gray-100 text-gray-800';
      case 'low': return 'bg-green-100 text-green-800';
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
        {/* Navigation */}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={newOrder.priority}
                onChange={(e) => setNewOrder({...newOrder, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
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

        {/* Order Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Filter Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={filter.customer_name}
                onChange={(e) => setFilter({...filter, customer_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filter.date_from}
                onChange={(e) => setFilter({...filter, date_from: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filter.date_to}
                onChange={(e) => setFilter({...filter, date_to: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-4">
              <button
                onClick={fetchOrders}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Orders ({orders.length})</h2>
          <div className="space-y-4">
            {orders.map((order) => (
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
                    <div className="flex space-x-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(order.priority)}`}>
                        {order.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    {order.estimated_delivery_time && (
                      <p className="text-sm text-purple-600">
                        ⏱️ ETA: {order.estimated_delivery_time} min
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleSendForDelivery(order.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        🚚 Send for Delivery
                      </button>
                      <button
                        onClick={() => getEstimateDeliveryTime(order.id)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
                      >
                        ⏱️ Get Estimate
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Delivery Agent Interface
const DeliveryAgentApp = () => {
  const [orders, setOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [ws, setWs] = useState(null);
  const [agentId] = useState('delivery_agent_1');
  const [location, setLocation] = useState(null);
  const [currentTab, setCurrentTab] = useState('active'); // 'active' or 'history'
  const [agentStats, setAgentStats] = useState({
    totalDeliveries: 0,
    avgDeliveryTime: 0,
    successRate: 0,
    totalEarnings: 0
  });

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const deliveryOrders = response.data.filter(order => 
        order.status === 'pending' || order.status === 'out_for_delivery'
      );
      setOrders(deliveryOrders);
      console.log('Fetched active orders for delivery agent:', deliveryOrders.length);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      // Fetch all orders assigned to this agent
      const response = await axios.get(`${API}/delivery-agents/${agentId}/orders`);
      const allAgentOrders = response.data;
      
      // Separate delivered orders for history
      const deliveredOrders = allAgentOrders.filter(order => 
        order.status === 'delivered' || order.status === 'cancelled'
      );
      setOrderHistory(deliveredOrders);
      
      // Calculate agent stats
      const delivered = allAgentOrders.filter(order => order.status === 'delivered');
      const totalDeliveries = delivered.length;
      const avgTime = delivered.length > 0 
        ? delivered.reduce((sum, order) => sum + (order.actual_delivery_time || 0), 0) / delivered.length
        : 0;
      const successRate = allAgentOrders.length > 0 
        ? (delivered.length / allAgentOrders.length) * 100 
        : 0;
      const totalEarnings = delivered.reduce((sum, order) => sum + (order.order_value || 0), 0);
      
      setAgentStats({
        totalDeliveries,
        avgDeliveryTime: Math.round(avgTime),
        successRate: Math.round(successRate),
        totalEarnings: totalEarnings.toFixed(2)
      });
      
      console.log('Fetched order history:', deliveredOrders.length);
    } catch (error) {
      console.error('Error fetching order history:', error);
      // Fallback: fetch from general orders endpoint with filtering
      try {
        const response = await axios.get(`${API}/orders?assigned_to=${agentId}`);
        const agentOrders = response.data;
        const deliveredOrders = agentOrders.filter(order => 
          order.status === 'delivered' || order.status === 'cancelled'
        );
        setOrderHistory(deliveredOrders);
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    }
  };

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          };
          setLocation(newLocation);
          
          // Send location update via WebSocket
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'location_update',
              location: newLocation
            }));
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOrderHistory();
    
    // Get initial location
    updateLocation();
    
    // Update location every 30 seconds
    const locationInterval = setInterval(updateLocation, 30000);
    
    // Set up polling as fallback to WebSocket
    const pollInterval = setInterval(() => {
      fetchOrders();
      if (currentTab === 'history') {
        fetchOrderHistory();
      }
    }, 10000);
    
    // Try WebSocket connection
    const websocket = new WebSocket(`${WS_URL}/ws/delivery/${agentId}`);
    
    websocket.onopen = () => {
      console.log('Delivery Agent WebSocket connected');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_order') {
        setOrders(prev => [data.order, ...prev]);
        
        if (Notification.permission === 'granted') {
          new Notification('New Delivery Order!', {
            body: `Order for ${data.order.customer_name} at ${data.order.customer_address}`,
            icon: '/favicon.ico'
          });
        }
      } else if (data.type === 'order_assigned') {
        setOrders(prev => prev.map(order => 
          order.id === data.order.id ? data.order : order
        ));
        
        if (Notification.permission === 'granted') {
          new Notification('Order Assigned!', {
            body: `You've been assigned order ${data.order.order_id}`,
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
      clearInterval(locationInterval);
    };
  }, [agentId, currentTab]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}`, {
        status: status,
        assigned_to: agentId
      });
      
      if (ws && ws.readyState === WebSocket.OPEN) {
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
      
      // If marked as delivered, refresh history
      if (status === 'delivered') {
        setTimeout(() => {
          fetchOrderHistory();
          fetchOrders(); // Remove from active orders
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

  const formatDeliveryTime = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4">
        {/* Header with Stats */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl font-bold text-gray-900">Delivery Agent</h1>
            <div className="text-right">
              {location && (
                <p className="text-xs text-green-600">📍 GPS Active</p>
              )}
              <p className="text-xs text-gray-500">Agent ID: {agentId}</p>
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
            <div className="bg-purple-50 rounded-lg p-2">
              <p className="text-lg font-bold text-purple-600">{agentStats.avgDeliveryTime}m</p>
              <p className="text-xs text-purple-600">Avg Time</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2">
              <p className="text-lg font-bold text-yellow-600">{agentStats.successRate}%</p>
              <p className="text-xs text-yellow-600">Success Rate</p>
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
                        <p className="text-green-600 text-sm font-medium">💰 ${order.order_value}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {order.priority !== 'normal' && (
                        <p className="text-xs text-red-600 mt-1">🚨 {order.priority.toUpperCase()}</p>
                      )}
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
                    {order.estimated_delivery_time && (
                      <div className="flex items-center">
                        <span className="text-purple-600 mr-2">⏱️</span>
                        <p className="text-purple-600 text-sm">ETA: {order.estimated_delivery_time} min</p>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">🕐</span>
                      <p className="text-gray-600 text-sm">Created: {formatDate(order.created_at)}</p>
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
                        <p className="text-green-600 text-sm font-medium">💰 ${order.order_value}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {order.customer_rating && (
                        <p className="text-xs text-yellow-600 mt-1">⭐ {order.customer_rating}/5</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">📍</span>
                      <p className="text-gray-700 text-sm leading-relaxed">{order.customer_address}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Created:</p>
                        <p className="text-gray-700">{formatDate(order.created_at)}</p>
                      </div>
                      {order.delivered_at && (
                        <div>
                          <p className="text-gray-500">Delivered:</p>
                          <p className="text-gray-700">{formatDate(order.delivered_at)}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {order.estimated_delivery_time && (
                        <div>
                          <p className="text-gray-500">Estimated:</p>
                          <p className="text-purple-600">{order.estimated_delivery_time} min</p>
                        </div>
                      )}
                      {order.actual_delivery_time && (
                        <div>
                          <p className="text-gray-500">Actual Time:</p>
                          <p className={`${
                            order.actual_delivery_time <= (order.estimated_delivery_time || 60) 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatDeliveryTime(order.actual_delivery_time)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {order.delivery_notes && (
                      <div>
                        <p className="text-gray-500 text-sm">Notes:</p>
                        <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded">
                          {order.delivery_notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Action Buttons for History Items */}
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
                  
                  {/* Performance Indicator */}
                  {order.status === 'delivered' && order.estimated_delivery_time && order.actual_delivery_time && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Performance:</span>
                        <span className={`font-medium ${
                          order.actual_delivery_time <= order.estimated_delivery_time 
                            ? 'text-green-600' 
                            : 'text-yellow-600'
                        }`}>
                          {order.actual_delivery_time <= order.estimated_delivery_time 
                            ? '🎯 On Time' 
                            : '⏱️ Delayed'
                          }
                        </span>
                      </div>
                    </div>
                  )}
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
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>✨ Features: Real-time GPS tracking, AI delivery estimates, Analytics dashboard</p>
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