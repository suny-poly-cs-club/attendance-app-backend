-- migrate:up
ALTER TABLE club_days
DROP CONSTRAINT club_days_tstzrange_excl;

-- migrate:down

ALTER TABLE club_days
ADD CONSTRAINT club_days_tstzrange_excl 
exclude using gist (tstzrange(starts_at, ends_at) with &&);