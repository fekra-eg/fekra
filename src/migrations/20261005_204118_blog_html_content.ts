import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_content_format" AS ENUM('richText', 'html');
  CREATE TYPE "public"."enum__posts_v_version_content_format" AS ENUM('richText', 'html');
  ALTER TABLE "posts_locales" ADD COLUMN "content_format" "enum_posts_content_format" DEFAULT 'richText';
  ALTER TABLE "posts_locales" ADD COLUMN "html_content" varchar;
  ALTER TABLE "_posts_v_locales" ADD COLUMN "version_content_format" "enum__posts_v_version_content_format" DEFAULT 'richText';
  ALTER TABLE "_posts_v_locales" ADD COLUMN "version_html_content" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts_locales" DROP COLUMN "content_format";
  ALTER TABLE "posts_locales" DROP COLUMN "html_content";
  ALTER TABLE "_posts_v_locales" DROP COLUMN "version_content_format";
  ALTER TABLE "_posts_v_locales" DROP COLUMN "version_html_content";
  DROP TYPE "public"."enum_posts_content_format";
  DROP TYPE "public"."enum__posts_v_version_content_format";`)
}
