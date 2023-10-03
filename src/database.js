export class Database {
  getUser(id) {SELECT * FROM users WHERE "userID" = id;}

  getCheckedInUsers(date) {SELECT * FROM checkIN WHERE "checkInDate" = date;}

  checkInUser(userID, code) {}

  registerUser() {INSERT INTO users
      ("firstName", "lastName", "email", "admin", "passwordHash")
      VALUES (firstName, lastName, email, FALSE, passwordHash); }
}
