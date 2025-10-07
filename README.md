# Store Rating System

A comprehensive full-stack web application that allows users to submit ratings for stores with role-based access control. Built with Express.js, React.js, and PostgreSQL.

## 🚀 Features

### User Roles
- **System Administrator**: Full system control and management
- **Normal User**: Browse stores and submit ratings
- **Store Owner**: Monitor store performance and reviews

### Key Functionalities

#### System Administrator
- ✅ Complete user management (add, edit, delete users)
- ✅ Store management (add, edit, delete stores)
- ✅ Dashboard with system statistics
- ✅ User role management
- ✅ Advanced filtering and sorting
- ✅ Real-time activity monitoring

#### Normal User
- ✅ User registration and authentication
- ✅ Browse and search stores
- ✅ Submit and modify store ratings (1-5 stars)
- ✅ View store details and ratings
- ✅ Profile management
- ✅ Password updates

#### Store Owner
- ✅ Store performance dashboard
- ✅ View customer reviews and ratings
- ✅ Average rating monitoring
- ✅ Review analytics

## 🛠️ Tech Stack

### Backend
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, rate limiting
- **Validation**: express-validator

### Frontend
- **Framework**: React.js 18
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Notifications**: React Toastify
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd store-rating-system
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

### 4. Database Setup

#### Create PostgreSQL Database
```sql
CREATE DATABASE store_rating_db;
```

#### Run Database Schema
```bash
psql -U your_username -d store_rating_db -f config/schema.sql
```

### 5. Environment Configuration

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=store_rating_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

### 6. Start the Application

#### Development Mode
```bash
# Start backend server
npm run dev

# In a new terminal, start frontend
cd client
npm start
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 🔐 Default Admin Account

The system comes with a default admin account:
- **Email**: admin@store-rating.com
- **Password**: Admin123!

## 📊 Database Schema

### Users Table
- `id` (Primary Key)
- `name` (20-60 characters)
- `email` (Unique)
- `password` (Hashed)
- `address` (Max 400 characters)
- `role` (admin, user, store_owner)
- `created_at`, `updated_at`

### Stores Table
- `id` (Primary Key)
- `name`
- `email` (Unique)
- `address` (Max 400 characters)
- `owner_id` (Foreign Key to Users)
- `created_at`, `updated_at`

### Ratings Table
- `id` (Primary Key)
- `user_id` (Foreign Key to Users)
- `store_id` (Foreign Key to Stores)
- `rating` (1-5)
- `created_at`, `updated_at`
- Unique constraint on (user_id, store_id)

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive form validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Cross-origin request handling
- **Helmet**: Security headers

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/password` - Update password
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - Get all users (with filtering)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Stores
- `GET /api/stores` - Get all stores (with filtering)
- `GET /api/stores/:id` - Get store by ID
- `POST /api/stores` - Create store (admin only)
- `PUT /api/stores/:id` - Update store
- `DELETE /api/stores/:id` - Delete store (admin only)

### Ratings
- `POST /api/ratings/:storeId` - Submit/update rating
- `GET /api/ratings/:storeId` - Get store ratings
- `GET /api/ratings/:storeId/user` - Get user's rating for store
- `GET /api/ratings/user/all` - Get user's all ratings
- `DELETE /api/ratings/:storeId` - Delete user's rating

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `POST /api/admin/users` - Create user (admin only)
- `POST /api/admin/stores` - Create store (admin only)
- `GET /api/admin/users` - Get users with admin details
- `GET /api/admin/stores` - Get stores with admin details
- `PUT /api/admin/users/:id/role` - Update user role

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean, professional interface
- **Role-based Navigation**: Dynamic menu based on user role
- **Real-time Feedback**: Toast notifications
- **Loading States**: Smooth user experience
- **Form Validation**: Client and server-side validation
- **Accessibility**: Keyboard navigation and screen reader support

## 🔍 Form Validations

### Name
- Minimum: 20 characters
- Maximum: 60 characters

### Address
- Maximum: 400 characters

### Password
- Length: 8-16 characters
- Must contain: At least one uppercase letter
- Must contain: At least one special character

### Email
- Standard email format validation

## 📈 Performance Features

- **Pagination**: Efficient data loading
- **Sorting**: Multi-column sorting support
- **Filtering**: Advanced search and filter options
- **Caching**: Optimized database queries
- **Lazy Loading**: Component-based code splitting

## 🧪 Testing

The application includes comprehensive validation and error handling:

- Input validation on both client and server
- Database constraint validation
- Authentication and authorization checks
- Error boundary implementation
- Form validation with user feedback

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=store_rating_db
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRE=7d
```

### Build for Production
```bash
# Build React app
cd client
npm run build

# The build folder will be served by Express.js
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please contact the development team.

---

**Built with ❤️ by Senior Software Engineer**
