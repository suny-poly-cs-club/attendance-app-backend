import jwt from 'jsonwebtoken';

/**
 * @typedef JWTPayload
 * @property {number} iat the timestamp of when the token was issued
 * @property {number} exp the timestamp of when the token will expire
 * @property {string} sub the subject of the JWT (the userID)
 */

// TODO: make a way to refresh a session

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
    return jwt.sign({}, this.#jwtSecret, {
      subject: user.id.toString(),
      expiresIn: '30d',
      algorithm: 'HS256',
    });
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
    } catch (e) {
      console.error('Failed to verify JWT:', e);
      return false;
    }
  }
}

// export const requireClubAdmin = () =>
//   async (req, reply) => {
//     if (!req.user) {
//       reply.status(401).send();
//       return;
//     }

//     const clubId = Number(req.param.clubId || req.body.clubId || req.query.clubId);
//     if (isNaN(clubId)) {
//       reply.status(404).send();
//       return;
//     }

//     if (req.user.isAdmin) {
//       return;
//     }
//   };
