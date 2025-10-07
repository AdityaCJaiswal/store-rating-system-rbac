import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Store, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield,
  Users,
  BarChart3
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'store_owner':
        return <Store className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 bg-red-100';
      case 'store_owner':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'store_owner':
        return 'Store Owner';
      default:
        return 'User';
    }
  };

  return (
    <nav className="glass-effect fixed w-full top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Store className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">StoreRate</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 group"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Dashboard</span>
            </Link>

            <Link
              to="/stores"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 group"
            >
              <Store className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Stores</span>
            </Link>

            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 group"
                >
                  <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium">Admin</span>
                </Link>
                <Link
                  to="/admin/users"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 group"
                >
                  <Users className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium">Users</span>
                </Link>
                <Link
                  to="/admin/stores"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 group"
                >
                  <Store className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium">Manage Stores</span>
                </Link>
              </>
            )}

            {user?.role === 'store_owner' && (
              <Link
                to="/store-owner"
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 group"
              >
                <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">My Store</span>
              </Link>
            )}

            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
              <Link
                to="/profile"
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 group"
              >
                <Settings className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Profile</span>
              </Link>

              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold ${getRoleColor(user?.role)}`}>
                  {getRoleIcon(user?.role)}
                  <span>{getRoleName(user?.role)}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-300 group"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none focus:text-primary-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/stores"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <Store className="w-4 h-4" />
                <span>Stores</span>
              </Link>

              {user?.role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                  <Link
                    to="/admin/users"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Users className="w-4 h-4" />
                    <span>Manage Users</span>
                  </Link>
                  <Link
                    to="/admin/stores"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Store className="w-4 h-4" />
                    <span>Manage Stores</span>
                  </Link>
                </>
              )}

              {user?.role === 'store_owner' && (
                <Link
                  to="/store-owner"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>My Store</span>
                </Link>
              )}

              <Link
                to="/profile"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="w-4 h-4" />
                <span>Profile</span>
              </Link>

              <div className="px-3 py-2">
                <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium w-fit ${getRoleColor(user?.role)}`}>
                  {getRoleIcon(user?.role)}
                  <span>{getRoleName(user?.role)}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{user?.name}</div>
              </div>

              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
