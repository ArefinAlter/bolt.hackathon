# Frontend Guidelines: Dokani Platform

## 1. Overview
This document provides design and structural guidelines for the Next.js frontend of the Dokani platform.

## 2. Design System
- **Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **UI Components**: We will use a component library like **shadcn/ui**. It's a collection of accessible and reusable components that can be styled with Tailwind CSS, which is perfect for building a high-quality UI quickly.
- **Color Palette**:
  - **Primary**: A modern, trustworthy blue (e.g., `#2563EB` or `blue-600` in Tailwind).
  - **Neutral**: Grays for text, backgrounds, and borders (e.g., `slate` or `gray` palette in Tailwind).
  - **Accent/Success**: Green (e.g., `emerald-500`) for success messages and "Approve" buttons.
  - **Accent/Danger**: Red (e.g., `red-500`) for error messages and "Deny" buttons.
  - **Accent/Warning**: Yellow or orange (e.g., `amber-500`) for "Under Review" or "Pending" statuses.
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
      - page.tsx (visual policy editor and version management)
    - /requests
      - /[id]
        - page.tsx (view single request details)
  /return (public, interactive return portal)
    - /[public_id]
      - page.tsx
  /components (reusable UI components)
    /ui (shadcn/ui components)
    /custom (our custom-built components)
      - ReturnConversation.tsx
      - CaseTimeline.tsx
      - ReturnsTable.tsx
      - ReviewQueue.tsx
      - PolicyEditor.tsx
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
  - Components: `StatCard` (for key metrics), `ReviewQueue` (for cases needing human review), `ReturnsTable` (list of all returns).
- **`/dashboard/policy`**: Page for creating, editing, and managing versions of return policies using the `PolicyEditor` component.
- **`/dashboard/requests/[id]`**: Detail view for a single return request. Shows all data, including the conversation log, AI recommendation, confidence score, and uploaded evidence.
- **`/return/[public_id]`**: The interactive Return/Refund Portal. This is a single-page application experience for the customer.
  - Components: `ReturnConversation` and `CaseTimeline`.

### 3.3. Key Custom Components

- **`ReturnConversation.tsx`**: The main customer-facing chat component within the Return/Refund Portal.
  - Manages the conversation state.
  - Handles text input from the user.
  - Interacts with Supabase Edge Functions to drive the workflow.
- **`CaseTimeline.tsx`**: A component that displays the current stage and history of the return process (e.g., "Information Collection", "Under Review", "Completed").
- **`ReturnsTable.tsx`**: A data table (using `shadcn/ui`'s table component) to display and filter all return requests on the main dashboard.
- **`ReviewQueue.tsx`**: A dedicated component on the dashboard that lists all requests with the status `pending_review` for the merchant to action.
- **`StatCard.tsx`**: A simple card to display a key metric on the dashboard (e.g., "Total Returns", "Pending Review").
- **`PolicyEditor.tsx`**: A sophisticated component/set of components on the `/dashboard/policy` page for creating and editing the hierarchical policy rules (general, by category, etc.) and managing versions.

## 4. State Management
- For simple state needs (like form inputs, modal visibility), we'll use React's built-in hooks (`useState`, `useEffect`).
- For global state (like the logged-in user's session), we'll use React's `Context` API, likely provided by the Supabase helper library. We don't need a complex state management library like Redux for this project. 