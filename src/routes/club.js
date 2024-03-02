import {PostgresErrorCode} from '../database.js';

import {object, string, email, minLength, maxLength, safeParse, flatten,number} from 'valibot';
import { mapValibotToFormError } from '../util/err.js';
import {authenticated,authenticatedClubDay} from '../auth.js';


const CreateClubSchema = object({
  name: string([
    maxLength(80, 'name exceeds max length'),
  ]),

});

const ClubAdminSchema = object({
  userId: number(),
  clubId: number(),

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
	
	//get all clubs that this user can admininstrae
	app.get("/", async (request,reply) =>{
		reply.type("application/json");
		
		//if the user is a aervice admin
		if(request.user.isAdmin){
			//send them all the clubs
			const cd = await request.ctx.db.getAllClubs();
			return cd;
		}
		const cd = await request.ctx.db.getClubsAdminOf(request.user.id);
		return cd;
	});
	
	app.post("/addadmin", async (request,reply) =>{
		reply.type("application/json");
		//decode post data
		const result = safeParse(ClubAdminSchema, request.body);
		if (!result.success) {
			return reply.status(400).send(mapValibotToFormError(result.issues));
		}
		
		//if the user is a service admin or a club admin 
		if(request.user.isAdmin || await request.ctx.db.isUserClubAdmin(request.user.id,result.output.clubId)){
			//set the requested person as club admin
			const cd = request.ctx.db.setClubAdmin(result.output.userId,result.output.clubId,true);
			return cd;
		}else{
			//if they are not admin then send not authorized
			reply.status(403)
			return '{"status":403}';
		}
	});
	
	app.post("/removeadmin", async (request,reply) =>{
		reply.type("application/json");
		//decode post data
		const result = safeParse(ClubAdminSchema, request.body);
		if (!result.success) {
			return reply.status(400).send(mapValibotToFormError(result.issues));
		}
		
		//if the user is a service admin or a club admin 
		if(request.user.isAdmin || await request.ctx.db.isUserClubAdmin(request.user.id,result.output.clubId)){
			//set the requested person as club admin
			const cd = request.ctx.db.setClubAdmin(result.output.userId,result.output.clubId,false);
			return cd;
		}else{
			//if they are not admin then send not authorized
			reply.status(403)
			return '{"status":403}';
		}
	});
	
	app.get("/admins/:id", async (request, reply) => {
		reply.type("application/json");
		const {id: clubId} = request.params;
		//if the user is a service admin or a club admin 
		if(request.user.isAdmin || await request.ctx.db.isUserClubAdmin(request.user.id,clubId)){
			const cd = await request.ctx.db.getClubAdmins(clubId);
			return cd;
		}else{
			//if they are not admin then send not authorized
			reply.status(403)
			return '{"status":403}';
		}
	});
	
	done();
}