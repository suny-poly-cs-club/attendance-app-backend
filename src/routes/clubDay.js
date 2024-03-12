import qr from 'qrcode';
import {object, isoTimestamp, custom, string, safeParse} from 'valibot';

import {authenticated, authenticatedClubDay} from '../auth.js';
import {mapValibotToFormError} from '../util/err.js';

const CreateClubDaySchema = object({
  startsAt: string([
    isoTimestamp(),
  ]),
  endsAt: string([
    isoTimestamp(),
    custom(input => new Date(input).getTime() > Date.now(), 'cannot end in the past')
  ]),
});

const getClubDay = async (req, reply) => {
  const {clubDayId: _clubDayId} = req.params;
  const clubDayId = Number(_clubDayId);

  if (isNaN(clubDayId)) {
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

export const clubDayRoutes = (app, _options, done) => {
  app.addHook('onRequest', authenticatedClubDay());

  app.post('/:clubId/club-days', async (req, reply) => {
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

    // const clubId = req.params.clubId;
    // if(!clubId || isNaN(clubId)) {
    //   reply.status(400);
    //   return {message: 'club ID not found in request body'};
    // }

    const cd = await req.ctx.db.createClubDay({startsAt, endsAt, clubId: req.clubId});
    return cd;
  });

  app.get('/:clubId/club-days', async (req, _reply) => {
    // TODO: paginate this maybe
    // const clubId = Number(req.params.clubId)
    // if(!clubId || isNaN(clubId)){
    //   _reply.status(400);
    //   return {message: 'club ID querey not found'};
    // }

    const clubDays = await req.ctx.db.getAllClubDaysByClub(clubId);
    return clubDays;
  });

  app.get(
    '/:clubId/club-day/:clubDayId',
    {onRequest: [getClubDay]},
    async (req, _reply) => {
      return req.clubDay;
    }
  );

  app.delete(
    '/:clubId/club-day/:clubDayId',
    {onRequest: [getClubDay]},
    async (req, _reply) => {
      return req.ctx.db.deleteClubDay(req.clubDay.id);
    }
  );


  app.get('/:clubId/club-day/:clubDayId/attendees', async (req, reply) => {
    const {clubDayId: _id} = req.params;
    const id = Number(_id);

    if (isNaN(id)) {
      reply.status(404).send();
      return;
    }

    const users = await req.ctx.db.getCheckedInUsers(id);
    return users;
  });

  app.get(
    '/:clubId/club-day/:clubDayId/qr-token',
    {onRequest: [getClubDay]},
    async (req, _reply) => {
      const qrToken = req.ctx.qrManager.createQRToken(req.clubDay);
      return {token: qrToken};
    }
  );

  app.get(
    '/:clubId/club-day/:clubDayId/qr.svg',
    {onRequest: [getClubDay]},
    async (req, reply) => {
      const qrToken = req.ctx.qrManager.createQRToken(req.clubDay);
      const svg = await qr.toString(qrToken, {type: 'svg'});
      return reply.type('image/svg+xml').send(svg);
    }
  );

  app.get(
    '/:clubId/club-day/:clubDayId/qr.png',
    {onRequest: [getClubDay]},
    async (req, reply) => {
      const qrToken = req.ctx.qrManager.createQRToken(req.clubDay);
      const png = qr.toBuffer(qrToken, {type: 'png'});
      return reply.type('image/png').send(png);
    }
  );

  done();
};
