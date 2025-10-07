#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Store Rating System...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  const envContent = `NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=store_rating_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key_here_${Math.random().toString(36).substring(2, 15)}
JWT_EXPIRE=7d`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created with default values');
  console.log('⚠️  Please update the database credentials in .env file\n');
} else {
  console.log('✅ .env file already exists\n');
}

// Install backend dependencies
console.log('📦 Installing backend dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Backend dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install backend dependencies:', error.message);
  process.exit(1);
}

// Install frontend dependencies
console.log('📦 Installing frontend dependencies...');
try {
  execSync('cd client && npm install', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies:', error.message);
  process.exit(1);
}

console.log('🎉 Setup completed successfully!\n');
console.log('📋 Next steps:');
console.log('1. Update database credentials in .env file');
console.log('2. Create PostgreSQL database: store_rating_db');
console.log('3. Run database schema: psql -U your_username -d store_rating_db -f config/schema.sql');
console.log('4. Start backend: npm run dev');
console.log('5. Start frontend: cd client && npm start');
console.log('\n🔐 Default admin login:');
console.log('Email: admin@store-rating.com');
console.log('Password: Admin123!\n');
console.log('Happy coding! 🚀');
