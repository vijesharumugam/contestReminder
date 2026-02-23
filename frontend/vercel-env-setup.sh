# Quick script to add environment variables to Vercel
# Run this from the frontend directory

# Install Vercel CLI if not already installed
# npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
# When prompted, paste your Clerk publishable key (pk_live_... or pk_test_...)

vercel env add CLERK_SECRET_KEY production
# When prompted, paste your Clerk secret key (sk_live_... or sk_test_...)

vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production
# When prompted, paste: /sign-in

vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL production
# When prompted, paste: /sign-up

vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL production
# When prompted, paste: /

vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL production
# When prompted, paste: /

vercel env add NEXT_PUBLIC_TELEGRAM_BOT_USERNAME production
# When prompted, paste: Contest_rem_bot

vercel env add NEXT_PUBLIC_BACKEND_URL production
# When prompted, paste: https://contestreminder-krrf.onrender.com

vercel env add NEXT_PUBLIC_ADMIN_EMAIL production
# When prompted, paste: vijesharumugam26@gmail.com

# Redeploy
vercel --prod
