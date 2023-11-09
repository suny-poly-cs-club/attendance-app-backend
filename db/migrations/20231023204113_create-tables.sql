-- migrate:up
create extension if not exists pgcrypto;

create table users (
  id serial primary key,
  first_name varchar(80) not null,
  last_name varchar(80) not null,
  email text unique not null,
  is_admin boolean not null default false,
  password_hash text not null
);

create table club_days (
  id serial primary key,
  starts_at timestamptz not null,
  ends_at timestamptz not null,

  -- ends_at must come after starts_at
  check (ends_at > starts_at),
  -- don't allow overlapping ranges
  exclude using gist (tstzrange(starts_at, ends_at) with &&)
);

create table check_ins (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  club_day_id int not null references club_days(id) on delete cascade,
  checked_in_at timestamptz not null default now(),

  -- any given user can only check into each club day once
  unique (user_id, club_day_id)
);

-- migrate:down
drop table check_ins;
drop table club_days;
drop table users;
