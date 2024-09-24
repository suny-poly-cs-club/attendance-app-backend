import {authenticated} from '../auth.js';
import {object, safeParse, string, boolean, optional} from 'valibot';
import {mapValibotToFormError} from '../util/err.js';

const searchWordsSchema = object({
  querey: string(),
});

const UpdateUserSchema = object({
  service_admin: optional(boolean()),
});

export const userRoutes = (app, _options, done) => {
  app.addHook('onRequest', authenticated({requireAdmin: true}));

  //get all users
  app.get(
    '/',
    //{onRequest: [authenticated({requireAdmin: true})]},
    async (req, reply) => {
      reply.type('application/json');
      //you must be a service admin to do this
      const cd = await req.ctx.db.getAllUsers();
      return cd;
    }
  );

  // TODO: switch to postgres full text search instead of getting all users (slow)
  // TODO: make get and qs
  //search users
  app.post(
    '/search',
    //{onRequest: [authenticated({requireAdmin: true})]},
    async (req, reply) => {
      reply.type('application/json');
      const result = safeParse(searchWordsSchema, req.body);
      if (!result.success) {
        return reply.status(400).send(mapValibotToFormError(result.issues));
      }
      const words = result.output.querey.split(' ');

      const allusers = await req.ctx.db.getAllUsers();

      const foundSearch = [];

      //loop over all users
      for (let i = 0; i < allusers.length; i++) {
        //loop over all the search words
        for (let j = 0; j < words.length; j++) {
          //if the search word is found in either the first or last name
          if (
            allusers[i].firstName.includes(words[j]) ||
            allusers[i].lastName.includes(words[j])
          ) {
            //add this user to the new list
            foundSearch.push(allusers[i]);
            //this user is on the list so we do not need to check for more matching words
            break;
          }
        }
      }
      return foundSearch;
    }
  );

  // modify another user
  app.patch('/:userId', async (req, reply) => {
    const result = safeParse(UpdateUserSchema, req.body);
    if (!result.success) {
      return reply.status(400).send(mapValibotToFormError(result.issues));
    }

    if ('service_admin' in result.output) {
      const out = await req.ctx.db.setUserAdmin(
        req.params.userId,
        result.output.service_admin
      );
      console.log(out);
    }

    return reply.status(204).send();
  });

  ////make more users service admins
  //app.post('/addadmin', async (req, reply) => {
  //reply.type("application/json");
  //if(!req.user.isAdmin){
  //reply.status(403).send();
  //      return;
  //}
  //const result = safeParse(userIdSchema, req.body);
  //if (!result.success) {
  //return reply.status(400).send(mapValibotToFormError(result.issues));
  //}

  //const cd = await req.ctx.db.setUserAdmin(result.output.userId,true);
  //return cd;

  //});

  ////make users no longer service admins
  //app.post('/removeadmin', async (req, reply) => {
  //reply.type("application/json");
  //if(!req.user.isAdmin){
  //reply.status(403).send();
  //      return;
  //}
  //const result = safeParse(userIdSchema, req.body);
  //if (!result.success) {
  //return reply.status(400).send(mapValibotToFormError(result.issues));
  //}

  //const cd = await req.ctx.db.setUserAdmin(result.output.userId,false);
  //return cd;

  //});

  done();
};
