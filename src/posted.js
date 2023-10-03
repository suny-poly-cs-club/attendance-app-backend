import bcrypt from "bcrypt";
import {Database} from './database.js';
const database = new Database();
export const postEndpoints = (app, options ,done) =>{
	app.post("/sign-up",(request,reply) =>{
		reply.code(500);
		return '{"status":"ERROR"}';
	});
	
	app.post("/login",(request,reply) =>{
		let userEmail = request.email;
		let rawPassword = request.password;
		let saltedPassword = saltPassword(rawPassword);
		let userid = "DATABASE: GET USER ID FROM EMAIL";
		if(!userid){
			reply.code(403);
			return '{"status": false , "message":"invalid username or password"}'
		}
		let passwordFromDataBase = "DATABASE: GET PASSWORD BASAED ON USER ID"
		if(saltedPassword == passwordFromDataBase){
			let token = generateNewToken();
			return '{"status": true , "message": " ", "token": "'+token+'"}'
		}else{
			reply.code(403);
			return '{"status": false , "message":"invalid username or password"}'
		}
		
		//reply.code(403);
		//return '{"status":"ERROR"}';
	});
	
	app.post("/check-in", (request,reply) =>{
		var token = request.body.token;
		var qrCode = request.body.code;
		var success  = database.checkInUser(token,qrCode);
		return '{"success": '+success+'}';	
	});
	
	app.get("/testcon", (request,replay) =>{
		return "D";
	});
	done();
}

function numericalHash(string){
  var value =0;
  for(var i=0;i<string.length;i++){
      value += string.charCodeAt(i)*Math.pow(31,i);
  }
  return value;
}

function saltPassword(password){
	let saltRounds = 16;
	return bcrypt.genSalt(saltRounds,password);
}