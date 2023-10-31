import {authenticated} from '../auth.js';

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
  app.addHook('onRequest', authenticated({requireAdmin: true}));

  app.post('/', async (req, reply) => {
    const {startsAt: _startsAt, endsAt: _endsAt} = req.body;

    // TODO: regex to make sure these are in the right format?

    if (!(_startsAt && _endsAt)) {
      reply.status(400);
      return {message: '`startsAt` and `endsAt` are both required'};
    }

    const startsAt = new Date(_startsAt);
    const endsAt = new Date(_endsAt);

    if (startsAt.getTime() >= endsAt.getTime()) {
      reply.status(400);
      return {message: '`startsAt` must come before `endsAt`'};
    }

    const cd = await req.ctx.db.createClubDay({startsAt, endsAt});
    return cd;
  });

  app.get(
    '/:id',
    {onRequest: [getClubDay]},
    async (req, _reply) => {
      return req.clubDay;
    }
  );

  app.get(
    '/:id/qr-token',
    {onRequest: [getClubDay]},
    async (req, _reply) => {
      const qrToken = req.ctx.qrManager.createQRToken(req.clubDay);
      return {token: qrToken};
    }
  );

  done();
};
