import pg from 'pg';
const {Client} = pg;

/**
 * @typedef User
 * @property {number} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {boolean} isAdmin
 */

/**
 * @typedef ClubDay
 * @property {number} id
 * @property {Date} startsAt
 * @property {Date} endsAt
 * @property {number} clubId
 */

function makeid(length) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export class Database {
  client;

  constructor() {
    const user = process.env.POSTGRES_USER;
    const password = process.env.POSTGRES_PASSWORD;
    const database = process.env.POSTGRES_DB;
    const host = process.env.POSTGRES_HOST;
    const port = process.env.POSTGRES_PORT;

    this.client = new Client({
      user,
      password,
      database,
      host,
      port,
    });
  }

  async connect() {
    this.client.connect();
  }

  ////////// User Methods //////////

  /**
   * Returns a user by ID
   * @param {number} id
   * @returns {Promise<User | null>}
   */
  async getUser(id) {
    const res = await this.client.query(
      `
        SELECT
          u.id,
          u.first_name AS "firstName",
          u.last_name AS "lastName",
          u.email,
          u.is_admin AS "isAdmin",
          ca.user_id IS NOT NULL AS "isClubAdmin"

        FROM users u
        LEFT JOIN club_admins ca
        ON ca.user_id = u.id
        WHERE u.id = $1::int
      `,
      [id]
    );

    const user = res.rows[0];
    return user; //? mapUser(user) : null;
  }

  /**
   * Returns a user by email
   * @param {number} email
   * @returns {Promise<User | null>}
   */
  async getUserByEmail(email) {
    const res = await this.client.query(
      `
        SELECT
          id,
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          is_admin AS "isAdmin"
        FROM users
        WHERE email = $1::text
      `,
      [email]
    );

    const user = res.rows[0];
    return user;
  }

  /**
   * Registers a user
   * @returns {Promise<User>}
   */
  async registerUser({firstName, lastName, email, password}) {
    // to hash a password:
    // `crypt('mypassword', gen_salt('bf'))`

    const res = await this.client.query(
      `
        INSERT INTO users (first_name, last_name, email, password_hash)
        VALUES ($1::varchar(80), $2::varchar(80), $3::text, crypt($4::text, gen_salt('bf')))
        RETURNING
          id,
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          is_admin AS "isAdmin"
      `,
      [firstName, lastName, email, password]
    );

    const user = res.rows[0];

    const firstChek = await this.client.query('SELECT count(id) FROM users');
    const num = firstChek.rows[0].count;
    if (num === 1) {
      //if this is the first user
      console.log('Promoting first user to service admin');
      //make them an admin
      await this.client.query(
        'UPDATE users SET is_admin=true WHERE id=$1::int',
        [user.id]
      );
      user.isAdmin = true;
    }

    return user; //? mapUser(user) : null;
  }

  /**
   * Returns whether or not an email + password combo are valid
   * @returns {Promise<boolean>}
   */
  async getUserFromLogin({email, password}) {
    // to retrieve a user with email and password
    // `select * from users where email = '' and passwordHash = crypt('', passhash) LIMIT 1;`
    // return generated token

    const res = await this.client.query(
      `
        SELECT
          id,
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          is_admin AS "isAdmin"
        FROM users
        WHERE
          email = $1::text
          AND password_hash = crypt($2::text, password_hash)
      `,
      [email, password]
    );

    return res.rows[0];
  }

  ////////// Club Day Methods //////////

  async createClubDay({startsAt, endsAt, clubId}) {
    startsAt = new Date(startsAt);
    endsAt = new Date(endsAt);

    if (startsAt.getTime() > endsAt.getTime()) {
      throw new Error('End date must come before start date');
    }
    //generate a unique qr token for this club day
    let qrToken = '';
    let invalidQrToken = true;
    do {
      //generate token
      qrToken = makeid(10);
      const check = await this.client.query(
        `
			SELECT
				id
			FROM club_days
			WHERE
				qr_token = $1::text
			`,
        [qrToken]
      );
      invalidQrToken = check.rows.length > 0;
    } while (invalidQrToken);

    const res = await this.client.query(
      `
        INSERT INTO club_days (starts_at, ends_at, club_id, qr_token)
        VALUES ($1::TIMESTAMPTZ, $2::TIMESTAMPTZ, $3::int, $4::text)
        RETURNING
          id,
          starts_at AS "startsAt",
          ends_at AS "endsAt",
          club_id AS "clubId"
      `,
      [startsAt, endsAt, clubId, qrToken]
    );

    const cd = res.rows[0];
    return cd;
    // return cd ? mapClubDay(cd) : null;
  }

  //this function is currently not used
  async getCurrentClubDay() {
    const res = await this.client.query(
      `
        SELECT
          id,
          starts_at AS "startsAt",
          ends_at AS "endsAt"
        FROM club_days
        WHERE NOW() BETWEEN starts_at AND ends_at
        LIMIT 1
      `
    );

    const cd = res.rows[0];
    return cd; // ? mapClubDay(cd) : null;
  }

  /**
   * Gets a club day by its ID
   * @param {number} id
   * @returns {ClubDay}
   */
  async getClubDay(clubID) {
    const res = await this.client.query(
      `
        SELECT
          id,
          starts_at AS "startsAt",
          ends_at AS "endsAt",
          club_id AS "clubId"
        FROM club_days
        WHERE id = $1::int
      `,
      [clubID]
    );

    const cd = res.rows[0];
    return cd;
  }

  async getAllClubDays() {
    const res = await this.client.query(
      `
        SELECT
          cd.id,
          cd.starts_at AS "startsAt",
          cd.ends_at AS "endsAt",
          COALESCE(ci.attendees, 0)::int AS attendees,
		  cd.club_id AS "clubId"
        FROM club_days cd
        LEFT JOIN
            (SELECT club_day_id, COUNT(*) AS attendees
            FROM check_ins
            GROUP BY club_day_id) ci
        ON cd.id = ci.club_day_id
        ORDER BY cd.ends_at DESC;
      `
    );

    return res.rows;
  }

  async deleteClubDay(id) {
    const res = await this.client.query(
      `
        DELETE FROM club_days
        WHERE id = $1::int
        RETURNING
          id,
          starts_at AS "startsAt",
          ends_at AS "endsAt"
      `,
      [id]
    );

    return res.rows.length ? res.rows[0] : null;
  }

  async getAllClubDaysByClub(clubId) {
    const res = await this.client.query(
      `
        SELECT
          cd.id,
          cd.starts_at AS "startsAt",
          cd.ends_at AS "endsAt",
          COALESCE(ci.attendees, 0)::int AS attendees,
		  cd.club_id AS "clubId"
        FROM club_days cd
        LEFT JOIN
            (SELECT club_day_id, COUNT(*) AS attendees
            FROM check_ins
            GROUP BY club_day_id) ci
        ON cd.id = ci.club_day_id
		WHERE club_id = $1::int
        ORDER BY cd.ends_at DESC;
      `,
      [clubId] //NOTE the WHERE part of the query has not been tested
    );

    return res.rows;
  }

  async getClubDayQrToken(clubDayid) {
    const res = await this.client.query(
      `
			SELECT qr_token
			FROM club_days
			WHERE id = $1::int
		`,
      [clubDayid]
    );
    return res.rows[0].qr_token;
  }

  async getClubDayFromQrToken(qrToken) {
    const res = await this.client.query(
      `
        SELECT
          id,
          starts_at AS "startsAt",
          ends_at AS "endsAt",
          club_id AS "clubId"
        FROM club_days
        WHERE qr_token = $1::text
      `,
      [qrToken]
    );

    const cd = res.rows[0];
    return cd;
  }

  async getClubNameFromQrToken(qrToken) {
    const res = await this.client.query(
      `
		Select name 
		FROM clubs AS cl 
		JOIN 
			club_days AS cd 
			ON cl.id = cd.club_id
			WHERE cd.qr_token = $1::text
		`,
      [qrToken]
    );

    if (res.rows.length == 0) {
      return null;
    } else {
      return res.rows[0].name;
    }
  }

  async hasUserCheckedIntoClubDay(qrToken, userid) {
    //
    const res = await this.client.query(
      `SELECT 1 
		FROM check_ins ci 
		JOIN club_days cd 
		ON ci.club_day_id = cd.id 
		WHERE 
			ci.user_id = $1::int 
			AND cd.qr_token = $2::text`,
      [userid, qrToken]
    );

    return !!res.rows.length;
  }

  ////////// Check Ins //////////

  //not currently used. rebly should remove for new club system
  /**
   * Checks in to the currently ongoing club day
   * @param {number} userID
   */
  async checkInCurrent(userID) {
    const res = await this.client.query(
      `
        INSERT INTO check_ins (user_id, club_day_id)
        VALUES ($1::int,
               (SELECT id
                FROM club_days
                WHERE NOW() BETWEEN starts_at AND ends_at))
        RETURNING
          id,
          user_id AS "userID",
          club_day_id AS "clubDayID",
          checked_in_at AS "checkedInAt"
      `,
      [userID]
    );

    return res.rows[0];
  }

  async checkIn(userID, clubDayID) {
    const res = await this.client.query(
      `
        INSERT INTO check_ins (user_id, club_day_id)
        VALUES ($1::int, $2::int)
        RETURNING
          id,
          user_id AS "userID",
          club_day_id AS "clubDayID",
          checked_in_at AS "checkedInAt"
      `,
      [userID, clubDayID]
    );

    return res.rows[0];
  }

  async getCheckedInUsers(clubDayID) {
    const res = await this.client.query(
      `
        SELECT
          u.id,
          u.first_name AS "firstName",
          u.last_name AS "lastName",
          u.email,
          u.is_admin AS "isAdmin"
        FROM check_ins ci
        INNER JOIN users u
        ON u.id = ci.user_id
        WHERE ci.club_day_id = $1::int
		ORDER BY u.last_name ASC
      `,
      [clubDayID]
    );

    return res.rows;
  }

  ////////// Clubs //////////

  /**creates a new club with the given name
  @param {string} name the name of the club
  @returns object with an id element, the ID of the new club
  */
  async createClub(name) {
    const res = await this.client.query(
      `
        INSERT INTO clubs (name)
        VALUES ($1::varchar(80))
        RETURNING
          id,
		  name
      `,
      [name]
    );

    const cd = res.rows[0];
    return cd;
  }

  async deleteClub(id) {
    const res = await this.client.query(
      `
        DELETE FROM clubs
        WHERE id = $1::int
        RETURNING
          id,
          name
      `,
      [id]
    );

    return res.rows.length ? res.rows[0] : null;
  }

  async getClub(id) {
    const res = await this.client.query(
      `
        SELECT * FROM clubs
        WHERE id = $1::int
      `,
      [id]
    );
    return res.rows[0];
  }

  async getAllClubs() {
    const res = await this.client.query(
      `
			SELECT * FROM clubs;
		`
    );
    return res.rows;
  }

  ////////// Club admin //////////

  async addClubAdmin(clubID, userID) {
    const res = await this.client.query(
      `
      INSERT INTO club_admins (user_id, club_id)
      VALUES ($1::int, $2::int)
      RETURNING
        user_id AS "userId",
        club_id AS "clubId";
      `,
      [userID, clubID]
    );

    return res.rows[0];
  }

  async removeClubAdmin(clubID, userID) {
    const res = await this.client.query(
      `
      DELETE FROM club_admins
      WHERE
        user_id = $1::int
        AND club_id = $2::int
      RETURNING
        user_id AS "userId",
        club_id AS "clubId";
      `,
      [userID, clubID]
    );

    return res.rows[0];
  }

  /**sets wether a user is an admin for a given club
	@param {number} userId the id of the user
	@param {number} clubId the id of the club
	@param {boolean} isAdmin wether they are now an admin or not
	@returns the passed in data from the database
  */
  //async setClubAdmin(userId, clubId, isAdmin) {
  //  //check to see if the user is allready in the table for the given club
  //  const exsistsRequest = await this.client.query(
  //    `
  //	SELECT count(id) FROM club_admins WHERE user_id=$1::int AND club_id=$2::int;
  //`,
  //    [userId, clubId]
  //  );
  //
  //  let res = null;
  //  if (exsistsRequest.rows && exsistsRequest.rows[0].count === 1) {
  //    //if so update the exsisting row wiht the new value
  //    res = await this.client.query(
  //      `
  //		UPDATE club_admins
  //		SET is_admin=$1::boolean
  //		WHERE user_id=$2::int
  //			AND club_id=$3::int
  //		RETURNING
  //			user_id AS "userId",
  //			club_id AS "clubId",
  //			is_admin AS "isAdmin";
  //	`,
  //      [isAdmin, userId, clubId]
  //    );
  //  } else {
  //    //else add a new entry to the table
  //    res = await this.client.query(
  //      `
  //		INSERT INTO club_admins(user_id,club_id,is_admin)
  //		VALUES($1::int, $2::int, $3::boolean)
  //		RETURNING
  //			user_id AS "userId",
  //			club_id AS "clubId",
  //			is_admin AS "isAdmin";
  //	`,
  //      [userId, clubId, isAdmin]
  //    );
  //  }
  //  return res.rows[0];
  //}

  /**gets all the users who are admins for a given club
   @param (number) clubId the id of the club
   @returns an array of users
  */
  async getClubAdmins(clubId) {
    const res = await this.client.query(
      `
        SELECT
          u.id,
          u.first_name AS "firstName",
          u.last_name AS "lastName",
          u.email,
          u.is_admin AS "isAdmin"
        FROM club_admins ca
        RIGHT JOIN users u
          ON u.id = ca.user_id AND ca.club_id = $1::int
        WHERE
          u.is_admin
          OR ca.user_id IS NOT NULL
		    ORDER BY u.last_name ASC
      `,
      [clubId]
    );

    return res.rows;
  }

  /**get all the clubs a user is an admin of
	@param {number} userId the ID of the user
	@returns clubs the user is an admin of
  */
  async getClubsAdminOf(userId) {
    //SELECT name,id FROM clubs WHERE id=(SELECT club_id FROM club_admins WHERE user_id=6 AND is_admin=true)
    const res = await this.client.query(
      `
        SELECT
          c.name,
          c.id
        FROM clubs c
        INNER JOIN
        club_admins ca
        ON c.id = ca.club_id
        WHERE
          ca.user_id = $1::int
        ORDER BY c.id ASC
      `,
      [userId]
    );
    return res.rows;
  }

  /**
	@param {number} userID the ID of the user
	@param {number} clubID the id of the club
  */
  async isUserClubAdmin(userId, clubId) {
    const res = await this.client.query(
      // SELECT is_admin AS "isAdmin" FROM club_admins WHERE user_id=$1::int AND club_id=$2::int;
      `
      SELECT 1
      FROM club_admins
      WHERE
        user_id=$1::int
        AND club_id=$2::int
		`,
      [userId, clubId]
    );

    //if nothing was returned they are not an admin, else return what was found in the database
    // if(!res.rows)
    // return false
    // return res.rows.length ? res.rows[0].isAdmin : false;

    return !!res.rows.length;
  }

  async isUserAnyClubAdmin(userId) {
    const res = await this.client.query(
      `
        SELECT 1
        FROM club_admins
        WHERE user_id = $1::int
        LIMIT 1
      `,
      [userId]
    );

    return !!res.rows.length;
  }

  ////////// User //////////

  /** get all of the users in the database
	@returns array containing all users
  */
  async getAllUsers() {
    const res = await this.client.query(
      `
			SELECT
				id,
				first_name AS "firstName",
				last_name AS "lastName",
				email,
				is_admin AS "isAdmin"
			FROM users
			ORDER BY last_name ASC
		`
    );
    return res.rows;
  }

  async setUserAdmin(userId, isAdmin) {
    const res = await this.client.query(
      `
			UPDATE users
			SET is_admin=$1::boolean
			WHERE id=$2::int
			RETURNING
				id,
				first_name AS "firstName",
				last_name AS "lastName",
				email,
				is_admin AS "isAdmin"
		`,
      [isAdmin, userId]
    );

    return res.rows[0];
  }
  //this does not work for some reason. I'm just gogin to do it in javascript. mutch more secure anyway
  ///** search all users for ones who's first or last name matches the inputs
  //@param {string array} words the words to use in the search
  //@returns {User array} all the users that match the search words
  //*/
  //async searchUsers(words){
  //  const escapedWords = words.map((word) => this.client.escapeLiteral(word));
  //  //NEEDS SQL INJECTTION PROTECTION
  //  //for some reason the querey does not work with this escape method
  //  const res = await this.client.query(
  //	`
  //		SELECT
  //			id,
  //			first_name AS "firstName",
  //			last_name AS "lastName",
  //			email,
  //			is_admin AS "isAdmin"
  //		FROM users
  //		WHERE LOWER(first_name) LIKE '%' || $1 || '%' OR LOWER(last_name) LIKE '%' || $1 || '%';
  //	`,[words]
  //  );
  //
  //  return res.rows;
  //}
}

export const PostgresErrorCode = {
  UniqueViolation: '23505',
  ExclusionViolation: '23P01',
};
