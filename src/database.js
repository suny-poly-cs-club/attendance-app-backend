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
 */

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
          id,
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          is_admin AS "isAdmin"
        FROM users
        WHERE id = $1::int
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
    return user; //? mapUser(user) : null;
  }

  /**
   * Returns whether or not an email + password combo are valid
   * @returns {Promise<boolean>}
   */
  async isUserPasswordValid({email, password}) {
    // to retrieve a user with email and password
    // `select * from users where email = '' and passwordHash = crypt('', passhash) LIMIT 1;`
    // return generated token

    const res = await this.client.query(
      `
        SELECT id
        FROM users
        WHERE
          email = $1::text
          AND password_hash = crypt($2::text, password_hash)
      `,
      [email, password]
    );

    return res.rows?.length === 1;
  }

  ////////// Club Day Methods //////////

  async createClubDay({startsAt, endsAt}) {
    startsAt = new Date(startsAt);
    endsAt = new Date(endsAt);

    if (startsAt.getTime() > endsAt.getTime()) {
      throw new Error('End date must come before start date');
    }

    const res = await this.client.query(
      `
        INSERT INTO club_days (starts_at, ends_at)
        VALUES ($1::TIMESTAMPTZ, $2::TIMESTAMPTZ)
        RETURNING
          id,
          starts_at AS "startsAt",
          ends_at AS "endsAt"
      `,
      [startsAt, endsAt]
    );

    const cd = res.rows[0];
    return cd;
    // return cd ? mapClubDay(cd) : null;
  }

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
  async getClubDay(id) {
    const res = await this.client.query(
      `
        SELECT
          id,
          starts_at AS "startsAt",
          ends_at AS "endsAt"
        FROM club_days
        WHERE id = $1::int
      `,
      [id]
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
          COALESCE(ci.attendees, 0)::int AS attendees
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

  ////////// Check Ins //////////

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
      `,
      [clubDayID]
    );

    return res.rows;
  }
}

export const PostgresErrorCode = {
  UniqueViolation: '23505',
  ExclusionViolation: '23P01',
};
