# Multi-Agent Research Platform

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/ronak501s-projects/v0-multi-agent-research-platform)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/qa3WcjzEs1A)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/ronak501s-projects/v0-multi-agent-research-platform](https://vercel.com/ronak501s-projects/v0-multi-agent-research-platform)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/qa3WcjzEs1A](https://v0.app/chat/qa3WcjzEs1A)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Local Development

This repository is standardized on npm.

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Do not use pnpm or yarn in this repository.

## Payments

This project now includes Razorpay subscriptions for the Pro and Premium plans.

Required environment variables:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RAZORPAY_PRO_PLAN_ID`
- `RAZORPAY_PREMIUM_PLAN_ID`
- `NEXT_PUBLIC_APP_URL`

Setup flow:

1. Create the two recurring plans in Razorpay.
1. Add the env vars above in your local `.env.local` and your hosting provider.
1. Run the Supabase migration in `supabase/migrations/20260508000100_add_razorpay_subscription_columns.sql`.
1. Point the Razorpay webhook to `POST /api/billing/webhook`.
1. Open `/price` and click a paid plan to test the checkout flow.