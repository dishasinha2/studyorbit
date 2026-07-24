# Authentication Configuration

## Overview

StudyOrbit uses Supabase Auth for email OTP and Google OAuth sign-in. The app expects the browser client to be configured with the public Supabase project URL and anon key, and the server can optionally use the service-role key for admin and storage operations.

## Required environment variables

Set these variables in .env.local for local development and in the deployment environment for production:

- NEXT_PUBLIC_SUPABASE_URL
  - The Supabase project URL, for example: https://<project-ref>.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY
  - The public anon key from the Supabase project API settings.
- SUPABASE_SERVICE_ROLE_KEY
  - Optional but recommended for server-side storage/admin workflows.

The app also relies on the existing database connection:

- DATABASE_URL
  - PostgreSQL connection string for Prisma.

## Supabase setup steps

1. Create or open the Supabase project used by StudyOrbit.
2. In Project Settings > API, copy:
   - Project URL
   - Project API keys > anon public
   - Project API keys > service_role (for server-side features)
3. Add the values to your environment files:
   - .env.local (local)
   - deployment secrets (production)
4. In Authentication > Settings, enable the providers required by the app:
   - Email OTP
   - Google OAuth
5. In Authentication > URL Configuration, add the redirect URLs used by the app:
   - Local: http://localhost:3000/auth/callback
   - Production: https://<your-domain>/auth/callback

## Google OAuth setup steps

1. Open Google Cloud Console and create or select an OAuth client.
2. Add the authorized redirect URI used by Supabase:
   - https://<supabase-project-ref>.supabase.co/auth/v1/callback
3. In Supabase Auth > Providers > Google, enable Google and paste the Google client ID and client secret.
4. Save the provider settings and test the sign-in flow from the StudyOrbit /auth page.

## Runtime validation behavior

The app now validates Supabase auth configuration on startup and surfaces a clear error when required variables are missing. This prevents silent failures and makes misconfiguration obvious during development and deployment.

## Deployment configuration

For production deployment, ensure the following are available in the deployment environment:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (if storage/admin features are used)
- DATABASE_URL

Also verify the production domain is included in the Supabase redirect URL list and in the Google OAuth authorized redirect settings.
