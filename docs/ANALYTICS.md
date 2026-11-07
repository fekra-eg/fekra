# FEKRA analytics verification

The event names live in `src/lib/analytics.ts`. Events require analytics consent. Tags load from approved CMS IDs after the corresponding consent; direct GA4 and GTM do not run together. Event parameters use an allow-list and omit names, email addresses, phone numbers, CV content, query strings and confirmation tokens.

| Event | Trigger | Evidence still required in production |
| --- | --- | --- |
| contact_form_submit | Successful contact or consultation response | GA4 DebugView with `form` and locale |
| job_application_submit | Successful application response | DebugView with job ID and locale |
| newsletter_signup | Accepted newsletter request | DebugView; this records a request, not confirmed opt-in |
| booking_cta_click | Booking CTA or widget opened | Separate click evidence |
| booking_scheduled | Calendly embed posts `calendly.event_scheduled` | Completed controlled booking in DebugView |

The Calendly listener checks both the exact provider origin and the iframe source. A direct link to Calendly cannot report booking completion back to this website. FEKRA must approve an embedded booking flow or configure an owned completion destination in Calendly before claiming completed-booking coverage for direct links. No appointment was created during this review.

For signoff, supply approved GA4, GTM (if used), and LinkedIn IDs and a controlled test appointment. Record network traffic before consent, after Essential only, after Accept all, and after withdrawal and reload. Confirm zero optional requests when denied, one conversion per success, and no personal data. Provider screenshots and marketing-account ownership remain owner tasks.
