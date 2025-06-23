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
