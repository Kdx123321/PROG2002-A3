# PROG2002 A3 - Charity Events

A full-stack charity events application. Users can browse charity events, search/filter them, view event details with weather information, and register for events. Admins can create, edit and delete events through a separate admin interface.

**Tech stack:** Angular 22 + TypeScript (client & admin) | Node.js + Express (API) | MySQL (database) | Open-Meteo Weather API

## Team

- Dexin Kong (24832287)
- Dongxu Li (24832300)

## Project Structure

```
api/          Express backend (REST API, weather endpoint)
client-app/   Angular client application
admin-app/    Angular admin application
```

## Prerequisites

- Node.js 18+
- MySQL 8
- Angular CLI 22 (`npm install -g @angular/cli`)

## Database Setup

1. Create a MySQL database, e.g. `charityevents_db`.
2. Import the schema:

```
mysql -u root -p charityevents_db < api/charityevents_db.sql
```

(or import `api/charityevents_db.sql` via MySQL Workbench / phpMyAdmin)

## Running Locally

**1. API server**

```
cd api
npm install
```

Copy `api/.env.example` to `api/.env` and fill in your database credentials:

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=charityevents_db
WEATHER_API_KEY=your_key
```

Start the server:

```
node server.js
```

The API runs at `http://localhost:3000`.

**2. Client app**

```
cd client-app
npm install
ng serve
```

Opens at `http://localhost:4200`.

**3. Admin app**

```
cd admin-app
npm install
ng serve --port 4201
```

Opens at `http://localhost:4201`.

## Deployment (cPanel)

The apps are deployed on cPanel with Passenger for Node.js:

- `client-app` is built (`ng build`) and uploaded to the `public` folder of the hosting account; the API URL in the build points to `https://<domain>/a3api/api`.
- `api` is registered as a Node.js app with the Phusion Passenger setup in cPanel; environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) are configured in the cPanel Node.js interface, and the app is restarted after any change.
- `admin-app` is built and uploaded to a `public-admin` folder with base href `/a3api/admin/`.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/events | List all events (supports `?date=`, `?location=`, `?category_id=` filters) |
| GET | /api/events/:id | Get one event (includes weather) |
| POST | /api/events | Create an event (admin) |
| PUT | /api/events/:id | Update an event (admin) |
| DELETE | /api/events/:id | Delete an event (admin); returns 409 if registrations exist |
| GET | /api/registrations | List registrations |
| POST | /api/register | Register for an event; duplicate email for the same event returns 409 |
| GET | /api/categories | List event categories |
| GET | /api/weather | Get weather data for an event location |