# Deployment Guide

This guide will help you deploy the Store Rating System to various platforms.

## 🚀 Quick Start

### Local Development
```bash
# Clone and setup
git clone <repository-url>
cd store-rating-system
npm run setup

# Configure database in .env file
# Create PostgreSQL database and run schema

# Start development servers
npm run dev          # Backend on port 5000
cd client && npm start  # Frontend on port 3000
```

## 🌐 Production Deployment

### Option 1: Heroku

1. **Prepare for Heroku**
   ```bash
   # Install Heroku CLI
   # Login to Heroku
   heroku login
   
   # Create Heroku app
   heroku create your-app-name
   ```

2. **Configure Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_production_jwt_secret
   heroku config:set DB_HOST=your_production_db_host
   heroku config:set DB_USER=your_production_db_user
   heroku config:set DB_PASSWORD=your_production_db_password
   heroku config:set DB_NAME=store_rating_db
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

4. **Setup Database**
   ```bash
   # Connect to your production database and run:
   # psql -h your_host -U your_user -d store_rating_db -f config/schema.sql
   ```

### Option 2: DigitalOcean App Platform

1. **Connect Repository**
   - Connect your GitHub repository to DigitalOcean App Platform

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - Source Directory: `/`

3. **Environment Variables**
   - Add all required environment variables in the dashboard

4. **Database**
   - Create a managed PostgreSQL database
   - Update connection string in environment variables

### Option 3: AWS EC2

1. **Launch EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - Configure security groups (ports 22, 80, 443, 3000, 5000)

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib -y
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

3. **Setup Application**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd store-rating-system
   
   # Install dependencies
   npm install
   cd client && npm install && npm run build
   cd ..
   
   # Configure environment
   cp .env.example .env
   # Edit .env with production values
   ```

4. **Setup Database**
   ```bash
   # Create database and user
   sudo -u postgres psql
   CREATE DATABASE store_rating_db;
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE store_rating_db TO your_user;
   \q
   
   # Run schema
   psql -U your_user -d store_rating_db -f config/schema.sql
   ```

5. **Start Application**
   ```bash
   # Start with PM2
   pm2 start server.js --name "store-rating-api"
   pm2 startup
   pm2 save
   ```

6. **Setup Nginx (Optional)**
   ```bash
   # Install Nginx
   sudo apt install nginx -y
   
   # Configure reverse proxy
   sudo nano /etc/nginx/sites-available/store-rating
   ```

   Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/store-rating /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN cd client && npm ci && npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_USER=postgres
      - DB_PASSWORD=password
      - DB_NAME=store_rating_db
      - JWT_SECRET=your_jwt_secret
    depends_on:
      - postgres

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=store_rating_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Deploy with Docker
```bash
# Build and run
docker-compose up -d

# Run database migrations
docker-compose exec app psql -h postgres -U postgres -d store_rating_db -f config/schema.sql
```

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your_domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Logs

### PM2 Monitoring
```bash
# View logs
pm2 logs store-rating-api

# Monitor resources
pm2 monit

# Restart application
pm2 restart store-rating-api
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## 🔧 Environment Variables

### Required Variables
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=store_rating_db
DB_USER=your_database_user
DB_PASSWORD=your_database_password
JWT_SECRET=your_strong_jwt_secret_key
JWT_EXPIRE=7d
```

### Optional Variables
```env
# For production optimizations
NODE_OPTIONS=--max-old-space-size=1024
```

## 🚨 Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Database backup strategy
- [ ] Monitor application logs
- [ ] Use environment variables for secrets

## 📈 Performance Optimization

1. **Database Indexing**
   - Ensure proper indexes on frequently queried columns
   - Monitor query performance

2. **Caching**
   - Implement Redis for session storage
   - Add response caching for static data

3. **CDN**
   - Use CloudFlare or AWS CloudFront for static assets

4. **Load Balancing**
   - Use multiple application instances behind a load balancer

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials
   - Verify database server is running
   - Check network connectivity

2. **Port Already in Use**
   - Kill process using the port: `sudo lsof -ti:5000 | xargs kill -9`
   - Change port in environment variables

3. **Build Failures**
   - Clear node_modules: `rm -rf node_modules package-lock.json`
   - Reinstall: `npm install`

4. **Permission Issues**
   - Check file permissions
   - Ensure proper user ownership

### Logs to Check
- Application logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -u nginx`

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review security group/firewall settings

---

**Happy Deploying! 🚀**
