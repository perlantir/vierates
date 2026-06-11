# VieRates Integration Status

## Production-Wired

- Stripe webhooks: real signature verification through `stripe.webhooks.constructEvent` using the raw request body.

## Guarded Demo Stubs

These paths intentionally throw unless `DEMO_MODE=true`.

- Twilio Verify OTP delivery: `lib/integrations/twilio.ts`
- Twilio SMS delivery and inbound STOP webhook handling: `lib/integrations/twilio.ts`
- Resend email delivery: `lib/integrations/resend.ts`
- Pusher realtime publish/auth surface: `lib/integrations/pusher.ts`

## Pending

- TrustedForm certificate capture is not wired. The app stores no certificate URL until the real TrustedForm script and capture flow are implemented.
