# App Flow: Dokani Platform

## 1. Overview
This document outlines the primary user flows for the Dokani platform.

---

## Flow 1: New Merchant Onboarding

**Persona**: Merchant
**Goal**: To sign up, set up their business profile, and configure their return policies.

1.  **Landing Page**: Merchant arrives at the main landing page.
2.  **Sign Up**: Merchant clicks "Sign Up" and registers for a new account.
3.  **First Login & Welcome**: Upon first login, the user is guided to set up their business profile.
4.  **Profile Setup**: Merchant enters their "Business Name" and "Website" into a simple form.
5.  **Policy Configuration**: The merchant is then directed to the "Policy Management" dashboard.
6.  **Define Rules**: Using the visual policy editor, the merchant defines their return rules across multiple dimensions:
    - **General Rules**: Return window, required evidence, etc.
    - **Category Rules**: Specific rules for different product categories.
    - **Auto-Approval**: Thresholds for order value, risk scores, etc.
7.  **Save and Version Policy**: The merchant saves the policy, creating `v1.0.0`. They can test it in a simulation environment before activating it. Once activated, the system is ready to process returns against these rules.

---

## Flow 2: Instant Approval Flow

**Persona**: End-Customer
**Business Triggers**: Low-value order, within policy, valid reason, evidence provided.
**Goal**: To have a simple return request approved and refunded automatically.

1.  **Initiation**: Customer is on a social media channel (e.g., Facebook Messenger) and clicks a "Start a Return" button in the chat with the business.
2.  **Redirection to Portal**: A Supabase Edge Function generates a unique, secure link that is sent to the customer. Clicking it opens the **Return/Refund Portal**.
3.  **Information Collection**: The AI Customer Service Agent greets the customer and collects the necessary information (e.g., order number, reason for return). The portal's visual timeline shows the current status.
4.  **Evidence Upload**: The agent prompts the customer to upload a photo of the defective item. The file is saved to Supabase Storage.
5.  **Triage System (Automated)**: The collected data is sent to the Triage System. A Supabase Edge Function fetches the merchant's active policy and evaluates the request.
6.  **Risk Assessment**: The system determines the request is low-risk and compliant with all auto-approval rules.
7.  **Auto-Approval & Refund**:
    - The Triage System marks the `return_requests` status as `approved`.
    - It triggers another function to process the refund immediately via the Stripe API.
8.  **Customer Notification**: The agent informs the customer: "Your return has been approved and your refund has been processed. You will see it in your account within 3-5 business days." The timeline is updated to "Completed". -> **[End Flow]**

---

## Flow 3: Automatic Denial Flow

**Persona**: End-Customer
**Business Triggers**: Clear policy violation (e.g., return window expired, final sale item).
**Goal**: To receive a clear, immediate explanation for a denied return request.

1.  **Steps 1-5**: Same as Flow 2.
2.  **Risk Assessment**: The Triage System determines the request is a clear policy violation (e.g., the order is 90 days old, but the return window is 30 days).
3.  **Auto-Denial**: The Triage System marks the `return_requests` status as `denied`.
4.  **Customer Communication**: The AI agent provides a clear, empathetic explanation: "I'm sorry, but this request cannot be approved because the item was purchased more than 30 days ago, which is outside our return window." It also provides a link to the policy and an option to appeal to a human. The timeline is updated to "Denied". -> **[End Flow]**

---

## Flow 4: Human Review Flow

**Persona**: End-Customer
**Business Triggers**: High-value order, complex case, conflicting evidence.
**Goal**: To have a complex case reviewed by the business.

1.  **Steps 1-5**: Same as Flow 2.
2.  **Risk Assessment**: The Triage System determines the request requires human judgment (e.g., a very expensive item with a non-standard return reason).
3.  **Flag for Review**:
    - The Triage System provides a recommendation (e.g., "Approve") and a confidence score.
    - It updates the `return_requests` status to `pending_review` and flags it for the merchant.
4.  **Customer Notification**: The AI agent informs the customer: "Thank you for the information. Your request requires a closer look by our team. We will review it and notify you of the decision within 1-2 business days." The timeline is updated to "Under Review". -> **[End Flow]**

---

## Flow 5: Merchant Manages a Human Review Case

**Persona**: Merchant
**Goal**: To review a flagged case and make a final decision.

1.  **Notification**: The merchant logs into the Business Dashboard and sees a new item in their "Review Queue".
2.  **Review Case**: The merchant opens the case details page. They can see all collected information: customer chat history, uploaded evidence, order details, and the AI's recommendation ("Approve") and confidence score (e.g., 85%).
3.  **Decision**: The merchant reviews the information and makes a judgment. They can add internal notes. They then click either **"Approve"** or **"Deny"**.
4.  **System Action**:
    - **If Approved**: The system updates the status to `approved` and initiates the refund via Stripe.
    - **If Denied**: The system updates the status to `denied`.
5.  **Final Notification**: A notification is automatically sent to the customer informing them of the final decision. -> **[End Flow]**

---

## Future Enhancements: Multimodal Communication

The flows described above can be enhanced in the future with voice and video capabilities. For example, in the **Instant Approval Flow**, a customer could initiate the return by sending a voice note. The AI Customer Service Agent would transcribe the audio, process the request, and could respond with a generated voice message from ElevenLabs confirming the refund, creating a more natural and accessible interaction.