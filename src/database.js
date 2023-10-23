/**
 * @typedef User
 * @property {number} userID
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {boolean} admin
 * @property {string} passwordHash
 */

export class Database {
  constructor() {
    const user = process.env.POSTGRES_USER;
    const pass = process.env.POSTGRES_PASS;
    const db = process.env.POSTGRES_DB;
    const host = process.env.POSTGRES_HOST;
    const port = process.env.POSTGRES_PORT;
  }

  /**
   * Returns a user by ID
   * @param {number} id
   * @returns {Promise<User | null>}
   */
  getUser(id) {
    return 'SELECT * FROM users WHERE "userID" = id;'}

  getCheckedInUsers(date) {
    return 'SELECT * FROM checkIN WHERE "checkInDate" = date;';
  }

  checkInUser(userID, code) {
    return '';
  }

  /**
   * Registers a user
   */
  async registerUser({firstName, lastName, email, password, admin = false}) {
    // to hash a password:
    // `crypt('mypassword', gen_salt('bf'))`

    return `INSERT INTO users
      ("firstName", "lastName", "email", "admin", "passwordHash")
      VALUES (firstName, lastName, email, FALSE, passwordHash);`

    // returns created user, token
  }

  async loginUser({email, password}) {
    // to retrieve a user with email and password
    // `select * from users where email = '' and passwordHash = crypt('', passhash) LIMIT 1;`
    // return generated token
  }
}
