import qr from 'qrcode';
import {custom, isoTimestamp, object, safeParse, string} from 'valibot';

import {authenticated} from '../middleware/auth.js';
import {mapValibotToFormError} from '../util/err.js';

const CreateClubDaySchema = object({
  startsAt: string([isoTimestamp()]),
  endsAt: string([
    isoTimestamp(),
    custom(
      input => new Date(input).getTime() > Date.now(),
      'cannot end in the past'
    ),
  ]),
});

export const getClubHook =
  ({requireAdmin = false}) =>
  async (req, reply) => {
    const {clubId: _clubId} = req.params;
    const clubId = Number(_clubId);

    if (!req.user) {
      reply.status(401).send();
      return;
    }

    if (Number.isNaN(clubId)) {
      reply.status(404).send();
      return;
    }

    if (requireAdmin) {
      const isAdmin =
        req.user.isAdmin ||
        (await req.ctx.db.isUserClubAdmin(req.user.id, clubId));

      if (!isAdmin) {
        reply.status(403).send();
        console.log('not an admin', req.user, clubId, isAdmin);
        return;
      }
    }

    const club = await req.ctx.db.getClub(clubId);
    req.clubId = clubId;
    req.club = club;
  };

const getClubDay = async (req, reply) => {
  const {clubDayId: _clubDayId} = req.params;
  const clubDayId = Number(_clubDayId);

  if (Number.isNaN(clubDayId)) {
    reply.status(404).send();
    return;
  }

  const clubDay = await req.ctx.db.getClubDay(clubDayId);

  if (!clubDay) {
    reply.status(404).send();
    return;
  }

  req.clubDay = clubDay;
};

// handles /api/clubs/:clubId/club-days
export const clubDayRoutes = (app, _options, done) => {
  app.addHook('onRequest', authenticated());

  //create a new club day
  app.post('/', async (req, reply) => {
    const result = safeParse(CreateClubDaySchema, req.body);
    if (!result.success) {
      return reply.status(400).send(mapValibotToFormError(result.issues));
    }

    const {startsAt: _startsAt, endsAt: _endsAt} = result.output;

    const startsAt = new Date(_startsAt);
    const endsAt = new Date(_endsAt);

    if (startsAt.getTime() >= endsAt.getTime()) {
      reply.status(400);
      return {message: '`startsAt` must come before `endsAt`'};
    }

    const cd = await req.ctx.db.createClubDay({
      startsAt,
      endsAt,
      clubId: req.params.clubId,
    });
    return cd;
  });

  //get all club days for a given club
  app.get(
    '/',
    {onRequest: [getClubHook({requireAdmin: true})]},
    async (req, _reply) => {
      // TODO: paginate this maybe
      const clubDays = await req.ctx.db.getAllClubDaysByClub(req.clubId);
      return clubDays;
    }
  );

  //get a club day
  app.get('/:clubDayId', {onRequest: [getClubDay]}, async (req, _reply) => {
    return req.clubDay;
  });

  //delete a club day
  app.delete('/:clubDayId', {onRequest: [getClubDay]}, async (req, _reply) => {
    return req.ctx.db.deleteClubDay(req.clubDay.id);
  });

  //get the attendies for a day
  app.get('/:clubDayId/attendees', async (req, reply) => {
    const {clubDayId: _id} = req.params;
    const id = Number(_id);

    if (Number.isNaN(id)) {
      reply.status(404).send();
      return;
    }

    const users = await req.ctx.db.getCheckedInUsers(id);
    return users;
  });

  app.get(
    '/:clubDayId/qr-token',
    {onRequest: [getClubDay]},
    async (req, _reply) => {
      // const qrToken = await req.ctx.qrManager.createQRToken(req.clubDay);
      // return {token: qrToken};

      const token = await req.ctx.db.getClubDayQrToken(req.clubDay.id);
      return {token};
    }
  );

  app.get(
    '/:clubDayId/qr.svg',
    {onRequest: [getClubDay]},
    async (req, reply) => {
      const qrToken = await req.ctx.qrManager.createQRToken(req.clubDay);
      const svg = await qr.toString(qrToken, {type: 'svg'});
      return reply.type('image/svg+xml').send(svg);
    }
  );

  app.get(
    '/:clubDayId/qr.png',
    {onRequest: [getClubDay]},
    async (req, reply) => {
      const qrToken = await req.ctx.qrManager.createQRToken(req.clubDay);
      const png = await qr.toBuffer(qrToken, {type: 'png'});
      return reply.type('image/png').send(png);
    }
  );

  done();
};
