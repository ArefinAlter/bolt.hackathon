# AI Returns Agent

## Description

The AI Returns Agent is a B2B service designed for e-commerce and retail businesses in fcommerce to streamline their product returns and refund processes. It features a conversational AI agent that interacts with customers to process return requests, triages items based on store policies, and determines the most cost-effective disposition for each returned product (e.g., return to stock, refurbish, donate, or recycle).

This project aims to reduce the financial impact of returns by minimizing manual processing costs, ensuring consistent policy application, and recovering value from returned goods. It provides a seamless experience for the end-customer and a powerful dashboard for business administrators.

This project is being developed for the bolt.new World's Largest Hackathon.

## Key Features

- **Conversational AI Chatbot**: Engages customers to initiate and process return requests via text and voice.
- **Automated RMA Triage**: Automatically checks return eligibility against business policies (e.g., return window, product condition).
- **Intelligent Disposition**: Decides the best route for returned items to maximize value recovery.
- **Image-based Fraud Detection**: Analyzes customer-uploaded photos to detect potential fraud.
- **Admin Dashboard**: Allows businesses to configure policies, monitor returns, and manage escalations.
- **Automated Notifications**: Keeps customers informed with shipping labels and status updates.

## Tech Stack

- **Frontend**: Next.js (A popular framework for building modern web applications)
- **Backend & Database**: Supabase
- **AI & Voice**:
  - **Core Logic**: OpenAI GPT API
  - **Text-to-Speech & Voice Cloning**: ElevenLabs
  - **Conversational Video**: Tavus
- **Workflow Automation**: n8n
- **Deployment**: Netlify
- **Source Control**: GitHub 