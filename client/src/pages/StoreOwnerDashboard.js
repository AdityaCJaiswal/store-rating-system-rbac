import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { 
  Store, 
  Star, 
  Users, 
  BarChart3,
  TrendingUp,
  Eye,
  StarIcon,
  User,
  Calendar
} from 'lucide-react';

const StoreOwnerDashboard = () => {
  const [store, setStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({
    totalRatings: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchStoreData();
  }, []);

  useEffect(() => {
    if (store) {
      fetchRatings();
    }
  }, [store, currentPage]);

  const fetchStoreData = async () => {
    try {
      // Get store owner dashboard data
      const response = await axios.get('/api/store-owner/dashboard');
      
      if (response.data.store) {
        setStore(response.data.store);
        setStats({
          totalRatings: response.data.totalRatings,
          averageRating: response.data.averageRating
        });
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      if (!store) return;
      
      const response = await axios.get(`/api/ratings/${store.id}?page=${currentPage}&limit=10`);
      setRatings(response.data.ratings);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getPerformanceStatus = (rating) => {
    if (rating >= 4.5) return { text: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (rating >= 4) return { text: 'Very Good', color: 'text-blue-600 bg-blue-100' };
    if (rating >= 3) return { text: 'Good', color: 'text-yellow-600 bg-yellow-100' };
    if (rating >= 2) return { text: 'Needs Improvement', color: 'text-orange-600 bg-orange-100' };
    return { text: 'Poor', color: 'text-red-600 bg-red-100' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Store className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Store Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have a store assigned to your account. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  const performance = getPerformanceStatus(stats.averageRating);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Store Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor your store's performance and customer feedback
        </p>
      </div>

      {/* Store Overview */}
      <div className="card mb-8">
        <div className="card-body">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Store className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{store.name}</h2>
                <p className="text-gray-600">{store.address}</p>
                <p className="text-sm text-gray-500">{store.email}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${performance.color}`}>
              {performance.text}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </p>
                <div className="flex items-center mt-1">
                  {renderStars(stats.averageRating)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalRatings}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Performance</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.averageRating >= 4 ? 'Excellent' : stats.averageRating >= 3 ? 'Good' : 'Needs Work'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Reviews</h3>
        </div>
        <div className="card-body">
          {ratings.length > 0 ? (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{rating.user_name}</p>
                        <p className="text-sm text-gray-500">{rating.user_email}</p>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {renderStars(rating.rating)}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {rating.rating}/5
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        {new Date(rating.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your store hasn't received any ratings yet.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-footer">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalRatings)} of{' '}
                {pagination.totalRatings} reviews
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="flex items-center px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Performance Insights</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Rating</span>
                <div className="flex items-center">
                  <div className="flex items-center">
                    {renderStars(stats.averageRating)}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {stats.averageRating.toFixed(1)}/5
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Reviews</span>
                <span className="text-sm font-medium text-gray-900">{stats.totalRatings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Performance Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${performance.color}`}>
                  {performance.text}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <button className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors w-full text-left">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">View Detailed Analytics</span>
              </button>
              <button className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors w-full text-left">
                <Eye className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">View Store Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreOwnerDashboard;
