# Project Rules for AI Assistant

You are an expert AI programmer helping me build a B2B SaaS application called "AI Returns Agent" for a hackathon. Your goal is to help me develop the app efficiently and according to plan.

## 1. Adhere to the Documentation

Before you write any code or make any changes, you must refer to the official project documents located in the `/docs` directory:
- `1_Project_Requirements.md`: What the app must do.
- `2_Tech_Stack.md`: The tools we must use.
- `3_Backend_Structure.md`: The shape of our data in Supabase.
- `4_App_Flow.md`: How users will interact with the app.
- `5_Frontend_Guidelines.md`: How the app should look and be structured.

Your suggestions and code must be consistent with these documents. If I ask for something that contradicts them, please point out the conflict and ask for clarification.

## 2. Security First

- You must **NEVER** write API keys, passwords, or any other secrets directly in the code.
- Always assume that secrets will be handled by environment variables (e.g., `process.env.SUPABASE_KEY`).
- When generating code that accesses Supabase, always use the environment variable placeholders for the URL and anon key.
- Remind me to create a `.env.local` file and add it to `.gitignore` if it's missing.

## 3. Frontend Development

- **Tech**: Use **Next.js 13+** with the **App Router**. All components should be server components by default unless client-side interactivity is explicitly required (`'use client'`).
- **Language**: Use **TypeScript**. All functions, props, and state variables should have explicit types.
- **Styling**: Use **Tailwind CSS** for all styling. Do not write traditional CSS files or use styled-components.
- **Components**: For UI, prioritize using components from the **shadcn/ui** library. If a suitable component doesn't exist there, we can build a custom one.
- **Structure**: Follow the directory structure defined in `5_Frontend_Guidelines.md`.

## 4. Backend (Supabase)

- When writing SQL or database-related code, you must adhere strictly to the table and column names defined in `3_Backend_Structure.md`.
- When I need to set up the database, you should provide me with the exact SQL statements to create the tables and enable Row Level Security (RLS).
- For database access from the frontend, use the official `@supabase/supabase-js` library.

## 5. Workflow (n8n)

- When designing the n8n workflow, you should provide a JSON export of the workflow if possible.
- If not, describe the nodes and their connections in detail:
  1.  **Webhook Node**: To receive requests from the frontend.
  2.  **Supabase Nodes**: To execute queries and fetch data.
  3.  **HTTP Request Nodes**: To call external APIs like OpenAI and ElevenLabs.
  4.  **Function Nodes (Code)**: For custom data transformation.
  5.  **Switch/IF Nodes**: For conditional logic (e.g., checking the return policy).
- All API calls from n8n must use credentials stored securely within n8n's credential manager, not hardcoded in the node.

## 6. Code Quality

- Your code should be clean, readable, and well-commented (but only for non-obvious logic).
- Follow standard conventions for the language and framework we are using.
- Provide clear explanations for the code you generate. 