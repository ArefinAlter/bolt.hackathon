# Key Features: Dokani Platform

This document highlights the standout features of the Dokani platform, designed to provide a robust, intelligent, and scalable B2B returns solution.

## 1. Social Media Chat Integration
Dokani meets customers where they are. Businesses can integrate "Start a Return" buttons directly into their Facebook Messenger and WhatsApp chat flows. This seamless starting point reduces friction and initiates the return process instantly by triggering a backend function that generates a unique link to the portal.

- **Technology**: Web plugins, Supabase Edge Functions

## 2. Dynamic, Multi-Flow Triage System
At the heart of Dokani is an intelligent Triage System that assesses each return request and automatically routes it down one of three paths:
- **Instant Approval Flow**: For low-risk, policy-compliant requests.
- **Human Review Flow**: For complex or high-value cases requiring merchant judgment.
- **Automatic Denial Flow**: For clear policy violations.

This ensures efficiency for the business and fast, clear outcomes for the customer.

- **Technology**: Supabase Edge Functions, OpenAI GPT-4o

## 3. Interactive Return & Refund Portal
Customers receive a unique link to a modern, single-page portal built with Next.js. This portal features:
- **An AI-powered chat interface** for conversational information gathering.
- **A real-time visual timeline** that shows the customer the exact status of their case from initiation to completion.

- **Technology**: Next.js, Supabase Realtime, Tailwind CSS

## 4. Advanced Policy Management System
Dokani empowers merchants with granular control over their return logic through a powerful dashboard. Key capabilities include:
- **Visual Policy Editor**: An intuitive interface to define general rules, product-category-specific rules, and auto-approval thresholds.
- **Policy Versioning**: Policies can be versioned, tested in a simulation, and scheduled for activation, with a full history and rollback capability.

- **Technology**: Next.js, Supabase (PostgreSQL with JSONB)

## 5. AI-Powered Agents (GPT-4o)
The platform utilizes two distinct AI agents to manage the workflow:
- **Customer Service Agent**: A customer-facing conversational agent that handles information collection with an empathetic and professional tone.
- **Triage Agent**: A backend agent that analyzes the case against business policies, assesses risk, and determines the appropriate workflow, providing recommendations for human reviewers.

- **Technology**: OpenAI GPT-4o, Supabase Edge Functions

## 6. Business Dashboard with AI-Assisted Review
Merchants get a comprehensive dashboard to monitor all return activities. A key feature is the **Review Queue** for cases flagged for human review. Here, merchants can see all case details alongside the Triage Agent's recommendation and confidence score, enabling faster, more consistent decisions.

- **Technology**: Next.js, Supabase, Tailwind CSS, shadcn/ui

## 7. Secure and Scalable Architecture
The platform is built on a modern, serverless stack designed for security and scalability. The conceptual **Model Context Protocol (MCP) Server layer** ensures that communication between AI agents and core systems is secure, structured, and auditable.

- **Technology**: Supabase (Database, Auth, Storage, Edge Functions), Next.js

## 8. Future-Ready: Voice & Video Capabilities
The architecture is designed to be extensible for multimodal communication. Planned future integrations with services like **ElevenLabs (voice)** and **Tavus (video)** will allow the AI agents to handle customer interactions via voice notes or video calls, and respond in the same medium for a highly engaging and accessible experience.
