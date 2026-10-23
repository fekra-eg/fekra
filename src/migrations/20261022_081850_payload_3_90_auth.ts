import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Payload 3.90 adds `resetPasswordRequestedAt` to auth collections and storage-s3
// adds `_objectKey` to every upload collection; 20261020_120000 only covered media.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "applicant_files" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "applicant_files" DROP COLUMN IF EXISTS "_objectkey";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";`)
}
