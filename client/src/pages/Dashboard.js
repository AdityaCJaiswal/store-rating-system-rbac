import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from '../config/axios';
import { 
  Store, 
  Star, 
  Users, 
  BarChart3, 
  TrendingUp,
  Eye,
  StarIcon
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStores: 0,
    totalRatings: 0,
    averageRating: 0,
    myRatings: 0
  });
  const [recentStores, setRecentStores] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stores
      const storesResponse = await axios.get('/api/stores?limit=5');
      setRecentStores(storesResponse.data.stores);

      if (user?.role === 'user') {
        // Fetch user's ratings
        const ratingsResponse = await axios.get('/api/ratings/user/all?limit=5');
        setMyRatings(ratingsResponse.data.ratings);
        
        // Calculate stats for regular users
        const allStoresResponse = await axios.get('/api/stores');
        const allRatingsResponse = await axios.get('/api/ratings/user/all');
        
        const totalStores = allStoresResponse.data.pagination.totalStores;
        const myRatingsCount = allRatingsResponse.data.pagination.totalRatings;
        const avgRating = myRatingsCount > 0 
          ? allRatingsResponse.data.ratings.reduce((sum, rating) => sum + rating.rating, 0) / myRatingsCount 
          : 0;

        setStats({
          totalStores,
          totalRatings: myRatingsCount,
          averageRating: avgRating,
          myRatings: myRatingsCount
        });
      } else if (user?.role === 'admin') {
        // Fetch admin stats
        const adminResponse = await axios.get('/api/admin/dashboard');
        setStats({
          totalStores: adminResponse.data.statistics.totalStores,
          totalRatings: adminResponse.data.statistics.totalRatings,
          averageRating: 0,
          myRatings: 0
        });
      } else if (user?.role === 'store_owner') {
        // Fetch store owner stats
        const storeOwnerResponse = await axios.get('/api/store-owner/dashboard');
        setStats({
          totalStores: 1,
          totalRatings: storeOwnerResponse.data.totalRatings,
          averageRating: storeOwnerResponse.data.averageRating,
          myRatings: 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-slide-up">
            <div className="stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStores}</p>
                  <p className="text-sm text-green-600 font-medium mt-1">↗ +12% from last month</p>
                </div>
                <div className="stat-card-icon bg-gradient-to-br from-blue-500 to-blue-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Stores</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStores}</p>
                  <p className="text-sm text-green-600 font-medium mt-1">↗ +8% from last month</p>
                </div>
                <div className="stat-card-icon bg-gradient-to-br from-green-500 to-green-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <Store className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Ratings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRatings}</p>
                  <p className="text-sm text-green-600 font-medium mt-1">↗ +15% from last month</p>
                </div>
                <div className="stat-card-icon bg-gradient-to-br from-yellow-500 to-yellow-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">System Health</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">Active</p>
                  <p className="text-sm text-green-600 font-medium mt-1">All systems operational</p>
                </div>
                <div className="stat-card-icon bg-gradient-to-br from-purple-500 to-purple-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'store_owner':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-slide-up">
            <div className="stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.averageRating.toFixed(1)}
                  </p>
                  <p className="text-sm text-green-600 font-medium mt-1">↗ +0.3 from last month</p>
                </div>
                <div className="stat-card-icon bg-gradient-to-br from-yellow-500 to-yellow-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Ratings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRatings}</p>
                  <p className="text-sm text-green-600 font-medium mt-1">↗ +5 new this week</p>
                </div>
                <div className="stat-card-icon bg-gradient-to-br from-blue-500 to-blue-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Store Performance</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.averageRating >= 4 ? 'Excellent' : stats.averageRating >= 3 ? 'Good' : 'Needs Improvement'}
                  </p>
                  <p className="text-sm text-green-600 font-medium mt-1">Keep up the great work!</p>
                </div>
                <div className="stat-card-icon bg-gradient-to-br from-green-500 to-green-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        );

      default: // user
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-slide-up">
            <div className="stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Stores</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStores}</p>
                  <p className="text-sm text-blue-600 font-medium mt-1">Available to rate</p>
                </div>
                <div className="stat-card-icon bg-gradient-to-br from-blue-500 to-blue-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <Store className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">My Ratings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.myRatings}</p>
                  <p className="text-sm text-green-600 font-medium mt-1">↗ +2 this week</p>
                </div>
                <div className="stat-card-icon bg-gradient-to-br from-yellow-500 to-yellow-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.averageRating.toFixed(1)}
                  </p>
                  <p className="text-sm text-green-600 font-medium mt-1">Your rating average</p>
                </div>
                <div className="stat-card-icon bg-gradient-to-br from-green-500 to-green-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        );
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

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <div className="text-lg font-semibold text-gray-700">Loading your dashboard...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12 animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-4">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Here's what's happening with your {user?.role === 'admin' ? 'system' : user?.role === 'store_owner' ? 'store' : 'ratings'}.
            </p>
          </div>
        </div>

        {getRoleSpecificContent()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Stores */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Stores</h3>
            </div>
            <div className="card-body">
              {recentStores.length > 0 ? (
                <div className="space-y-4">
                  {recentStores.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{store.name}</h4>
                        <p className="text-sm text-gray-500">{store.address}</p>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {renderStars(store.average_rating)}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {parseFloat(store.average_rating).toFixed(1)} ({store.total_ratings} ratings)
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/stores/${store.id}`}
                        className="btn btn-outline text-xs"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No stores available</p>
              )}
            </div>
            <div className="card-footer">
              <Link to="/stores" className="btn btn-primary w-full">
                View All Stores
              </Link>
            </div>
          </div>

          {/* My Ratings (for regular users) */}
          {user?.role === 'user' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">My Recent Ratings</h3>
              </div>
              <div className="card-body">
                {myRatings.length > 0 ? (
                  <div className="space-y-4">
                    {myRatings.map((rating) => (
                      <div key={rating.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{rating.store_name}</h4>
                          <p className="text-sm text-gray-500">{rating.store_address}</p>
                          <div className="flex items-center mt-1">
                            <div className="flex items-center">
                              {renderStars(rating.rating)}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {rating.rating}/5
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No ratings submitted yet</p>
                )}
              </div>
              <div className="card-footer">
                <Link to="/stores" className="btn btn-primary w-full">
                  Rate More Stores
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;