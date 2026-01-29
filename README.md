# 🏆 Contest Reminder System

A production-ready, full-stack web application to track and get reminders for coding contests from Codeforces, CodeChef, and LeetCode.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Tech Stack](https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js)
![Tech Stack](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?style=flat-square&logo=mongodb)

## ✨ Features

- **🔄 Multi-platform Support**: Codeforces, CodeChef, LeetCode (powered by CLIST API)
- **📡 Automated Fetching**: Periodic updates from CLIST API every 6 hours
- **📧 Email Notifications**: Daily digests at 8 AM and 30-minute pre-contest reminders
- **📱 Telegram Bot**: Optional real-time notifications via dedicated bot
- **🎨 Modern UI**: Next.js 16+ with Tailwind CSS v4, glassmorphism design, and Framer Motion animations
- **🔐 Secure Auth**: Powered by Clerk authentication

## 🏗️ Architecture

```
├── backend/                 # Express.js API server
│   ├── config/             # Database configuration
│   ├── models/             # MongoDB schemas (User, Contest, NotificationLog)
│   ├── routes/             # API routes (users, contests, admin)
│   └── services/           # Business logic (CLIST, mailer, scheduler, telegram)
│
├── frontend/               # Next.js 16 application
│   ├── app/               # App Router pages
│   ├── components/        # React components (Navbar, ContestCard, Footer)
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility functions
│
└── .env                   # Backend environment variables
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Clerk account
- CLIST API account
- Gmail App Password
- Telegram Bot Token (optional)

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend** (root `.env`):
```env
MONGODB_URI=mongodb://127.0.0.1:27017/contestreminder
CLIST_USERNAME=your_clist_username
CLIST_API_KEY=your_clist_api_key
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotName
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
```

See `.env.example` files for complete documentation.

### 3. Run the System

You need **two terminals**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access the app at: `http://localhost:3000`

## 📱 Telegram Integration

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Add the token to root `.env` as `TELEGRAM_BOT_TOKEN`
3. Add the bot username to `frontend/.env.local` as `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
4. In the web app, go to **Settings** and click **Connect Telegram**
5. Press **START** in the bot to link your account

## 📬 Notification Schedule

| Type | Time | Description |
|------|------|-------------|
| Daily Digest | 8:00 AM UTC | Summary of all contests in next 24 hours |
| Pre-contest | 30 min before | Reminder for each contest you're tracking |

## 🛠️ API Endpoints

### Users
- `POST /api/users/sync` - Sync user from Clerk
- `GET /api/users/:clerkId` - Get user status
- `PUT /api/users/preferences` - Update notification preferences
- `POST /api/users/disconnect-telegram` - Disconnect Telegram

### Contests
- `GET /api/contests` - Get upcoming contests (with optional `?platform=` filter)
- `GET /api/contests/platforms` - Get unique platforms

### Admin (requires admin email header)
- `GET /api/admin/users` - Get all users
- `POST /api/admin/test-email` - Send test email
- `POST /api/admin/test-telegram` - Send test Telegram message

## 📦 Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- node-cron (scheduling)
- Nodemailer (email)
- node-telegram-bot-api

**Frontend:**
- Next.js 16 (App Router)
- Tailwind CSS v4
- Clerk (authentication)
- Framer Motion (animations)
- Axios (HTTP client)
- Lucide React (icons)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

---

**Made with ❤️ by Vijesh Arumugam**