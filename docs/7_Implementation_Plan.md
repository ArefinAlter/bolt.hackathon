# Implementation Plan: Dokani Platform

This document breaks down the development process into phases and actionable steps.

## Phase 1: Setup & Foundation (Complete)
- [x] Set up GitHub repository.
- [x] Create accounts for Supabase, OpenAI, and Stripe.
- [x] Set up local development environment (Node.js, Cursor).
- [x] Create project documentation.

---

## Phase 2: Backend Foundation & Authentication

**Goal**: To create the database structure, set up serverless functions, and implement merchant authentication.

- **Step 1: Initialize Supabase Database**
  - [ ] Take the SQL schema from `3_Backend_Structure.md` and run it in the Supabase SQL Editor to create the `profiles`, `policies`, `return_requests`, and `mock_orders` tables.
  - [ ] Set up the Storage bucket named `return-evidence`.
  - [ ] Populate the `mock_orders` table with sample orders for testing.
  - [ ] Create an initial `policies` record for a test merchant with a JSON structure for rules.

- **Step 2: Initialize Next.js Project**
  - [ ] In the terminal, run `npx create-next-app@latest`.
  - [ ] Use TypeScript and Tailwind CSS.
  - [ ] Set up the `.env.local` file with Supabase and Stripe API key placeholders. Add `.env.local` to `.gitignore`.
  - [ ] Install the Supabase helper library: `npm install @supabase/auth-helpers-nextjs @supabase/supabase-js`.

- **Step 3: Create Merchant Authentication**
  - [ ] Build the sign-up, login, and logout functionality for merchants.
  - [ ] Create the pages in `/app/auth/login` and `/app/auth/signup`.
  - [ ] Protect the `/dashboard` route so only authenticated merchants can access it.

- **Step 4: Create Initial Supabase Edge Function**
  - [ ] Set up the Supabase CLI and link it to the project.
  - [ ] Create a new Edge Function (e.g., `init-return`).
  - [ ] This function will take an `order_id`, create a new record in `return_requests`, and return its `public_id`. This will be the entry point triggered by social media chat plugins.

---

## Phase 3: Business Dashboard & Policy Management

**Goal**: To build the merchant-facing dashboard for managing policies and reviewing returns.

- **Step 5: Build Landing Page**
  - [ ] Create the static landing page components and style with Tailwind CSS.

- **Step 6: Build Business Dashboard UI Shell**
  - [ ] Set up `shadcn/ui`.
  - [ ] Create the main dashboard layout (`/app/dashboard/layout.tsx`) with a sidebar for navigation.
  - [ ] Build the main dashboard page (`/app/dashboard/page.tsx`) to display `StatCard` components.

- **Step 7: Implement Visual Policy Editor**
  - [ ] Build the `/dashboard/policy` page.
  - [ ] Create the `PolicyEditor.tsx` component. This will be a form-based UI that allows a merchant to edit the fields of the `rules` JSONB object in their active policy.
  - [ ] Implement versioning logic (e.g., "Save as new version" button).

- **Step 8: Implement Returns & Review Queue View**
  - [ ] Create the `ReturnsTable.tsx` and `ReviewQueue.tsx` components.
  - [ ] On the dashboard, fetch and display all return requests.
  - [ ] Populate the `ReviewQueue` with requests that have the `pending_review` status.
  - [ ] Build the `/dashboard/requests/[id]` detail view to show all info, including the `conversation_log` and `ai_recommendation`. Add "Approve" / "Deny" buttons for the review queue cases.

---

## Phase 4: AI & Workflow Integration

**Goal**: To build the customer-facing return portal and integrate all backend AI and payment logic.

- **Step 9: Build the Return/Refund Portal Shell**
  - [ ] Build the public page at `/app/return/[public_id]/page.tsx`.
  - [ ] Create the `ReturnConversation.tsx` component with a message area and input field.
  - [ ] Create and include the `CaseTimeline.tsx` component.
  - [ ] The page should fetch the return request data on load.

- **Step 10: Implement Core Logic in Supabase Edge Functions**
  - [ ] Create a main `triage-return` Edge Function.
  - [ ] This function will:
    1.  Fetch the merchant's active policy from the `policies` table.
    2.  Call the OpenAI API with a detailed system prompt and the collected return data.
    3.  Parse the response from the AI.
    4.  Implement the logic for the three flows: Instant Approval, Automatic Denial, and Human Review.
    5.  Update the `return_requests` table with the correct status, AI recommendation, etc.
    6.  If approved, call the Stripe API to process a refund.

- **Step 11: Implement Full Conversation Loop**
  - [ ] Connect the `ReturnConversation.tsx` component to the `triage-return` Edge Function.
  - [ ] When the user provides all necessary information, the frontend calls the function.
  - [ ] The frontend updates the UI, including the `CaseTimeline`, based on the response from the function.
  - [ ] Implement evidence upload, saving the file to Supabase Storage and passing the URL to the triage function.

---

## Phase 5: Deployment & Final Touches

- **Step 12: Prepare for Deployment**
  - [ ] Thoroughly test all application flows (Merchant Onboarding, all three return flows).
  - [ ] Ensure all secrets are in environment variables.
- **Step 13: Deploy**
  - [ ] Create a new site in a service like Vercel or Netlify and link it to the GitHub repo.
  - [ ] Configure the build settings.
  - [ ] Copy all environment variables to the deployment platform's settings.
  - [ ] Trigger a deploy.
- **Step 14: Final Review**
  - [ ] Write the final presentation/demo script.
  - [ ] Record a video walkthrough of the application.

---

## Phase 6: Future Enhancements (Post-MVP)

- **Step 15: Integrate Voice & Video Capabilities**
  - [ ] **Voice Input/Output**: Integrate the ElevenLabs API into the core Edge Functions to generate audio from text responses. Update the `ReturnConversation.tsx` component to handle audio playback and utilize the browser's SpeechRecognition API for voice input.
  - [ ] **Video Generation**: Investigate and integrate the Tavus API to generate personalized video messages for customers at key decision points, such as an approval or denial notification.