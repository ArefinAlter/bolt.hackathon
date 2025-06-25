# Backend Structure: Dokani Platform (Hackathon Demo)

## 1. Overview

This document specifies the backend architecture for the Dokani platform, which includes the database schema (PostgreSQL via Supabase), serverless functions, and the Model Context Protocol (MCP) server layer. **This is a simulation-focused demo for hackathon purposes.**

## 2. Authentication

- We will use Supabase's built-in authentication for Merchants.
- **Table**: `auth.users` (managed by Supabase)
- **Primary User Role**: `merchant`
- **Authentication Method**: Email/Password.

## 3. Database Tables

We will need the following tables to store our application's data.

### Table 1: `profiles`

This table stores public data related to a registered user. It has a one-to-one relationship with the `auth.users` table.

- **Purpose**: To store business-specific information not suitable for the `auth.users` table.
- **Fields**:
  - `id` (uuid, Primary Key): Foreign key to `auth.users.id`.
  - `created_at` (timestamp with time zone): Automatically managed.
  - `business_name` (text): The name of the e-commerce business.
  - `website` (text, nullable): The company's website.

### Table 2: `policies`

Stores versioned return policy rules for each business. The complex, hierarchical rule structure is stored in a JSONB column.

- **Purpose**: To provide a flexible and version-controlled source of truth for the Policy Engine and AI Agents.
- **Fields**:
  - `id` (bigint, Primary Key): Auto-incrementing unique identifier.
  - `created_at` (timestamp with time zone): Automatically managed.
  - `business_id` (uuid): Foreign key to `profiles.id`. Links the policy to a business.
  - `version` (text): Semantic version number (e.g., "1.0.0", "1.1.0").
  - `is_active` (boolean, default: false): Indicates if this is the currently active policy version.
  - `effective_date` (timestamp with time zone): When this policy version becomes active.
  - `rules` (jsonb): A JSON object containing the detailed policy configuration, including general rules, category customizations, and auto-approval logic.

### Table 3: `return_requests`

The core table that tracks every single return request initiated by a customer.

- **Purpose**: To serve as the main log of all return activities, viewable on the Business Dashboard.
- **Fields**:
  - `id` (bigint, Primary Key): Auto-incrementing unique identifier.
  - `public_id` (uuid, default: `gen_random_uuid()`): A unique, non-guessable identifier for public-facing links.
  - `created_at` (timestamp with time zone): Automatically managed.
  - `business_id` (uuid): Foreign key to `profiles.id`. Links the request to a business.
  - `order_id` (text): The original order number from the e-commerce store.
  - `customer_email` (text): The email of the customer making the return.
  - `reason_for_return` (text): The reason provided by the customer.
  - `status` (text): The current status of the request. Must be one of: `pending_triage`, `pending_review`, `approved`, `denied`, `completed`.
  - `evidence_urls` (array of text, nullable): An array of URLs pointing to images or other evidence uploaded by the customer.
  - `conversation_log` (jsonb, nullable): A structured log of the conversation between the customer and the AI agent.
  - `ai_recommendation` (text, nullable): The recommendation from the Triage Agent (e.g., "Auto-Approve", "Flag for Review").
  - `ai_confidence_score` (float, nullable): The confidence score of the AI's recommendation.
  - `admin_notes` (text, nullable): Internal notes added by a merchant during a human review.

### Table 4: `mock_orders`

A simple table to simulate an external ERP/order management system for the hackathon POC.

- **Purpose**: To allow the chatbot to look up an order and verify its existence and purchase date.
- **Fields**:
  - `id` (bigint, Primary Key): Auto-incrementing unique identifier.
  - `order_id` (text, unique): The order number (e.g., "ORDER-12345").
  - `purchase_date` (timestamp with time zone): The date the order was placed.
  - `customer_email` (text): The email associated with the order.
  - `product_name` (text): Name of the product purchased.
  - `product_category` (text): Category of the product.

## 4. Serverless Functions (Supabase Edge Functions)

Supabase Edge Functions are the compute layer of the application, responsible for:
- **Request Initiation**: A function is triggered by direct portal access to create a new `return_requests` record and generate a unique portal link.
- **AI Agent Orchestration**: Functions host the logic for the AI Customer Service and Triage Agents, managing the conversation flow and state.
- **Triage System**: A core function that takes request data, fetches the active policy from the `policies` table, and runs the evaluation logic (auto-approve, deny, or flag for review).
- **External API Integration**: Functions handle all communication with external services like OpenAI (for AI models), ElevenLabs (for voice), and Tavus (for video).
- **Simulated Refund Processing**: Functions handle simulated refund workflow for demo purposes.

## 5. Storage

- We will use **Supabase Storage**.
- A bucket named `return-evidence` will be created.
- It will be used to store the photos and other evidence files customers upload for their return requests.
- Row Level Security (RLS) policies will be configured to ensure that customers can only upload files for their own return requests.

## 6. MCP Server Architecture (Conceptual)

To ensure secure and structured communication, the platform uses a conceptual Model Context Protocol (MCP) server layer. This layer sits between the AI Agents and the core business data/services.

- **Policy MCP Server**: Serves policy documents to AI agents, validates requests against rules, and logs all policy-related decisions.
- **Request MCP Server**: Manages the end-to-end lifecycle of a return request, including status changes, evidence handling, and coordinating with simulated payment systems.
- **Communication MCP Server**: Secures inter-agent messaging, implements security measures like circuit breakers and rate limiting, and ensures a complete audit trail.

## 7. Demo-Specific Architecture

### 7.1 Simulation Components
- **Mock Payment Processing**: Simulated refund workflow without actual payment integration
- **Demo Data**: Pre-populated with realistic test scenarios and mock orders
- **Direct Portal Access**: Return process initiated through direct portal access rather than social media integration

### 7.2 Hackathon Optimizations
- **Rapid Development**: Focus on core AI functionality and user experience
- **Single User Experience**: Seamless switching between business and customer roles
- **Real-time Interaction**: Live AI conversations and decision making
- **Voice/Video Integration**: Ready-to-use ElevenLabs and Tavus integration for enhanced demo experience 