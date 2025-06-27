# Dokani Platform Security & Deployment Guide

This guide details security best practices and deployment steps for the Dokani platform backend, including authentication, authorization, secrets management, rate limiting, error handling, and deploying Supabase Edge Functions.

---

## 1. Authentication & Authorization

- **JWT Authentication**: All API calls require a valid Supabase JWT token in the `Authorization` header.
- **Row Level Security (RLS)**: Enforced on all database tables. Only authorized users can access or modify data.
- **Role-based Access**: Use custom claims in JWTs to distinguish between admins, agents, and customers.

---

## 2. Secrets & Environment Management

- **Environment Variables**: Store API keys, secrets, and configuration in environment variables (never hard-code in code).
- **Supabase Secrets**: Use the Supabase dashboard or CLI to manage secrets for Edge Functions.
- **.env Files**: For local development, use `.env` files and add them to `.gitignore`.

---

## 3. Rate Limiting & Abuse Prevention

- **Built-in Rate Limiting**: Each function group has rate limits (see `function_reference.md`).
- **429 Handling**: Clients should handle `429 Too Many Requests` errors and implement exponential backoff.
- **IP Throttling**: Optionally, add IP-based throttling for sensitive endpoints.

---

## 4. Error Handling & Logging

- **Standardized Errors**: All functions return structured error responses (see `integration_guide.md`).
- **No Sensitive Data**: Never expose stack traces or sensitive info in error messages.
- **Audit Logging**: Log all critical actions (e.g., policy changes, escalations, admin actions) to the `audit_logs` table.
- **Monitoring**: Use Supabase logs and third-party tools (e.g., Sentry) for monitoring and alerting.

---

## 5. Secure File Uploads

- **Validation**: Validate file type, size, and content before accepting uploads.
- **Storage**: Store files in secure Supabase Storage buckets with access controls.
- **Virus Scanning**: Integrate with a virus scanning service for uploaded files if possible.
- **Temporary URLs**: Use signed URLs for file access.

---

## 6. Deployment of Edge Functions

### a. Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Logged in to Supabase (`supabase login`)
- Project linked (`supabase link`)

### b. Deploying Functions
```sh
supabase functions deploy <function-name>
```
- Deploy all functions in `supabase/functions/` as needed.
- Use `supabase functions list` to verify deployment status.

### c. Environment Configuration
- Set secrets and environment variables via the Supabase dashboard or CLI:
```sh
supabase secrets set KEY=VALUE
```
- Ensure all required secrets (API keys, provider tokens) are set before deploying.

### d. Production Deployment
- Use Supabase's hosted Edge runtime for production.
- For custom domains, configure DNS and SSL in the Supabase dashboard.
- Monitor function logs and errors via the dashboard.

---

## 7. Database Security

- **RLS Policies**: Write strict RLS policies for all tables (see `database_schema.md`).
- **Least Privilege**: Grant only necessary permissions to each role.
- **Backups**: Enable automated backups in Supabase.

---

## 8. Best Practices

- **Keep dependencies up to date**
- **Review code for security vulnerabilities**
- **Rotate secrets regularly**
- **Use HTTPS for all endpoints**
- **Test RLS and access controls thoroughly**
- **Document all custom policies and roles**

---

## 9. References

- [Integration Guide](./integration_guide.md)
- [Function Reference](./function_reference.md)
- [Database Schema](./database_schema.md)
- [Supabase Security Docs](https://supabase.com/docs/guides/auth)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)

---

For further help, contact the backend or DevOps team, or consult the project documentation. 