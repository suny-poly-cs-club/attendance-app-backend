import jwt from 'jsonwebtoken';

/**
 * @typedef QRJWTPayload
 * @property {number} cdID the ID of the club day
 * @property {number} iat the timestamp of when the token was issued
 * @property {number} exp the timestamp of when the token will expire
 */

export class QRManager {
  // TODO: we should probably use a different secret for auth and QR codes
  #jwtSecret = process.env.JWT_SECRET;

  /**
   * Creates a signed token to use in the QR code.
   *
   * By using a signed token, we can guarantee that the token was not tampered with,
   * and data should all be correct.
   *
   * @param {import('./database.js').ClubDay} clubDay
   * @returns {string}
   */
  createQRToken(clubDay) {
    return jwt.sign({
      cdID: clubDay.id,

      // not valid before - start time
      nbf: Math.round(clubDay.startsAt.getTime() / 1_000),

      // expires at - end time
      exp: Math.round(clubDay.endsAt.getTime() / 1_000),

      // issued at - current time
      iat: Math.round(Date.now() / 1_000),
    },
    this.#jwtSecret,
      {
        algorithm: 'HS256',
      }
    );
  }

  verifyQRToken(token) {
    try {
      return jwt.verify(token, this.#jwtSecret);
    } catch(e) {
      console.error('Failed to verify JWT:', e);
      return false;
    }
  }
}
