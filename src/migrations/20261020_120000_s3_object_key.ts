import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// @payloadcms/storage-s3 3.90 adds a hidden `_objectKey` field to upload collections (DEV-01).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN IF EXISTS "_objectkey";`)
}
