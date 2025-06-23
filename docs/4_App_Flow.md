# App Flow: AI Returns Agent

## 1. Overview
This document outlines the primary user flows for the AI Returns Agent application.

---

## Flow 1: New Business Admin Onboarding

**Persona**: Business Admin
**Goal**: To sign up, set up their business profile, and configure their first return policy.

1.  **Landing Page**: User arrives at the main landing page.
2.  **Sign Up**: User clicks "Sign Up" and registers for a new account using email/password or Google social sign-on.
3.  **First Login & Welcome**: Upon first login, the user is greeted with a welcome message and guided to set up their profile.
4.  **Profile Setup**: User enters their "Business Name" and "Website" into a simple form. This populates their record in the `profiles` table.
5.  **Policy Configuration**: The user is then directed to the "Policy Configuration" page.
6.  **Define Rules**: The user fills out the return policy form:
    -   Return Window (e.g., `30` days)
    -   Non-returnable Categories (e.g., `final_sale`)
    -   Sets photo requirement for defects.
7.  **Save Policy**: User saves the policy. They are now ready to process returns. The dashboard is currently empty.

---

## Flow 2: End-Customer Initiates a Return (Happy Path)

**Persona**: End-Customer
**Goal**: To successfully and automatically get a return approved and receive a shipping label.

1.  **Initiation**: Customer visits the merchant's website (a mock page for the POC) and opens the "Return Helper" chatbot. The chat interface displays a visual progress stepper, with the first stage "Initiated" highlighted.
2.  **Greeting**: The chatbot greets the customer and asks for their **Order Number**.
3.  **Order Lookup**:
    -   The frontend sends the Order Number to the n8n workflow. The UI stepper moves to "Verifying Order".
    -   n8n queries the `mock_orders` table in Supabase to find the order.
    -   **If not found**: The bot replies, "Sorry, I can't find that order number. Please double-check and try again." The stepper returns to "Initiated". -> **[End Flow]**
    -   **If found**: The workflow proceeds. The UI stepper moves to "Gathering Information".
4.  **Reason for Return**: The bot asks, "Why would you like to return this item?". It might offer buttons for common reasons (`Defective`, `Wrong Item`, `Changed Mind`).
5.  **Photo Upload (Conditional)**:
    -   The n8n workflow checks the merchant's `return_policies`. If the reason is `Defective` and `requires_photo_for_defect` is true, the bot asks the customer to upload a photo.
    -   The customer uploads a photo. The frontend uploads it directly to Supabase Storage and gets a URL back. This URL is passed to the n8n workflow.
6.  **AI Triage (n8n Workflow)**: The n8n workflow now has all the data: order details, reason, and photo URL (if applicable). The UI stepper moves to "Checking Policy".
    -   **Step 1 (Policy Check)**: The purchase date is checked against the `return_window_days` from the policy. The product category is checked against `non_returnable_categories`.
    -   **Step 2 (AI Decision)**: The collected data is passed to the OpenAI GPT API with a system prompt explaining its role. The prompt asks for a JSON output with `decision` (`approved`/`rejected`), `reasoning`, and `disposition` (`return_to_stock`, `recycle`, etc.).
7.  **Approval & RMA**:
    -   The AI decides to `approve`. The UI stepper moves to "Approved!".
    -   n8n generates a unique RMA number and creates a new entry in the `return_requests` table.
    -   n8n reads the `public_id` from the newly created row.
    -   The bot replies to the customer: "Great news! Your return is approved. Your RMA number is [RMA]. You can track the status of your return at any time using this link: /return/[public_id]". -> **[End Flow]**

---

## Flow 3: Return is Denied or Escalated

**Persona**: End-Customer
**Goal**: To understand why a return was denied or be connected with a human agent.

1.  **Steps 1-6**: Same as Flow 2.
2.  **AI Triage (Denial)**: The AI, based on the policy (e.g., outside return window), decides to `reject`. The UI stepper moves to "Decision".
3.  **Communicate Denial**:
    -   n8n updates the `return_requests` table with status `rejected`.
    -   The bot replies with an empathetic, clear message based on the AI's reasoning: "I'm sorry, but it looks like this item was purchased more than [policy.days] days ago, so it's outside our return window and cannot be returned." The stepper shows "Denied".
4.  **Customer Escalation**: The customer is unhappy and types, "This is ridiculous, I want to speak to a person."
5.  **Escalation Trigger**: The frontend or n8n detects frustration or keywords like "agent" or "person".
6.  **Flag for Review**:
    -   n8n updates the `return_requests` table status to `escalated`. The stepper shows "Escalated to Agent".
    -   The bot replies: "I understand your frustration. I've flagged your request for review by our support team. They will reach out to you at [customer.email] within 24 hours." -> **[End Flow]**

---

## Flow 4: Admin Manages an Escalation

**Persona**: Business Admin / Customer Service Agent
**Goal**: To review an escalated case and make a final decision.

1.  **Notification**: The admin logs into the dashboard and sees a "1" next to the "Escalated" filter.
2.  **Review**: The admin clicks the filter and sees the escalated request. They click to open the full details page.
3.  **Investigate**: The admin reviews the order details, the full chat transcript (future feature, simulated for now), the customer's photo, and the AI's initial reasoning for denial.
4.  **Manual Override**: The admin uses their judgment. They can add internal notes in the `admin_notes` field. They then click either "Approve" or "Reject".
5.  **Finalize**: The system updates the request status. (For the POC, a manual email to the customer is assumed next). -> **[End Flow]** 