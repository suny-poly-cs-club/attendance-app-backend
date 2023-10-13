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
	
	app.get("/gopost", (request,replay) =>{
		reply.type("text/html");
		return '<html> 	<head> 		<style> 			.main { 				margin: 1%; 				height: 98%; 			} 			.inputs { 				background: lightgray; 				padding: 1%; 			} 			.responce { 				padding: 0.5%; 				font-size: larger; 				width: 99%; 				background: lightgray; 				height: 60%; 			} 			.status { 				font-size: larger; 			} 			table.inputTable { 				border-spacing: 1em; 			} 			input.inputBox { 				width: 500%; 				padding: 5%; 				border-radius: 1em; 				border-width: 1px; 				font-size: medium; 			} 		</style> 		<script> 			function postit(){\nvar ajaxRequest = new XMLHttpRequest();\najaxRequest.onreadystatechange = function(){\nif(ajaxRequest.readyState == 4){\ndocument.querySelector(".responce").innerHTML=ajaxRequest.responseText;\ndocument.querySelector(".statusCode").innerHTML="status: "+ajaxRequest.status;\n}\n}\najaxRequest.open("POST", document.querySelector(".url").value);\najaxRequest.setRequestHeader("Content-type", document.querySelector(".contentType").value);\najaxRequest.send(document.querySelector(".data").value);\n}\n</script> 	</head> 	 	<body> 		<div class="main"> 			<div class="inputs"> 				<table class="inputTable"> 					<tr> 						<td>URL to post to:</td> 						<td><input class="url inputBox"/></td> 					</tr> 					<tr> 						<td>Post data:</td> 						<td><input class="data inputBox"/></td> 					</tr> 					<tr> 						<td>Content type:</td> 						<td><input class="contentType inputBox"/></td> 					</tr> 				</table> 				 				<button onclick="postit()" style="padding: .5%;width: 70%;background: red;font-weight: bold;"> POST </button> 			</div> 			<div class="status"> 				<br> 				<span class="statusCode">status:</span> 				<br><br>responce: 			</div> 			<div class="responce"> 			 			</div> 		</div> 	</body> </html>';
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

function generateNewToken(){
	let token = "";
	let lowercase = "a".charCodeAt(0);
	let uppercase = "A".charCodeAt(0);
	for(let i=0;i<128;i++){
		let sel = Math.floor(Math.random()*100000%3)
		if(sel==0){//number case
			token+=Math.floor(Math.random()*1000000%10)
		}
		else if(sel==1){//lower case
			token+=String.fromCharCode(Math.floor(Math.random()*1000000%26)+lowercase)
		}
		else if(sel==2){//upper case
			token+=String.fromCharCode(Math.floor(Math.random()*1000000%26)+uppercase)
		}
	}
	return token
}