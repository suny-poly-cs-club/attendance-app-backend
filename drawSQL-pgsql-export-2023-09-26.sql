CREATE TABLE "users"(
    "userID" bigserial NOT NULL,
    "firstName" VARCHAR(80) NOT NULL,
    "lastName" VARCHAR(80) NOT NULL,
    "email" VARCHAR(80) NOT NULL,
    "admin" BOOLEAN NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL
);
ALTER TABLE
    "users" ADD PRIMARY KEY("userID");
ALTER TABLE
    "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
CREATE TABLE "token"(
    "tokenID" bigserial NOT NULL,
    "userID" BIGINT NOT NULL,
    "sessionToken" VARCHAR(255) NOT NULL,
    "tokenExpiration" TIMESTAMP(0) WITH
        TIME zone NOT NULL
);
ALTER TABLE
    "token" ADD PRIMARY KEY("tokenID");
CREATE TABLE "checkIn"(
    "checkInID" bigserial NOT NULL,
    "checkInDate" DATE NOT NULL,
    "userID" BIGINT NOT NULL,
    "checkInTime" TIME(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "checkIn" ADD PRIMARY KEY("checkInID");
CREATE TABLE "clubDays"(
    "clubDayID" bigserial NOT NULL,
    "clubDayDate" DATE NOT NULL,
    "clubDayStartTime" TIME(0) WITHOUT TIME ZONE NOT NULL,
    "QRCode" BIGINT NOT NULL,
    "clubDayEndTime" BIGINT NOT NULL
);
ALTER TABLE
    "clubDays" ADD PRIMARY KEY("clubDayID");
ALTER TABLE
    "token" ADD CONSTRAINT "token_userid_foreign" FOREIGN KEY("userID") REFERENCES "users"("userID");
ALTER TABLE
    "checkIn" ADD CONSTRAINT "checkin_userid_foreign" FOREIGN KEY("userID") REFERENCES "users"("userID");