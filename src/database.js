export class Database {
  getUser(id) {return 'SELECT * FROM users WHERE "userID" = id;'}

  getCheckedInUsers(date) {return 'SELECT * FROM checkIN WHERE "checkInDate" = date;''}

  checkInUser(userID, code) {return ''}

  registerUser() {return 'INSERT INTO users
      ("firstName", "lastName", "email", "admin", "passwordHash")
      VALUES (firstName, lastName, email, FALSE, passwordHash);' }
}
