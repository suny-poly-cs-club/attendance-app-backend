import {object, safeParse, string} from 'valibot';

import {PostgresErrorCode} from '../database.js';
import {authenticated} from '../middleware/auth.js';
import {mapValibotToFormError} from '../util/err.js';

const CheckInSchema = object({
  code: string(),
});

export const checkInRoutes = (app, _options, done) => {
  // middleware that blocks unauthenticated access
  app.addHook('onRequest', authenticated());

  //check in
  app.post('/', async (req, reply) => {
    const result = safeParse(CheckInSchema, req.body);
    if (!result.success) {
      return reply.status(400).send(mapValibotToFormError(result.issues));
    }

    const code = req.body.code;
    const user = req.user;

    const v = await req.ctx.qrManager.verifyQRToken(code);

    if (!v) {
      reply.status(400);
      return {message: 'invalid QR token'};
    }
    try {
      await req.ctx.db.checkIn(user.id, v.cdID);
    } catch (err) {
      // if (err.code === PostgresErrorCode.UniqueViolation) {
      //   reply.status(409);
      //   return {message: 'already checked in'};
      // }

      if (err.code !== PostgresErrorCode.UniqueViolation) {
        console.error(err);
        return reply.status(500).send();
      }
    }

    const club = await req.ctx.db.getClubFromQrToken(code);
    console.log(club);
    return club;

    // return reply.status(204).send();
    // return reply.status(200).send()
  });

  done();
};

export const checkCodeRoutes = (app, _options, done) => {
  app.addHook('onRequest', authenticated());
  //get the name of a club given the check in code
  app.get('/:dayCode', async (req, reply) => {
    //TODO validate QrToken
    const code = req.params.dayCode;
    const name = await req.ctx.db.getClubNameFromQrToken(code);
    if (!name) {
      return reply.status(404).send();
    }

    reply.type('application/json');
    return {name: name};
  });

  //check if a user has already checked into a club day

  app.post('/:dayCode', async (req, reply) => {
    // const authdUser = await req.ctx.getAuthenticatedUser();
    //
    // // the user does not exist
    // if (!authdUser) {
    //   reply.status(401).send();
    //   return;
    // }

    reply.type('application/json');
    //TODO validate QrToken
    const code = req.params.dayCode;
    const checkedIn = await req.ctx.db.hasUserCheckedIntoClubDay(
      code,
      authdUser.id
    );
    reply.c;

    return {checkedIn: checkedIn};
  });
  done();
};
