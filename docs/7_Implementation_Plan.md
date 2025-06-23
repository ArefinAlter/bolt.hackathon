# Implementation Plan: AI Returns Agent

This document breaks down the development process into phases and actionable steps.

## Phase 1: Setup & Foundation (Complete)
- [x] Set up GitHub repository.
- [x] Create accounts for Supabase, n8n, OpenAI, ElevenLabs.
- [x] Set up local development environment (Node.js, Cursor).
- [x] Create project documentation.

---

## Phase 2: Backend & Workflow Setup

**Goal**: To create the database structure and the basic n8n workflow that will power the application logic.

- **Step 1: Initialize Supabase Database**
  - [ ] Take the SQL schema from `3_Backend_Structure.md` and run it in the Supabase SQL Editor to create the `profiles`, `return_policies`, `return_requests` (with the new `public_id` field), and `mock_orders` tables.
  - [ ] Set up the Storage bucket named `product-images`.
  - [ ] Populate the `mock_orders` table with 3-4 sample orders for testing.

- **Step 2: Initialize Next.js Project**
  - [ ] In the terminal, run `npx create-next-app@latest` to create a new Next.js project.
  - [ ] Use TypeScript and Tailwind CSS.
  - [ ] Set up the `.env.local` file with Supabase URL and Anon Key placeholders. Add `.env.local` to `.gitignore`.
  - [ ] Install the Supabase helper library: `npm install @supabase/auth-helpers-nextjs @supabase/supabase-js`.

- **Step 3: Create Authentication**
  - [ ] Build the sign-up, login, and logout functionality using the Supabase library.
  - [ ] Create the pages in `/app/auth/login` and `/app/auth/signup`.
  - [ ] Protect the `/dashboard` route so only authenticated users can access it.

- **Step 4: Build Basic n8n Workflow**
  - [ ] In n8n, create a new workflow.
  - [ ] **Node 1**: Add a **Webhook** node. This will be the entry point for our chatbot. Copy its Test URL.
  - [ ] **Node 2**: Add a **Supabase** node (Execute Query). Configure it with your Supabase credentials. Write a simple query to fetch an order from `mock_orders` based on an `order_id` passed from the webhook.
  - [ ] Test the workflow by sending a mock request to the webhook URL with a sample `order_id`.

---

## Phase 3: Frontend Development

**Goal**: To build the user-facing landing page and the secure admin dashboard.

- **Step 5: Build Landing Page**
  - [ ] Create the static landing page components (`Hero`, `Features`, etc.) in the `/app` directory.
  - [ ] Style it with Tailwind CSS according to the design guidelines.

- **Step 6: Build Admin Dashboard UI Shell**
  - [ ] Set up `shadcn/ui` by running its `init` command in the terminal.
  - [ ] Create the main dashboard layout (`/app/dashboard/layout.tsx`) with a sidebar for navigation (links to "Dashboard", "Policy").
  - [ ] Build the main dashboard page (`/app/dashboard/page.tsx`) to display `StatCard` components.

- **Step 7: Implement Policy Management**
  - [ ] Build the `/dashboard/policy` page.
  - [ ] Create a form that allows an admin to create or update their record in the `return_policies` table.
  - [ ] Connect the form to Supabase to save the data.

- **Step 8: Implement Returns View**
  - [ ] Create the `ReturnsTable` component.
  - [ ] On the main dashboard page, fetch all records from the `return_requests` table that belong to the logged-in admin.
  - [ ] Pass the data to the `ReturnsTable` component.
  - [ ] Create the detail view page `/dashboard/requests/[id]` to show all information for a single return.

- **Step 9: Build Public Status Page**
  - [ ] Build the public page at `/app/return/[public_id]/page.tsx`.
  - [ ] This page will fetch a single `return_request` using the `public_id` from the URL.
  - [ ] It will display the status of the return in a clear, user-friendly format.

---

## Phase 4: Chatbot & AI Integration

**Goal**: To connect the frontend chatbot to the n8n workflow and integrate the AI services.

- **Step 10: Build the Chatbot Component**
  - [ ] Create the `Chatbot.tsx` component with a message area and an input field.
  - [ ] Create and include the `TriageStatusVisualizer.tsx` component inside the chatbot UI.
  - [ ] When the user sends a message, POST it to the n8n webhook URL.

- **Step 11: Enhance n8n Workflow (Core Logic)**
  - [ ] Extend the n8n workflow from Step 4.
  - [ ] Add nodes to fetch the `return_policies` for the business.
  - [ ] Add an **IF** node to check the return window.
  - [ ] Add an **HTTP Request** node to call the OpenAI API. Construct a detailed prompt using the data collected.
  - [ ] Parse the JSON response from OpenAI.
  - [ ] When a return is approved, ensure the workflow saves the request and then retrieves the `public_id` to send back to the frontend.

- **Step 12: Implement Full Chat Loop**
  - [ ] Configure n8n to send the AI's response (and current status for the visualizer) back to the chatbot.
  - [ ] The chatbot component should display the AI's message and update the `TriageStatusVisualizer`.
  - [ ] Implement the logic for photo uploads, saving the image to Supabase Storage and passing the URL to n8n.
  - [ ] Implement the escalation logic (flagging the request in Supabase).
  - [ ] On approval, display the unique status URL to the user.

- **Step 13: Integrate Voice**
  - [ ] Add **HTTP Request** nodes in n8n to call the ElevenLabs API to convert the AI's text response to speech.
  - [ ] The n8n workflow should return a URL to the generated audio file.
  - [ ] The `Chatbot.tsx` component should be able to play this audio file automatically.

---

## Phase 5: Deployment & Final Touches

- **Step 14: Prepare for Deployment**
  - [ ] Thoroughly test all application flows.
  - [ ] Ensure all secrets are in environment variables and the code is clean.
- **Step 15: Deploy to Netlify**
  - [ ] Create a new site in Netlify and link it to the GitHub repository.
  - [ ] Configure the build settings (e.g., `next build`).
  - [ ] Copy all the values from `.env.local` into the Netlify environment variables settings in the UI.
  - [ ] Trigger a deploy.
- **Step 16: Final Review**
  - [ ] Write the final presentation/demo script.
  - [ ] Record a video walkthrough of the application. 