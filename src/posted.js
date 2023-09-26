export const postEndpoints = (app, options, done) =>{
	app.post("/sign-up",(request,reply) =>{
		reply.code(500);
		return '{"status":"ERROR"}';
	});
	
	app.post("/login",(request,reply) =>{
		reply.code(403);
		return '{"status":"ERROR"}';
	});
	
	app.post("/check-in", (request,reply) =>{
		var token = request.body.token;
		var success  = checkInUser(token);
		return '{"success": '+success+'}';
	});
	done();
}