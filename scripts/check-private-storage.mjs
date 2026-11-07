/** Synthetic-only probe: never reads or lists real applicant objects. */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.resolve('@payloadcms/storage-s3'))
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { GetObjectCommand } = await import('@aws-sdk/client-s3')
const bucket = process.env.S3_PRIVATE_BUCKET || process.env.S3_BUCKET
if (!bucket) throw new Error('Storage is not configured')
const client = new S3Client({ region: process.env.S3_REGION, endpoint: process.env.S3_ENDPOINT, forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } })
const Key = `applications/qa-privacy-probe-${crypto.randomUUID()}.txt`
const result = { syntheticOnly: true, privateBucketConfigured: Boolean(process.env.S3_PRIVATE_BUCKET) }
let uploaded = false
try {
  await client.send(new PutObjectCommand({ Bucket: bucket, Key, Body: 'Synthetic FEKRA privacy probe. No applicant information.' }))
  uploaded = true
  if (!process.env.S3_PUBLIC_HOST) throw new Error('Set S3_PUBLIC_HOST to verify anonymous object access')
  const anonymous = await fetch(`https://${process.env.S3_PUBLIC_HOST}/storage/v1/object/public/${bucket}/${Key}`)
  result.anonymousStatus = anonymous.status
  result.anonymousDenied = !anonymous.ok
  const signed = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key }), { expiresIn: 2 })
  result.signedDownload = (await fetch(signed)).ok
  await new Promise((resolve) => setTimeout(resolve, 3200))
  result.expiredDenied = !(await fetch(signed)).ok
} finally {
  if (uploaded) await client.send(new DeleteObjectCommand({ Bucket: bucket, Key }))
}
console.log(JSON.stringify(result, null, 2))
if (!result.anonymousDenied || !result.signedDownload || !result.expiredDenied) process.exitCode = 1
