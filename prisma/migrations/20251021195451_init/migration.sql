-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "scd_last_name" TEXT,
    "birth_date" DATE,
    "country" TEXT,
    "gender" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "company_name" TEXT,
    "company_direction" TEXT,
    "company_phone" TEXT,
    "company_website" TEXT,
    "company_logo" TEXT,
    "devices" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" SMALLINT DEFAULT 0,
    "expiration_date" TIMESTAMP(3),
    "plan_id" TEXT,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "partner_name" TEXT,
    "partner_meet_year" INTEGER,
    "group_name" TEXT,
    "group_year" INTEGER,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_partners" (
    "id" TEXT NOT NULL,
    "guest_id" INTEGER NOT NULL,
    "names" TEXT,
    "last_name" TEXT,
    "scd_last_name" TEXT,
    "date" DATE,

    CONSTRAINT "guest_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_group_members" (
    "id" TEXT NOT NULL,
    "guest_id" INTEGER NOT NULL,
    "name" TEXT,
    "last_name" TEXT,
    "scd_last_name" TEXT,
    "date" DATE,
    "date_init" INTEGER,

    CONSTRAINT "guest_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultants" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company" TEXT,
    "date" DATE,
    "email" TEXT,
    "gender" TEXT,
    "last_name" TEXT,
    "names" TEXT,
    "nationality" TEXT,
    "phone" TEXT,
    "scd_last_name" TEXT,
    "group" JSONB,

    CONSTRAINT "consultants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_notes" (
    "id" SERIAL NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "date_key" TEXT NOT NULL,
    "path_key" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "consultant_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_partners" (
    "id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "names" TEXT,
    "last_name" TEXT,
    "scd_last_name" TEXT,
    "date" DATE,

    CONSTRAINT "consultant_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_create_names" (
    "id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "name" TEXT,
    "last_name" TEXT,
    "scd_last_name" TEXT,
    "birth_date" DATE,
    "is_person" BOOLEAN,

    CONSTRAINT "consultant_create_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_partner_data" (
    "id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "name" TEXT,
    "date" DATE,
    "year_meet" INTEGER,

    CONSTRAINT "consultant_partner_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_partner_data_partners" (
    "id" TEXT NOT NULL,
    "partner_data_id" TEXT NOT NULL,
    "names" TEXT,
    "last_name" TEXT,
    "scd_last_name" TEXT,
    "date" DATE,

    CONSTRAINT "consultant_partner_data_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_group_data" (
    "id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "date" DATE,
    "last_init" INTEGER,

    CONSTRAINT "consultant_group_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_group_data_members" (
    "id" TEXT NOT NULL,
    "group_data_id" TEXT NOT NULL,
    "name" TEXT,
    "last_name" TEXT,
    "scd_last_name" TEXT,
    "date" DATE,
    "date_init" INTEGER,

    CONSTRAINT "consultant_group_data_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_user_id_key" ON "licenses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "guests_user_id_key" ON "guests"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_notes_consultant_id_date_key_path_key_key" ON "consultant_notes"("consultant_id", "date_key", "path_key");

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_partners" ADD CONSTRAINT "guest_partners_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_group_members" ADD CONSTRAINT "guest_group_members_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultants" ADD CONSTRAINT "consultants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_notes" ADD CONSTRAINT "consultant_notes_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_partners" ADD CONSTRAINT "consultant_partners_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_create_names" ADD CONSTRAINT "consultant_create_names_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_partner_data" ADD CONSTRAINT "consultant_partner_data_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_partner_data_partners" ADD CONSTRAINT "consultant_partner_data_partners_partner_data_id_fkey" FOREIGN KEY ("partner_data_id") REFERENCES "consultant_partner_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_group_data" ADD CONSTRAINT "consultant_group_data_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_group_data_members" ADD CONSTRAINT "consultant_group_data_members_group_data_id_fkey" FOREIGN KEY ("group_data_id") REFERENCES "consultant_group_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;
