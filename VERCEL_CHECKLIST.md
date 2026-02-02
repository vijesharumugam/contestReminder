# Quick Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Generate CRON_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output - you'll need it!

### 2. Prepare Environment Variables

**Backend Variables:**
```
MONGODB_URI=
CLIST_USERNAME=
CLIST_API_KEY=
GMAIL_USER=
GMAIL_PASS=
TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_ADMIN_EMAIL=
CRON_SECRET=
NODE_ENV=production
```

**Frontend Variables:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
NEXT_PUBLIC_BACKEND_URL=
NEXT_PUBLIC_ADMIN_EMAIL=
```

---

## 🚀 Deployment Steps

### Backend
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. **Root Directory**: `backend`
4. Add all backend environment variables
5. Deploy
6. **Copy the deployment URL** (e.g., `https://your-backend.vercel.app`)

### Frontend
1. Import the same repository again
2. **Root Directory**: `frontend`
3. Add all frontend environment variables
4. **Set `NEXT_PUBLIC_BACKEND_URL`** to your backend URL from step 6 above
5. Deploy

---

## ⚠️ Important Notes

### Vercel Cron (Pro Plan Required)
- **Free Tier**: Cron jobs won't work automatically
- **Pro Tier ($20/month)**: Cron jobs work automatically

### Free Tier Workaround
Use [cron-job.org](https://cron-job.org) to trigger these URLs:

**Every 6 hours:**
```
https://your-backend.vercel.app/api/cron/fetch-contests
```

**Daily at 8 AM:**
```
https://your-backend.vercel.app/api/cron/daily-digest
```

**Every 5 minutes:**
```
https://your-backend.vercel.app/api/cron/upcoming-reminders
```

**Add this header to each cron job:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

---

## 🧪 Testing After Deployment

### 1. Test Backend
```bash
curl https://your-backend.vercel.app/
```
Should return: `Contest Reminder API Running`

### 2. Test Frontend
Visit your frontend URL and try:
- Sign up
- View contests
- Update preferences

### 3. Test Cron (Manual)
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-backend.vercel.app/api/cron/fetch-contests
```

---

## 🔧 MongoDB Atlas Setup

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (`0.0.0.0/0`)
4. This is required for Vercel's serverless functions

---

## 📱 Post-Deployment

1. Update Clerk dashboard with your production URLs
2. Test Telegram bot connection
3. Test email notifications
4. Monitor Vercel dashboard for errors

---

## 🆘 Common Issues

**"CRON_SECRET not configured"**
→ Add `CRON_SECRET` to Vercel environment variables

**"MongoDB Connection Error"**
→ Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`

**Frontend can't reach backend**
→ Verify `NEXT_PUBLIC_BACKEND_URL` is correct and redeploy

**Cron jobs not running**
→ Upgrade to Vercel Pro or use external cron service
