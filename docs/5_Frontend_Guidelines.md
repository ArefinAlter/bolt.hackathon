# Frontend Guidelines: AI Returns Agent

## 1. Overview
This document provides design and structural guidelines for the Next.js frontend of the AI Returns Agent application.

## 2. Design System
- **Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **UI Components**: We will use a component library like **shadcn/ui**. It's a collection of accessible and reusable components that can be styled with Tailwind CSS, which is perfect for building a high-quality UI quickly.
- **Color Palette**:
  - **Primary**: A modern, trustworthy blue (e.g., `#2563EB` or `blue-600` in Tailwind).
  - **Neutral**: Grays for text, backgrounds, and borders (e.g., `slate` or `gray` palette in Tailwind).
  - **Accent/Success**: Green (e.g., `emerald-500`) for success messages and "Approve" buttons.
  - **Accent/Danger**: Red (e.g., `red-500`) for error messages and "Reject" buttons.
  - **Accent/Warning**: Yellow or orange (e.g., `amber-500`) for "Escalated" status.
- **Typography**:
  - **Font**: Use a clean, sans-serif font like **Inter**, which can be easily imported from Google Fonts.
  - **Hierarchy**: Clear heading sizes (h1, h2, h3) and body text.
- **Layout**: Clean, spacious, and modern. Use cards, modals, and consistent padding. The interface should be responsive and work well on both desktop and mobile devices.

## 3. Page & Component Structure

This outlines the key pages and reusable components to be built.

### 3.1. Directory Structure
```
/app
  / (landing page, public)
    - page.tsx
  /auth (authentication pages)
    - /login
      - page.tsx
    - /signup
      - page.tsx
  /dashboard (protected admin routes)
    - layout.tsx (shared dashboard layout with sidebar/nav)
    - page.tsx (main dashboard view)
    - /policy
      - page.tsx (policy configuration)
    - /requests
      - /[id]
        - page.tsx (view single request details)
  /return (public status tracking page)
    - /[public_id]
      - page.tsx
  /components (reusable UI components)
    /ui (shadcn/ui components)
    /custom (our custom-built components)
      - Chatbot.tsx
      - TriageStatusVisualizer.tsx
      - ReturnsTable.tsx
      - StatCard.tsx
  /lib (helper functions, utils)
    - supabase.ts (Supabase client setup)
```

### 3.2. Key Pages

- **`/(landing)`**: The main marketing page.
  - Components: `Header`, `HeroSection`, `FeatureGrid`, `PricingTable`, `Footer`.
- **`/auth/login`**: Login page with email/password and social login buttons.
- **`/auth/signup`**: Signup page.
- **`/dashboard`**: The main view after login.
  - Components: `StatCard` (for key metrics), `ReturnsTable` (list of recent returns).
- **`/dashboard/policy`**: Page for creating/editing the `return_policy`. Will contain a form.
- **`/dashboard/requests/[id]`**: Detail view for a single return request. Shows all data from the `return_requests` table, including linked photos.
- **`/return/[public_id]`**: A public page that shows the status of a single return request. It will fetch the return data based on the `public_id` and display its current status in a user-friendly way.

### 3.3. Key Custom Components

- **`Chatbot.tsx`**: The main customer-facing component.
  - Will contain the `TriageStatusVisualizer`.
  - Manages the conversation state (messages).
  - Handles text and voice input.
  - Interacts with the n8n workflow webhook.
- **`TriageStatusVisualizer.tsx`**: A component that displays the current step of the return process (e.g., as a stepper or a timeline). It will take the current status as a prop.
- **`ReturnsTable.tsx`**: A data table (using `shadcn/ui`'s table component) to display and filter return requests.
- **`StatCard.tsx`**: A simple card to display a key metric on the dashboard (e.g., "Total Returns", "Pending Approval").
- **`PolicyForm.tsx`**: The form used on the `/dashboard/policy` page.

## 4. State Management
- For simple state needs (like form inputs, modal visibility), we'll use React's built-in hooks (`useState`, `useEffect`).
- For global state (like the logged-in user's session), we'll use React's `Context` API, likely provided by the Supabase helper library. We don't need a complex state management library like Redux for this project. 