/** Arabic-keyboard phones and long attribution must never block a form. npx tsx scripts/check-form-schema.ts */
import assert from 'node:assert'
import { applicationSchema } from '../src/lib/validation'
const base = { fullName: 'أحمد علي', email: 'a@b.co', phone: '+٢٠ ١٠٠ ١٢٣ ٤٥٦٧', jobId: '18', consent: true }
const ok = applicationSchema.parse({ ...base, referrer: 'x'.repeat(2000), locale: 'ar', sourcePath: '/ar/careers' })
assert.equal(ok.phone, '+20 100 123 4567')
assert.equal(ok.referrer!.length, 512)
assert.equal(applicationSchema.safeParse({ ...base, phone: 'abc' }).success, false)
console.log('ok')
