CREATE TABLE "users"(
    "id" INTEGER NOT NULL,
    "first_name" VARCHAR(80) NOT NULL,
    "last_name" VARCHAR(80) NOT NULL,
    "email" TEXT NOT NULL,
    "is_admin" BOOLEAN NULL DEFAULT 'false NOT NULL',
    "password_hash" TEXT NOT NULL
);
CREATE TABLE "club_days"(
    "id" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(0) WITH
        TIME zone NOT NULL,
        "ends_at" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "club_id" BIGINT NOT NULL
);
CREATE TABLE "schema_migrations"("version" VARCHAR(128) NOT NULL);
CREATE TABLE "clubs"(
    "id" bigserial NOT NULL,
    "name" BIGINT NOT NULL
);
ALTER TABLE
    "clubs" ADD PRIMARY KEY("id");
CREATE TABLE "check_ins"(
    "id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "club_day_id" INTEGER NOT NULL,
    "checked_in_at" TIMESTAMP(0) WITH
        TIME zone NULL DEFAULT 'now() NOT NULL'
);
CREATE TABLE "club_admins"(
    "id" bigserial NOT NULL,
    "user_id" INTEGER NOT NULL,
    "club_is" BIGINT NOT NULL,
    "is_admin" BOOLEAN NOT NULL
);
ALTER TABLE
    "club_admins" ADD PRIMARY KEY("id");
ALTER TABLE
    "club_admins" ADD CONSTRAINT "club_admins_club_is_foreign" FOREIGN KEY("club_is") REFERENCES "clubs"("id");
ALTER TABLE
    "users" ADD CONSTRAINT "users_id_foreign" FOREIGN KEY("id") REFERENCES "club_admins"("user_id");
ALTER TABLE
    "club_days" ADD CONSTRAINT "club_days_id_foreign" FOREIGN KEY("id") REFERENCES "check_ins"("club_day_id");
ALTER TABLE
    "club_days" ADD CONSTRAINT "club_days_club_id_foreign" FOREIGN KEY("club_id") REFERENCES "clubs"("id");
ALTER TABLE
    "users" ADD CONSTRAINT "users_id_foreign" FOREIGN KEY("id") REFERENCES "check_ins"("user_id");