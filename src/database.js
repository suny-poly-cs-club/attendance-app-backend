import pg from 'pg';
const {Client} = pg;

/**
 * @typedef User
 * @property {number} userID
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {boolean} isAdmin
 */

const mapUser = ({
  id,
  first_name: firstName,
  last_name: lastName,
  email,
  is_admin: isAdmin
}) => ({id, firstName, lastName, email, isAdmin});

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
      'SELECT * FROM users WHERE id = $1::int',
      [id]
    );

    const user = res.rows[0];
    return user ? mapUser(res.rows[0]) : null;
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
        RETURNING *
      `,
      [firstName, lastName, email, password]
    );

    const user = res.rows[0];
    return user ? mapUser(user) : null;
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

    console.log(res.rows);

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
        RETURNING *
      `,
      [startsAt, endsAt]
    );

    // TODO: to camel
    return res.rows[0];
  }

  async getCurrentClubDay() {
    const res = await this.client.query(
      'SELECT * FROM club_days WHERE NOW() BETWEEN starts_at AND ends_at'
    );

    // TODO: to camel
    return res.rows[0];
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
        RETURNING *
      `,
      [userID]
    );

    // TODO: to camel
    return res.rows[0];
  }

  async checkIn(userID, clubDayID) {
    const res = await this.client.query(
      `
        INSERT INTO check_ins (user_id, club_day_id)
        VALUES ($1::int, $2::int)
        RETURNING *
      `,
      [userID, clubDayID]
    );

    return res.rows[0];
  }

  async getCheckedInUsers(clubDayID) {
    const res = await this.client.query(
      'SELECT * FROM check_ins WHERE club_day_id = $1::int',
      [clubDayID]
    );

    return res.rows;
  }
}
