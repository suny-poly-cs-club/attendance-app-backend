import jwt from 'jsonwebtoken';

/**
 * @typedef QRJWTPayload
 * @property {number} cdID the ID of the club day
 * @property {number} iat the timestamp of when the token was issued
 * @property {number} exp the timestamp of when the token will expire
 */

export class QRManager {
  // TODO: we should probably use a different secret for auth and QR codes
  //#jwtSecret = process.env.JWT_SECRET;
  #baseURL = process.env.QR_BASE_URL;

  constructor(db) {
    this.db = db;
  }

  /**
   * retreive the qr token stored with the club day
   *
   * combine the token with the configured base url
   * the resultant url can then be used to check into a club day
   *
   * @param {import('./database.js').ClubDay} clubDay
   * @returns {string}
   */
  async createQRToken(clubDay) {
    //get the url domain and the qr data from the clubday
    //combine them into a single string: URLBASE/check-in?code=CLUBDAYCODE
    //then return that

    const qrToken = await this.db.getClubDayQrToken(clubDay.id);

    const qRL = `${this.#baseURL}/check-in?code=${qrToken}`;
    return qRL;
    //return jwt.sign(
    //  {
    //    cdID: clubDay.id,
    //
    //    // not valid before - start time
    //    nbf: Math.round(clubDay.startsAt.getTime() / 1_000),
    //
    //    // expires at - end time
    //    exp: Math.round(clubDay.endsAt.getTime() / 1_000),
    //
    //    // issued at - current time
    //    iat: Math.round(Date.now() / 1_000),
    //  },
    //  this.#jwtSecret,
    //  {
    //    algorithm: 'HS256',
    //  }
    //);
  }

  async verifyQRToken(token) {
    //take in the club qr data
    //look it up in the databse
    //if no results return false
    //check it is a valid club checkin time
    //if the time is not valid return fasle
    //if all is good return an obejct with the field cdID being the internal id of the clubday
    try {
      const clubDay = await this.db.getClubDayFromQrToken(token);
      if (!clubDay) {
        //console.log("club not found");
        return false;
      }
      if (clubDay.startsAt > Date.now() || clubDay.endsAt < Date.now()) {
        //console.log("club out of time");
        return false;
      }
      const returnable = {
        cdID: clubDay.id,
        nbf: Math.round(clubDay.startsAt.getTime() / 1_000),
        exp: Math.round(clubDay.endsAt.getTime() / 1_000),
      };
      return returnable;
    } catch (e) {
      //console.log(e);
      return false;
    }

    //try {
    //  return jwt.verify(token, this.#jwtSecret);
    //} catch (e) {
    //  console.error('Failed to verify JWT:', e);
    //  return false;
    //}
  }
}
