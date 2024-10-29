import {AuthManager} from '../auth.js';
import {Database} from '../database.js';
import {QRManager} from '../qr.js';

/**
 * A class created with every request that holds instances of everything used around the app
 *
 * The Context class also has a few methods on it to make retrieving data easier
 */
export class Context {
  /**
   * The app database instance
   * @type {Database}
   */
  db;

  /**
   * The auth manager instance
   * @type {AuthManager}
   */
  authManager;

  /**
   * The qr manager instance
   * @type {QRManager}
   */
  qrManager;

  /** Fastify request */
  req;

  /** Fastify reply */
  reply;

  constructor(options) {
    Object.assign(this, options);
  }

  /**
   * Returns the authenticated user if there is one
   * @returns {Promise<import('./database').User | null>}
   */
  async getAuthenticatedUser() {
    const jwt = this.req.headers.authorization;

    if (!jwt) {
      return null;
    }

    const tokenClaims = this.authManager.verifyToken(jwt);
    if (!tokenClaims) {
      return null;
    }

    const userID = Number(tokenClaims.sub);

    return this.db.getUser(userID);
  }

  /** Registers the Context middleware */
  static register(app, options) {
    app.addHook('onRequest', (req, reply, done) => {
      const ctx = new Context({req, reply, ...options});
      req.ctx = ctx;

      done();
    });
  }
}
