-- migrate:up

CREATE TABLE clubs(
    id serial primary key,
    name varchar(80) NOT NULL
);

alter table club_days add club_id int NOT NULL references clubs(id) on delete cascade;

CREATE TABLE club_admins(
    id serial primary key,
    user_id int NOT NULL references users(id) on delete cascade,
    club_id bigint NOT NULL references clubs(id) on delete cascade,
    is_admin boolean NOT NULL
);

-- migrate:down
alter table club_days drop COLUMN club_id
drop table club_admins
drop table clubs

