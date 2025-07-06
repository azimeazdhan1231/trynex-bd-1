
# TryneX Lifestyle - Complete Deployment Guide

## Overview
This guide will help you deploy both the frontend (on Replit) and backend (on Render) for always-online admin connectivity.

## Part 1: Backend Deployment on Render

### Step 1: Prepare Backend Files
1. Copy the `backend/` folder contents to a new GitHub repository
2. Ensure you have these files:
   - `server.js` (main backend server)
   - `package.json` (dependencies)

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com) and create an account
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure deployment settings:
   - **Name**: `trynex-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or paid for better performance)

### Step 3: Environment Variables
Add these environment variables in Render dashboard:
- `NODE_ENV`: `production`
- `PORT`: `3000` (Render will override this)

### Step 4: Get Backend URL
Once deployed, you'll get a URL like: `https://trynex-backend.onrender.com`

## Part 2: Update Frontend to Use Backend

### Step 1: Update Admin Panel Connection
Edit `admin.js` to connect to your deployed backend:

```javascript
// Replace the Supabase direct connection with backend API calls
const BACKEND_URL = 'https://your-backend-url.onrender.com';

// Update all Supabase calls to use your backend API
async function loadProducts() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/products`);
        const result = await response.json();
        if (result.success) {
            allProducts = result.data;
        }
    } catch (error) {
        console.error('Backend connection failed, using fallback');
        // Fallback to localStorage
    }
}
```

### Step 2: Frontend Deployment on Replit
1. Your frontend is already in Replit
2. Update the workflow to run the Python server:

## Part 3: Update Frontend Configuration

### Update admin.js with Backend Connection:
Replace the existing Supabase configuration in admin.js with:

```javascript
// Backend API Configuration
const BACKEND_URL = 'https://your-backend-url.onrender.com'; // Replace with your actual URL
const FALLBACK_MODE = false;

// API Helper Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Update load functions
async function loadProducts() {
    try {
        const result = await apiCall('/api/products');
        if (result.success) {
            allProducts = result.data;
            showConnectionStatus('connected');
        }
    } catch (error) {
        console.error('Failed to load products from backend:', error);
        // Fallback to localStorage
        loadProductsFromLocalStorage();
        showConnectionStatus('disconnected');
    }
}
```

## Part 4: Benefits of This Setup

### Always-Online Admin Panel
- Backend runs 24/7 on Render
- Real-time synchronization
- No connection drops
- Global accessibility

### Cost-Effective
- Render free tier for backend
- Replit for frontend development
- Supabase free tier for database

### Scalable Architecture
- Frontend and backend are separated
- Easy to scale independently
- Better performance

## Part 5: Maintenance & Monitoring

### Backend Health Check
Your backend includes a health check endpoint:
- URL: `https://your-backend-url.onrender.com/health`
- Returns server status and timestamp

### Monitoring
1. Set up uptime monitoring using:
   - UptimeRobot (free)
   - Pingdom
   - Built-in Render monitoring

### Database Management
- Use Supabase dashboard for direct database access
- Monitor API usage and performance
- Set up backups if needed

## Part 6: Testing Deployment

### Test Backend APIs
```bash
# Test health
curl https://your-backend-url.onrender.com/health

# Test products API
curl https://your-backend-url.onrender.com/api/products

# Test orders API
curl https://your-backend-url.onrender.com/api/orders
```

### Test Frontend
1. Access your Replit frontend
2. Check admin panel connectivity
3. Test real-time updates
4. Verify order processing

## Part 7: Troubleshooting

### Common Issues

1. **CORS Errors**: Backend includes CORS middleware
2. **Connection Timeouts**: Render free tier has cold starts
3. **Database Connection**: Verify Supabase credentials
4. **API Rate Limits**: Monitor Supabase usage

### Debug Steps
1. Check Render logs for backend errors
2. Use browser dev tools for frontend debugging
3. Monitor network requests
4. Check Supabase dashboard for database issues

## Security Notes

1. **Environment Variables**: Store sensitive data in Render environment variables
2. **API Security**: Implement authentication for production
3. **Database Security**: Use Supabase Row Level Security (RLS)
4. **HTTPS**: Both Render and Replit provide HTTPS by default

## Next Steps After Deployment

1. **Custom Domain**: Point your domain to the frontend
2. **SSL Certificate**: Automatic with Replit and Render
3. **Analytics**: Add Google Analytics or similar
4. **Performance Monitoring**: Set up error tracking
5. **Backup Strategy**: Regular database backups

This setup ensures your admin panel is always connected and your website runs smoothly with real-time updates!
