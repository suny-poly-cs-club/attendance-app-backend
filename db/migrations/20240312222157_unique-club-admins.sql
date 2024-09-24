-- migrate:up
ALTER TABLE club_admins
ADD CONSTRAINT club_admins_user_id_club_id_uniq
UNIQUE (user_id, club_id);

-- migrate:down
ALTER TABLE club_admins
DROP CONSTRAINT club_admins_user_id_club_id_uniq;
