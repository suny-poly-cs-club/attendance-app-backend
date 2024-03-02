import {PostgresErrorCode} from '../database.js';

import {object, string, email, minLength, maxLength, safeParse, flatten} from 'valibot';
import { mapValibotToFormError } from '../util/err.js';
import {authenticated,authenticatedClubDay} from '../auth.js';


const CreateClubSchema = object({
  name: string([
    maxLength(80, 'name exceeds max length'),
  ]),

});

//service admin club endpoints
export const clubEndpointsSA = (app, options ,done) =>{
	//make sure the user is service admin
	app.addHook('onRequest', authenticated({requireAdmin: true}));
	
	//get all clubs
	app.get("/", async (request,reply) =>{
		reply.type("application/json");
		
		const cd = await request.ctx.db.getAllClubs();
		return cd;
	});
	
	//create a new club
	app.post("/", async (request,reply) =>{
		const result = safeParse(CreateClubSchema, request.body);
		if (!result.success) {
			return reply.status(400).send(mapValibotToFormError(result.issues));
		}
		
		reply.type("application/json");
		
		try{
			var cd = await request.ctx.db.createClub(result.output.name);
		}catch (err) {
			if (err.code === PostgresErrorCode.UniqueViolation) {
				reply.status(409); // 409 Conflict -- resource already exists
				return {
					message: 'an account with this email already exists'
				};
			}
				
				
		
			// if the error isn't that an account already exists, we don't know
			// how to handle it, so just log it and give 500
		
			console.error('Unhandled error:', err);
		
			reply.status(500);
			return {message: 'internal server error'};
		}
		return cd;
		
		
	});
	
	//delete a club
	app.delete("/:id", (request,reply) =>{
		const {id: _id} = request.params;
		return request.ctx.db.deleteClub(_id);
	});
	
	done();
}

//general club endpoints
export const clubEndpointsGE = (app, options ,done) =>{
	app.addHook('onRequest', authenticated());
	
	done();
}