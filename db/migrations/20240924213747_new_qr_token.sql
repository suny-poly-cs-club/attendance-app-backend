-- migrate:up
ALTER TABLE club_days ADD COLUMN qr_token varchar(20); 

-- migrate:down
ALTER TABLE club_days DROP COLUMN qr_token;
