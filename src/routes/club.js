import {PostgresErrorCode} from '../database.js';

import {
  email,
  flatten,
  maxLength,
  minLength,
  number,
  object,
  safeParse,
  string,
} from 'valibot';
import {authenticated} from '../middleware/auth.js';
import {mapValibotToFormError} from '../util/err.js';
import {getClubHook} from './clubDay.js';

const CreateClubSchema = object({
  name: string([maxLength(80, 'name exceeds max length')]),
});

const ClubAdminSchema = object({
  userId: number(),
});

//service admin club endpoints
//apperently theese dont exsist any more
export const clubEndpointsSA = (app, _options, done) => {
  //make sure the user is service admin
  app.addHook('onRequest', authenticated({requireAdmin: true}));
  done();
};

//general club endpoints
export const clubEndpointsGE = (app, _options, done) => {
  app.addHook('onRequest', authenticated());

  //create a club
  app.post('/', async (request, reply) => {
    // user is not a service admin
    if (!request.user.isAdmin) {
      reply.status(403).send();
      return;
    }

    const result = safeParse(CreateClubSchema, request.body);
    if (!result.success) {
      return reply.status(400).send(mapValibotToFormError(result.issues));
    }

    reply.type('application/json');

    try {
      var cd = await request.ctx.db.createClub(result.output.name);
    } catch (err) {
      if (err.code === PostgresErrorCode.UniqueViolation) {
        reply.status(409); // 409 Conflict -- resource already exists
        return {
          message: 'an account with this email already exists',
        };
      }

      // if the error isn't that an account already exists, we don't know
      // how to handle it, so just log it and give 500
      console.error('Unhandled error:', err);
      reply.status(500);
      return;
    }

    return cd;
  });

  //delete a club
  app.delete(
    '/:clubId',
    {onRequest: [getClubHook({requireAdmin: true})]},
    async (req, reply) => {
      if (!req.user.isAdmin) {
        reply.status(403).send();
        return;
      }

      return req.ctx.db.deleteClub(req.params.clubId);
    }
  );

  //get all clubs that this user can admininstrae
  app.get('/', async (request, reply) => {
    reply.type('application/json');

    //if the user is a aervice admin
    if (request.user.isAdmin) {
      //send them all the clubs
      const cd = await request.ctx.db.getAllClubs();
      return cd;
    }

    const cd = await request.ctx.db.getClubsAdminOf(request.user.id);
    return cd;
  });

  //get all the user that are admins of a specific club
  app.get(
    '/:clubId/admins',
    {onRequest: [getClubHook({requireAdmin: true})]},
    async (req, _reply) => {
      const allAdmins = await req.ctx.db.getClubAdmins(req.params.clubId);
      return allAdmins;
    }
  );

  //make a user an admin of a club
  app.post(
    '/:clubId/admins',
    {onRequest: [getClubHook({requireAdmin: true})]},
    async (request, reply) => {
      reply.type('application/json');
      //decode post data
      const result = safeParse(ClubAdminSchema, request.body);
      if (!result.success) {
        return reply.status(400).send(mapValibotToFormError(result.issues));
      }

      const res = await request.ctx.db.addClubAdmin(
        request.params.clubId,
        result.output.userId
      );
      return res;
    }
  );

  //remove a user from a clubs admin list
  app.delete(
    '/:clubId/admins/:userId',
    {onRequest: [getClubHook({requireAdmin: true})]},
    async (request, reply) => {
      const userId = request.params.userId;

      //return reply.status(400).send();
      reply.type('application/json');
      //const result = safeParse(ClubAdminSchema, request.body);
      //if (!result.success) {
      //  return reply.status(400).send(mapValibotToFormError(result.issues));
      //}
      //
      const res = await request.ctx.db.removeClubAdmin(
        request.params.clubId,
        userId
      );
      return res;
    }
  );

  //app.post("/removeadmin", async (request,reply) =>{
  //	reply.type("application/json");
  //	//decode post data
  //	const result = safeParse(ClubAdminSchema, request.body);
  //	if (!result.success) {
  //		return reply.status(400).send(mapValibotToFormError(result.issues));
  //	}

  //	//if the user is a service admin or a club admin
  //	if(request.user.isAdmin || await request.ctx.db.isUserClubAdmin(request.user.id,result.output.clubId)){
  //		//set the requested person as club admin
  //		const cd = request.ctx.db.setClubAdmin(result.output.userId,result.output.clubId,false);
  //		return cd;
  //	}else{
  //		//if they are not admin then send not authorized
  //		reply.status(403)
  //		return '{"status":403}';
  //	}
  //});

  //app.get('/admins/:id', async (request, reply) => {
  //  reply.type('application/json');
  //  const {id: clubId} = request.params;
  //  //if the user is a service admin or a club admin
  //  if (
  //    request.user.isAdmin ||
  //    (await request.ctx.db.isUserClubAdmin(request.user.id, clubId))
  //  ) {
  //    const cd = await request.ctx.db.getClubAdmins(clubId);
  //    return cd;
  //  }
  //
  //  //if they are not admin then send not authorized
  //  reply.status(403);
  //  return '{"status":403}';
  //});

  done();
};
