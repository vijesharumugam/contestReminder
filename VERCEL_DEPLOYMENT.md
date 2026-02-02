# Vercel Deployment Guide

## 🚀 Deploying to Vercel

This project is now configured for Vercel deployment with serverless functions and Vercel Cron.

### Prerequisites
- Vercel account (free tier works)
- MongoDB Atlas database (already configured)
- All API keys ready (CLIST, Gmail, Telegram, Clerk)

---

## 📦 Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### **Backend Deployment**

1. **Go to [Vercel Dashboard](https://vercel.com/new)**

2. **Import your repository**
   - Connect your GitHub/GitLab account
   - Select your repository

3. **Configure the backend project**
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: Leave empty (not needed for serverless)
   - **Output Directory**: Leave empty

4. **Add Environment Variables** (click "Environment Variables")
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   CLIST_USERNAME=your_clist_username
   CLIST_API_KEY=your_clist_api_key
   GMAIL_USER=your_email@gmail.com
   GMAIL_PASS=your_gmail_app_password
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@gmail.com
   CRON_SECRET=your_random_secret_string
   NODE_ENV=production
   ```

   **Generate CRON_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Deploy** - Click "Deploy"

6. **Note your backend URL** (e.g., `https://your-backend.vercel.app`)

---

#### **Frontend Deployment**

1. **Import the same repository again** (or add as new project)

2. **Configure the frontend project**
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
   CLERK_SECRET_KEY=sk_xxx
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotName
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
   NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@gmail.com
   ```

4. **Deploy** - Click "Deploy"

---

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy backend
cd backend
vercel --prod

# Deploy frontend
cd ../frontend
vercel --prod
```

---

## ⏰ Vercel Cron Configuration

The cron jobs are automatically configured in `backend/vercel.json`:

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Fetch Contests | Every 6 hours | `/api/cron/fetch-contests` |
| Daily Digest | 8:00 AM daily | `/api/cron/daily-digest` |
| 30-min Reminders | Every 5 minutes | `/api/cron/upcoming-reminders` |

**Important**: Vercel Cron is only available on **Pro plans** ($20/month). 

### Free Tier Alternative
If you're on the free tier, you can use an external cron service:
- [cron-job.org](https://cron-job.org) (free)
- [EasyCron](https://www.easycron.com) (free tier available)

Configure them to hit your endpoints with the Bearer token:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-backend.vercel.app/api/cron/fetch-contests
```

---

## 🔒 Security Notes

1. **CRON_SECRET**: Keep this secret! It prevents unauthorized access to cron endpoints
2. **Environment Variables**: Never commit `.env` files to Git
3. **MongoDB**: Ensure your MongoDB Atlas IP whitelist includes `0.0.0.0/0` for Vercel

---

## ✅ Verification

After deployment:

1. **Test Backend API**
   ```bash
   curl https://your-backend.vercel.app/
   # Should return: "Contest Reminder API Running"
   ```

2. **Test Frontend**
   - Visit your frontend URL
   - Sign up/Sign in should work
   - Contest calendar should load

3. **Test Cron Endpoints** (manual trigger)
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-backend.vercel.app/api/cron/fetch-contests
   ```

---

## 🐛 Troubleshooting

### Issue: "CRON_SECRET not configured"
- Add `CRON_SECRET` to Vercel environment variables

### Issue: "MongoDB Connection Error"
- Check `MONGODB_URI` is correct
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`

### Issue: Cron jobs not running
- Verify you're on Vercel Pro plan
- Check Vercel dashboard → Project → Cron Jobs tab
- Use external cron service if on free tier

### Issue: Frontend can't reach backend
- Update `NEXT_PUBLIC_BACKEND_URL` to your actual backend URL
- Redeploy frontend after changing env vars

---

## 📊 Monitoring

- **Vercel Dashboard**: Monitor function invocations and errors
- **Logs**: View real-time logs in Vercel dashboard
- **Cron Jobs**: Check execution history in Vercel Cron tab

---

## 💰 Cost Estimate

**Free Tier:**
- Frontend: Free (100GB bandwidth)
- Backend: Free (100GB bandwidth, 100 hours serverless execution)
- ⚠️ Cron: Not available (use external service)

**Pro Tier ($20/month):**
- Everything unlimited
- ✅ Vercel Cron included
- Better performance and support

---

## 🔄 Local Development

The project still works locally:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

Cron jobs won't run locally (they're Vercel-specific), but you can manually trigger them:
```bash
curl -H "Authorization: Bearer your_local_secret" \
  http://localhost:5000/api/cron/fetch-contests
```
