# myPip Backend Server - Production Deployment Guide

This guide will help you deploy the myPip backend server to production for handling GitHub OAuth integration.

## Prerequisites

- Node.js 16+ installed on your server
- A domain name (e.g., www.mypip.dev)
- SSL certificate (Let's Encrypt recommended)
- Reverse proxy (nginx recommended)

## 1. Server Setup

### Install Node.js and npm
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### Create application directory
```bash
sudo mkdir -p /var/www/mypip-backend
sudo chown $USER:$USER /var/www/mypip-backend
cd /var/www/mypip-backend
```

## 2. Application Deployment

### Clone or upload your application
```bash
# If using git
git clone <your-repo-url> .
# Or upload files manually to /var/www/mypip-backend
```

### Install dependencies
```bash
npm install --production
```

### Create environment file
```bash
cp env.example .env
nano .env
```

Update the `.env` file with your production values:
```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=Ov23liiDXv1qIPEGgOg4
GITHUB_CLIENT_SECRET=92312095f05395118cdb1983e7d0d23e3b4346a0
GITHUB_REDIRECT_URI=https://www.mypip.dev/auth/github/callback

# Server Configuration
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Production Domain Configuration
PRODUCTION_DOMAIN=https://www.mypip.dev
API_BASE_URL=https://www.mypip.dev/api

# CORS Configuration - Production
ALLOWED_ORIGINS=https://www.mypip.dev,https://mypip.dev

# Security
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# SSL/TLS (if using reverse proxy like nginx)
TRUST_PROXY=true
```

## 3. Process Management with PM2

### Install PM2
```bash
npm install -g pm2
```

### Create PM2 ecosystem file
```bash
nano ecosystem.config.js
```

Add the following content:
```javascript
module.exports = {
  apps: [{
    name: 'mypip-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### Create logs directory
```bash
mkdir logs
```

### Start the application
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 4. Nginx Reverse Proxy Setup

### Install nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### Create nginx configuration
```bash
sudo nano /etc/nginx/sites-available/mypip-backend
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name www.mypip.dev mypip.dev;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.mypip.dev mypip.dev;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/www.mypip.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.mypip.dev/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (if serving from same server)
    location / {
        root /var/www/mypip-frontend;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/mypip-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 5. SSL Certificate with Let's Encrypt

### Install Certbot
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### Obtain SSL certificate
```bash
sudo certbot --nginx -d www.mypip.dev -d mypip.dev
```

### Set up auto-renewal
```bash
sudo crontab -e
```

Add this line:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## 6. Firewall Configuration

### Configure UFW (Ubuntu)
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Configure firewalld (CentOS/RHEL)
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 7. Monitoring and Logs

### View application logs
```bash
pm2 logs mypip-backend
pm2 monit
```

### View nginx logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitor system resources
```bash
htop
df -h
free -h
```

## 8. GitHub OAuth App Configuration

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Select your OAuth App
3. Update the callback URL to: `https://www.mypip.dev/auth/github/callback`
4. Save the changes

## 9. Testing the Deployment

### Test health endpoint
```bash
curl https://www.mypip.dev/health
```

### Test GitHub OAuth flow
1. Visit your frontend application
2. Click the GitHub button
3. Complete the OAuth flow
4. Verify the callback works

## 10. Maintenance

### Update the application
```bash
cd /var/www/mypip-backend
git pull origin main
npm install --production
pm2 restart mypip-backend
```

### Backup environment file
```bash
cp .env .env.backup.$(date +%Y%m%d)
```

### Monitor disk space
```bash
df -h
du -sh /var/log/*
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Check if another process is using port 3001
   ```bash
   sudo netstat -tulpn | grep :3001
   ```

2. **Permission denied**: Ensure proper file permissions
   ```bash
   sudo chown -R $USER:$USER /var/www/mypip-backend
   ```

3. **SSL certificate issues**: Renew certificates manually
   ```bash
   sudo certbot renew --force-renewal
   ```

4. **CORS errors**: Check nginx configuration and allowed origins

### Useful Commands

```bash
# Restart services
sudo systemctl restart nginx
pm2 restart mypip-backend

# Check service status
sudo systemctl status nginx
pm2 status

# View real-time logs
pm2 logs mypip-backend --lines 100
sudo tail -f /var/log/nginx/error.log
```

## Security Checklist

- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured
- [ ] Strong session secret set
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Regular backups configured
- [ ] Monitoring and alerting set up

Your backend server is now ready for production! 🚀 