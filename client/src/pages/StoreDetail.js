import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  Store, 
  Star, 
  MapPin, 
  Mail, 
  User,
  StarIcon,
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react';

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStoreDetails();
    if (user?.role === 'user') {
      fetchUserRating();
    }
  }, [id, user]);

  const fetchStoreDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/stores/${id}`);
      setStore(response.data.store);
      if (response.data.store.user_rating) {
        setUserRating(response.data.store.user_rating);
        setRating(response.data.store.user_rating);
      }
    } catch (error) {
      console.error('Error fetching store details:', error);
      toast.error('Failed to load store details');
      navigate('/stores');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRating = async () => {
    try {
      const response = await axios.get(`/api/ratings/${id}/user`);
      if (response.data.rating) {
        setUserRating(response.data.rating);
        setRating(response.data.rating.rating);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const handleRatingSubmit = async () => {
    if (user?.role !== 'user') {
      toast.error('Only regular users can submit ratings');
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`/api/ratings/${id}`, { rating });
      
      if (response.data.message.includes('updated')) {
        toast.success('Rating updated successfully!');
      } else {
        toast.success('Rating submitted successfully!');
      }
      
      setUserRating(response.data.rating);
      fetchStoreDetails(); // Refresh store details to get updated average
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    try {
      setSubmitting(true);
      await axios.delete(`/api/ratings/${id}`);
      toast.success('Rating deleted successfully!');
      setUserRating(null);
      setRating(0);
      fetchStoreDetails(); // Refresh store details
    } catch (error) {
      console.error('Error deleting rating:', error);
      toast.error(error.response?.data?.message || 'Failed to delete rating');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-6 w-6 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive && onStarClick ? () => onStarClick(i + 1) : undefined}
      />
    ));
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Store not found</h2>
          <p className="mt-2 text-gray-600">The store you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/stores')}
            className="mt-4 btn btn-primary"
          >
            Back to Stores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/stores')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Stores
      </button>

      {/* Store Header */}
      <div className="card mb-8">
        <div className="card-body">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Store className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {renderStars(store.average_rating)}
                  </div>
                  <span className="ml-3 text-lg font-medium text-gray-900">
                    {parseFloat(store.average_rating).toFixed(1)}
                  </span>
                  <span className="ml-2 text-gray-500">
                    ({store.total_ratings} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                <span>{store.address}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="h-5 w-5 mr-3 text-gray-400" />
                <span>{store.email}</span>
              </div>
              {store.owner_name && (
                <div className="flex items-center text-gray-600">
                  <User className="h-5 w-5 mr-3 text-gray-400" />
                  <span>Owner: {store.owner_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Section (for regular users) */}
      {user?.role === 'user' && (
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              {userRating ? 'Update Your Rating' : 'Rate This Store'}
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating (1-5 stars)
                </label>
                <div className="flex items-center space-x-1">
                  {renderStars(rating, true, setRating)}
                  <span className="ml-3 text-sm text-gray-600">
                    {rating}/5 stars
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleRatingSubmit}
                  disabled={submitting || rating < 1}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : userRating ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Rating
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Submit Rating
                    </>
                  )}
                </button>

                {userRating && (
                  <button
                    onClick={handleDeleteRating}
                    disabled={submitting}
                    className="btn btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Rating
                      </>
                    )}
                  </button>
                )}
              </div>

              {userRating && (
                <div className="text-sm text-gray-600">
                  <p>Your current rating: {userRating.rating}/5 stars</p>
                  <p>Submitted on: {new Date(userRating.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Store Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Store Information</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Email:</strong> {store.email}</p>
                <p><strong>Address:</strong> {store.address}</p>
                {store.owner_name && (
                  <p><strong>Owner:</strong> {store.owner_name}</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Rating Statistics</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Average Rating:</strong> {parseFloat(store.average_rating).toFixed(1)}/5</p>
                <p><strong>Total Reviews:</strong> {store.total_ratings}</p>
                <p><strong>Store Added:</strong> {new Date(store.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDetail;
