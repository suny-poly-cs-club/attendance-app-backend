export class Database {
  getUser(id) {return 'SELECT * FROM users WHERE "userID" = id;'}

  getCheckedInUsers(date) {
    return 'SELECT * FROM checkIN WHERE "checkInDate" = date;';
  }

  checkInUser(userID, code) {
    return '';
  }

  async registerUser({firstName, lastName, email, password, admin = false}) {
    // to hash a password:
    // `crypt('mypassword', gen_salt('bf'))`

    return `INSERT INTO users
      ("firstName", "lastName", "email", "admin", "passwordHash")
      VALUES (firstName, lastName, email, FALSE, passwordHash);`

    // returns created user, token
  }

  async loginUser({email, password}) {
    // to retrieve a user with email and password
    // `select * from users where email = '' and passwordHash = crypt('', passhash) LIMIT 1;`
    // return generated token
  }
}

function generateNewToken() {
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
