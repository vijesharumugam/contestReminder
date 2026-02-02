# 🚀 Deployment Guide: Render (Backend) + Vercel (Frontend)

## ✅ **Best of Both Worlds!**

- **Backend on Render**: Free tier supports cron jobs and background workers
- **Frontend on Vercel**: Best Next.js hosting with global CDN

---

## 📦 **Part 1: Deploy Backend to Render**

### **Step 1: Create Render Account**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### **Step 2: Create New Web Service**
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `contestReminder`
3. Click **"Connect"**

### **Step 3: Configure Backend**
Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `contest-reminder-backend` |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

### **Step 4: Add Environment Variables**
Click **"Advanced"** → **"Add Environment Variable"**

Add these one by one:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
CLIST_USERNAME=your_clist_username
CLIST_API_KEY=your_clist_api_key
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_gmail_app_password
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@gmail.com
NODE_ENV=production
```

### **Step 5: Deploy**
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. **Copy your backend URL** (e.g., `https://contest-reminder-backend.onrender.com`)

### **Step 6: Verify Backend**
Visit: `https://your-backend.onrender.com`

You should see: **"Contest Reminder API Running"**

---

## 📦 **Part 2: Deploy Frontend to Vercel**

### **Step 1: Go to Vercel Dashboard**
1. Visit [vercel.com/new](https://vercel.com/new)
2. Click **"Add New Project"**

### **Step 2: Import Repository**
1. Click **"Import Git Repository"**
2. Select your GitHub account
3. Find **`contestReminder`**
4. Click **"Import"**

### **Step 3: Configure Frontend**
| Setting | Value |
|---------|-------|
| **Project Name** | `contest-reminder-frontend` |
| **Framework Preset** | **Next.js** (auto-detected) |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |

### **Step 4: Add Frontend Environment Variables**
Click **"Environment Variables"** and add:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotName
NEXT_PUBLIC_BACKEND_URL=https://contest-reminder-backend.onrender.com
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@gmail.com
```

**⚠️ Important**: Replace `https://contest-reminder-backend.onrender.com` with your actual Render backend URL!

### **Step 5: Deploy**
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. **Your app is live!** 🎉

---

## ✅ **Part 3: Verification**

### **Test Backend**
```bash
curl https://your-backend.onrender.com/
```
Should return: `Contest Reminder API Running`

### **Test Frontend**
1. Visit your Vercel URL
2. Sign up / Sign in
3. View contests
4. Update preferences

### **Test Cron Jobs**
Render automatically runs your cron jobs! Check the logs:
1. Go to Render Dashboard
2. Click on your backend service
3. Click **"Logs"**
4. You should see cron job executions

---

## 🎯 **Cron Schedule (Automatic on Render!)**

| Job | Schedule | Status |
|-----|----------|--------|
| Fetch Contests | Every 6 hours | ✅ Auto-runs |
| Daily Digest | 8:00 AM daily | ✅ Auto-runs |
| 30-min Reminders | Every 5 minutes | ✅ Auto-runs |

**No external cron service needed!** Render handles it all. 🎉

---

## 🔧 **Post-Deployment**

### **Update Clerk**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Update production URLs

### **Update MongoDB Atlas**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Network Access → Add IP: `0.0.0.0/0`

---

## 💡 **Important Notes**

### **Render Free Tier**
- ✅ Cron jobs work perfectly
- ⚠️ Service spins down after 15 min of inactivity
- ⚠️ Cold start: ~30 seconds on first request
- ✅ Cron jobs wake the service automatically

### **Vercel Free Tier**
- ✅ Perfect for Next.js
- ✅ Global CDN
- ✅ Unlimited bandwidth
- ✅ Always fast

---

## 🎉 **You're Live!**

**Frontend**: `https://contest-reminder-frontend.vercel.app`  
**Backend**: `https://contest-reminder-backend.onrender.com`

---

## 🐛 **Troubleshooting**

### **Backend not responding**
- Wait 30 seconds (cold start)
- Check Render logs for errors

### **Frontend can't reach backend**
- Verify `NEXT_PUBLIC_BACKEND_URL` is correct
- Redeploy frontend after changing env vars

### **Cron jobs not running**
- Check Render logs
- Verify MongoDB connection

---

**Need help?** Check the Render and Vercel documentation or ask me! 🙂
