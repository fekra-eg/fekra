import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// 20261103_140415_review_newsletter was generated without S3 env vars, so its
// `up` dropped the storage adapter's columns. With S3 on (production) every
// uncached media read then failed on `column media.prefix does not exist` —
// draft preview first, since it never hits the cache. Idempotent so it is a
// no-op on databases that never lost them.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT 'media';
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  ALTER TABLE "applicant_files" ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT 'applications';
  ALTER TABLE "applicant_files" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;`)
}

export async function down(_: MigrateDownArgs): Promise<void> {
  // Dropping these is what broke production; nothing to undo.
}
