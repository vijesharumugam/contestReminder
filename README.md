# 🎯 Contest Reminder System

A full-stack web application that sends automated email and Telegram notifications for upcoming coding contests from CodeChef, Codeforces, and LeetCode.

## ✨ Features

- 📧 **Email Notifications** - Daily digest and 30-minute reminders
- 📱 **Telegram Integration** - Real-time notifications via Telegram bot
- 🎨 **Modern UI** - Beautiful, responsive interface built with Next.js
- 🔐 **Authentication** - Secure user authentication with Clerk
- 📊 **Admin Dashboard** - Manage users and test notifications
- 🌍 **Multi-Platform** - Supports CodeChef, Codeforces, and LeetCode
- ⚡ **Real-time Updates** - Automatic contest data fetching every 6 hours

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** CSS Modules
- **Authentication:** Clerk
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Atlas)
- **Scheduling:** node-cron
- **Email:** Nodemailer (multi-provider support)
- **Telegram:** node-telegram-bot-api

### External Services
- **Contest Data:** CLIST API
- **Email:** SendGrid / Resend / Mailgun / Gmail
- **Notifications:** Telegram Bot API
- **Hosting:** Render (Backend) + Vercel (Frontend)

## 📁 Project Structure

```
APItest/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── Contest.js            # Contest schema
│   │   ├── User.js               # User schema
│   │   └── NotificationLog.js    # Notification tracking
│   ├── routes/
│   │   ├── contests.js           # Contest endpoints
│   │   ├── users.js              # User management
│   │   └── admin.js              # Admin operations
│   ├── services/
│   │   ├── clistService.js       # CLIST API integration
│   │   ├── mailer.js             # Multi-provider email service
│   │   ├── scheduler.js          # Cron job handlers
│   │   └── telegramService.js    # Telegram bot
│   ├── server.js                 # Express app entry point
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Home page (contest list)
│   │   ├── layout.tsx            # Root layout
│   │   ├── admin/                # Admin dashboard
│   │   ├── sign-in/              # Sign in page
│   │   └── sign-up/              # Sign up page
│   ├── components/
│   │   ├── Navbar.tsx            # Navigation bar
│   │   └── ContestCard.tsx       # Contest display card
│   ├── hooks/
│   │   └── useUserSync.ts        # User sync with backend
│   └── package.json
├── .env                          # Development environment variables
├── .env.development              # Development config
├── .env.production               # Production config template
├── .env.example                  # Environment variables template
├── EMAIL_SETUP_GUIDE.md          # Quick email setup guide
├── PRODUCTION_DEPLOYMENT_GUIDE.md # Full deployment guide
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- MongoDB Atlas account (or local MongoDB)
- CLIST API credentials
- Email service account (Gmail for dev, SendGrid for production)
- Telegram Bot token (optional)
- Clerk account for authentication

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd APItest
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# CLIST API
CLIST_USERNAME=your_clist_username
CLIST_API_KEY=your_clist_api_key

# Email (Gmail for development)
EMAIL_PROVIDER=gmail
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# Admin
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@gmail.com

# Environment
NODE_ENV=development
PORT=5000
```

Start the backend:

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk Routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# Telegram Bot
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username

# Admin Email
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@gmail.com
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📧 Email Service Setup

### Development (Local)
Use Gmail SMTP - quick and easy:

1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
   ```env
   EMAIL_PROVIDER=gmail
   GMAIL_USER=your_email@gmail.com
   GMAIL_PASS=your_16_character_app_password
   ```

### Production (Deployed)
**⚠️ Gmail SMTP doesn't work reliably in production!**

Use SendGrid (recommended):

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Verify your sender email
3. Create an API key
4. Add to Render environment variables:
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxx...
   SENDGRID_FROM_EMAIL=your_verified_email@gmail.com
   SENDGRID_FROM_NAME=Contest Reminder
   ```

**📖 Detailed Setup:** See [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)

## 🌍 Production Deployment

### Backend (Render)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your GitHub repository
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables (see `.env.production`)
6. Deploy!

### Frontend (Vercel)

1. Push code to GitHub
2. Import project on Vercel
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework:** Next.js
4. Add environment variables
5. Deploy!

**📖 Full Guide:** See [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)

## 🔧 Environment Variables

### Backend Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `CLIST_USERNAME` | Yes | CLIST API username |
| `CLIST_API_KEY` | Yes | CLIST API key |
| `EMAIL_PROVIDER` | Yes | `gmail`, `sendgrid`, `resend`, or `mailgun` |
| `GMAIL_USER` | If using Gmail | Gmail address |
| `GMAIL_PASS` | If using Gmail | Gmail app password |
| `SENDGRID_API_KEY` | If using SendGrid | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | If using SendGrid | Verified sender email |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Yes | Admin email address |

### Frontend Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Backend API URL |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Yes | Telegram bot username |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Yes | Admin email (must match backend) |

## 📅 Scheduled Jobs

The backend runs these cron jobs:

- **Contest Fetch:** Every 6 hours - Updates contest data from CLIST API
- **Daily Digest:** 8:00 AM daily - Sends email with today's contests
- **30-min Reminders:** Every 5 minutes - Checks for contests starting in 30 minutes
- **Keep-Alive:** Every 10 minutes (production only) - Prevents Render free tier sleep

## 🧪 Testing

### Test Email Service

1. Start the backend
2. Check logs for: `[Mailer] ✅ Email service verified successfully`
3. Go to admin dashboard
4. Click "Test Gmail" button
5. Check your email

### Test Telegram

1. Start the backend
2. Message your bot on Telegram: `/start`
3. Go to admin dashboard
4. Click "Test Telegram" button
5. Check Telegram for message

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify all required environment variables are set
- Check Node.js version (requires 20+)

### Emails not sending
- **Development:** Check Gmail app password is correct
- **Production:** Verify email provider API key and sender email
- Check logs for detailed error messages
- See [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_BACKEND_URL` is correct
- Check backend is running
- Check CORS is enabled in backend

### Contests not showing
- Check CLIST API credentials
- Trigger manual fetch: `GET /api/trigger-fetch`
- Check MongoDB connection

## 📚 API Documentation

### Contest Endpoints

- `GET /api/contests` - Get all contests
- `GET /api/contests?platform=CodeChef` - Filter by platform
- `GET /api/contests/platforms` - Get available platforms

### User Endpoints

- `POST /api/users/sync` - Sync user from Clerk
- `GET /api/users/:clerkId` - Get user by Clerk ID
- `PUT /api/users/:clerkId/preferences` - Update preferences
- `POST /api/users/:clerkId/telegram` - Link Telegram account

### Admin Endpoints

- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/test-email` - Send test email
- `POST /api/admin/test-telegram` - Send test Telegram message

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

- **Email Setup Issues:** See [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)
- **Deployment Issues:** See [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- **General Issues:** Check the troubleshooting section above

## 🎉 Acknowledgments

- Contest data provided by [CLIST API](https://clist.by/)
- Authentication by [Clerk](https://clerk.com/)
- Email service by [SendGrid](https://sendgrid.com/) / [Resend](https://resend.com/)

---

**Built with ❤️ for competitive programmers**