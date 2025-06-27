# Frontend Guidelines: Dokani Platform

## 1. Overview
This document provides design and structural guidelines for the Next.js frontend of the Dokani platform.

## 2. Design System
- **Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **UI Components**: We will use a component library like **shadcn/ui**. It's a collection of accessible and reusable components that can be styled with Tailwind CSS, which is perfect for building a high-quality UI quickly.
- **Color Palette**:
  - **Primary**: `#eace0a` (vibrant yellow/gold) - Our principal brand color
  - **Primary Dark**: `#d4c009` (darker shade for hover states)
  - **Primary Light**: `#f0d82e` (lighter shade for backgrounds)
  - **Neutral**: Grays for text, backgrounds, and borders (e.g., `slate` or `gray` palette in Tailwind).
  - **Accent/Success**: Green (e.g., `emerald-500`) for success messages and "Approve" buttons.
  - **Accent/Danger**: Red (e.g., `red-500`) for error messages and "Deny" buttons.
  - **Accent/Warning**: Orange (e.g., `orange-500`) for "Under Review" or "Pending" statuses.
  - **Complementary**: Deep blue (e.g., `blue-700`) for contrast and secondary actions.
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
    - /analytics
      - page.tsx (comprehensive analytics dashboard)
    - /policy
      - page.tsx (visual policy editor and version management)
    - /requests
      - /[id]
        - page.tsx (view single request details)
    - /risk-assessment
      - page.tsx (risk management and fraud detection)
    - /file-management
      - page.tsx (evidence and asset management)
    - /testing
      - page.tsx (AI agent and persona testing tools)
    - /call-management
      - page.tsx (call history, analytics, and monitoring)
  /return (public, interactive return portal)
    - /[public_id]
      - page.tsx
  /settings (user preferences and profile)
    - page.tsx (user preferences and settings)
  /components (reusable UI components)
    /ui (shadcn/ui components)
    /custom (our custom-built components)
      - ReturnConversation.tsx
      - CaseTimeline.tsx
      - ReturnsTable.tsx
      - ReviewQueue.tsx
      - PolicyEditor.tsx
      - StatCard.tsx
      - AnalyticsDashboard.tsx
      - RiskAssessmentPanel.tsx
      - FileManager.tsx
      - TestingInterface.tsx
      - CallManager.tsx
      - UserPreferences.tsx
      - RealTimeStreaming.tsx
      - PersonaBuilder.tsx
  /lib (helper functions, utils)
    - supabase.ts (Supabase client setup)
    - analytics.ts (analytics utilities)
    - streaming.ts (real-time streaming utilities)
    - file-utils.ts (file management utilities)
```

### 3.2. Key Pages

- **`/(landing)`**: The main marketing page.
  - Components: `Header`, `HeroSection`, `FeatureGrid`, `PricingTable`, `Footer`.
- **`/auth/login`**: Login page with email/password and social login buttons.
- **`/auth/signup`**: Signup page.
- **`/dashboard`**: The main view after login.
  - Components: `StatCard` (for key metrics), `ReviewQueue` (for cases needing human review), `ReturnsTable` (list of all returns).
- **`/dashboard/analytics`**: Comprehensive analytics dashboard.
  - Components: `AnalyticsDashboard`, `ChartComponents`, `MetricsGrid`, `ExportTools`.
- **`/dashboard/policy`**: Page for creating, editing, and managing versions of return policies using the `PolicyEditor` component.
- **`/dashboard/requests/[id]`**: Detail view for a single return request. Shows all data, including the conversation log, AI recommendation, confidence score, and uploaded evidence.
- **`/dashboard/risk-assessment`**: Risk management and fraud detection interface.
  - Components: `RiskAssessmentPanel`, `FraudAlerts`, `RiskMetrics`, `RiskHistory`.
- **`/dashboard/file-management`**: Evidence and asset management system.
  - Components: `FileManager`, `AssetLibrary`, `FileUploader`, `FileOrganizer`.
- **`/dashboard/testing`**: AI agent and persona testing tools.
  - Components: `TestingInterface`, `AgentTester`, `PersonaTester`, `PolicySimulator`.
- **`/dashboard/call-management`**: Call history, analytics, and monitoring.
  - Components: `CallManager`, `CallHistory`, `CallAnalytics`, `CallMonitor`.
- **`/return/[public_id]`**: The interactive Return/Refund Portal. This is a single-page application experience for the customer.
  - Components: `ReturnConversation` and `CaseTimeline`.
- **`/settings`**: User preferences and profile management.
  - Components: `UserPreferences`, `ProfileManager`, `NotificationSettings`.

### 3.3. Key Custom Components

- **`ReturnConversation.tsx`**: The main customer-facing chat component within the Return/Refund Portal.
  - Manages the conversation state.
  - Handles text input from the user.
  - Interacts with Supabase Edge Functions to drive the workflow.
  - Supports real-time streaming responses.
- **`CaseTimeline.tsx`**: A component that displays the current stage and history of the return process (e.g., "Information Collection", "Under Review", "Completed").
- **`ReturnsTable.tsx`**: A data table (using `shadcn/ui`'s table component) to display and filter all return requests on the main dashboard.
- **`ReviewQueue.tsx`**: A dedicated component on the dashboard that lists all requests with the status `pending_review` for the merchant to action.
- **`StatCard.tsx`**: A simple card to display a key metric on the dashboard (e.g., "Total Returns", "Pending Review").
- **`PolicyEditor.tsx`**: A sophisticated component/set of components on the `/dashboard/policy` page for creating and editing the hierarchical policy rules (general, by category, etc.) and managing versions.
- **`AnalyticsDashboard.tsx`**: Comprehensive analytics dashboard with charts, metrics, and insights.
  - Real-time data visualization.
  - Custom date range filtering.
  - Export capabilities.
  - Interactive charts and graphs.
- **`RiskAssessmentPanel.tsx`**: Risk management interface for monitoring customer risk scores and fraud detection.
  - Risk score visualization.
  - Fraud alert management.
  - Risk factor analysis.
  - Risk mitigation recommendations.
- **`FileManager.tsx`**: File and asset management system.
  - File upload and organization.
  - Asset library management.
  - File tagging and categorization.
  - Access control management.
- **`TestingInterface.tsx`**: AI agent and persona testing tools.
  - AI agent testing with different scenarios.
  - Persona testing (voice/video).
  - Policy simulation testing.
  - Performance benchmarking.
- **`CallManager.tsx`**: Call management and monitoring interface.
  - Call history and recordings.
  - Call analytics and insights.
  - Real-time call monitoring.
  - Voice quality metrics.
- **`UserPreferences.tsx`**: User preferences and settings management.
  - Language and theme preferences.
  - Notification settings.
  - Default persona selection.
  - Accessibility settings.
- **`RealTimeStreaming.tsx`**: Real-time streaming components for live updates.
  - WebSocket connection management.
  - Server-Sent Events handling.
  - Real-time data visualization.
  - Live collaboration features.
- **`PersonaBuilder.tsx`**: Enhanced persona creation and management.
  - Voice persona creation (ElevenLabs).
  - Video persona creation (Tavus).
  - Persona testing and preview.
  - Persona organization and management.

## 4. State Management
- For simple state needs (like form inputs, modal visibility), we'll use React's built-in hooks (`useState`, `useEffect`).
- For global state (like the logged-in user's session), we'll use React's `Context` API, likely provided by the Supabase helper library. We don't need a complex state management library like Redux for this project.
- For real-time features, we'll use WebSocket connections and Server-Sent Events for live updates.
- For complex form state (like policy editor), we'll use React Hook Form for better performance and validation. 