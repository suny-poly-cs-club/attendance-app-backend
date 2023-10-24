import jwt from 'jsonwebtoken';

/**
 * @typedef JWTPayload
 * @property {number} iat the timestamp of when the token was issued
 * @property {number} exp the timestamp of when the token will expire
 * @property {string} sub the subject of the JWT (the userID)
 */

export class AuthManager {
  #jwtSecret = process.env.JWT_SECRET;

  constructor(db) {
    this.db = db;
  }

  /**
   * Creates a signed JWT token for a user
   * @param {import('./database.js').User} user
   * @returns {string} the signed JWT
   */
  createToken(user) {
    return jwt.sign(
      {},
      this.#jwtSecret,
      {
        subject: user.id.toString(),
        expiresIn: '1h',
        algorithm: 'HS256',
      }
    );
  }

  /**
   * Checks if a token is valid. A token is valid if EVERY:
   *   - HMAC is valid
   *   - token has not expired
   *
   * @param {string} token
   * @returns {false | JWTPayload} if the token is valid
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.#jwtSecret);
    } catch(e) {
      console.error('Failed to verify JWT:', e);
      return false;
    }
  }
}

/**
 * Simple middleware to check if a user is authenticated or not
 */
export const authenticated = async (req, reply) => {
  const authdUser = await req.ctx.getAuthenticatedUser();

  if (!authdUser) {
    reply.status(401).send();
    return;
  }

  req.user = authdUser;
};

