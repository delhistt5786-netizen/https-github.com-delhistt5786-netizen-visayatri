# 🚀 Visayatri Live Deployment Guide

## Overview
This guide will help you deploy Visayatri to production using:
- **Frontend**: Vercel (Next.js hosting)
- **Backend**: Render (Node.js hosting)
- **Database**: MongoDB Atlas (Cloud)

---

## 📋 Prerequisites
1. **GitHub Account** - to host your code
2. **Vercel Account** - for frontend deployment (free tier available)
3. **Render Account** - for backend deployment (free tier available)
4. **MongoDB Atlas Account** - for database (free tier available)
5. **Razorpay Account** - for payments (test/live keys)

---

## 🔧 Step 1: Prepare Your Code for Deployment

### 1.1 Fix MongoDB Connection
The current issue: `querySrv ENOTFOUND` means DNS can't resolve MongoDB Atlas.

**Solution A: Use MongoDB Atlas (Cloud)**
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a free cluster
3. Whitelist all IPs (0.0.0.0/0) - or your Render IP once deployed
4. Get connection string in format: `mongodb+srv://username:password@cluster.mongodb.net/visayatri?retryWrites=true&w=majority`
5. Update `.env` with new connection string

**Solution B: Use Local MongoDB (Development Only)**
```bash
# Install MongoDB locally
brew install mongodb-community  # macOS
# or
sudo apt-get install mongodb  # Linux

# Start MongoDB
brew services start mongodb-community

# Update .env
MONGODB_URI=mongodb://localhost:27017/visayatri
```

### 1.2 Add .gitignore (if not exists)
```bash
cd backend
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo "uploads/" >> .gitignore

cd ../frontend
echo "node_modules/" >> .gitignore
echo ".env.local" >> .gitignore
echo ".next/" >> .gitignore
echo "dist/" >> .gitignore
```

### 1.3 Create .env.example Files
```bash
# backend/.env.example
PORT=5002
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/visayatri
JWT_SECRET=your_super_secret_key_here
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
WHATSAPP_NUMBER=919717743876
FRONTEND_URL=https://yourdomain.com

# frontend/.env.example
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
NEXT_PUBLIC_WHATSAPP=919717743876
```

---

## 📤 Step 2: Push Code to GitHub

```bash
cd /path/to/visayatri

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Visayatri platform with premium UI"

# Create new GitHub repo
# Go to github.com and create 'visayatri' repo (don't initialize)

# Add remote and push
git remote add origin https://github.com/YOUR-USERNAME/visayatri.git
git branch -M main
git push -u origin main
```

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Connect Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up / Login
3. Click **"Import Project"**
4. Select **"Import Git Repository"**
5. Paste: `https://github.com/YOUR-USERNAME/visayatri`
6. Click **Import**

### 3.2 Configure Environment Variables
In Vercel dashboard, under project settings → Environment Variables:

```
NEXT_PUBLIC_API_URL = https://your-backend-url.onrender.com/api
NEXT_PUBLIC_WHATSAPP = 919717743876
```

### 3.3 Set Root Directory
- Under **Root Directory**: select `frontend/`

### 3.4 Deploy
- Click **Deploy**
- Wait for build to complete
- Your frontend URL will be: `https://visayatri.vercel.app`

---

## 🖥️ Step 4: Deploy Backend to Render

### 4.1 Connect Render
1. Go to [render.com](https://render.com)
2. Sign up / Login
3. Click **"New +"** → **"Web Service"**
4. Select **"Build and deploy from a Git repository"**
5. Search and select `visayatri` repository
6. Click **Connect**

### 4.2 Configure Deployment
- **Name**: `visayatri-api`
- **Environment**: `Node`
- **Region**: `Singapore` (or closest to you)
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `backend/`

### 4.3 Add Environment Variables
Click **Add Environment Variable** for each:

```
NODE_ENV = production
MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/visayatri
JWT_SECRET = your_secret_key_here (generate strong random string)
RAZORPAY_KEY_ID = rzp_live_xxxxx
RAZORPAY_KEY_SECRET = xxxxx
WHATSAPP_NUMBER = 919717743876
FRONTEND_URL = https://yourdomain.vercel.app
```

### 4.4 Deploy
- Click **Create Web Service**
- Wait for deployment (~3 minutes)
- Your backend URL will be: `https://visayatri-api.onrender.com`

---

## 🔗 Step 5: Update Frontend API URL

After backend is deployed:

1. Go to Vercel dashboard
2. Select your frontend project
3. Settings → Environment Variables
4. Update `NEXT_PUBLIC_API_URL`:
   ```
   https://visayatri-api.onrender.com/api
   ```
5. Click **Redeploy** to update frontend

---

## ✅ Step 6: Post-Deployment Checklist

- [ ] Test homepage loads: `https://yourdomain.vercel.app`
- [ ] Test visa listing: `https://yourdomain.vercel.app/visa`
- [ ] Test visa detail page
- [ ] Test login page (should use mock data)
- [ ] Test registration
- [ ] Verify dashboards load
- [ ] Test mobile responsiveness
- [ ] Check console for any errors
- [ ] Test backend health: `https://your-backend.onrender.com/api/health`

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
❌ DB error: querySrv ENOTFOUND
```
**Solution**: 
1. Verify MongoDB Atlas IP whitelist includes Render IP
2. Use connection string with direct IP if DNS fails
3. Check credentials are correct

### Frontend can't reach backend
```
❌ CORS error or 404
```
**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Verify backend is running (`/api/health`)
3. Backend must be deployed before frontend is updated

### Build fails on Vercel
```
✗ Build failed
```
**Solution**:
1. Check build logs in Vercel dashboard
2. Verify `.gitignore` doesn't exclude necessary files
3. Check `package.json` scripts

### Render deployment stuck
```
⏳ Still building...
```
**Solution**:
1. Check build logs in Render dashboard
2. If stuck > 15 min, manually restart deployment
3. Verify MongoDB connection string is correct

---

## 🎯 Custom Domain Setup (Optional)

### Vercel Custom Domain
1. Go to Vercel project settings
2. Domains → Add domain
3. Follow DNS configuration instructions
4. Update frontend URL in backend `.env`

### Render Custom Domain  
1. Go to Render service settings
2. Custom Domain → Add domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_API_URL` in Vercel

---

## 🔒 Security Checklist

- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS only (automatic on Vercel/Render)
- [ ] Never commit `.env` files
- [ ] Rotate API keys regularly
- [ ] Set up error logging/monitoring
- [ ] Test CORS configuration

---

## 📊 Monitoring & Maintenance

### Vercel Analytics
- Dashboard shows build time, error rate, response times

### Render Monitoring
- Logs tab shows application output
- Set up alerts for deployment failures

### Backend Logs
View real-time logs with:
```bash
curl https://your-backend.onrender.com/api/health
```

---

## 🚀 Next Steps After Deployment

1. **Test thoroughly** - User, Agent, Admin workflows
2. **Set up monitoring** - Sentry, Logrocket, etc.
3. **Enable analytics** - Track user behavior
4. **Configure backups** - MongoDB Atlas automated backups
5. **Set up CI/CD** - Auto-deploy on Git push
6. **Scale database** - Upgrade MongoDB plan if needed
7. **Add custom domain** - Brand your URLs
8. **Set up email** - SendGrid for notifications

---

## 📞 Support

If you encounter issues:
1. Check Render/Vercel dashboard logs
2. Test backend with: `curl https://backend-url/api/health`
3. Check browser console for frontend errors
4. Verify all environment variables are set

**Congrats! 🎉 Visayatri is now live!**
