-- =============================================================
-- PROG2002 Assessment 3 - Charity Events Database (v2)
-- Database: charityevents_db
-- Description: A3 schema - extends the A2 database with
--              (1) latitude/longitude on event (for the weather API)
--              (2) a new registration table linked to event
--              Case study set in Liuzhou, China.
-- How to use (MySQL Workbench / mysql command line):
--   1. Open this file and run it (or: mysql -u root -p < charityevents_db.sql)
--   2. It (re)creates the database, the tables, and sample data.
-- NOTE: this file DROPS and recreates charityevents_db (A2 data is
--       replaced by this extended dataset).
-- =============================================================

DROP DATABASE IF EXISTS charityevents_db;
CREATE DATABASE charityevents_db;
USE charityevents_db;

-- -------------------------------------------------------------
-- Table: organisation
-- Stores the charitable organisations that host events.
-- -------------------------------------------------------------
CREATE TABLE organisation (
    organisation_id INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    mission_statement TEXT,
    contact_email   VARCHAR(100),
    contact_phone   VARCHAR(20),
    address         VARCHAR(200)
);

-- -------------------------------------------------------------
-- Table: category
-- Event categories used to filter events (e.g. fun run, gala).
-- -------------------------------------------------------------
CREATE TABLE category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- -------------------------------------------------------------
-- Table: event
-- Stores every charity event. The status flag allows the site
-- to suspend events that violate policy (suspended events are
-- hidden from the public pages). Whether an event is "past" or
-- "upcoming" is derived by comparing event_date with CURDATE().
-- A3 additions: latitude/longitude so the client can call the
-- Open-Meteo weather API for the event location.
-- -------------------------------------------------------------
CREATE TABLE event (
    event_id        INT AUTO_INCREMENT PRIMARY KEY,
    organisation_id INT NOT NULL,
    category_id     INT NOT NULL,
    name            VARCHAR(150) NOT NULL,
    short_description VARCHAR(255),
    full_description  TEXT,
    purpose         VARCHAR(255),
    event_date      DATETIME NOT NULL,
    location        VARCHAR(150) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    ticket_price    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ticket_info     VARCHAR(255),
    fundraising_goal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    funds_raised    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    image_url       VARCHAR(255),
    latitude        DECIMAL(10,7) NOT NULL DEFAULT 0.0,
    longitude       DECIMAL(10,7) NOT NULL DEFAULT 0.0,
    status          ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_organisation
        FOREIGN KEY (organisation_id) REFERENCES organisation (organisation_id),
    CONSTRAINT fk_event_category
        FOREIGN KEY (category_id) REFERENCES category (category_id)
);

-- -------------------------------------------------------------
-- Table: registration (NEW in A3)
-- Records ticket purchases (registrations) for events.
-- One person may register for many events, but only ONCE per
-- event - enforced by the UNIQUE(event_id, email) constraint.
-- The FK uses ON DELETE RESTRICT so an event that has any
-- registration can never be deleted (data integrity rule).
-- -------------------------------------------------------------
CREATE TABLE registration (
    registration_id   INT AUTO_INCREMENT PRIMARY KEY,
    event_id          INT NOT NULL,
    full_name         VARCHAR(100) NOT NULL,
    email             VARCHAR(100) NOT NULL,
    phone             VARCHAR(20),
    registration_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tickets           INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_registration_event
        FOREIGN KEY (event_id) REFERENCES event (event_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_registration_once_per_event
        UNIQUE (event_id, email)
);

-- -------------------------------------------------------------
-- Sample data: charitable organisations
-- -------------------------------------------------------------
INSERT INTO organisation (name, description, mission_statement, contact_email, contact_phone, address) VALUES
('Liuzhou Care', 'Liuzhou Care is a local non-profit organisation dedicated to supporting vulnerable families and individuals across Liuzhou through food relief, housing support, and community programs.',
 'No one in Liuzhou should face hardship alone.',
 'hello@liuzhoucare.org', '+86 772 5550 1234', '12 Binjiang East Road, Chengzhong District, Liuzhou, Guangxi'),
('Bright Futures Youth Foundation', 'Bright Futures Youth Foundation empowers young people aged 12-25 in Liuzhou with mentoring, education scholarships, and mental health support so every young person can reach their full potential.',
 'Every young person deserves a bright future.',
 'contact@brightfutures.org', '+86 772 5550 9876', '88 Wenchang Road, Liuzhou, Guangxi');

-- -------------------------------------------------------------
-- Sample data: event categories
-- -------------------------------------------------------------
INSERT INTO category (name, description) VALUES
('Fun Run', 'Running or walking events open to all fitness levels'),
('Gala Dinner', 'Formal fundraising dinners with auctions and entertainment'),
('Concert', 'Live music events raising funds for a cause'),
('Silent Auction', 'Bidding events where attendees place written bids'),
('Charity Walk', 'Community walking events for awareness and fundraising'),
('Bake Sale', 'Community food stalls raising funds for local causes');

-- -------------------------------------------------------------
-- Sample data: events (8 active + 1 suspended).
-- Coordinates are the real-world positions of the Liuzhou
-- venues, ready for the Open-Meteo weather forecast API.
-- -------------------------------------------------------------
INSERT INTO event
(organisation_id, category_id, name, short_description, full_description, purpose,
 event_date, location, city, ticket_price, ticket_info, fundraising_goal, funds_raised,
 image_url, latitude, longitude, status) VALUES
-- Organisation 1: Liuzhou Care
(1, 1, 'Liuzhou Riverside Fun Run 2026', 'A 10 km fun run along the scenic Liu River promenade.',
 'Lace up your running shoes and join us for the annual Liuzhou Riverside Fun Run! Choose between the 10 km course for experienced runners or the relaxed 3 km family walk along the Liu River promenade. All proceeds fund our emergency food relief program, which provides over 5,000 food hampers each year to families doing it tough.',
 'Raise CNY 40,000 for the emergency food relief program.',
 '2026-11-08 08:00:00', 'Binjiang Park (Riverside Park), Liuzhou', 'Liuzhou', 35.00,
 'Entry includes a race bib, finisher medal, and breakfast rice noodles.', 40000.00, 26500.00,
 'images/fun-run.jpg', 24.3156000, 109.4086000, 'active'),

(1, 2, 'Starlight Gala Dinner 2026', 'An elegant evening of fine dining, live music, and a live auction.',
 'Join Liuzhou Care for our most glamorous night of the year. The Starlight Gala Dinner features a three-course meal, performances by local musicians, and a live auction with exclusive prizes. Every ticket helps us keep our family shelter open 24/7 for those experiencing homelessness.',
 'Raise CNY 120,000 for the 24/7 family shelter.',
 '2026-12-05 18:30:00', 'Grand Ballroom, Liuzhou Hotel', 'Liuzhou', 150.00,
 'Black tie. All tickets include dinner, drinks, and auction paddle.', 120000.00, 74500.00,
 'images/gala-dinner.jpg', 24.3264000, 109.4281000, 'active'),

(1, 6, 'Community Bake Sale & Morning Tea', 'Homemade treats, great coffee, and even better company.',
 'Our wonderful volunteers bake hundreds of cakes, luosifen-inspired snacks, slices, and biscuits for this beloved community morning tea. Drop by, grab a coffee and a treat, and know that every yuan goes straight to our senior companionship program, which pairs volunteers with isolated elderly residents.',
 'Raise CNY 5,000 for the senior companionship program.',
 '2026-10-18 09:00:00', 'Liuzhou Community Hall, Chengzhong District', 'Liuzhou', 0.00,
 'Free entry - pay what you feel for treats and coffee.', 5000.00, 1300.00,
 'images/bake-sale.jpg', 24.3189000, 109.4123000, 'active'),

(1, 5, 'Sunrise Charity Walk for Seniors', 'A gentle 5 km walk at sunrise to honour our elderly community.',
 'Walk with us at sunrise around the lakeside trail of Dalongtan Park to raise awareness of loneliness among seniors. The 5 km route is fully accessible, and the early morning air in the park is unforgettable. Funds raised keep our weekly social visits and transport service running.',
 'Raise CNY 15,000 for senior social support services.',
 '2026-08-23 06:30:00', 'Lakeside Trail, Dalongtan Park, Liuzhou', 'Liuzhou', 20.00,
 'Includes breakfast roll and soy milk at the finish line.', 15000.00, 15230.00,
 'images/charity-walk.jpg', 24.4558000, 109.3853000, 'active'),

-- Organisation 2: Bright Futures Youth Foundation
(2, 3, 'Sounds of Tomorrow Benefit Concert', 'An afternoon of live music by young Liuzhou artists.',
 'Some of Liuzhou''s most talented young musicians take the stage for one unforgettable afternoon by the river at Yaobu Ancient Town. Every ticket funds our music scholarship program, giving disadvantaged young people instruments, lessons, and a stage of their own. Line-up announced soon!',
 'Raise CNY 30,000 for youth music scholarships.',
 '2026-11-21 14:00:00', 'Riverside Amphitheatre, Yaobu Ancient Town', 'Liuzhou', 45.00,
 'General admission. Under 12s free with a paying adult.', 30000.00, 9800.00,
 'images/benefit-concert.jpg', 24.3163000, 109.4342000, 'active'),

(2, 1, 'Bright Futures Colour Dash', 'A 5 km colour run where getting messy is the whole point!',
 'The Colour Dash is back! Run, walk, or dance your way through 5 km of colour stations at People''s Square while our volunteers shower you in bright, non-toxic powder. Perfect for families, teams, and anyone who wants to support youth mental health programs in the most colourful way possible.',
 'Raise CNY 25,000 for youth mental health programs.',
 '2026-10-25 09:30:00', 'People''s Square, Liuzhou', 'Liuzhou', 30.00,
 'Entry includes colour pack, sunglasses, and event t-shirt.', 25000.00, 6200.00,
 'images/colour-dash.jpg', 24.3127000, 109.4159000, 'active'),

(2, 4, 'Young Artists Silent Auction', 'Bid on artworks donated by emerging young Liuzhou artists.',
 'Browse and bid on over 60 original artworks donated by Liuzhou''s most promising young artists, from ink paintings and photography to ceramics and digital art. All hammer prices go directly to our education scholarship fund, helping young people stay in school.',
 'Raise CNY 18,000 for the education scholarship fund.',
 '2026-12-12 17:00:00', 'Exhibition Hall, Liuzhou Museum', 'Liuzhou', 10.00,
 'Entry fee covers catalogue and refreshments. Bidding paddles provided.', 18000.00, 0.00,
 'images/silent-auction.jpg', 24.3506000, 109.4219000, 'active'),

(2, 2, 'Golden Hour Gala 2026', 'Celebrate a decade of bright futures at our anniversary gala.',
 'Ten years of mentoring, scholarships, and second chances - and we are just getting started. Join us for a night of celebration on the rooftop of the Diwang International Tower with guest speakers, a retrospective exhibition, and a fundraising pledge drive to launch our next decade of impact.',
 'Raise CNY 200,000 for the next decade of youth programs.',
 '2026-09-12 18:00:00', 'Rooftop Garden, Diwang International Tower, CBD', 'Liuzhou', 200.00,
 'Cocktail attire. Includes canapes, drinks, and entertainment.', 200000.00, 201500.00,
 'images/golden-gala.jpg', 24.3201000, 109.4231000, 'active'),

-- A suspended event (violates policy - must NOT appear on the public website)
(2, 3, 'Test Event - Suspended', 'This event has been suspended and should never be displayed.',
 'This placeholder event exists to demonstrate that suspended events are hidden from the public website. It violates our content policy and therefore its status is set to suspended.',
 'N/A - suspended event.',
 '2026-11-15 19:00:00', 'Secret Location', 'Liuzhou', 10.00,
 'N/A', 1000.00, 0.00, NULL, 24.3264000, 109.4281000, 'suspended');

-- -------------------------------------------------------------
-- Sample data: registrations (12 records across the events)
-- Note: wei.zhang registers for two DIFFERENT events (allowed),
-- but no email appears twice for the same event (blocked).
-- -------------------------------------------------------------
INSERT INTO registration (event_id, full_name, email, phone, registration_date, tickets) VALUES
(1, 'Wei Zhang',     'wei.zhang@example.com',   '+86 138 7720 1001', '2026-09-14 10:22:00', 2),
(1, 'Liping Chen',   'liping.chen@example.com', '+86 139 7720 1002', '2026-09-15 09:05:00', 1),
(1, 'Jianhua Wang',  'jianhua.wang@example.com','+86 137 7720 1003', '2026-09-20 20:41:00', 4),
(2, 'Fang Liu',      'fang.liu@example.com',    '+86 136 7720 1004', '2026-09-18 14:30:00', 2),
(2, 'Wei Zhang',     'wei.zhang@example.com',   '+86 138 7720 1001', '2026-09-25 11:12:00', 2),
(3, 'Xiaoming Huang','xiaoming.h@example.com',  '+86 135 7720 1005', '2026-10-01 08:47:00', 3),
(3, 'Yuting Yang',   'yuting.yang@example.com', '+86 150 7720 1006', '2026-10-02 16:03:00', 1),
(4, 'Guang Zhou',    'guang.zhou@example.com',  '+86 151 7720 1007', '2026-08-10 19:25:00', 2),
(5, 'Shanshan Wu',   'shanshan.wu@example.com', '+86 152 7720 1008', '2026-09-28 12:56:00', 2),
(6, 'Hao Li',        'hao.li@example.com',      '+86 153 7720 1009', '2026-10-03 10:18:00', 5),
(7, 'Tingting Luo',  'tingting.luo@example.com','+86 155 7720 1010', '2026-10-04 15:44:00', 1),
(8, 'Kun Zhao',      'kun.zhao@example.com',    '+86 156 7720 1011', '2026-09-05 21:09:00', 2);
