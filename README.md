# Running

#### Docker Compose Instructions (recommended)

**Development** -- uses nodemon to automatically restart the server when changes are made
```sh
# copy `.env.example` to `.env` and change values accordingly
$ cp .env.example .env
# start the app
$ pnpm dev
# to stop everything, ctrl+c then run:
$ docker compose down
```

**Production**
```sh
# copy `.env.example` to `.env` and change values accordingly
$ cp .env.example .env
# start everything
$ docker compose up -d
# stop everything
$ docker compose down
```

#### Without Docker Compose
```sh
# copy `.env.example` to `.env` and change values accordingly
$ cp .env.example .env
# install external dependencies
$ pnpm install
# run database migrations
$ dbmate up
# run app
$ node src/index.js # runs the app on default port (3000)
$ PORT=8000 node src/index.js # runs the app on port 8000
```

# Docs

> [!IMPORTANT]
> The following constraints exist and are enforced on various fields:
>
> **User:**
> - password MUST be AT LEAST 5 characters
> - email MUST be AT MOST 255 characters
> - first, last name MUST be AT MOST 80 characters each
>
> **Club Day:**
> - starts\_at MUST COME BEFORE ends\_at
> - ends\_at MUST come AFTER the current time
> - the range from starts\_at to ends\_at MUST NOT OVERLP with another range
>
> **requests**
> - Anywhere "Authorization" is present it refers to the http header of the same name
> - Omit<A, '',...> submit the object of the corresponding type but leave out specified information
>

## Typedefs
```ts
type ISOTimestamp = string;
type Token = string;
type QRToken = string;

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean; // default false
}

type ClubDay = {
  id: number;
  startsAt: ISOTimestamp;
  endsAt: ISOTimestamp;
  clubId: number;
}

type CheckIn = {
  id: number;
  userID: number;
  clubDayID: number;
  checkedInAt: ISOString;
}
```

### Auth Routes
#### Register User
**Request**
```http
POST /api/sign-up
Content-Type: application/json

{
 fisetName: string.
 lastName: string,
 email: string,
 password: string
}
```

**Response**
```http
200 OK
Content-Type: application/json

{token: Token}
```

#### Log In
**Request**
```http
POST /api/login
Content-Type: application/json

{email: string; password: string}
```

**Response**
```http
200 OK
Content-Type: application/json

{token: Token}
```

### Club Day Routes
> [!NOTE]
> All of these routes require authentication, and the user to be a service admin (`isAdmin=true`) or and admin of the club.

#### Get All Club Days For a Club
**Request**
```http
GET /api/clubs/<id>/club-days
Authorization: Token

parameter
```

**Response**
```http
200 OK
Content-Type: application/json

ClubDay[]
```

#### Create Club Day
**Request**
```http
POST /api/clubs/<id>/club-days
Authorization: Token
Content-Type: application/json

Omit<ClubDay, 'id'>
```

**Response**
```http
200 OK
Content-Type: application/json

ClubDay
```

#### Get Club Day
**Request**
```http
GET /api/clubs/<club id>/club-days/<club day id>
Authorization: Token
```

**Response**
```http
200 OK
Content-Type: application/json

ClubDay
```

#### Get Club Day Attendees
**Request**
```http
GET /api/clubs/<club id>/club-days/<club day id/attendees
Authorization: Token
```

**Response**
```http
200 OK
Content-Type: application/json

User[]
```

#### Delete Club Day
**Request**
```http
DELETE /api/clubs/<club id>/club-days/<club day id>
Authorization: Token
```

**Response**
```http
200 OK
Content-Type: application/json

ClubDay
```

#### Get QR Token
**Request**
```http
GET /api/clubs/<club id>/club-days/<club day id>/qr-token
Authorization: Token
```

**Response**
```http
200 OK
Content-Type: application/json

{token: QRToken}
```

#### Get QR Code as PNG
**Request**
```http
GET /api/clubs/<club id>/club-days/<club day id>/qr-token.png
Authorization: Token
```

**Response**
```http
200 OK
Content-Type: image/png
```
NOTE: this is currently broken

#### Get QR Code as SVG
**Request**
```http
GET /api/clubs/<club id>/club-days/<club day id>/qr-token.svg
Authorization: Token
```

**Response**
```http
200 OK
Content-Type: image/svg+xml
```

### Check In Routes
#### Check In
**Request**
```http
POST /api/check-in
Authorization: Token
Content-Type: application/json

{code: QRToken}
```

**Response**
```http
204 No Content
```

#### Get Club Name From Day Code
**Request**
```http
GET /api/check-code/<QRToken>
```

**Response**
```http
200 OK
Content-Type: application/json

{name: string}
```

### User Routes
#### Get Current User
**Request**
```http
GET /api/user
Authorization: Token
```

**Response**
```http
200 OK
Content-Type: application/json

User
```

#### Get All Users
**Request**
```http
GET /api/users
Authorization: Token (requires isAdmin=true)
```

**Response**
```http
200 OK
Content-Type: application/json

[User]
```

#### Search Users
**Request**
```http
POST /api/users/search
Authorization: Token 
Content-Type: application/json

{querey: string} (space seperated list of words to search)
```

**Response**
```http
200 OK
Content-Type: application/json

[User]
```

#### Modify a user (change weather they are a service admin)
**Request**
```http
PATCH /api/users/<id>
Authorization: Token  (requires isAdmin=true)
Content-Type: application/json

{service_admin: boolean}
```

**Response**
```http
204 No Content
Content-Type: application/json

User
```


### Club Admin Routes
> [!NOTE]
> All of these routes require authentication, and the user to be a service admin (`isAdmin=true`) or and admin of the club.

#### Get All Clubs a user is admin of
note: service admins are automaticly admin of all clubs
**Request**
```http
GET /api/clubs
Authorization: Token
```

**Response**
```http
200 OK
Content-Type: application/json

[{id:number , name: string}]
```

#### Get All admins of a Clubs
note: service admins are automaticly admin of all clubs
**Request**
```http
GET /api/clubs/<id>/admins
Authorization: Token
```

**Response**
```http
200 OK
Content-Type: application/json

[Users]
```



### Make a User an Admin of a Club
**Request**
```http
POST /api/clubs/<id>/admins
Authorization: Token
Content-Type: application/json

{userId: number, clubId: number}
```

**Response**
```http
200 OK
Content-Type: application/json

{userId: number, clubId: number, isAdmin: boolean}
```

### Make a User no Longer an Admin of a Club
**Request**
```http
DELETE /api/clubs/<club id>/admins/<user id>
Authorization: Token
Content-Type: application/json

{userId: number, clubId: number}
```

**Response**
```http
200 OK
Content-Type: application/json

{userId: number, clubId: number, isAdmin: boolean}
```

#### Create a New Club
**Request**
```http
POST /api/clubs
Authorization: Token
Content-Type: application/json

{name: string}
```
Note: the user must be a service admin

**Response**
```http
200 OK
Content-Type: application/json

{id: number, name: string}
```

#### Delete a club
**Request**
```http
DELETE /api/clubs/<id>
Authorization: Token

```
Note: user must be a service admin

**Response**
```http
200 OK
Content-Type: application/json

{id: number, name: string}
```

## Error Codes
#### 200 OK
A 200 error is the success code. This means the request completed successfully.

#### 204 No Content
204 is another success code. It is used when the operation was successful, but there is no data to be returned.

#### 400 Bad Request
A 400 error means bad the server received bad input. The error format will be one of the following:
```ts
// Form validation error (ex: login, sign up, create club day)
{
  type: 'validation_arror',
  issues: [
    name: string[], // which form field the error came from
    errors: string[] // the reason validation failed
  ]
}

// Non validation error
{
  message: string // the error message
}
```

#### 401 Unauthorized
401 unauthorized is given when the supplied token is invalid. **If you receive a 401 status code from any request, assume your token expired, and force the user to log back in (through a request to [log in](#log-in)).**

#### 403 Forbidden
Getting a 403 forbidden status code means the user tried to access a resource they don't have access to. This is most likely a result of a non-admin user trying to access an admin-only resource.

#### 404 Not Found
A 404 status code means the resource does not exist.

#### 409 Conflict
A 409 error means the resource already exists. An example of this being used is trying to register an account for an email that already has an account.

#### 500 Internal Server Error
500 errors should not happen. If one happens, that means there is an unhandled error somewhere in the API.
