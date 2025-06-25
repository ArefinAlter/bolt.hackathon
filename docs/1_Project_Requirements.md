# Project Requirements: Dokani B2B Return/Refund Platform (Hackathon Demo)

## 1. Overview

This document outlines the functional and non-functional requirements for Dokani, a B2B platform that streamlines decentralized return/refund workflows for small-to-medium e-commerce sellers. **This is a simulation-focused demo for hackathon purposes, demonstrating AI-powered return management without actual payment processing or social media integration.**

## 2. User Roles & Personas

- **End-Customer**: The individual who purchased a product and wishes to initiate a return. They interact with the AI agent via the Return/Refund Portal.
- **Merchant**: An employee or owner of the e-commerce business who configures return policies, monitors the business dashboard, and manages cases requiring human review.
- **AI Customer Service Agent**: An automated agent responsible for the initial customer interaction, information gathering, and guiding the user.
- **AI Triage Agent**: An automated agent that evaluates return requests against policies and determines the correct workflow.

## 3. Functional Requirements

### 3.1. Merchant Authentication & Portal Access
- [ ] **FR1.1**: A public-facing marketing/landing page describing the service.
- [ ] **FR1.2**: Business Admins (Merchants) must be able to sign up for an account.
- [ ] **FR1.3**: Registered merchants must be able to log in to access the Business Dashboard.

### 3.2. Business Dashboard
- [ ] **FR2.1**: After login, merchants are directed to a central dashboard.
- [ ] **FR2.2**: The dashboard must display a real-time list of all return requests with key details (Order ID, Customer Name, Date, Status).
- [ ] **FR2.3**: Merchants must be able to filter the list of returns by status (e.g., Pending, Approved, Denied, Under Review).
- [ ] **FR2.4**: Merchants must be able to view the full details of any return request, including conversation history and customer-uploaded evidence.
- [ ] **FR2.5**: A dedicated "Policy Management" section must be present for configuration.
- [ ] **FR2.6**: In this section, merchants can use a visual editor to define and version their return policy rules, including:
    - General rules (return windows, required evidence).
    - Product category customizations (category-specific rules, restocking fees).
    - Automated approval settings (order value thresholds, risk scores).
    - Policy versioning, preview, and rollback capabilities.
- [ ] **FR2.7**: Merchants must be able to review cases flagged for "Human Review" and manually "Approve" or "Deny" the request. The AI's recommendation and confidence score should be visible.
- [ ] **FR2.8**: The dashboard should display key analytics (e.g., number of returns, approval/denial rates, sentiment analysis).

### 3.3. Customer-Facing Return/Refund Portal
- [ ] **FR3.1**: The return process is initiated through direct access to the Return/Refund Portal (demo simulation).
- [ ] **FR3.2**: The portal features a chat interface for the customer to interact with the AI Customer Service Agent.
- [ ] **FR3.3**: The UI must include a visual timeline showing the customer the current stage and history of their case.
- [ ] **FR3.4**: The AI-driven conversation flow must be as follows:
    1.  The AI agent greets the customer and collects order information and the reason for the return.
    2.  If applicable (e.g., for "defective" items), it requests evidence like photos.
    3.  The request is passed to the Triage System for automated assessment against the merchant's policies.
    4.  **Instant Approval Flow**: If the request meets low-risk criteria, it is auto-approved, and the customer is notified of the simulated refund processing.
    5.  **Automatic Denial Flow**: If the request is a clear policy violation, it is auto-denied, and the customer receives a clear explanation.
    6.  **Human Review Flow**: If the case is high-risk or complex, it is flagged for human review in the Business Dashboard, and the customer is notified that it's "Under Review".
- [ ] **FR3.5**: The unique link (`/return/[public_id]`) allows the customer to return to the portal at any time to check the status of their request.

### 3.4. AI, Backend & Workflow
- [ ] **FR4.1**: The core logic will be orchestrated using Supabase Edge Functions.
- [ ] **FR4.2**: The system must integrate with OpenAI's GPT-4o API for the conversational AI agents.
- [ ] **FR4.3**: A Model Context Protocol (MCP) server layer must be implemented to ensure secure, structured communication between AI agents and business systems (Policy, Request, and Communication MCPs).
- [ ] **FR4.4**: Simulated refund processing workflow for demo purposes (no actual payment integration).

### 3.5. Voice & Video Capabilities
- [ ] **FC1.1**: **Voice Interaction**: The platform handles multimodal inputs allowing customers to initiate and conduct returns using voice notes.
- [ ] **FC1.2**: **AI-Powered Voice Responses**: The AI agents respond to customers using high-quality, generated voice (via ElevenLabs) to create a more engaging and accessible experience.
- [ ] **FC1.3**: **Video Interaction**: The platform supports video calls with AI agents using personalized video messages (via Tavus) for enhanced customer engagement.

## 4. Non-Functional Requirements

- [ ] **NFR1**: **Security**: All API keys, sensitive credentials, and customer data must be stored and handled securely. MCP servers will enforce security policies.
- [ ] **NFR2**: **Usability**: The Business Dashboard and Return/Refund Portal must be intuitive and easy to use for their respective users.
- [ ] **NFR3**: **Performance**: AI agent responses and status updates should be near real-time to ensure a smooth user experience.
- [ ] **NFR4**: **Scalability**: The architecture (Supabase, Next.js) should be chosen to support scaling with a growing number of businesses and return requests.
- [ ] **NFR5**: **Demo Focus**: The system should provide a compelling demonstration of AI-powered return management without requiring external payment or social media integrations. 