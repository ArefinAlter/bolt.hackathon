# AI Returns Agent for E-commerce & F-Commerce

This project is a submission for the **bolt.new World's Largest Hackathon**.

## Project Goal

The AI Returns Agent is a B2B SaaS platform designed to solve a critical and costly problem for e-commerce and f-commerce businesses: managing product returns. Our goal is to transform the returns process from a logistical nightmare and margin killer into a streamlined, value-recovering, and positive customer experience.

The agent automates return merchandise authorizations (RMAs), triages products for the most cost-effective disposition, and provides a seamless conversational interface for customers, freeing up human support agents to handle high-value tasks.

## Key Features

- **Conversational AI Chatbot**: Engages customers via text and voice (powered by ElevenLabs & Tavus) to initiate and process return requests.
- **Automated RMA Triage**: Automatically checks return eligibility against business policies (return window, product condition, etc.) using data from the business's backend.
- **Intelligent Disposition Engine**: Decides the best route for returned items (return to stock, refurbish, donate, recycle) to maximize value recovery.
- **Business Admin Dashboard**: A central hub for businesses to configure return policies, monitor all return requests in real-time, and handle escalations.
- **Automated Customer Communication**: Keeps customers informed with RMA status updates, shipping labels, and refund notifications.

## Tech Stack

- **Frontend**: Next.js (A popular framework for building modern web applications)
- **Backend & Database**: Supabase (For user management, database, and secure API access)
- **AI & Voice**:
  - **Core Logic**: OpenAI GPT API
  - **Text-to-Speech & Voice Cloning**: ElevenLabs
  - **Conversational Video**: Tavus
- **Workflow Automation**: n8n (To orchestrate the complex return logic and connect different services)
- **Deployment**: Netlify
- **Source Control**: GitHub

---

## 🛑 Ground Rules & Security Guidelines

This is an open-source project for a hackathon, but we adhere to strict security and privacy rules.

### 1. **Protect Secrets at All Costs**
   - **DO NOT** commit any secret keys, passwords, or sensitive credentials directly into the code. This includes API keys for OpenAI, ElevenLabs, Supabase, etc.
   - We will use **environment variables** to manage these secrets. A special file (`.env.local`), which is ignored by Git, will hold these keys on our local development machines. For deployment, we will configure these secrets directly in the Netlify dashboard.

### 2. **No Real Customer Data**
   - During development and for the hackathon demo, we will use **mock (fake) data only**.
   - We will not use or store any real personal information (names, addresses, order details) of any individuals.

### 3. **Responsible AI Usage**
   - The system is designed to be helpful and empathetic, with clear escalation paths to human agents when the AI cannot handle a request or a customer is frustrated.

### 4. **Privacy by Design**
   - While this is a POC, it's designed with privacy in mind. A production version would require a comprehensive privacy policy and clear data handling procedures for business clients. 


## Bolt Provided Services

### NEW!! Creator Tier Access from ElevenLabs
Get 3 months of ElevenLabs Creator Tier free which includes 100k credits/month, pro voice cloning, and 192 kbps audio. Go to https://elevenlabs.io/?coupon=WORLDSLARGESTHACK-c9a5d1b8

After signing up an ElevenLabs account (please choose developer category during sign up), click the above link to redeem the coupon code. After the code has been added to your account, navigate to the subscriptions section (My Workspace > Subscription), and select the Creator tier. The coupon will be automatically added on the checkout page. Please do remember to downgrade to a free account before the coupon runs out to avoid being charged. Thank you and happy hacking!.

The above should help you tackle the Voice AI Challenge! Refer to the docs for a quickstart and detailed tutorial. For support, join the ElevenLabs Discord Server!

Please see all the rules and main requirements on the hackathon site.

If you run into any issues, please reach out to the support team of the specific tool above and don't hesitate to reach out on the Bolt Discord Server.

 

## Here are the other items from your original Builder Pack
 

### Step One: Register for Free Bolt Pro
Some of the other offers require you to have an active Bolt Pro account to work- which is free! Use this $30 code for a free Pro account or as credit when upgrading to a larger plan

$30 of Bolt.new credit: DNSY2060
Go to Bolt’s pricing page and click Upgrade to Pro. Use the provided promo code in the “Add promotion code” section. Provide a valid payment method and complete the checkout steps Already a paying customer? You’ll receive additional credit automatically when you apply the promo code.

 

### Step Two: Redeem sponsor perks 
RevenueCat is 100% free for Bolt participants, no coupon needed.
Our SDK helps you monetize your app in minutes, with support for mobile and web. You’ll only pay once your app’s making $2.5K+ per month. Build with Bolt, monetize and get paid with RevenueCat. Go to rev.cat/bolt enter your email address and click Start for Free.

### Free Domain for 1 year from Entri
Once you have Bolt Pro, claim your custom domain by visiting this page. Sign in with the same credentials as your Bolt Pro account. Just build your app in Bolt, deploy it to Netlify, and then claim your free domain.

### API Credit from Algorand/IPFS: BOLTnzggkgbnfm512
Get 2 months of Nodely Unlimited API access (a $512 value) free. Go to nodely.io/bolt-new-promo, click Redeem now, add your promo code at checkout, and complete with valid payment info to start your free trial.

### 2 Months Free Pro Access to Pica: GO-BOLT-ebfa836f
Get 2 months of Pro access, completely free — a $200 value. Enjoy all premium features with no restrictions. Available for a limited time. New users only. To redeem: Go to Pica Billing Settings → Click Manage Plan → Select Pro → Enter your code at checkout.

### 6-Months of Monitoring with Sentry: bolt-sentry-wlh
Build with AI, debug with Sentry. Hackathon participants get 6 months of Sentry’s Team Plan for new organizations — includes error monitoring, logs, replays, and performance tracing. To redeem: Go to Sentry Promo Page → Click Redeem Promo Code → Enter your code at checkout.

### 1 Free Month of Expo Production ($99 value) Code: Boltfriends
Build and ship unlimited during the hackathon with a free month of Expo's Production plan. To redeem: Create an account → Go to Billing → View Plans → Select your account → Upgrade Plan → Enter the code at checkout.

### $50 in Lingo credits: LINGODOTDEV676976
Localize your app in 85+ languages with $50 in credits (valid for 1 year after redemption). To redeem: Create an account → Go to Settings → Select Pro Subscription → Enter your code.

### $25 in API Credits + 50% Off Dappier: BOLT50
Enhance your Bolt projects with AI search and custom copilots. Monetize with native ads or go ad-free with 50% off paid plans. All new users get $25 in free API credits. To redeem: Create an account → Visit Subscription Plan → Select Starter Plan → Enter code at checkout.

### 50% discount for one year of 21st.dev: BOLT-23CA9NLJ
Get full access to Magic AI and Pro tools for generating UI components. To redeem: Create an account → Go to Pricing → Select Pro Plan → Enter your code at checkout.

### Free 1-Year DEV++ Membership: SFJM8XV8
Unlock special DEV features and 20+ exclusive offers from top tech companies like Neon and .fun domains — great for experimenting and building. Go to https://dev.to/++, click Join DEV++ and follow the steps to enter your promo code and check out.

### $150 in Free Tavus Credits
Get 250 free conversational video minutes, up to 3 concurrent CVI streams, and 3 free replica generations when you sign up or click this link with an existing Tavus account. New limits are visible on your Tavus Portal billing page, with detailed usage under “invoice history.” Once credits run out, you can subscribe to a paid plan for more usage.
