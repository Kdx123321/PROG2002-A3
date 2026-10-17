// server.js
// Express RESTful API for the Charity Events website (PROG2002 A3).
//
// The API exposes the charity event data stored in the MySQL database
// (charityevents_db) so that the client-side and admin-side websites
// can consume it. A3 extends the A2 API with the full CRUD cycle:
//
// PUBLIC ENDPOINTS (client-side website)
//   GET  /api/events                 -> all active events (upcoming first,
//                                       then past), with category and
//                                       organisation names.
//   GET  /api/events/search          -> search active events by date,
//                                       location and/or category.
//   GET  /api/events/:id             -> full details of ONE active event,
//                                       PLUS its registrations (newest
//                                       first). 404 if missing/suspended.
//   GET  /api/categories             -> all event categories.
//
// REGISTRATION ENDPOINT
//   POST /api/registrations          -> create a registration (ticket
//                                       purchase) for an event. Rejects
//                                       duplicates for the same event.
//
// ADMIN ENDPOINTS (admin-side website)
//   GET  /api/admin/events           -> ALL events regardless of status
//                                       (active, past AND suspended).
//   POST /api/admin/events           -> insert a new event.
//   PUT  /api/admin/events/:id       -> update an existing event.
//   DELETE /api/admin/events/:id     -> delete an event, but ONLY if it
//                                       has no registrations (409 otherwise).
//
// Run with:  npm install   then   npm start   (server listens on port 3000)

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./event_db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Simple request logger (helps when testing with the browser/Postman).
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// Serve the built Angular apps (client + admin) as static files.
// In development the Angular dev servers are used instead; in production
// (SCU cPanel) the Express server hosts the compiled output.
app.use(express.static(path.join(__dirname, 'public')));

// Reusable query fragment: event row + category name + organisation name.
const EVENT_SELECT = `
    SELECT e.*, c.name AS category, o.name AS organisation
    FROM event e
    JOIN category c    ON e.category_id = c.category_id
    JOIN organisation o ON e.organisation_id = o.organisation_id
`;

// Columns allowed when inserting/updating an event (whitelist prevents
// clients from writing unexpected fields such as the primary key).
const EVENT_FIELDS = [
    'organisation_id', 'category_id', 'name', 'short_description',
    'full_description', 'purpose', 'event_date', 'location', 'city',
    'ticket_price', 'ticket_info', 'fundraising_goal', 'funds_raised',
    'image_url', 'latitude', 'longitude', 'status'
];

// Fields an event insert/update must always provide.
const REQUIRED_EVENT_FIELDS = ['organisation_id', 'category_id', 'name',
    'event_date', 'location', 'city', 'ticket_price'];

// -------------------------------------------------------------
// GET /api/events
// Returns every ACTIVE event with its category and organisation.
// Events whose date has passed are marked as "past"; the client
// uses this flag to show the "Past" / "Upcoming" badge.
// Suspended events are excluded (policy violation => hidden).
// -------------------------------------------------------------
app.get('/api/events', (req, res) => {
    const sql = `
        ${EVENT_SELECT}
        WHERE e.status = 'active'
        ORDER BY CASE WHEN e.event_date < CURDATE() THEN 1 ELSE 0 END,
                 e.event_date ASC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        rows.forEach(r => {
            r.event_status = new Date(r.event_date) < new Date() ? 'past' : 'upcoming';
        });
        res.json(rows);
    });
});

// -------------------------------------------------------------
// GET /api/categories
// Returns all event categories (id + name) so the search page
// and the admin form can build their dropdowns.
// -------------------------------------------------------------
app.get('/api/categories', (req, res) => {
    db.query('SELECT category_id, name FROM category ORDER BY name', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// -------------------------------------------------------------
// GET /api/events/search?date=YYYY-MM-DD&location=text&category=id
// Searches ACTIVE events using one or more criteria (AND logic).
// Any criterion left empty is ignored.
// -------------------------------------------------------------
app.get('/api/events/search', (req, res) => {
    // Whitelist the allowed query parameters to avoid SQL injection.
    const { date, location, category } = req.query;
    const conditions = [];
    const params = [];

    if (date) {                       // exact date filter
        conditions.push('DATE(e.event_date) = ?');
        params.push(date);
    }
    if (location) {                   // partial, case-insensitive location match
        conditions.push('(e.location LIKE ? OR e.city LIKE ?)');
        params.push(`%${location}%`, `%${location}%`);
    }
    if (category) {                   // exact category filter
        conditions.push('e.category_id = ?');
        params.push(Number(category));
    }

    const where = conditions.length ? 'AND ' + conditions.join(' AND ') : '';
    const sql = `
        ${EVENT_SELECT}
        WHERE e.status = 'active' ${where}
        ORDER BY CASE WHEN e.event_date < CURDATE() THEN 1 ELSE 0 END,
                 e.event_date ASC
    `;
    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        rows.forEach(r => {
            r.event_status = new Date(r.event_date) < new Date() ? 'past' : 'upcoming';
        });
        res.json(rows);   // may be an empty array - the client shows a friendly message
    });
});

// -------------------------------------------------------------
// GET /api/events/:id
// Returns the full details of ONE active event PLUS the list of
// its registrations (sorted by registration date, NEWEST first,
// as required). Registrations expose only safe public fields.
// 404 if the event does not exist or is suspended.
// -------------------------------------------------------------
app.get('/api/events/:id', (req, res) => {
    const sql = `${EVENT_SELECT} WHERE e.event_id = ? AND e.status = 'active'`;
    db.query(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Event not found or has been suspended' });
        }
        const event = rows[0];
        event.event_status = new Date(event.event_date) < new Date() ? 'past' : 'upcoming';

        const regSql = `
            SELECT registration_id, full_name, registration_date, tickets
            FROM registration
            WHERE event_id = ?
            ORDER BY registration_date DESC
        `;
        db.query(regSql, [req.params.id], (err2, registrations) => {
            if (err2) return res.status(500).json({ error: 'Database error' });
            event.registrations = registrations;
            res.json(event);
        });
    });
});

// -------------------------------------------------------------
// POST /api/registrations
// Creates a registration (ticket purchase) for an event.
// Body: { event_id, full_name, email, phone?, tickets? }
// - validates required fields and ticket count client data
// - rejects unknown/suspended events (404/400)
// - rejects a duplicate registration for the same event (409),
//   matching the UNIQUE(event_id, email) rule in the schema
// On success returns 201 with the created record.
// -------------------------------------------------------------
app.post('/api/registrations', (req, res) => {
    const { event_id, full_name, email, phone, tickets } = req.body || {};

    if (!event_id || !full_name || !email) {
        return res.status(400).json({ error: 'event_id, full_name and email are required' });
    }
    const ticketCount = parseInt(tickets, 10);
    if (!Number.isInteger(ticketCount) || ticketCount < 1 || ticketCount > 10) {
        return res.status(400).json({ error: 'tickets must be a number between 1 and 10' });
    }

    // The event must exist and be active (no registrations for suspended events).
    db.query('SELECT status FROM event WHERE event_id = ?', [event_id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        if (rows[0].status !== 'active') {
            return res.status(400).json({ error: 'This event is suspended and cannot accept registrations' });
        }

        const sql = `
            INSERT INTO registration (event_id, full_name, email, phone, tickets)
            VALUES (?, ?, ?, ?, ?)
        `;
        db.query(sql, [event_id, full_name, email, phone || null, ticketCount], (err2, result) => {
            if (err2) {
                // 1062 = duplicate entry (same email, same event)
                if (err2.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'This email has already registered for this event' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({
                registration_id: result.insertId,
                event_id: Number(event_id),
                full_name, email, phone: phone || null, tickets: ticketCount
            });
        });
    });
});

// -------------------------------------------------------------
// GET /api/admin/events
// Returns ALL events regardless of status (active, past and
// suspended) for the admin dashboard listing.
// -------------------------------------------------------------
app.get('/api/admin/events', (req, res) => {
    const sql = `
        ${EVENT_SELECT}
        ORDER BY CASE WHEN e.event_date < CURDATE() THEN 1 ELSE 0 END,
                 e.event_date ASC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        rows.forEach(r => {
            r.event_status = new Date(r.event_date) < new Date() ? 'past' : 'upcoming';
        });
        res.json(rows);
    });
});

// -------------------------------------------------------------
// GET /api/admin/events/:id
// Full event details for the admin edit form, INCLUDING its
// registrations (all of them, newest first).
// -------------------------------------------------------------
app.get('/api/admin/events/:id', (req, res) => {
    const sql = `${EVENT_SELECT} WHERE e.event_id = ?`;
    db.query(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });

        const regSql = `
            SELECT registration_id, full_name, email, phone, registration_date, tickets
            FROM registration
            WHERE event_id = ?
            ORDER BY registration_date DESC
        `;
        db.query(regSql, [req.params.id], (err2, registrations) => {
            if (err2) return res.status(500).json({ error: 'Database error' });
            rows[0].registrations = registrations;
            res.json(rows[0]);
        });
    });
});

// -------------------------------------------------------------
// POST /api/admin/events
// Inserts a new charity event. Only whitelisted fields from
// EVENT_FIELDS are accepted; REQUIRED_EVENT_FIELDS must be present.
// -------------------------------------------------------------
app.post('/api/admin/events', (req, res) => {
    const body = req.body || {};

    const missing = REQUIRED_EVENT_FIELDS.filter(f => body[f] === undefined || body[f] === '');
    if (missing.length) {
        return res.status(400).json({ error: 'Missing required fields: ' + missing.join(', ') });
    }

    const fields = EVENT_FIELDS.filter(f => body[f] !== undefined);
    const sql = `
        INSERT INTO event (${fields.join(', ')})
        VALUES (${fields.map(() => '?').join(', ')})
    `;
    db.query(sql, fields.map(f => body[f]), (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ event_id: result.insertId, ...body });
    });
});

// -------------------------------------------------------------
// PUT /api/admin/events/:id
// Updates an existing event (all fields optional except that at
// least one must be supplied). Whitelisted fields only.
// -------------------------------------------------------------
app.put('/api/admin/events/:id', (req, res) => {
    const body = req.body || {};
    const fields = EVENT_FIELDS.filter(f => body[f] !== undefined);

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No updatable fields supplied' });
    }

    const sql = `
        UPDATE event SET ${fields.map(f => `${f} = ?`).join(', ')}
        WHERE event_id = ?
    `;
    db.query(sql, [...fields.map(f => body[f]), req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
        res.json({ event_id: Number(req.params.id), updated: fields });
    });
});

// -------------------------------------------------------------
// DELETE /api/admin/events/:id
// Removes an event, upholding data integrity: an event can only
// be deleted if it has NO registrations. If registrations exist
// the attempt is blocked with 409 Conflict.
// (The FK also uses ON DELETE RESTRICT as a second line of defence.)
// -------------------------------------------------------------
app.delete('/api/admin/events/:id', (req, res) => {
    db.query('SELECT COUNT(*) AS cnt FROM registration WHERE event_id = ?',
        [req.params.id], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            if (rows[0].cnt > 0) {
                return res.status(409).json({
                    error: `Cannot delete: this event has ${rows[0].cnt} registration(s).`
                });
            }

            db.query('DELETE FROM event WHERE event_id = ?', [req.params.id], (err2, result) => {
                if (err2) return res.status(500).json({ error: 'Database error' });
                if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
                res.json({ message: 'Event deleted', event_id: Number(req.params.id) });
            });
        });
});

// Central error handler (unexpected errors become clean JSON, not HTML).
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(PORT, () => {
    console.log(`Charity Events API running at http://localhost:${PORT}`);
    console.log(`Public:  GET  /api/events | /api/events/search | /api/events/:id | /api/categories`);
    console.log(`Registration: POST /api/registrations`);
    console.log(`Admin:   GET/POST/PUT/DELETE /api/admin/events...`);
});
