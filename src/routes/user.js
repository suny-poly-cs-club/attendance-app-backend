import {authenticated} from '../auth.js';
import {object, safeParse, number, string} from 'valibot';
import { mapValibotToFormError } from '../util/err.js';

const userIdSchema = object({
  userId: number(),
});

const searchWordsSchema = object({
  querey: string(),
});

export const userRoutes = (app, _options, done) => {
  app.addHook('onRequest', authenticated());

  // returns data about the current user
  app.get('/', async req => {
    return req.user;
  });
  
  //get all users
  app.get('/all', async (req, reply) => {
	reply.type("application/json");
	//you must be a service admin to do this
	if(!req.user.isAdmin){
		reply.status(403).send();
        return;
	}
	
	const cd = await req.ctx.db.getAllUsers();
	return cd;
  });
  
  //search users
  app.post('/search', async (req, reply) => {
	    reply.type("application/json");
	    const result = safeParse(searchWordsSchema, req.body);
		if (!result.success) {
			return reply.status(400).send(mapValibotToFormError(result.issues));
		}
		const words = result.output.querey.split(" ");
		
		const allusers = await req.ctx.db.getAllUsers();
		
		var foundSearch = [];
		
		//loop over all users
		for(let i=0;i<allusers.length;i++){
			//loop over all the search words
			for(let j=0;j<words.length;j++){
				//if the search word is found in either the first or last name 
				if(allusers[i].firstName.includes(words[j]) || allusers[i].lastName.includes(words[j])){
					//add this user to the new list
					foundSearch.push(allusers[i]);
					//this user is on the list so we do not need to check for more matching words
					break;
				}
			}
		}
		return foundSearch;
  });
  
  //make more users service admins
  app.post('/addadmin', async (req, reply) => {
	reply.type("application/json");
	if(!req.user.isAdmin){
		reply.status(403).send();
        return;
	}
	const result = safeParse(userIdSchema, req.body);
	if (!result.success) {
		return reply.status(400).send(mapValibotToFormError(result.issues));
	}
	
	const cd = await req.ctx.db.setUserAdmin(result.output.userId,true);
	return cd;
	
  });
  
  //make users no longer service admins
  app.post('/removeadmin', async (req, reply) => {
	reply.type("application/json");
	if(!req.user.isAdmin){
		reply.status(403).send();
        return;
	}
	const result = safeParse(userIdSchema, req.body);
	if (!result.success) {
		return reply.status(400).send(mapValibotToFormError(result.issues));
	}
	
	const cd = await req.ctx.db.setUserAdmin(result.output.userId,false);
	return cd;
	
  });

  done();
};
