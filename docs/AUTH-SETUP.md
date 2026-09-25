# NRICart authentication activation

The Google button is implemented; the Google provider and custom SMTP still require owner configuration. These settings are not exposed by the connected Supabase tools.

## Branded mail

In Supabase project vzsmqzovlgasnoynpjbr, Authentication > Email > SMTP settings, set sender name NRICart and sender email polagan8@gmail.com. Use SMTP credentials belonging to that Gmail account. Gmail SMTP commonly uses smtp.gmail.com port 465 (SSL) or 587 (TLS), username polagan8@gmail.com, and an app password generated with 2-Step Verification enabled. Enter the app password directly in Supabase, never in chat, GitHub, or Vercel frontend variables. Account policies can restrict app passwords. Keep email confirmation enabled. Test delivery and confirmation to a second address. Gmail quotas make a transactional provider with a verified NRICart domain more suitable for a public store.

Suggested confirmation subject: Confirm your NRICart account
Suggested recovery subject: Reset your NRICart password
Templates are in supabase/templates. Apply them in Authentication > Email Templates. They do not change the sender until SMTP is configured.

## Google sign-in

Create a Google Cloud OAuth Web application named NRICart. Configure the consent screen and approved website origin. Register this exact authorized redirect URI:

https://vzsmqzovlgasnoynpjbr.supabase.co/auth/v1/callback

Enter the Google OAuth client ID and secret directly into Supabase Authentication > Sign In / Providers > Google and enable it. Keep secrets out of browser code. Publish the Google consent app for external users when ready; while in testing, only configured test users can use it.

Set Supabase Auth Site URL to the deployed production origin. Allow the exact production and branch preview origins with trailing slash, plus /#/account for email confirmation and recovery. The Google flow returns to the origin root and the app opens the account or admin route after verifying the session. Do not grant admin based on email or user-editable profile fields.

## Verification

Test a new email account, confirmation, sign-in/out, reset, a Google account, cancellation, and an admin Google account. Verify an ordinary customer remains restricted from /#/admin. Email delivery, provider activation, and real OAuth round trips are not yet verified.

Sources: https://supabase.com/docs/guides/auth/auth-smtp and https://supabase.com/docs/guides/auth/social-login/auth-google
