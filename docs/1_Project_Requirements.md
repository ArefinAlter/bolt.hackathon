# Project Requirements: AI Returns Agent

## 1. Overview

This document outlines the functional and non-functional requirements for the AI Returns Agent, a B2B SaaS platform for the bolt.new Hackathon. The system will provide an automated, AI-driven solution for managing e-commerce product returns.

## 2. User Roles & Personas

- **End-Customer**: The individual who purchased a product and wishes to initiate a return. They interact with the chatbot.
- **Business Admin**: An employee of the e-commerce company who configures return policies, monitors the dashboard, and manages the overall system.
- **Customer Service Agent**: An employee who handles escalated return requests that the AI cannot resolve.

## 3. Functional Requirements

### 3.1. Landing Page & User Authentication
- [ ] **FR1.1**: A public-facing marketing/landing page describing the service.
- [ ] **FR1.2**: Must include sections for Features, Pricing (mock), and a "Log In" / "Sign Up" call-to-action.
- [ ] **FR1.3**: Business Admins must be able to sign up for an account using an email and password.
- [ ] **FR1.4**: Registered admins must be able to log in to access the admin dashboard.
- [ ] **FR1.5**: Social login (e.g., Google) should be available for convenience.

### 3.2. Admin Dashboard
- [ ] **FR2.1**: After login, admins are directed to a central dashboard.
- [ ] **FR2.2**: The dashboard must display a list of all return requests with key details (Order ID, Customer Name, Date, Status).
- [ ] **FR2.3**: Admins must be able to filter the list of returns by status (Pending, Approved, Rejected, Escalated).
- [ ] **FR2.4**: Admins must be able to view the full details of a single return request, including customer-uploaded photos.
- [ ] **FR2.5**: A dedicated section for "Policy Configuration" must be present.
- [ ] **FR2.6**: In this section, admins can define their return policy rules (e.g., number of days for the return window, product categories that are non-returnable). This will be a simple form.
- [ ] **FR2.7**: Admins must have buttons to manually "Approve" or "Reject" an escalated return request.
- [ ] **FR2.8**: The dashboard should display key analytics (e.g., number of returns processed, approval rate).

### 3.3. Customer-Facing Chatbot (Proof of Concept)
- [ ] **FR3.1**: The chatbot will be embeddable on a mock e-commerce website.
- [ ] **FR3.2**: The chatbot must handle both text and voice input/output (using ElevenLabs/Tavus).
- [ ] **FR3.3**: The chatbot UI must include a visual indicator (e.g., a stepper or progress bar) showing the customer the current stage of the triage process (e.g., "Verifying Order", "Checking Policy", "Decision").
- [ ] **FR3.4**: The conversation flow must be as follows:
    1.  Greeting & request for Order Number.
    2.  Lookup order details via an API call to the backend (Supabase).
    3.  Ask for the reason for the return (dropdown or free text).
    4.  If applicable (e.g., for "defective" items), request a photo upload.
    5.  The AI triages the request against the merchant's configured policy.
    6.  If approved, issue an RMA number and provide a unique, public link to a status tracking page.
    7.  If denied, provide a clear, empathetic explanation.
    8.  If the customer expresses frustration or the case is complex, escalate to a human agent (flag the request as "Escalated" in the dashboard).
- [ ] **FR3.5**: A public, read-only page must exist at a unique URL (`/return/[public_id]`) where a customer can view the current status of their return without logging in.

### 3.4. AI & Workflow
- [ ] **FR4.1**: The core logic will be orchestrated in an n8n workflow.
- [ ] **FR4.2**: The system must integrate with OpenAI's API for natural language understanding and decision-making.
- [ ] **FR4.3**: The system must integrate with ElevenLabs for text-to-speech.

## 4. Non-Functional Requirements

- [ ] **NFR1**: **Security**: All API keys and sensitive credentials must be stored securely using environment variables, never in the codebase.
- [ ] **NFR2**: **Usability**: The admin dashboard and chatbot interface must be intuitive and easy to use for non-technical users.
- [ ] **NFR3**: **Performance**: Chatbot responses should be near real-time to ensure a smooth conversational experience. API lookups should be efficient.
- [ ] **NFR4**: **Scalability**: While this is a POC, the architecture (Supabase, Netlify, n8n) should be chosen with future scalability in mind. 