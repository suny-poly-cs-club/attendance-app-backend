-- migrate:up
CREATE EXTENSION btree_gist;

ALTER TABLE club_days
DROP CONSTRAINT club_days_tstzrange_excl;

ALTER TABLE club_days
ADD CONSTRAINT club_days_tstzrange_excl
EXCLUDE USING GIST(
  club_id WITH =,
  TSTZRANGE(starts_at, ends_at) WITH &&
);

-- migrate:down
ALTER TABLE club_days
DROP CONSTRAINT club_days_tstzrange_excl;

DROP EXTENSION btree_gist;

ALTER TABLE club_days
ADD CONSTRAINT club_days_tstzrange_excl
EXCLUDE USING GIST (TSTZRANGE(starts_at, ends_at) WITH &&);
