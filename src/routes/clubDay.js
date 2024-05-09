import qr from 'qrcode';
import {object, isoTimestamp, custom, string, safeParse} from 'valibot';

import {authenticated,authenticatedClubDay} from '../auth.js';
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
  const {id: _id} = req.params;
  const id = Number(_id);

  if (isNaN(id)) {
    reply.status(404).send();
    return;
  }

  const clubDay = await req.ctx.db.getClubDay(id);

  if (!clubDay) {
    reply.status(404).send();
    return;
  }

  req.clubDay = clubDay;
};

export const clubDayRoutes = (app, _options, done) => {
  app.addHook('preHandler', authenticatedClubDay());

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

    const clubId = req.body.clubId;
    if(!clubId || isNaN(clubId)){
      reply.status(400);
      return {message: 'club ID not found in request body'};
    }

    const cd = await req.ctx.db.createClubDay({startsAt, endsAt,clubId});
    return cd;
  });

  app.get('/', async (req, _reply) => {
    // TODO: paginate this maybe
    let clubId = Number(req.query.clubId);
    if(!clubId || isNaN(clubId)){
      _reply.status(400);
      return {message: 'club ID querey not found'};
    }

    const clubDays = await req.ctx.db.getAllClubDaysByClub(clubId);
    return clubDays;
  });

  app.get(
    '/:id',
    {onRequest: [getClubDay]},
    async (req, _reply) => {
      return req.clubDay;
    }
  );

  app.delete(
    '/:id',
    {onRequest: [getClubDay]},
    async (req, _reply) => {
      return req.ctx.db.deleteClubDay(req.clubDay.id);
    }
  );


  app.get('/:id/attendees', async (req, reply) => {
    const {id: _id} = req.params;
    const id = Number(_id);

    if (isNaN(id)) {
      reply.status(404).send();
      return;
    }

    const users = await req.ctx.db.getCheckedInUsers(id);
    return users;
  });

  app.get(
    '/:id/qr-token',
    {onRequest: [getClubDay]},
    async (req, _reply) => {
      const qrToken = req.ctx.qrManager.createQRToken(req.clubDay);
      return {token: qrToken};
    }
  );

  app.get(
    '/:id/qr.svg',
    {onRequest: [getClubDay]},
    async (req, reply) => {
      const qrToken = req.ctx.qrManager.createQRToken(req.clubDay);
      const svg = await qr.toString(qrToken, {type: 'svg'});
      return reply.type('image/svg+xml').send(svg);
    }
  );

  app.get(
    '/:id/qr.png',
    {onRequest: [getClubDay]},
    async (req, reply) => {
      const qrToken = req.ctx.qrManager.createQRToken(req.clubDay);
      const png = qr.toBuffer(qrToken, {type: 'png'});
      return reply.type('image/png').send(png);
    }
  );

  done();
};
