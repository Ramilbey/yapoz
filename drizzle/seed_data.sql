--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET search_path = public;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: workspaces; Type: TABLE DATA; Schema: public; Owner: jawab
--

INSERT INTO public.workspaces VALUES ('KASIH1', 'Kasih Hair Studio', 'Kuala Lumpur', 'Asia/Kuala_Lumpur', 'MYR', '{"live": true, "sample": true, "business": {"type": "hair salon", "phone": null, "address": "2-7 Jalan Kiara 3, Mont Kiara, 50480 Kuala Lumpur", "website": null, "languages": ["English", "Malay", "Mandarin"], "description": "Friendly neighbourhood hair salon with three stylists. Cuts, colour, treatments and blow-dries for women, men and kids. Sells a small range of hair care products."}, "onboarding": {"step": 6, "completedAt": "2026-10-01T00:00:00.000Z"}, "demoTraffic": false, "confidenceThreshold": 0.55}', '2026-10-21 19:38:59.580092+08');
INSERT INTO public.workspaces VALUES ('FORNO7', 'Forno Sette', 'Kuala Lumpur', 'Asia/Kuala_Lumpur', 'MYR', '{"live": true, "sample": true, "business": {"type": "wood-fired pizzeria", "phone": null, "address": "27 Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur", "website": null, "languages": ["English", "Malay"], "description": "Neapolitan-style wood-fired pizzeria in Bangsar with a 40-seat dining room, a terrace and its own delivery riders nearby. Also sells aprons and T-shirts."}, "onboarding": {"step": 6, "completedAt": "2026-10-01T00:00:00.000Z"}, "demoTraffic": false, "confidenceThreshold": 0.55}', '2026-10-21 19:38:50.525816+08');


--
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: jawab
--

INSERT INTO public.users VALUES ('00000000-0000-4000-8000-000000000001', 'FORNO7', 'owner@demo', 'Lina Hassan', '$2b$10$ap1sP77b51svNiyQp0faHeNXJeblOJZfb.tEZddjgda5UD9qu9Pne', 'owner', '2026-10-21 19:38:50.666535+08');
INSERT INTO public.users VALUES ('00000000-0000-4000-8000-000000000002', 'FORNO7', 'service@demo', 'Farid Aziz', '$2b$10$ap1sP77b51svNiyQp0faHeNXJeblOJZfb.tEZddjgda5UD9qu9Pne', 'service', '2026-10-21 19:38:50.666535+08');
INSERT INTO public.users VALUES ('00000000-0000-4000-8000-000000000011', 'KASIH1', 'owner@demo', 'Nadia Lim', '$2b$10$8yA42gq/ijHx.XQyWFeN.efvcllZs7pvhoRXk0H7PBvaRfcmsxtIy', 'owner', '2026-10-21 19:38:59.718585+08');


--
--



--
--

Pizza cook | Brickfields, Kuala Lumpur
aiman.hakim@example.com
PERSONAL DETAILS
Age: 29 | Marital status: Married | Religion: Islam | Nationality: Malaysian
SUMMARY
6 years in professional kitchens. Ran the wood-fired oven alone on Friday and Saturday nights, 180+ covers per
service.
EXPERIENCE
Head pizzaiolo, Fuoco Lento, Bukit Bintang (2022–2025, 3 yrs)
- Managed oven fire from 6pm lighting to 11pm close, keeping the deck at 430–470°C
- Trained 3 junior cooks on stretching and turning pizzas in a wood-fired oven
Pizza cook, Dapur Api Pizzeria, Bangsar South (2020–2022, 2 yrs)
Commis, Hotel kitchen, KL Sentral (2019–2020, 1 yr)
SKILLS
wood-fired oven (5 yrs), Neapolitan dough (5 yrs), line cooking (6 yrs)
AVAILABILITY
evenings, weekends. Can start in 2 weeks.
LANGUAGES
Malay, English', true, '2026-10-21 19:38:51.228+08', 'seed', '2026-10-21 19:38:51.228+08', '2026-10-21 19:38:51.229053+08');
Pizza cook | Bangsar South, Kuala Lumpur
meiling.tan@example.com
PERSONAL DETAILS
Date of birth: 14/02/1997 | Gender: Female | Marital status: Single
SUMMARY
5 years in professional kitchens. 4 years on a wood-fired oven doing 48-hour cold-fermented dough.
EXPERIENCE
Senior pizza cook, Brace & Ember, Damansara Heights (2021–present, 5 yrs)
- Holds a Neapolitan pizza course certificate (2022) and a food handler certificate
- Works dinner service five nights a week, 5pm to close
Prep cook, Little Lantern Café, Mid Valley (2020–2021, 1 yr)
SKILLS
wood-fired oven (4 yrs), dough fermentation (4 yrs), food safety (5 yrs)
AVAILABILITY
evenings, weekends, full-time. One month notice.
LANGUAGES
English, Mandarin, Cantonese, Malay', true, '2026-10-21 19:38:51.261+08', 'seed', '2026-10-21 19:38:51.261+08', '2026-10-21 19:38:51.262246+08');
Pizza cook | Seputeh, Kuala Lumpur
arjun.pillai@example.com
SUMMARY
8 years in professional kitchens. 6 years firing a wood oven for breads and lunch pizzas.
EXPERIENCE
Bakery and pizza lead, Grainhouse Bakery, Mid Valley (2019–present, 7 yrs)
- Prefers morning shifts only, 6am to 2pm, Monday to Friday
- Cut dough waste by 20% with a new portioning system
Baker, Morning Crust, Brickfields (2017–2019, 2 yrs)
SKILLS
wood-fired oven (6 yrs), bread baking (8 yrs), kitchen management (3 yrs)
AVAILABILITY
mornings, weekdays.
LANGUAGES
English, Tamil, Malay', true, '2026-10-21 19:38:51.287+08', 'seed', '2026-10-21 19:38:51.287+08', '2026-10-21 19:38:51.288436+08');
Name: Daniel Wong
Now: Pizza cook at Oak & Flame, Sri Hartamas
- 3 yrs wood fire oven at Oak & Flame, 2 yrs deck oven before that
- can open and close the oven, do dough by myself
- free evenings + weekend
Stay at Mont Kiara. Languages: English, Cantonese.
Available: evenings, weekends.
PM me @danielwong_cooks_demo', true, '2026-10-21 19:38:51.298+08', 'seed', '2026-10-21 19:38:51.298+08', '2026-10-21 19:38:51.299569+08');
Name: Nurul Izzah binti Kamal
Now: Pizza cook at Brace & Ember, Damansara Heights
- 2 tahun wood-fired pizza (2 years)
- before that 1 year pastry
- boleh kerja malam, evening shift ok
Stay at Damansara Heights. Languages: Malay, English.
Available: evenings.
PM me @izzah_kitchen_demo', true, '2026-10-21 19:38:51.306+08', 'seed', '2026-10-21 19:38:51.306+08', '2026-10-21 19:38:51.306901+08');
Pizza cook | Kepong, Kuala Lumpur
hafiz.rahman@example.com
PERSONAL DETAILS
Age: 33 | Married with 2 children
SUMMARY
9 years in professional kitchens. 7 years as pizza chef on a wood-fired oven.
EXPERIENCE
Pizza chef, Ember Republic, Kepong (2018–present, 8 yrs)
- Leads a team of 4 on night shift
- Competed in a regional pizza competition, 2nd place (2023)
Line cook, Kopi & Co, Segambut (2016–2018, 2 yrs)
SKILLS
wood-fired oven (7 yrs), Neapolitan dough (7 yrs), team leadership (3 yrs)
AVAILABILITY
evenings, late nights, weekends.
LANGUAGES
Malay, English', true, '2026-10-21 19:38:51.328+08', 'seed', '2026-10-21 19:38:51.328+08', '2026-10-21 19:38:51.32888+08');
Name: Priya Nair
Now: Pizza cook at Casa Fumo, Bukit Bintang
- 3.5 years on wood-fired oven at Casa Fumo
- also ran the dough lab — mixing, balling, fermentation logs
- can do evenings and weekends, stay in Brickfields 5 min away
Stay at Brickfields. Languages: English, Tamil, Malay.
Available: evenings, weekends.
PM me @priya_pizza_demo', true, '2026-10-21 19:38:51.339+08', 'seed', '2026-10-21 19:38:51.339+08', '2026-10-21 19:38:51.340456+08');
Pizza cook | TTDI, Kuala Lumpur
marco.rossi@example.com
PERSONAL DETAILS
Age: 38 | Nationality: Italian
SUMMARY
12 years in professional kitchens. 10 years on wood-fired ovens in Naples and Kuala Lumpur.
EXPERIENCE
Pizzaiolo, Antica Brace, Naples (2013–2020, 7 yrs)
- Designed the dough programme at Lievito (72-hour biga)
- Holds an employment pass, transferable
Head pizzaiolo, Lievito, TTDI (2020–present, 6 yrs)
SKILLS
wood-fired oven (10 yrs), Neapolitan dough (12 yrs), menu development (4 yrs)
AVAILABILITY
evenings, weekends, full-time. Available from next month.
LANGUAGES
English, Italian', true, '2026-10-21 19:38:51.362+08', 'seed', '2026-10-21 19:38:51.362+08', '2026-10-21 19:38:51.363207+08');
Name: Siti Aisyah binti Omar
Now: Crew at QuickSlice, Cheras
- 1 tahun kerja pizza fast food, conveyor oven
- nak belajar wood fire
- boleh shift malam
Stay at Cheras. Languages: Malay.
Available: evenings, weekends.
PM me @aisyah_crew_demo', true, '2026-10-21 19:38:51.373+08', 'seed', '2026-10-21 19:38:51.373+08', '2026-10-21 19:38:51.374376+08');
Pizza cook | Petaling Jaya, Kuala Lumpur
kevin.lim@example.com
SUMMARY
4 years in professional kitchens. 4 years weekend shifts on a wood-fired oven.
EXPERIENCE
Weekend pizza cook, Firepit Social, SS2 (2022–present, 4 yrs)
- Runs mobile oven at weekend events and weddings
- Weekdays taken by a full-time logistics job
SKILLS
wood-fired oven (4 yrs), catering events (2 yrs)
AVAILABILITY
weekends.
LANGUAGES
English, Mandarin, Malay', true, '2026-10-21 19:38:51.398+08', 'seed', '2026-10-21 19:38:51.398+08', '2026-10-21 19:38:51.399604+08');
Name: Faizal Osman
Now: Wok cook at Gerai Faizal, Setapak night market
- 5 years wok cook at night market
- never work pizza but fast learner
- can work late night
Stay at Setapak. Languages: Malay, English.
Available: evenings, late nights.
PM me @faizal_wok_demo', true, '2026-10-21 19:38:51.41+08', 'seed', '2026-10-21 19:38:51.41+08', '2026-10-21 19:38:51.411365+08');
Pizza cook | Sentul, Kuala Lumpur
lakshmi.devi@example.com
SUMMARY
4 years in professional kitchens. 3 years artisan bread, 1 year wood-fired pizza.
EXPERIENCE
Pizza cook, Ember Republic, Kepong (2025–present, 1 yr)
- Strong on hydration and fermentation
- Evening shifts preferred
Baker, Sentul Bread House (2022–2025, 3 yrs)
SKILLS
bread baking (3 yrs), wood-fired oven (1 yrs)
AVAILABILITY
evenings, weekdays.
LANGUAGES
English, Tamil, Malay', true, '2026-10-21 19:38:51.432+08', 'seed', '2026-10-21 19:38:51.432+08', '2026-10-21 19:38:51.433272+08');
Name: Jason Teh
Now: Pizza cook (part-time) at Oak & Flame, Sri Hartamas
- 3 yrs wood-fired, part time
- looking for 4 evenings a week
- can start immediately
Stay at Sri Hartamas. Languages: English, Mandarin.
Available: evenings, part-time.
PM me @jason_teh_demo', true, '2026-10-21 19:38:51.443+08', 'seed', '2026-10-21 19:38:51.443+08', '2026-10-21 19:38:51.44403+08');
Name: Amirul Asyraf
Now: Pizza cook at Telawi Slice, Bangsar
- 2.5 years wood fire pizza at Telawi Slice
- I live in Bangsar, walking distance
- evening and weekend ok
Stay at Bangsar. Languages: Malay, English.
Available: evenings, weekends.
PM me @amirul_bangsar_demo', true, '2026-10-21 19:38:51.45+08', 'seed', '2026-10-21 19:38:51.45+08', '2026-10-21 19:38:51.451124+08');
Pizza cook | Subang Jaya, Kuala Lumpur
grace.chong@example.com
PERSONAL DETAILS
Age: 31 | Marital status: Single
SUMMARY
6 years in professional kitchens. 5 years wood-fired oven, part of the opening team at Rosso Vivo.
EXPERIENCE
Sous chef (pizza), Rosso Vivo, SS15 Subang (2020–present, 6 yrs)
- Comfortable leading the pass on busy nights
- Would relocate closer for the right role
SKILLS
wood-fired oven (5 yrs), kitchen opening (1 yrs)
AVAILABILITY
evenings, weekends.
LANGUAGES
English, Mandarin, Cantonese', true, '2026-10-21 19:38:51.468+08', 'seed', '2026-10-21 19:38:51.468+08', '2026-10-21 19:38:51.46934+08');
Pizza cook | Kuchai Lama, Kuala Lumpur
ravi.shankar@example.com
SUMMARY
8 years in professional kitchens. 4 years on a wood-fired grill (meat, not pizza).
EXPERIENCE
Grill cook, Charcoal Road, Kuchai Lama (2018–present, 8 yrs)
- 8 years line cooking overall
- Full-time evenings
SKILLS
line cooking (8 yrs), wood-fired grill (4 yrs)
AVAILABILITY
evenings, full-time.
LANGUAGES
English, Tamil, Malay', true, '2026-10-21 19:38:51.491+08', 'seed', '2026-10-21 19:38:51.491+08', '2026-10-21 19:38:51.49183+08');
Name: Zul Hilmi
Now: Pizza cook at Pizza Corner Wangsa
- 3 tahun pizza deck oven (electric)
- belum pernah wood fire
- shift petang/malam ok
Stay at Wangsa Maju. Languages: Malay.
Available: evenings.
PM me @zulhilmi_demo', true, '2026-10-21 19:38:51.502+08', 'seed', '2026-10-21 19:38:51.502+08', '2026-10-21 19:38:51.503286+08');
Pizza cook | Bangsar South, Kuala Lumpur
hannah.lee@example.com
SUMMARY
1 years in professional kitchens. Diploma in Culinary Arts (2024).
EXPERIENCE
Commis, Dapur Api Pizzeria, Bangsar South (2025–present, 1 yr)
- 1 year commis at a wood-fired pizzeria
- Eager to grow into a pizza cook role
SKILLS
wood-fired oven (1 yrs), culinary diploma (2 yrs)
AVAILABILITY
evenings, weekends.
LANGUAGES
English, Korean', true, '2026-10-21 19:38:51.521+08', 'seed', '2026-10-21 19:38:51.521+08', '2026-10-21 19:38:51.522414+08');
Name: Muthu Krishnan
Now: Tandoor cook at Little India Tandoor House, Brickfields
- 4 years tandoor (wood/charcoal), naan and breads
- want to move into pizza
- near Bangsar
Stay at Brickfields. Languages: Tamil, English, Malay.
Available: evenings, weekends.
PM me @muthu_tandoor_demo', true, '2026-10-21 19:38:51.531+08', 'seed', '2026-10-21 19:38:51.531+08', '2026-10-21 19:38:51.53266+08');
Pizza cook | Ampang, Kuala Lumpur
farah.nadia@example.com
SUMMARY
3 years in professional kitchens. 3 years pastry, laminated doughs.
EXPERIENCE
Pastry cook, Sugar & Salt Patisserie, Ampang (2022–present, 4 yrs)
- Morning shifts
- Interested in dessert pizzas
SKILLS
pastry (3 yrs)
AVAILABILITY
mornings, weekdays.
LANGUAGES
Malay, English', true, '2026-10-21 19:38:51.548+08', 'seed', '2026-10-21 19:38:51.548+08', '2026-10-21 19:38:51.549628+08');
Pizza cook | Bukit Bintang, Kuala Lumpur
eric.chan@example.com
SUMMARY
5 years in professional kitchens. 5 years wood-fired oven at a 120-seat pizzeria.
EXPERIENCE
Pizza cook, Casa Fumo, Bukit Bintang (2020–present, 6 yrs)
- Handles nightly stock count and dough orders
- Evening and late-night shifts
SKILLS
wood-fired oven (5 yrs), inventory (2 yrs)
AVAILABILITY
evenings, late nights.
LANGUAGES
English, Cantonese, Mandarin', true, '2026-10-21 19:38:51.568+08', 'seed', '2026-10-21 19:38:51.568+08', '2026-10-21 19:38:51.569043+08');
Name: Syafiq Iskandar
Now: Pizza cook at Bara Pizza, Puchong
- 3 years wood fire oven at Bara Pizza Puchong
- evening shift only
- got own transport
Stay at Puchong. Languages: Malay, English.
Available: evenings.
PM me @syafiq_bara_demo', true, '2026-10-21 19:38:51.578+08', 'seed', '2026-10-21 19:38:51.578+08', '2026-10-21 19:38:51.579087+08');
Name: Joanne Yap
Now: Server at Little Lantern Café, Mid Valley
- 2 years service/front of house
- no kitchen experience
- open to kitchen training
Stay at Seputeh. Languages: English, Mandarin.
Available: evenings, weekends.
PM me @joanne_yap_demo', true, '2026-10-21 19:38:51.585+08', 'seed', '2026-10-21 19:38:51.585+08', '2026-10-21 19:38:51.586692+08');
Pizza cook | Titiwangsa, Kuala Lumpur
danish.haziq@example.com
PERSONAL DETAILS
Age: 27 | Religion: Islam
SUMMARY
4 years in professional kitchens. 4 years wood-fired oven in Ipoh, moved to KL in 2025.
EXPERIENCE
Pizza cook, Sette Colli Pizzeria, Ipoh (2021–2025, 4 yrs)
- Comfortable doing 100+ pizzas per night
- Full-time evenings
SKILLS
wood-fired oven (4 yrs), Neapolitan dough (3 yrs)
AVAILABILITY
evenings, weekends, full-time.
LANGUAGES
Malay, English', true, '2026-10-21 19:38:51.603+08', 'seed', '2026-10-21 19:38:51.603+08', '2026-10-21 19:38:51.603836+08');
Name: Ong Wei Jie
Now: Part-time kitchen helper at Ember Republic, Kepong
- student, 6 months part time helper
- weekends only
- learning to stretch dough
Stay at Kepong. Languages: Mandarin, English.
Available: weekends, part-time.
PM me @weijie_ong_demo', true, '2026-10-21 19:38:51.613+08', 'seed', '2026-10-21 19:38:51.613+08', '2026-10-21 19:38:51.614891+08');
Pizza cook | Mid Valley, Kuala Lumpur
anand.raj@example.com
SUMMARY
4 years in professional kitchens. 3 years on the wood-fired oven at Lievito.
EXPERIENCE
Pizza cook, Lievito, TTDI (2023–present, 3 yrs)
- Works the dinner rush 5pm–11pm
- Food handler certificate, typhoid vaccination up to date
Prep cook, Grainhouse Bakery, Mid Valley (2022–2023, 1 yr)
SKILLS
wood-fired oven (3 yrs), prep and mise en place (4 yrs)
AVAILABILITY
evenings, weekends.
LANGUAGES
English, Tamil, Malay', true, '2026-10-21 19:38:51.632+08', 'seed', '2026-10-21 19:38:51.632+08', '2026-10-21 19:38:51.632727+08');
Pizza cook | Shah Alam, Kuala Lumpur
nadia.karim@example.com
PERSONAL DETAILS
Marital status: Married
SUMMARY
10 years in professional kitchens. 10 years Italian kitchens, 5 in management.
EXPERIENCE
Executive sous chef, Hotel Italian restaurant, Shah Alam (2017–present, 9 yrs)
- 2 years supervising a wood-fired pizza station
- Daytime roles only
SKILLS
Italian cuisine (10 yrs), wood-fired oven (2 yrs), kitchen management (5 yrs)
AVAILABILITY
mornings, weekdays, full-time.
LANGUAGES
Malay, English, Arabic', true, '2026-10-21 19:38:51.651+08', 'seed', '2026-10-21 19:38:51.651+08', '2026-10-21 19:38:51.652517+08');
Name: Tommy Goh
Now: Delivery rider at Pizza delivery, Chow Kit
- 3 years delivery rider for pizza shop
- want to work inside kitchen
- night ok
Stay at Chow Kit. Languages: English, Mandarin, Malay.
Available: evenings, late nights.
PM me @tommy_goh_demo', true, '2026-10-21 19:38:51.663+08', 'seed', '2026-10-21 19:38:51.663+08', '2026-10-21 19:38:51.663846+08');
Pizza cook | Bangsar, Kuala Lumpur
iskandar.z@example.com
SUMMARY
6 years in professional kitchens. 5 years wood-fired oven, lunch service lead.
EXPERIENCE
Lunch pizza lead, Telawi Slice, Bangsar (2020–present, 6 yrs)
- Weekday mornings and lunch only (school pickup in the evening)
- Lives in Bangsar
SKILLS
wood-fired oven (5 yrs), Neapolitan dough (5 yrs)
AVAILABILITY
mornings, weekdays.
LANGUAGES
Malay, English', true, '2026-10-21 19:38:51.679+08', 'seed', '2026-10-21 19:38:51.679+08', '2026-10-21 19:38:51.680143+08');
Pizza cook | Damansara Heights, Kuala Lumpur
yusuf.ali@example.com
SUMMARY
5 years in professional kitchens. 4 years wood-fired oven across two pizzerias.
EXPERIENCE
Pizza cook, Brace & Ember, Damansara Heights (2022–present, 4 yrs)
- Set up the allergen board and nut-free prep area at Brace & Ember
- Evenings and weekends, 10 minutes from Bangsar
Pizza cook, Fuoco Lento, Bukit Bintang (2021–2022, 1 yr)
SKILLS
wood-fired oven (4 yrs), Neapolitan dough (4 yrs), allergen control (2 yrs)
AVAILABILITY
evenings, weekends.
LANGUAGES
English, Malay, Arabic', true, '2026-10-21 19:38:51.7+08', 'seed', '2026-10-21 19:38:51.7+08', '2026-10-21 19:38:51.700954+08');


--
--

Pizza cook | Brickfields, Kuala Lumpur
aiman.hakim@example.com
PERSONAL DETAILS
Age: 29 | Marital status: Married | Religion: Islam | Nationality: Malaysian
SUMMARY
6 years in professional kitchens. Ran the wood-fired oven alone on Friday and Saturday nights, 180+ covers per
service.
EXPERIENCE
Head pizzaiolo, Fuoco Lento, Bukit Bintang (2022–2025, 3 yrs)
- Managed oven fire from 6pm lighting to 11pm close, keeping the deck at 430–470°C
- Trained 3 junior cooks on stretching and turning pizzas in a wood-fired oven
Pizza cook, Dapur Api Pizzeria, Bangsar South (2020–2022, 2 yrs)
Commis, Hotel kitchen, KL Sentral (2019–2020, 1 yr)
SKILLS
wood-fired oven (5 yrs), Neapolitan dough (5 yrs), line cooking (6 yrs)
AVAILABILITY
evenings, weekends. Can start in 2 weeks.
LANGUAGES
Malay, English', '2026-10-21 19:38:51.233844+08');
Pizza cook | Bangsar South, Kuala Lumpur
meiling.tan@example.com
PERSONAL DETAILS
Date of birth: 14/02/1997 | Gender: Female | Marital status: Single
SUMMARY
5 years in professional kitchens. 4 years on a wood-fired oven doing 48-hour cold-fermented dough.
EXPERIENCE
Senior pizza cook, Brace & Ember, Damansara Heights (2021–present, 5 yrs)
- Holds a Neapolitan pizza course certificate (2022) and a food handler certificate
- Works dinner service five nights a week, 5pm to close
Prep cook, Little Lantern Café, Mid Valley (2020–2021, 1 yr)
SKILLS
wood-fired oven (4 yrs), dough fermentation (4 yrs), food safety (5 yrs)
AVAILABILITY
evenings, weekends, full-time. One month notice.
LANGUAGES
English, Mandarin, Cantonese, Malay', '2026-10-21 19:38:51.266851+08');
Pizza cook | Seputeh, Kuala Lumpur
arjun.pillai@example.com
SUMMARY
8 years in professional kitchens. 6 years firing a wood oven for breads and lunch pizzas.
EXPERIENCE
Bakery and pizza lead, Grainhouse Bakery, Mid Valley (2019–present, 7 yrs)
- Prefers morning shifts only, 6am to 2pm, Monday to Friday
- Cut dough waste by 20% with a new portioning system
Baker, Morning Crust, Brickfields (2017–2019, 2 yrs)
SKILLS
wood-fired oven (6 yrs), bread baking (8 yrs), kitchen management (3 yrs)
AVAILABILITY
mornings, weekdays.
LANGUAGES
English, Tamil, Malay', '2026-10-21 19:38:51.292287+08');
Pizza cook | Kepong, Kuala Lumpur
hafiz.rahman@example.com
PERSONAL DETAILS
Age: 33 | Married with 2 children
SUMMARY
9 years in professional kitchens. 7 years as pizza chef on a wood-fired oven.
EXPERIENCE
Pizza chef, Ember Republic, Kepong (2018–present, 8 yrs)
- Leads a team of 4 on night shift
- Competed in a regional pizza competition, 2nd place (2023)
Line cook, Kopi & Co, Segambut (2016–2018, 2 yrs)
SKILLS
wood-fired oven (7 yrs), Neapolitan dough (7 yrs), team leadership (3 yrs)
AVAILABILITY
evenings, late nights, weekends.
LANGUAGES
Malay, English', '2026-10-21 19:38:51.332664+08');
Pizza cook | TTDI, Kuala Lumpur
marco.rossi@example.com
PERSONAL DETAILS
Age: 38 | Nationality: Italian
SUMMARY
12 years in professional kitchens. 10 years on wood-fired ovens in Naples and Kuala Lumpur.
EXPERIENCE
Pizzaiolo, Antica Brace, Naples (2013–2020, 7 yrs)
- Designed the dough programme at Lievito (72-hour biga)
- Holds an employment pass, transferable
Head pizzaiolo, Lievito, TTDI (2020–present, 6 yrs)
SKILLS
wood-fired oven (10 yrs), Neapolitan dough (12 yrs), menu development (4 yrs)
AVAILABILITY
evenings, weekends, full-time. Available from next month.
LANGUAGES
English, Italian', '2026-10-21 19:38:51.367225+08');
Pizza cook | Petaling Jaya, Kuala Lumpur
kevin.lim@example.com
SUMMARY
4 years in professional kitchens. 4 years weekend shifts on a wood-fired oven.
EXPERIENCE
Weekend pizza cook, Firepit Social, SS2 (2022–present, 4 yrs)
- Runs mobile oven at weekend events and weddings
- Weekdays taken by a full-time logistics job
SKILLS
wood-fired oven (4 yrs), catering events (2 yrs)
AVAILABILITY
weekends.
LANGUAGES
English, Mandarin, Malay', '2026-10-21 19:38:51.403774+08');
Pizza cook | Sentul, Kuala Lumpur
lakshmi.devi@example.com
SUMMARY
4 years in professional kitchens. 3 years artisan bread, 1 year wood-fired pizza.
EXPERIENCE
Pizza cook, Ember Republic, Kepong (2025–present, 1 yr)
- Strong on hydration and fermentation
- Evening shifts preferred
Baker, Sentul Bread House (2022–2025, 3 yrs)
SKILLS
bread baking (3 yrs), wood-fired oven (1 yrs)
AVAILABILITY
evenings, weekdays.
LANGUAGES
English, Tamil, Malay', '2026-10-21 19:38:51.436895+08');
Pizza cook | Subang Jaya, Kuala Lumpur
grace.chong@example.com
PERSONAL DETAILS
Age: 31 | Marital status: Single
SUMMARY
6 years in professional kitchens. 5 years wood-fired oven, part of the opening team at Rosso Vivo.
EXPERIENCE
Sous chef (pizza), Rosso Vivo, SS15 Subang (2020–present, 6 yrs)
- Comfortable leading the pass on busy nights
- Would relocate closer for the right role
SKILLS
wood-fired oven (5 yrs), kitchen opening (1 yrs)
AVAILABILITY
evenings, weekends.
LANGUAGES
English, Mandarin, Cantonese', '2026-10-21 19:38:51.473258+08');
Pizza cook | Kuchai Lama, Kuala Lumpur
ravi.shankar@example.com
SUMMARY
8 years in professional kitchens. 4 years on a wood-fired grill (meat, not pizza).
EXPERIENCE
Grill cook, Charcoal Road, Kuchai Lama (2018–present, 8 yrs)
- 8 years line cooking overall
- Full-time evenings
SKILLS
line cooking (8 yrs), wood-fired grill (4 yrs)
AVAILABILITY
evenings, full-time.
LANGUAGES
English, Tamil, Malay', '2026-10-21 19:38:51.495681+08');
Pizza cook | Bangsar South, Kuala Lumpur
hannah.lee@example.com
SUMMARY
1 years in professional kitchens. Diploma in Culinary Arts (2024).
EXPERIENCE
Commis, Dapur Api Pizzeria, Bangsar South (2025–present, 1 yr)
- 1 year commis at a wood-fired pizzeria
- Eager to grow into a pizza cook role
SKILLS
wood-fired oven (1 yrs), culinary diploma (2 yrs)
AVAILABILITY
evenings, weekends.
LANGUAGES
English, Korean', '2026-10-21 19:38:51.526043+08');
Pizza cook | Ampang, Kuala Lumpur
farah.nadia@example.com
SUMMARY
3 years in professional kitchens. 3 years pastry, laminated doughs.
EXPERIENCE
Pastry cook, Sugar & Salt Patisserie, Ampang (2022–present, 4 yrs)
- Morning shifts
- Interested in dessert pizzas
SKILLS
pastry (3 yrs)
AVAILABILITY
mornings, weekdays.
LANGUAGES
Malay, English', '2026-10-21 19:38:51.553428+08');
Pizza cook | Bukit Bintang, Kuala Lumpur
eric.chan@example.com
SUMMARY
5 years in professional kitchens. 5 years wood-fired oven at a 120-seat pizzeria.
EXPERIENCE
Pizza cook, Casa Fumo, Bukit Bintang (2020–present, 6 yrs)
- Handles nightly stock count and dough orders
- Evening and late-night shifts
SKILLS
wood-fired oven (5 yrs), inventory (2 yrs)
AVAILABILITY
evenings, late nights.
LANGUAGES
English, Cantonese, Mandarin', '2026-10-21 19:38:51.572632+08');
Pizza cook | Titiwangsa, Kuala Lumpur
danish.haziq@example.com
PERSONAL DETAILS
Age: 27 | Religion: Islam
SUMMARY
4 years in professional kitchens. 4 years wood-fired oven in Ipoh, moved to KL in 2025.
EXPERIENCE
Pizza cook, Sette Colli Pizzeria, Ipoh (2021–2025, 4 yrs)
- Comfortable doing 100+ pizzas per night
- Full-time evenings
SKILLS
wood-fired oven (4 yrs), Neapolitan dough (3 yrs)
AVAILABILITY
evenings, weekends, full-time.
LANGUAGES
Malay, English', '2026-10-21 19:38:51.607754+08');
Pizza cook | Mid Valley, Kuala Lumpur
anand.raj@example.com
SUMMARY
4 years in professional kitchens. 3 years on the wood-fired oven at Lievito.
EXPERIENCE
Pizza cook, Lievito, TTDI (2023–present, 3 yrs)
- Works the dinner rush 5pm–11pm
- Food handler certificate, typhoid vaccination up to date
Prep cook, Grainhouse Bakery, Mid Valley (2022–2023, 1 yr)
SKILLS
wood-fired oven (3 yrs), prep and mise en place (4 yrs)
AVAILABILITY
evenings, weekends.
LANGUAGES
English, Tamil, Malay', '2026-10-21 19:38:51.636437+08');
Pizza cook | Shah Alam, Kuala Lumpur
nadia.karim@example.com
PERSONAL DETAILS
Marital status: Married
SUMMARY
10 years in professional kitchens. 10 years Italian kitchens, 5 in management.
EXPERIENCE
Executive sous chef, Hotel Italian restaurant, Shah Alam (2017–present, 9 yrs)
- 2 years supervising a wood-fired pizza station
- Daytime roles only
SKILLS
Italian cuisine (10 yrs), wood-fired oven (2 yrs), kitchen management (5 yrs)
AVAILABILITY
mornings, weekdays, full-time.
LANGUAGES
Malay, English, Arabic', '2026-10-21 19:38:51.656593+08');
Pizza cook | Bangsar, Kuala Lumpur
iskandar.z@example.com
SUMMARY
6 years in professional kitchens. 5 years wood-fired oven, lunch service lead.
EXPERIENCE
Lunch pizza lead, Telawi Slice, Bangsar (2020–present, 6 yrs)
- Weekday mornings and lunch only (school pickup in the evening)
- Lives in Bangsar
SKILLS
wood-fired oven (5 yrs), Neapolitan dough (5 yrs)
AVAILABILITY
mornings, weekdays.
LANGUAGES
Malay, English', '2026-10-21 19:38:51.683723+08');
Pizza cook | Damansara Heights, Kuala Lumpur
yusuf.ali@example.com
SUMMARY
5 years in professional kitchens. 4 years wood-fired oven across two pizzerias.
EXPERIENCE
Pizza cook, Brace & Ember, Damansara Heights (2022–present, 4 yrs)
- Set up the allergen board and nut-free prep area at Brace & Ember
- Evenings and weekends, 10 minutes from Bangsar
Pizza cook, Fuoco Lento, Bukit Bintang (2021–2022, 1 yr)
SKILLS
wood-fired oven (4 yrs), Neapolitan dough (4 yrs), allergen control (2 yrs)
AVAILABILITY
evenings, weekends.
LANGUAGES
English, Malay, Arabic', '2026-10-21 19:38:51.705165+08');


--
-- Data for Name: channels; Type: TABLE DATA; Schema: public; Owner: jawab
--

INSERT INTO public.channels VALUES ('c6227b9b-10e8-4372-aba3-a96b08923443', 'FORNO7', 'simulator', 'autopilot', '{}', NULL, true, '2026-10-21 19:38:50.680401+08');
INSERT INTO public.channels VALUES ('9bf6ffab-c75b-46e1-af2c-d8c94f1775d6', 'FORNO7', 'telegram', 'autopilot', '{"botUsername": ""}', NULL, true, '2026-10-21 19:38:50.680401+08');
INSERT INTO public.channels VALUES ('84648923-353a-4a25-ae50-ccb95351d4d9', 'FORNO7', 'whatsapp', 'autopilot', '{"phoneNumberId": ""}', NULL, true, '2026-10-21 19:38:50.680401+08');
INSERT INTO public.channels VALUES ('855dbef7-a818-4dfe-9a83-a69151d2756b', 'KASIH1', 'simulator', 'autopilot', '{}', NULL, true, '2026-10-21 19:38:59.722477+08');
INSERT INTO public.channels VALUES ('e8ac4df0-b555-4e5c-9e2b-4ee3e4f04457', 'KASIH1', 'telegram', 'autopilot', '{}', NULL, true, '2026-10-21 19:38:59.722477+08');
INSERT INTO public.channels VALUES ('458a6dd5-d7e4-4fdc-b4d6-094c055c0a62', 'KASIH1', 'whatsapp', 'autopilot', '{}', NULL, true, '2026-10-21 19:38:59.722477+08');


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: jawab
--

INSERT INTO public.customers VALUES ('64ba803c-227d-4406-a87c-a8f4e2f5cf0a', 'FORNO7', 'telegram', 'demo-8a4dcf', 'Melissa Tan', NULL, NULL, 'en', '2026-10-14 21:20:00+08', '2026-10-14 21:20:00+08');
INSERT INTO public.customers VALUES ('304e1549-cbae-4fdd-b8f4-d1a1fecffe13', 'FORNO7', 'telegram', 'demo-cyi4yl', 'Melissa Tan', NULL, NULL, 'en', '2026-10-14 09:26:00+08', '2026-10-14 09:26:00+08');
INSERT INTO public.customers VALUES ('4f5fee3c-78b6-4b16-8b73-740cd1536fc5', 'FORNO7', 'telegram', 'demo-97dv4z', 'Jun Wei', NULL, NULL, 'en', '2026-10-14 13:28:00+08', '2026-10-14 13:28:00+08');
INSERT INTO public.customers VALUES ('e5613bd6-5be4-4b82-a088-fe3968b40858', 'FORNO7', 'telegram', 'demo-4uftsl', 'Sharon Lee', NULL, NULL, 'en', '2026-10-14 21:01:00+08', '2026-10-14 21:01:00+08');
INSERT INTO public.customers VALUES ('aafece14-913e-4082-b233-22bc92f8014a', 'FORNO7', 'telegram', 'demo-2yxxrz', 'Amir', NULL, NULL, 'en', '2026-10-14 19:04:00+08', '2026-10-14 19:04:00+08');
INSERT INTO public.customers VALUES ('4e443ce7-092c-4cbd-837f-68b4f8c0042a', 'FORNO7', 'whatsapp', 'demo-c29vfq', 'Ganesh', NULL, NULL, 'en', '2026-10-14 17:05:00+08', '2026-10-14 17:05:00+08');
INSERT INTO public.customers VALUES ('cab2ca6c-1fa1-4ac2-94f4-2a604f243bcc', 'FORNO7', 'telegram', 'demo-bit5rc', 'Kavitha S.', NULL, NULL, 'en', '2026-10-14 15:02:00+08', '2026-10-14 15:02:00+08');
INSERT INTO public.customers VALUES ('a846fd1a-5305-4247-90cf-f9a8b9ca341a', 'FORNO7', 'telegram', 'demo-bkkt7h', 'Amir', NULL, NULL, 'en', '2026-10-14 10:49:00+08', '2026-10-14 10:49:00+08');
INSERT INTO public.customers VALUES ('3cd9ef59-2354-43f6-8ec1-62e1cf3342f0', 'FORNO7', 'whatsapp', 'demo-2687c2', 'Nur Amira', NULL, NULL, 'en', '2026-10-14 21:24:00+08', '2026-10-14 21:24:00+08');
INSERT INTO public.customers VALUES ('db598671-fad0-4481-bd54-75e340e3f080', 'FORNO7', 'whatsapp', 'demo-31k9ec', 'Farhan', NULL, NULL, 'en', '2026-10-14 21:42:00+08', '2026-10-14 21:42:00+08');
INSERT INTO public.customers VALUES ('bd94e42a-919b-414d-9023-80e219d6d5c8', 'FORNO7', 'simulator', 'demo-gckd2k', 'Deepa', NULL, NULL, 'en', '2026-10-14 09:24:00+08', '2026-10-14 09:24:00+08');
INSERT INTO public.customers VALUES ('3cec144b-bfa8-4392-bd2d-e8f124f47edf', 'FORNO7', 'telegram', 'demo-et8pbr', 'Ganesh', NULL, NULL, 'en', '2026-10-14 14:51:00+08', '2026-10-14 14:51:00+08');
INSERT INTO public.customers VALUES ('a329220d-2773-4e8d-8b84-14de824f44f0', 'FORNO7', 'whatsapp', 'demo-2sss9d', 'Melissa Tan', NULL, NULL, 'en', '2026-10-14 13:10:00+08', '2026-10-14 13:10:00+08');
INSERT INTO public.customers VALUES ('5bcc2db1-8e72-4b75-8892-5947ef61ceb3', 'FORNO7', 'telegram', 'demo-f3cs8e', 'Amir', NULL, NULL, 'en', '2026-10-14 11:54:00+08', '2026-10-14 11:54:00+08');
INSERT INTO public.customers VALUES ('9ccb2bb0-47b8-4af7-a0d4-3d9b9c84987e', 'FORNO7', 'telegram', 'demo-dctidu', 'Haziq', NULL, NULL, 'en', '2026-10-14 21:31:00+08', '2026-10-14 21:31:00+08');
INSERT INTO public.customers VALUES ('0d501b19-c133-4982-9274-e3487be9484d', 'FORNO7', 'telegram', 'demo-2ssprb', 'Jun Wei', NULL, NULL, 'en', '2026-10-14 20:48:00+08', '2026-10-14 20:48:00+08');
INSERT INTO public.customers VALUES ('cd576b93-3aca-48ad-9101-9b4e63a633ea', 'FORNO7', 'telegram', 'demo-eiyqh3', 'Bryan Ooi', NULL, NULL, 'en', '2026-10-14 20:56:00+08', '2026-10-14 20:56:00+08');
INSERT INTO public.customers VALUES ('78742a2b-7881-47e3-93db-445f3f047808', 'FORNO7', 'telegram', 'demo-aplj1a', 'Jun Wei', NULL, NULL, 'en', '2026-10-14 11:07:00+08', '2026-10-14 11:07:00+08');
INSERT INTO public.customers VALUES ('9fc89296-1b74-408b-b685-f9f72f934ef7', 'FORNO7', 'telegram', 'demo-7ajtlg', 'Sharon Lee', NULL, NULL, 'en', '2026-10-14 12:49:00+08', '2026-10-14 12:49:00+08');
INSERT INTO public.customers VALUES ('71646379-a9eb-4f82-b097-bc981e119318', 'FORNO7', 'telegram', 'demo-712dff', 'Farhan', NULL, NULL, 'en', '2026-10-14 16:14:00+08', '2026-10-14 16:14:00+08');
INSERT INTO public.customers VALUES ('f58c81d1-081c-4b67-92ac-006475fad358', 'FORNO7', 'telegram', 'demo-28orh', 'Kavitha S.', NULL, NULL, 'en', '2026-10-14 16:40:00+08', '2026-10-14 16:40:00+08');
INSERT INTO public.customers VALUES ('d50dae1f-c599-4317-88c6-fe97ee4a198b', 'FORNO7', 'telegram', 'demo-3srh53', 'Nur Amira', NULL, NULL, 'en', '2026-10-14 10:22:00+08', '2026-10-14 10:22:00+08');
INSERT INTO public.customers VALUES ('40b03e3c-ed8f-4185-a824-3b1d562d7dba', 'FORNO7', 'telegram', 'demo-5l50u5', 'Nur Amira', NULL, NULL, 'en', '2026-10-14 16:51:00+08', '2026-10-14 16:51:00+08');
INSERT INTO public.customers VALUES ('c2f09aa8-a333-4069-8558-9518de0f2e5e', 'FORNO7', 'telegram', 'demo-fgvq3s', 'Ken Lau', NULL, NULL, 'en', '2026-10-14 22:19:00+08', '2026-10-14 22:19:00+08');
INSERT INTO public.customers VALUES ('8e35d37f-6d6b-4d53-acb4-5c75e5b9e03a', 'FORNO7', 'whatsapp', 'demo-fzpk2z', 'Deepa', NULL, NULL, 'en', '2026-10-14 16:41:00+08', '2026-10-14 16:41:00+08');
INSERT INTO public.customers VALUES ('ed39c690-bdb5-45f5-a0f0-c178fbe9e673', 'FORNO7', 'telegram', 'demo-afjhuy', 'Sharon Lee', NULL, NULL, 'en', '2026-10-14 13:00:00+08', '2026-10-14 13:00:00+08');
INSERT INTO public.customers VALUES ('03ccb318-319a-47f1-9133-64a1fe21ea34', 'FORNO7', 'telegram', 'demo-b610ym', 'Puteri', NULL, NULL, 'en', '2026-10-14 15:35:00+08', '2026-10-14 15:35:00+08');
INSERT INTO public.customers VALUES ('76a20fd7-07ba-4e28-8104-24c4581a8ea4', 'FORNO7', 'telegram', 'demo-dp2pfr', 'Nur Amira', NULL, NULL, 'en', '2026-10-14 11:20:00+08', '2026-10-14 11:20:00+08');
INSERT INTO public.customers VALUES ('b9bb1943-b43d-48bc-b7ab-5a9157b51144', 'FORNO7', 'whatsapp', 'demo-eorxs6', 'Puteri', NULL, NULL, 'en', '2026-10-14 12:46:00+08', '2026-10-14 12:46:00+08');
INSERT INTO public.customers VALUES ('e52b4abe-4040-4be8-bc4f-295d05cad5fa', 'FORNO7', 'whatsapp', 'demo-82lrhy', 'Chloe Ng', NULL, NULL, 'en', '2026-10-14 12:54:00+08', '2026-10-14 12:54:00+08');
INSERT INTO public.customers VALUES ('91ccb105-b5e9-402d-90cb-648feaf8adca', 'FORNO7', 'telegram', 'demo-3sw653', 'Arif Danial', NULL, NULL, 'en', '2026-10-14 09:49:00+08', '2026-10-14 09:49:00+08');
INSERT INTO public.customers VALUES ('698a33b0-3509-4d3f-8549-18d5e829deaf', 'FORNO7', 'telegram', 'demo-cznnle', 'Melissa Tan', NULL, NULL, 'en', '2026-10-14 19:17:00+08', '2026-10-14 19:17:00+08');
INSERT INTO public.customers VALUES ('4fe882cb-6567-4ee4-8529-a1662fedfc67', 'FORNO7', 'simulator', 'demo-2emj5p', 'Hakim', NULL, NULL, 'en', '2026-10-14 20:05:00+08', '2026-10-14 20:05:00+08');
INSERT INTO public.customers VALUES ('f02adeb5-aff2-401b-9b3a-2c0cf83b183a', 'FORNO7', 'whatsapp', 'demo-f8ydqc', 'Melissa Tan', NULL, NULL, 'en', '2026-10-14 18:14:00+08', '2026-10-14 18:14:00+08');
INSERT INTO public.customers VALUES ('bb8ae0ee-f466-4171-8d2b-496f140d8d62', 'FORNO7', 'whatsapp', 'demo-45gk9c', 'Vanessa', NULL, NULL, 'en', '2026-10-14 09:39:00+08', '2026-10-14 09:39:00+08');
INSERT INTO public.customers VALUES ('a6e01eed-a607-4ca0-beaa-2a7f6c0265bd', 'FORNO7', 'telegram', 'demo-3i0nfx', 'Siew Mei', NULL, NULL, 'en', '2026-10-14 20:56:00+08', '2026-10-14 20:56:00+08');
INSERT INTO public.customers VALUES ('d39eb77c-b900-48dc-a38e-32ac4d3e3316', 'FORNO7', 'telegram', 'demo-8kgtfw', 'Melissa Tan', NULL, NULL, 'en', '2026-10-15 22:42:00+08', '2026-10-15 22:42:00+08');
INSERT INTO public.customers VALUES ('7037bab0-86fd-4937-8778-364baf1163d6', 'FORNO7', 'telegram', 'demo-8c1qs9', 'Arif Danial', NULL, NULL, 'en', '2026-10-15 21:03:00+08', '2026-10-15 21:03:00+08');
INSERT INTO public.customers VALUES ('4046004b-c24d-49dc-bce6-1cc929f4b25c', 'FORNO7', 'whatsapp', 'demo-7yrdnm', 'Deepa', NULL, NULL, 'en', '2026-10-15 20:20:00+08', '2026-10-15 20:20:00+08');
INSERT INTO public.customers VALUES ('da548507-486b-4e83-8dd6-6bc3b12ed829', 'FORNO7', 'telegram', 'demo-c03tjv', 'Nur Amira', NULL, NULL, 'en', '2026-10-15 09:03:00+08', '2026-10-15 09:03:00+08');
INSERT INTO public.customers VALUES ('0cec5a6a-7466-497f-9e2c-1791c10c0ee4', 'FORNO7', 'telegram', 'demo-208k7d', 'Vanessa', NULL, NULL, 'en', '2026-10-15 15:55:00+08', '2026-10-15 15:55:00+08');
INSERT INTO public.customers VALUES ('1f1184fb-81ae-4f8e-b22c-b34c6a0a26d0', 'FORNO7', 'telegram', 'demo-b9zamj', 'Farhan', NULL, NULL, 'en', '2026-10-15 21:44:00+08', '2026-10-15 21:44:00+08');
INSERT INTO public.customers VALUES ('c4c3bb43-6425-4fca-a6c7-372d9dbc5da5', 'FORNO7', 'simulator', 'demo-2mum7c', 'Syahmi', NULL, NULL, 'en', '2026-10-15 22:32:00+08', '2026-10-15 22:32:00+08');
INSERT INTO public.customers VALUES ('1fa1a088-3d72-4a6b-b905-3bb6d9c7ddd4', 'FORNO7', 'whatsapp', 'demo-aibeh4', 'Nur Amira', NULL, NULL, 'en', '2026-10-15 10:55:00+08', '2026-10-15 10:55:00+08');
INSERT INTO public.customers VALUES ('adf294d7-8245-413a-90dc-ae6e37bb987c', 'FORNO7', 'whatsapp', 'demo-7pzgyv', 'Puteri', NULL, NULL, 'en', '2026-10-15 21:15:00+08', '2026-10-15 21:15:00+08');
INSERT INTO public.customers VALUES ('fd4d1cb0-93a1-424d-8052-332c54d536dc', 'FORNO7', 'whatsapp', 'demo-anhap4', 'Jun Wei', NULL, NULL, 'en', '2026-10-15 22:56:00+08', '2026-10-15 22:56:00+08');
INSERT INTO public.customers VALUES ('5ed37c07-a3e8-462e-855b-f97a23a7d739', 'FORNO7', 'telegram', 'demo-bpo2nq', 'Rachel Lim', NULL, NULL, 'en', '2026-10-15 11:21:00+08', '2026-10-15 11:21:00+08');
INSERT INTO public.customers VALUES ('10378edd-a4f3-4d58-a9d1-5f43db5e40a6', 'FORNO7', 'telegram', 'demo-1esf', 'Adam K.', NULL, NULL, 'en', '2026-10-15 09:00:00+08', '2026-10-15 09:00:00+08');
INSERT INTO public.customers VALUES ('bd95e579-3c68-4f6d-90b2-665eb5745f6b', 'FORNO7', 'telegram', 'demo-ca4k7k', 'Melissa Tan', NULL, NULL, 'en', '2026-10-15 14:40:00+08', '2026-10-15 14:40:00+08');
INSERT INTO public.customers VALUES ('ced65af0-0119-4e93-aaa7-48f9677cd5ef', 'FORNO7', 'telegram', 'demo-37v3ir', 'Deepa', NULL, NULL, 'en', '2026-10-15 14:48:00+08', '2026-10-15 14:48:00+08');
INSERT INTO public.customers VALUES ('76c3f01c-e6ed-45a1-8ecf-4c0cbddc29e0', 'FORNO7', 'telegram', 'demo-g6rzct', 'Rachel Lim', NULL, NULL, 'en', '2026-10-15 15:02:00+08', '2026-10-15 15:02:00+08');
INSERT INTO public.customers VALUES ('5f45a96c-ae58-4f75-b670-d7bfdbb1d58e', 'FORNO7', 'telegram', 'demo-8d4arg', 'Siew Mei', NULL, NULL, 'en', '2026-10-15 12:15:00+08', '2026-10-15 12:15:00+08');
INSERT INTO public.customers VALUES ('c2910800-c3c5-4b0b-b6ab-f06f6f3e6692', 'FORNO7', 'telegram', 'demo-9fjw0x', 'Hakim', NULL, NULL, 'en', '2026-10-15 16:08:00+08', '2026-10-15 16:08:00+08');
INSERT INTO public.customers VALUES ('51dc1141-8129-4d4d-b4ec-e59febef941b', 'FORNO7', 'telegram', 'demo-ax4g4h', 'Deepa', NULL, NULL, 'en', '2026-10-15 15:12:00+08', '2026-10-15 15:12:00+08');
INSERT INTO public.customers VALUES ('a510f50f-2eca-42b9-8831-22e2b6e2f3ba', 'FORNO7', 'telegram', 'demo-4ndh0n', 'Rachel Lim', NULL, NULL, 'en', '2026-10-15 13:34:00+08', '2026-10-15 13:34:00+08');
INSERT INTO public.customers VALUES ('a2cfd7d9-abdf-4c6a-9eb2-82e4bcae1a30', 'FORNO7', 'telegram', 'demo-a6pj6h', 'Ganesh', NULL, NULL, 'en', '2026-10-15 12:54:00+08', '2026-10-15 12:54:00+08');
INSERT INTO public.customers VALUES ('a3bb95d0-56c5-41dd-8f01-622bd9ee7782', 'FORNO7', 'telegram', 'demo-axr0w3', 'Hakim', NULL, NULL, 'en', '2026-10-15 21:01:00+08', '2026-10-15 21:01:00+08');
INSERT INTO public.customers VALUES ('e0cec588-4f2a-44b1-9782-015107c93911', 'FORNO7', 'telegram', 'demo-1kk4d2', 'Ken Lau', NULL, NULL, 'en', '2026-10-15 17:01:00+08', '2026-10-15 17:01:00+08');
INSERT INTO public.customers VALUES ('b1a5da68-6b37-4f33-8d52-a2be323195b8', 'FORNO7', 'telegram', 'demo-2k0qmg', 'Aisha Rahman', NULL, NULL, 'en', '2026-10-15 22:57:00+08', '2026-10-15 22:57:00+08');
INSERT INTO public.customers VALUES ('2cece751-38c4-467e-aaaf-9fede762692e', 'FORNO7', 'whatsapp', 'demo-5ri868', 'Bryan Ooi', NULL, NULL, 'en', '2026-10-15 14:18:00+08', '2026-10-15 14:18:00+08');
INSERT INTO public.customers VALUES ('53b2c08c-0421-4461-999e-060ad5dfe521', 'FORNO7', 'telegram', 'demo-q08xe', 'Adam K.', NULL, NULL, 'en', '2026-10-15 20:49:00+08', '2026-10-15 20:49:00+08');
INSERT INTO public.customers VALUES ('34ac993d-da76-4539-9678-14e191f31e23', 'FORNO7', 'simulator', 'demo-6wjrma', 'Bryan Ooi', NULL, NULL, 'en', '2026-10-15 20:47:00+08', '2026-10-15 20:47:00+08');
INSERT INTO public.customers VALUES ('989777f6-4f36-4910-91b7-688efeede9aa', 'FORNO7', 'whatsapp', 'demo-223y32', 'Arif Danial', NULL, NULL, 'en', '2026-10-15 09:13:00+08', '2026-10-15 09:13:00+08');
INSERT INTO public.customers VALUES ('56841408-d384-4c87-bd05-c3186043ede9', 'FORNO7', 'whatsapp', 'demo-ahze26', 'Jun Wei', NULL, NULL, 'en', '2026-10-15 22:21:00+08', '2026-10-15 22:21:00+08');
INSERT INTO public.customers VALUES ('d130c1b8-5cf4-4f92-bbac-9ab6ab3ad998', 'FORNO7', 'whatsapp', 'demo-5yiiwi', 'Hakim', NULL, NULL, 'en', '2026-10-15 22:20:00+08', '2026-10-15 22:20:00+08');
INSERT INTO public.customers VALUES ('a486f0e2-b365-4c7b-bf16-0869189005a0', 'FORNO7', 'whatsapp', 'demo-6wjusd', 'Haziq', NULL, NULL, 'en', '2026-10-15 09:53:00+08', '2026-10-15 09:53:00+08');
INSERT INTO public.customers VALUES ('bb555e02-0da5-4eb3-9059-6e9c257d655d', 'FORNO7', 'whatsapp', 'demo-6pb7bv', 'Bryan Ooi', NULL, NULL, 'en', '2026-10-15 17:29:00+08', '2026-10-15 17:29:00+08');
INSERT INTO public.customers VALUES ('b71f406d-9a2b-4eed-972a-9f82ca8e04a6', 'FORNO7', 'telegram', 'demo-d6tdsk', 'Aisha Rahman', NULL, NULL, 'en', '2026-10-16 18:55:00+08', '2026-10-16 18:55:00+08');
INSERT INTO public.customers VALUES ('8d85c686-53d5-4bfa-9e94-7708869119fa', 'FORNO7', 'whatsapp', 'demo-c8ejib', 'Puteri', NULL, NULL, 'en', '2026-10-16 17:16:00+08', '2026-10-16 17:16:00+08');
INSERT INTO public.customers VALUES ('f5df32a4-d153-43d5-9985-6fa92e73d679', 'FORNO7', 'telegram', 'demo-5uyvrl', 'Rachel Lim', NULL, NULL, 'en', '2026-10-16 14:45:00+08', '2026-10-16 14:45:00+08');
INSERT INTO public.customers VALUES ('2e9dfa95-e63b-4cac-9e52-f0a5fc3df54b', 'FORNO7', 'telegram', 'demo-e534e0', 'Nur Amira', NULL, NULL, 'en', '2026-10-16 21:40:00+08', '2026-10-16 21:40:00+08');
INSERT INTO public.customers VALUES ('2bb986c2-5b8f-43a6-b0dc-9d785452093e', 'FORNO7', 'telegram', 'demo-g0wg57', 'Nur Amira', NULL, NULL, 'en', '2026-10-16 11:21:00+08', '2026-10-16 11:21:00+08');
INSERT INTO public.customers VALUES ('771ba0cc-8015-41c6-b81f-d8d7749dd8ee', 'FORNO7', 'telegram', 'demo-cfyoie', 'Amir', NULL, NULL, 'en', '2026-10-16 14:06:00+08', '2026-10-16 14:06:00+08');
INSERT INTO public.customers VALUES ('1b19ce4b-a804-43b4-8f9b-69815a2ba60f', 'FORNO7', 'whatsapp', 'demo-8h32k0', 'Haziq', NULL, NULL, 'en', '2026-10-16 21:29:00+08', '2026-10-16 21:29:00+08');
INSERT INTO public.customers VALUES ('5db854af-74dd-4011-bc36-c234558c8341', 'FORNO7', 'telegram', 'demo-dvkceq', 'Kavitha S.', NULL, NULL, 'en', '2026-10-16 19:03:00+08', '2026-10-16 19:03:00+08');
INSERT INTO public.customers VALUES ('726132a9-1883-4439-8009-44b3d4751d05', 'FORNO7', 'simulator', 'demo-9e0cju', 'Siew Mei', NULL, NULL, 'en', '2026-10-16 09:37:00+08', '2026-10-16 09:37:00+08');
INSERT INTO public.customers VALUES ('a19b4f8d-1b50-41a5-8aba-7bcfdafc8b66', 'FORNO7', 'telegram', 'demo-3fjba2', 'Sharon Lee', NULL, NULL, 'en', '2026-10-16 22:56:00+08', '2026-10-16 22:56:00+08');
INSERT INTO public.customers VALUES ('9f85a09f-076b-4ee3-aca6-fb540458380c', 'FORNO7', 'whatsapp', 'demo-838gcc', 'Ganesh', NULL, NULL, 'en', '2026-10-16 17:04:00+08', '2026-10-16 17:04:00+08');
INSERT INTO public.customers VALUES ('3f8f5ce4-c71a-456e-b067-796601228a5e', 'FORNO7', 'telegram', 'demo-1nd1p9', 'Puteri', NULL, NULL, 'en', '2026-10-16 10:54:00+08', '2026-10-16 10:54:00+08');
INSERT INTO public.customers VALUES ('72c62fd5-a2a5-4a5f-9eb6-62017adc16e6', 'FORNO7', 'telegram', 'demo-99kzup', 'Haziq', NULL, NULL, 'en', '2026-10-16 20:05:00+08', '2026-10-16 20:05:00+08');
INSERT INTO public.customers VALUES ('904fdda9-d181-4af3-8655-aa7554f4b7b3', 'FORNO7', 'telegram', 'demo-3xb1p5', 'Arif Danial', NULL, NULL, 'en', '2026-10-16 20:01:00+08', '2026-10-16 20:01:00+08');
INSERT INTO public.customers VALUES ('72f94838-0677-41a1-b1ba-b6a6c8744f48', 'FORNO7', 'telegram', 'demo-f2wwgy', 'Ken Lau', NULL, NULL, 'en', '2026-10-16 19:16:00+08', '2026-10-16 19:16:00+08');
INSERT INTO public.customers VALUES ('c60f3e4a-0271-4c9a-a04d-41355092d777', 'FORNO7', 'simulator', 'demo-g64tly', 'Amir', NULL, NULL, 'en', '2026-10-16 12:53:00+08', '2026-10-16 12:53:00+08');
INSERT INTO public.customers VALUES ('9b594d44-6fd4-41dd-9454-352852a77ef0', 'FORNO7', 'telegram', 'demo-3nqq8r', 'Rachel Lim', NULL, NULL, 'en', '2026-10-16 11:48:00+08', '2026-10-16 11:48:00+08');
INSERT INTO public.customers VALUES ('92bb93b4-733c-49ef-bac0-a95013e1174b', 'FORNO7', 'whatsapp', 'demo-4ap4jr', 'Arif Danial', NULL, NULL, 'en', '2026-10-16 20:43:00+08', '2026-10-16 20:43:00+08');
INSERT INTO public.customers VALUES ('b503ee9f-427f-4402-8b99-7f3a83112515', 'FORNO7', 'whatsapp', 'demo-3a091h', 'Melissa Tan', NULL, NULL, 'en', '2026-10-16 21:42:00+08', '2026-10-16 21:42:00+08');
INSERT INTO public.customers VALUES ('af89d1c7-88e2-4f7a-ae4a-c0d301030461', 'FORNO7', 'whatsapp', 'demo-3b711h', 'Puteri', NULL, NULL, 'en', '2026-10-16 14:24:00+08', '2026-10-16 14:24:00+08');
INSERT INTO public.customers VALUES ('18658bd2-9a00-4d6a-87db-a88b90517309', 'FORNO7', 'telegram', 'demo-3s81ku', 'Chloe Ng', NULL, NULL, 'en', '2026-10-16 14:33:00+08', '2026-10-16 14:33:00+08');
INSERT INTO public.customers VALUES ('04c1f045-e9cd-4cc5-95f8-b9fc550f5067', 'FORNO7', 'telegram', 'demo-1xjqqm', 'Rachel Lim', NULL, NULL, 'en', '2026-10-16 09:52:00+08', '2026-10-16 09:52:00+08');
INSERT INTO public.customers VALUES ('5b3e3c06-675c-4ed7-9519-e0d923356775', 'FORNO7', 'telegram', 'demo-15u234', 'Bryan Ooi', NULL, NULL, 'en', '2026-10-16 14:38:00+08', '2026-10-16 14:38:00+08');
INSERT INTO public.customers VALUES ('cc20a777-bb00-4b1c-8271-e12dc990313d', 'FORNO7', 'whatsapp', 'demo-46y9y0', 'Deepa', NULL, NULL, 'en', '2026-10-16 17:34:00+08', '2026-10-16 17:34:00+08');
INSERT INTO public.customers VALUES ('76455732-2539-4081-af87-80023dfb0f5e', 'FORNO7', 'telegram', 'demo-40ldjh', 'Ganesh', NULL, NULL, 'en', '2026-10-16 13:43:00+08', '2026-10-16 13:43:00+08');
INSERT INTO public.customers VALUES ('689226c1-478c-4611-8262-63846396bc4d', 'FORNO7', 'telegram', 'demo-do4nto', 'Melissa Tan', NULL, NULL, 'en', '2026-10-16 10:14:00+08', '2026-10-16 10:14:00+08');
INSERT INTO public.customers VALUES ('9ad1e543-b5ac-4f97-8ab0-c1c569d3500f', 'FORNO7', 'telegram', 'demo-bdg3bg', 'Arif Danial', NULL, NULL, 'en', '2026-10-16 20:32:00+08', '2026-10-16 20:32:00+08');
INSERT INTO public.customers VALUES ('985c25cd-37ce-412d-a9d6-701dc97dc3ca', 'FORNO7', 'whatsapp', 'demo-8pzi2j', 'Aisha Rahman', NULL, NULL, 'en', '2026-10-16 22:55:00+08', '2026-10-16 22:55:00+08');
INSERT INTO public.customers VALUES ('a9735e4a-1a0e-4513-bfe4-21769eef5cdd', 'FORNO7', 'telegram', 'demo-5kky9o', 'Adam K.', NULL, NULL, 'en', '2026-10-16 20:59:00+08', '2026-10-16 20:59:00+08');
INSERT INTO public.customers VALUES ('d7b1014b-118a-498e-aa1f-a86c3c924320', 'FORNO7', 'telegram', 'demo-3jvfii', 'Farhan', NULL, NULL, 'en', '2026-10-16 13:25:00+08', '2026-10-16 13:25:00+08');
INSERT INTO public.customers VALUES ('d364b959-a27a-43e5-9018-6e37c4f643e8', 'FORNO7', 'telegram', 'demo-crz9s3', 'Aisha Rahman', NULL, NULL, 'en', '2026-10-16 13:00:00+08', '2026-10-16 13:00:00+08');
INSERT INTO public.customers VALUES ('fd42988c-c6ee-4160-ab36-a241f95afc62', 'FORNO7', 'simulator', 'demo-7swgkl', 'Farhan', NULL, NULL, 'en', '2026-10-16 10:21:00+08', '2026-10-16 10:21:00+08');
INSERT INTO public.customers VALUES ('94c4b1d0-1b78-4212-960c-7a3870067336', 'FORNO7', 'whatsapp', 'demo-6c22c5', 'Amir', NULL, NULL, 'en', '2026-10-16 09:29:00+08', '2026-10-16 09:29:00+08');
INSERT INTO public.customers VALUES ('da118caf-8ab7-45ab-8fd7-aa4463b61482', 'FORNO7', 'telegram', 'demo-fzpd0t', 'Kavitha S.', NULL, NULL, 'en', '2026-10-16 22:14:00+08', '2026-10-16 22:14:00+08');
INSERT INTO public.customers VALUES ('e32bdbd1-ba1f-4a02-af04-6dff06c4253d', 'FORNO7', 'telegram', 'demo-fiveci', 'Adam K.', NULL, NULL, 'en', '2026-10-16 20:09:00+08', '2026-10-16 20:09:00+08');
INSERT INTO public.customers VALUES ('754f22d2-45f4-4534-8e08-60c0cf51b217', 'FORNO7', 'telegram', 'demo-1k19kk', 'Hakim', NULL, NULL, 'en', '2026-10-16 19:41:00+08', '2026-10-16 19:41:00+08');
INSERT INTO public.customers VALUES ('2f652a22-6093-4070-ba8c-785f5f9bb7d6', 'FORNO7', 'whatsapp', 'demo-2uzshl', 'Puteri', NULL, NULL, 'en', '2026-10-16 15:34:00+08', '2026-10-16 15:34:00+08');
INSERT INTO public.customers VALUES ('d57f74a1-1acc-41da-bf1e-a668f184feed', 'FORNO7', 'telegram', 'demo-fwv1us', 'Siew Mei', NULL, NULL, 'en', '2026-10-16 11:12:00+08', '2026-10-16 11:12:00+08');
INSERT INTO public.customers VALUES ('d7d7ec14-fd0b-440a-b3b3-4fe42e2aca50', 'FORNO7', 'simulator', 'demo-7s74iq', 'Kavitha S.', NULL, NULL, 'en', '2026-10-16 13:08:00+08', '2026-10-16 13:08:00+08');
INSERT INTO public.customers VALUES ('21ff71ba-8c70-49a6-bc81-38cec01cf2e9', 'FORNO7', 'whatsapp', 'demo-7buqi4', 'Deepa', NULL, NULL, 'en', '2026-10-16 22:07:00+08', '2026-10-16 22:07:00+08');
INSERT INTO public.customers VALUES ('3656bc19-09f6-4424-a5b5-fd93a69fe8ed', 'FORNO7', 'telegram', 'demo-ce78lu', 'Deepa', NULL, NULL, 'en', '2026-10-16 16:06:00+08', '2026-10-16 16:06:00+08');
INSERT INTO public.customers VALUES ('9d42c14b-5c96-4e58-a730-8515959ce450', 'FORNO7', 'telegram', 'demo-fshnr2', 'Syahmi', NULL, NULL, 'en', '2026-10-16 16:33:00+08', '2026-10-16 16:33:00+08');
INSERT INTO public.customers VALUES ('1ca73526-5121-40db-9fbe-47477752e54d', 'FORNO7', 'telegram', 'demo-33nuwf', 'Kavitha S.', NULL, NULL, 'en', '2026-10-16 22:54:00+08', '2026-10-16 22:54:00+08');
INSERT INTO public.customers VALUES ('3745e9ed-833d-4100-976b-39cc47b05342', 'FORNO7', 'telegram', 'demo-26epy5', 'Amir', NULL, NULL, 'en', '2026-10-16 11:55:00+08', '2026-10-16 11:55:00+08');
INSERT INTO public.customers VALUES ('7e715a01-2c2a-431a-a808-29ac529aa3b7', 'FORNO7', 'whatsapp', 'demo-cdq17v', 'Nur Amira', NULL, NULL, 'en', '2026-10-16 10:14:00+08', '2026-10-16 10:14:00+08');
INSERT INTO public.customers VALUES ('2c3fcda4-9edb-4b95-8ab7-8825bdc90ee2', 'FORNO7', 'telegram', 'demo-26jzk2', 'Ganesh', NULL, NULL, 'en', '2026-10-16 13:15:00+08', '2026-10-16 13:15:00+08');
INSERT INTO public.customers VALUES ('9add354e-001c-4542-b763-823aef830bb8', 'FORNO7', 'whatsapp', 'demo-5ksmzb', 'Nur Amira', NULL, NULL, 'en', '2026-10-16 14:47:00+08', '2026-10-16 14:47:00+08');
INSERT INTO public.customers VALUES ('8d900ae1-c870-412d-af52-6c2ba2834bce', 'FORNO7', 'telegram', 'demo-dtrya3', 'Kavitha S.', NULL, NULL, 'en', '2026-10-16 16:04:00+08', '2026-10-16 16:04:00+08');
INSERT INTO public.customers VALUES ('9b002271-b075-4426-868f-a13bc3ae8541', 'FORNO7', 'telegram', 'demo-2t2ohi', 'Rachel Lim', NULL, NULL, 'en', '2026-10-16 10:57:00+08', '2026-10-16 10:57:00+08');
INSERT INTO public.customers VALUES ('1f882ee6-2963-43bd-80e3-f415c7b2e7ad', 'FORNO7', 'telegram', 'demo-q2yk3', 'Adam K.', NULL, NULL, 'en', '2026-10-16 17:56:00+08', '2026-10-16 17:56:00+08');
INSERT INTO public.customers VALUES ('752d6754-858f-4dc6-946d-d172504861e1', 'FORNO7', 'whatsapp', 'demo-a98ssg', 'Nur Amira', NULL, NULL, 'en', '2026-10-16 22:49:00+08', '2026-10-16 22:49:00+08');
INSERT INTO public.customers VALUES ('0b910062-38fe-4cd0-ab84-7ed575618772', 'FORNO7', 'telegram', 'demo-b1zde0', 'Deepa', NULL, NULL, 'en', '2026-10-16 20:17:00+08', '2026-10-16 20:17:00+08');
INSERT INTO public.customers VALUES ('07363467-c288-4d43-8524-466aeb319b8f', 'FORNO7', 'whatsapp', 'demo-afbkl8', 'Amir', NULL, NULL, 'en', '2026-10-16 22:12:00+08', '2026-10-16 22:12:00+08');
INSERT INTO public.customers VALUES ('d7239f94-c4a5-43ee-9bcb-ce4b3983b517', 'FORNO7', 'whatsapp', 'demo-ersj1a', 'Hakim', NULL, NULL, 'en', '2026-10-17 18:31:00+08', '2026-10-17 18:31:00+08');
INSERT INTO public.customers VALUES ('778f32ec-a57d-48f9-a3b9-2074405d1d7f', 'FORNO7', 'whatsapp', 'demo-27kpde', 'Syahmi', NULL, NULL, 'en', '2026-10-17 19:06:00+08', '2026-10-17 19:06:00+08');
INSERT INTO public.customers VALUES ('4c361c47-a987-4dd0-84f6-62c686718306', 'FORNO7', 'telegram', 'demo-7td9af', 'Amir', NULL, NULL, 'en', '2026-10-17 09:54:00+08', '2026-10-17 09:54:00+08');
INSERT INTO public.customers VALUES ('ebbf2c32-1aff-4480-9ea4-b85e229d12a3', 'FORNO7', 'telegram', 'demo-8wahge', 'Syahmi', NULL, NULL, 'en', '2026-10-17 21:35:00+08', '2026-10-17 21:35:00+08');
INSERT INTO public.customers VALUES ('74982a2e-d5f2-446b-bad8-eb5d1f9ac208', 'FORNO7', 'telegram', 'demo-ce98wv', 'Ganesh', NULL, NULL, 'en', '2026-10-17 14:49:00+08', '2026-10-17 14:49:00+08');
INSERT INTO public.customers VALUES ('8702457d-4e1d-4eba-8c33-eef818c09d9c', 'FORNO7', 'whatsapp', 'demo-asfkfe', 'Ken Lau', NULL, NULL, 'en', '2026-10-17 21:37:00+08', '2026-10-17 21:37:00+08');
INSERT INTO public.customers VALUES ('f1ee1816-0956-4cdd-a2b3-14289e91db0d', 'FORNO7', 'telegram', 'demo-b2wxlw', 'Vanessa', NULL, NULL, 'en', '2026-10-17 14:29:00+08', '2026-10-17 14:29:00+08');
INSERT INTO public.customers VALUES ('c99b9f28-7500-4aef-93a0-4b1d265738d0', 'FORNO7', 'telegram', 'demo-c0b2t5', 'Puteri', NULL, NULL, 'en', '2026-10-17 12:40:00+08', '2026-10-17 12:40:00+08');
INSERT INTO public.customers VALUES ('46b33352-12ef-4070-8fea-efb0b5a2cee6', 'FORNO7', 'telegram', 'demo-14pqqj', 'Syahmi', NULL, NULL, 'en', '2026-10-17 22:20:00+08', '2026-10-17 22:20:00+08');
INSERT INTO public.customers VALUES ('f5c1f298-ba20-473b-92ae-be2a0d078c3e', 'FORNO7', 'whatsapp', 'demo-8ozpxj', 'Rachel Lim', NULL, NULL, 'en', '2026-10-17 19:22:00+08', '2026-10-17 19:22:00+08');
INSERT INTO public.customers VALUES ('56f69597-55a4-4475-85ce-728a4d6be7c5', 'FORNO7', 'telegram', 'demo-evkk64', 'Kavitha S.', NULL, NULL, 'en', '2026-10-17 13:26:00+08', '2026-10-17 13:26:00+08');
INSERT INTO public.customers VALUES ('670aa114-0e52-49f7-944e-5d9c6ee8c67b', 'FORNO7', 'telegram', 'demo-35zavj', 'Jun Wei', NULL, NULL, 'en', '2026-10-17 14:25:00+08', '2026-10-17 14:25:00+08');
INSERT INTO public.customers VALUES ('52602099-2b43-4ca3-bde0-604831049b8f', 'FORNO7', 'telegram', 'demo-46nwxp', 'Kavitha S.', NULL, NULL, 'en', '2026-10-17 09:41:00+08', '2026-10-17 09:41:00+08');
INSERT INTO public.customers VALUES ('946c83f9-f549-4848-8869-60111eb262d5', 'FORNO7', 'telegram', 'demo-4tvz5k', 'Kavitha S.', NULL, NULL, 'en', '2026-10-17 20:30:00+08', '2026-10-17 20:30:00+08');
INSERT INTO public.customers VALUES ('c8b2f195-2d05-494b-bf1f-4e80bee40ee7', 'FORNO7', 'telegram', 'demo-2zxqzi', 'Melissa Tan', NULL, NULL, 'en', '2026-10-17 12:46:00+08', '2026-10-17 12:46:00+08');
INSERT INTO public.customers VALUES ('55a38d39-3659-41f9-a30c-53aa4449b0a0', 'FORNO7', 'telegram', 'demo-iadyx', 'Puteri', NULL, NULL, 'en', '2026-10-17 18:32:00+08', '2026-10-17 18:32:00+08');
INSERT INTO public.customers VALUES ('233b68fc-862d-4b92-a419-5230ef308121', 'FORNO7', 'telegram', 'demo-3smqh1', 'Sharon Lee', NULL, NULL, 'en', '2026-10-17 12:09:00+08', '2026-10-17 12:09:00+08');
INSERT INTO public.customers VALUES ('42738f18-1bff-4877-8231-355753e0505e', 'FORNO7', 'telegram', 'demo-9a1zm6', 'Haziq', NULL, NULL, 'en', '2026-10-17 11:11:00+08', '2026-10-17 11:11:00+08');
INSERT INTO public.customers VALUES ('4d20a699-0fa3-47ca-81bb-cffe21816db0', 'FORNO7', 'telegram', 'demo-hbsrz', 'Syahmi', NULL, NULL, 'en', '2026-10-17 12:18:00+08', '2026-10-17 12:18:00+08');
INSERT INTO public.customers VALUES ('05357cc6-082b-48b6-9d12-6cf5324efbf7', 'FORNO7', 'telegram', 'demo-6nl8fz', 'Arif Danial', NULL, NULL, 'en', '2026-10-17 12:18:00+08', '2026-10-17 12:18:00+08');
INSERT INTO public.customers VALUES ('2a28edf8-1670-4f50-8e73-edd4e6ca821b', 'FORNO7', 'whatsapp', 'demo-bn8j0n', 'Aisha Rahman', NULL, NULL, 'en', '2026-10-17 18:04:00+08', '2026-10-17 18:04:00+08');
INSERT INTO public.customers VALUES ('02b7365e-d0b0-439d-9a63-ca5860adbe5d', 'FORNO7', 'telegram', 'demo-fup4y', 'Kavitha S.', NULL, NULL, 'en', '2026-10-17 16:31:00+08', '2026-10-17 16:31:00+08');
INSERT INTO public.customers VALUES ('6fdaf8d3-f2f3-4139-a409-bc5e0a5f5d82', 'FORNO7', 'telegram', 'demo-7vzxz2', 'Syahmi', NULL, NULL, 'en', '2026-10-17 09:11:00+08', '2026-10-17 09:11:00+08');
INSERT INTO public.customers VALUES ('9f486886-b057-4183-b8f8-c74f910a3783', 'FORNO7', 'simulator', 'demo-dp6o9m', 'Ganesh', NULL, NULL, 'en', '2026-10-17 16:22:00+08', '2026-10-17 16:22:00+08');
INSERT INTO public.customers VALUES ('2401b862-e217-4bb4-92c9-d42d93b4dbdf', 'FORNO7', 'whatsapp', 'demo-1ar9s', 'Siew Mei', NULL, NULL, 'en', '2026-10-17 13:24:00+08', '2026-10-17 13:24:00+08');
INSERT INTO public.customers VALUES ('7dcf63b4-7b08-42f2-aaa9-07b34f330cd4', 'FORNO7', 'telegram', 'demo-lazne', 'Siew Mei', NULL, NULL, 'en', '2026-10-17 12:28:00+08', '2026-10-17 12:28:00+08');
INSERT INTO public.customers VALUES ('d2d5bb3f-e32b-43cc-85aa-26b3aa7bc880', 'FORNO7', 'telegram', 'demo-8xb0s3', 'Rachel Lim', NULL, NULL, 'en', '2026-10-17 16:46:00+08', '2026-10-17 16:46:00+08');
INSERT INTO public.customers VALUES ('6cd6b5b8-c72c-428b-818a-51ddfc544fb7', 'FORNO7', 'telegram', 'demo-dx7rvf', 'Siew Mei', NULL, NULL, 'en', '2026-10-17 15:46:00+08', '2026-10-17 15:46:00+08');
INSERT INTO public.customers VALUES ('b5731eaa-6b21-4f0c-be00-aa7d7be344b1', 'FORNO7', 'telegram', 'demo-7harhp', 'Ken Lau', NULL, NULL, 'en', '2026-10-17 16:30:00+08', '2026-10-17 16:30:00+08');
INSERT INTO public.customers VALUES ('911a433f-cd7a-4004-9cd6-2b5837e963e7', 'FORNO7', 'telegram', 'demo-3g1mdu', 'Sharon Lee', NULL, NULL, 'en', '2026-10-17 18:36:00+08', '2026-10-17 18:36:00+08');
INSERT INTO public.customers VALUES ('5f05adc9-ebb7-41bc-b966-a4fac122b54e', 'FORNO7', 'telegram', 'demo-1ylan6', 'Haziq', NULL, NULL, 'en', '2026-10-17 15:39:00+08', '2026-10-17 15:39:00+08');
INSERT INTO public.customers VALUES ('f45b7b10-0445-473a-886a-0bc2a6d595c7', 'FORNO7', 'telegram', 'demo-1hrt82', 'Puteri', NULL, NULL, 'en', '2026-10-17 09:29:00+08', '2026-10-17 09:29:00+08');
INSERT INTO public.customers VALUES ('dfbda23d-1289-498b-840b-1ab45ae8deb8', 'FORNO7', 'telegram', 'demo-7yocjl', 'Aisha Rahman', NULL, NULL, 'en', '2026-10-17 21:11:00+08', '2026-10-17 21:11:00+08');
INSERT INTO public.customers VALUES ('c1f7f45d-9769-408d-9ad4-545e0392008f', 'FORNO7', 'telegram', 'demo-fak4ej', 'Aisha Rahman', NULL, NULL, 'en', '2026-10-17 22:46:00+08', '2026-10-17 22:46:00+08');
INSERT INTO public.customers VALUES ('9daf3698-ab51-4f6b-a910-bd3a0514a49c', 'FORNO7', 'whatsapp', 'demo-2hwoyb', 'Jun Wei', NULL, NULL, 'en', '2026-10-17 11:26:00+08', '2026-10-17 11:26:00+08');
INSERT INTO public.customers VALUES ('b3f1340b-6c8a-4e51-9477-b7df673923af', 'FORNO7', 'telegram', 'demo-7i5via', 'Ken Lau', NULL, NULL, 'en', '2026-10-17 13:19:00+08', '2026-10-17 13:19:00+08');
INSERT INTO public.customers VALUES ('8fcff20c-6ddb-4d09-a9b4-89430f8c7e93', 'FORNO7', 'telegram', 'demo-5v3nzn', 'Ken Lau', NULL, NULL, 'en', '2026-10-17 17:09:00+08', '2026-10-17 17:09:00+08');
INSERT INTO public.customers VALUES ('af672798-6667-46bf-80fb-a97350da0a74', 'FORNO7', 'telegram', 'demo-37j8qw', 'Farhan', NULL, NULL, 'en', '2026-10-17 20:04:00+08', '2026-10-17 20:04:00+08');
INSERT INTO public.customers VALUES ('d77ade01-90c6-4163-b17a-c8eeeedd1c92', 'FORNO7', 'telegram', 'demo-cvxgiy', 'Amir', NULL, NULL, 'en', '2026-10-17 18:42:00+08', '2026-10-17 18:42:00+08');
INSERT INTO public.customers VALUES ('73c5908c-59b4-4e0a-bed7-3f27a0d59604', 'FORNO7', 'telegram', 'demo-kjyb4', 'Deepa', NULL, NULL, 'en', '2026-10-17 21:46:00+08', '2026-10-17 21:46:00+08');
INSERT INTO public.customers VALUES ('5064f399-f5b6-42a0-ad78-576c0ff56cb9', 'FORNO7', 'whatsapp', 'demo-9gkuz', 'Nur Amira', NULL, NULL, 'en', '2026-10-17 10:02:00+08', '2026-10-17 10:02:00+08');
INSERT INTO public.customers VALUES ('1185a560-6936-4e28-96bc-80d3f6cd1d8e', 'FORNO7', 'telegram', 'demo-g8s2nt', 'Kavitha S.', NULL, NULL, 'en', '2026-10-17 11:31:00+08', '2026-10-17 11:31:00+08');
INSERT INTO public.customers VALUES ('09e2ae55-aa18-4ab4-95cd-c20307f0a564', 'FORNO7', 'whatsapp', 'demo-fng4hs', 'Jun Wei', NULL, NULL, 'en', '2026-10-17 09:52:00+08', '2026-10-17 09:52:00+08');
INSERT INTO public.customers VALUES ('856867af-0ead-4a00-a671-13184e1babd8', 'FORNO7', 'telegram', 'demo-bu50q4', 'Haziq', NULL, NULL, 'en', '2026-10-17 19:27:00+08', '2026-10-17 19:27:00+08');
INSERT INTO public.customers VALUES ('4f682ee0-c636-419d-9632-12f8a3d7438f', 'FORNO7', 'whatsapp', 'demo-1jd4dy', 'Siew Mei', NULL, NULL, 'en', '2026-10-17 18:28:00+08', '2026-10-17 18:28:00+08');
INSERT INTO public.customers VALUES ('5542fca9-5d2d-4487-b731-cd0b7748ebb6', 'FORNO7', 'telegram', 'demo-eb3135', 'Rachel Lim', NULL, NULL, 'en', '2026-10-17 18:41:00+08', '2026-10-17 18:41:00+08');
INSERT INTO public.customers VALUES ('e6a8fe6d-3dda-4fcc-a5bf-f4e69bffb5d9', 'FORNO7', 'whatsapp', 'demo-cpnd51', 'Kavitha S.', NULL, NULL, 'en', '2026-10-17 16:03:00+08', '2026-10-17 16:03:00+08');
INSERT INTO public.customers VALUES ('ea209b90-0b5f-4ac5-b379-69270c2a237b', 'FORNO7', 'telegram', 'demo-93bukq', 'Siew Mei', NULL, NULL, 'en', '2026-10-17 11:25:00+08', '2026-10-17 11:25:00+08');
INSERT INTO public.customers VALUES ('00b04800-b9fe-4d05-9f52-6a56a0d7e738', 'FORNO7', 'telegram', 'demo-32970v', 'Sharon Lee', NULL, NULL, 'en', '2026-10-17 10:55:00+08', '2026-10-17 10:55:00+08');
INSERT INTO public.customers VALUES ('8e6473cc-ef7f-4569-91ad-dd84c1e3aa31', 'FORNO7', 'telegram', 'demo-bqn4si', 'Syahmi', NULL, NULL, 'en', '2026-10-18 21:22:00+08', '2026-10-18 21:22:00+08');
INSERT INTO public.customers VALUES ('49a3464c-8360-45bf-ae29-a88b7031f42b', 'FORNO7', 'whatsapp', 'demo-11mtj3', 'Chloe Ng', NULL, NULL, 'en', '2026-10-18 13:03:00+08', '2026-10-18 13:03:00+08');
INSERT INTO public.customers VALUES ('1798c5c5-f3f7-41ef-9cec-6728f3ac8be4', 'FORNO7', 'telegram', 'demo-dvbwcc', 'Deepa', NULL, NULL, 'en', '2026-10-18 14:11:00+08', '2026-10-18 14:11:00+08');
INSERT INTO public.customers VALUES ('88551b6e-50bd-409c-add1-c75be9a7f6a9', 'FORNO7', 'telegram', 'demo-5x95tv', 'Syahmi', NULL, NULL, 'en', '2026-10-18 17:25:00+08', '2026-10-18 17:25:00+08');
INSERT INTO public.customers VALUES ('dcdbaf44-b979-4db7-8de1-c1aeff705042', 'FORNO7', 'whatsapp', 'demo-bb67go', 'Jun Wei', NULL, NULL, 'en', '2026-10-18 19:03:00+08', '2026-10-18 19:03:00+08');
INSERT INTO public.customers VALUES ('32e97a11-6e4c-4b00-919d-66c978afb541', 'FORNO7', 'whatsapp', 'demo-777xom', 'Ganesh', NULL, NULL, 'en', '2026-10-18 16:51:00+08', '2026-10-18 16:51:00+08');
INSERT INTO public.customers VALUES ('ec9eb378-53f1-4507-b873-556e44cfa970', 'FORNO7', 'telegram', 'demo-24qt3t', 'Siew Mei', NULL, NULL, 'en', '2026-10-18 18:56:00+08', '2026-10-18 18:56:00+08');
INSERT INTO public.customers VALUES ('5cbf5366-fa30-4f64-9a36-b4bb1ceed059', 'FORNO7', 'telegram', 'demo-buj74j', 'Ken Lau', NULL, NULL, 'en', '2026-10-18 15:17:00+08', '2026-10-18 15:17:00+08');
INSERT INTO public.customers VALUES ('d04dac5e-5b24-4fd4-8d23-4cd897753466', 'FORNO7', 'telegram', 'demo-drk58y', 'Farhan', NULL, NULL, 'en', '2026-10-18 16:16:00+08', '2026-10-18 16:16:00+08');
INSERT INTO public.customers VALUES ('49dd269c-0fe8-4f0f-8eed-de4f45afd12c', 'FORNO7', 'telegram', 'demo-ag6q0s', 'Deepa', NULL, NULL, 'en', '2026-10-18 14:22:00+08', '2026-10-18 14:22:00+08');
INSERT INTO public.customers VALUES ('d9383216-bb7b-4f1a-baab-9b7c6b7c0378', 'FORNO7', 'telegram', 'demo-znzu5', 'Vanessa', NULL, NULL, 'en', '2026-10-18 21:30:00+08', '2026-10-18 21:30:00+08');
INSERT INTO public.customers VALUES ('f623e084-7805-48dc-be97-1af342381240', 'FORNO7', 'telegram', 'demo-esfs9k', 'Deepa', NULL, NULL, 'en', '2026-10-18 14:11:00+08', '2026-10-18 14:11:00+08');
INSERT INTO public.customers VALUES ('85433477-c94c-4aa3-9198-180d25379221', 'FORNO7', 'whatsapp', 'demo-ai85ok', 'Sharon Lee', NULL, NULL, 'en', '2026-10-18 13:04:00+08', '2026-10-18 13:04:00+08');
INSERT INTO public.customers VALUES ('54a428a4-5f58-478d-9e09-5709d0b9ebbc', 'FORNO7', 'whatsapp', 'demo-hkm44', 'Haziq', NULL, NULL, 'en', '2026-10-18 12:37:00+08', '2026-10-18 12:37:00+08');
INSERT INTO public.customers VALUES ('6b179ade-f1ca-4deb-8997-18553f087479', 'FORNO7', 'telegram', 'demo-8ikkzx', 'Nur Amira', NULL, NULL, 'en', '2026-10-18 15:54:00+08', '2026-10-18 15:54:00+08');
INSERT INTO public.customers VALUES ('75d4e73b-2537-4f6e-bc97-4d774c06d256', 'FORNO7', 'telegram', 'demo-g81vuc', 'Farhan', NULL, NULL, 'en', '2026-10-18 18:31:00+08', '2026-10-18 18:31:00+08');
INSERT INTO public.customers VALUES ('0ccdf676-92a4-4810-899a-23c3b6e8b44c', 'FORNO7', 'whatsapp', 'demo-1obez9', 'Jun Wei', NULL, NULL, 'en', '2026-10-18 20:44:00+08', '2026-10-18 20:44:00+08');
INSERT INTO public.customers VALUES ('f4022fb4-8f32-4e95-95f8-6fcedcf4f7d9', 'FORNO7', 'telegram', 'demo-cp8xa7', 'Melissa Tan', NULL, NULL, 'en', '2026-10-18 16:26:00+08', '2026-10-18 16:26:00+08');
INSERT INTO public.customers VALUES ('014bf3a4-14c7-42b5-853d-82badb7b4a96', 'FORNO7', 'telegram', 'demo-806lzz', 'Jun Wei', NULL, NULL, 'en', '2026-10-18 19:31:00+08', '2026-10-18 19:31:00+08');
INSERT INTO public.customers VALUES ('34237b02-d2ab-462f-8191-d534d19e5d2e', 'FORNO7', 'telegram', 'demo-b30vke', 'Hakim', NULL, NULL, 'en', '2026-10-18 22:26:00+08', '2026-10-18 22:26:00+08');
INSERT INTO public.customers VALUES ('8806daef-0e45-4e01-a78d-771dfefcbd74', 'FORNO7', 'telegram', 'demo-3ft51y', 'Puteri', NULL, NULL, 'en', '2026-10-18 20:27:00+08', '2026-10-18 20:27:00+08');
INSERT INTO public.customers VALUES ('e031c0b7-01ca-4aee-9ad7-5df0be4ef507', 'FORNO7', 'telegram', 'demo-1mghe4', 'Jun Wei', NULL, NULL, 'en', '2026-10-18 13:06:00+08', '2026-10-18 13:06:00+08');
INSERT INTO public.customers VALUES ('dfcfd6e6-0ffe-4dc6-acb0-d0a38767980b', 'FORNO7', 'whatsapp', 'demo-eti9ne', 'Rachel Lim', NULL, NULL, 'en', '2026-10-18 16:26:00+08', '2026-10-18 16:26:00+08');
INSERT INTO public.customers VALUES ('f327da76-80fa-427c-9f47-6a6a93dec818', 'FORNO7', 'telegram', 'demo-e7636d', 'Hakim', NULL, NULL, 'en', '2026-10-18 13:35:00+08', '2026-10-18 13:35:00+08');
INSERT INTO public.customers VALUES ('8399b52d-0df8-4871-9a73-89da40c81643', 'FORNO7', 'telegram', 'demo-c5i3n5', 'Siew Mei', NULL, NULL, 'en', '2026-10-18 20:13:00+08', '2026-10-18 20:13:00+08');
INSERT INTO public.customers VALUES ('4226e908-2014-486d-80fa-4dc18ed34085', 'FORNO7', 'telegram', 'demo-gh9bff', 'Haziq', NULL, NULL, 'en', '2026-10-18 22:47:00+08', '2026-10-18 22:47:00+08');
INSERT INTO public.customers VALUES ('072bc6d6-2279-450e-8252-dc669771c48a', 'FORNO7', 'telegram', 'demo-8ej4vc', 'Ganesh', NULL, NULL, 'en', '2026-10-18 09:57:00+08', '2026-10-18 09:57:00+08');
INSERT INTO public.customers VALUES ('bf66afac-103b-4571-b944-cd0957e33264', 'FORNO7', 'whatsapp', 'demo-bmoz5z', 'Nur Amira', NULL, NULL, 'en', '2026-10-18 14:12:00+08', '2026-10-18 14:12:00+08');
INSERT INTO public.customers VALUES ('cf43209b-fa39-497b-b395-089e2933639e', 'FORNO7', 'simulator', 'demo-5gx2d2', 'Ganesh', NULL, NULL, 'en', '2026-10-18 16:24:00+08', '2026-10-18 16:24:00+08');
INSERT INTO public.customers VALUES ('273b8d7d-1f37-42c0-b7b6-c355589587b6', 'FORNO7', 'whatsapp', 'demo-91hg91', 'Haziq', NULL, NULL, 'en', '2026-10-18 22:16:00+08', '2026-10-18 22:16:00+08');
INSERT INTO public.customers VALUES ('c62606df-8136-4230-ad01-045313b24645', 'FORNO7', 'telegram', 'demo-e7g2qq', 'Vanessa', NULL, NULL, 'en', '2026-10-18 22:14:00+08', '2026-10-18 22:14:00+08');
INSERT INTO public.customers VALUES ('9aa9b188-b370-4b18-9c11-5f43a7b2264c', 'FORNO7', 'simulator', 'demo-aaejlw', 'Bryan Ooi', NULL, NULL, 'en', '2026-10-18 12:22:00+08', '2026-10-18 12:22:00+08');
INSERT INTO public.customers VALUES ('0029565b-6735-4a82-91ed-307aecb2665e', 'FORNO7', 'whatsapp', 'demo-9zb25j', 'Bryan Ooi', NULL, NULL, 'en', '2026-10-18 09:00:00+08', '2026-10-18 09:00:00+08');
INSERT INTO public.customers VALUES ('d710e205-6a9b-41d4-9a30-e9bb0dd83313', 'FORNO7', 'telegram', 'demo-4zal91', 'Vanessa', NULL, NULL, 'en', '2026-10-18 15:45:00+08', '2026-10-18 15:45:00+08');
INSERT INTO public.customers VALUES ('dff130f4-a7d6-4c1d-b959-e63cfbd1b8bf', 'FORNO7', 'telegram', 'demo-46ppgk', 'Vanessa', NULL, NULL, 'en', '2026-10-18 13:37:00+08', '2026-10-18 13:37:00+08');
INSERT INTO public.customers VALUES ('3693154f-b07d-4721-b561-27e57703e31f', 'FORNO7', 'telegram', 'demo-1equul', 'Haziq', NULL, NULL, 'en', '2026-10-18 22:23:00+08', '2026-10-18 22:23:00+08');
INSERT INTO public.customers VALUES ('a61f149b-95f8-4d06-82bb-44b444504788', 'FORNO7', 'whatsapp', 'demo-9d4w3x', 'Vanessa', NULL, NULL, 'en', '2026-10-19 19:22:00+08', '2026-10-19 19:22:00+08');
INSERT INTO public.customers VALUES ('ae093341-084c-45ca-8999-d027005fc04f', 'FORNO7', 'telegram', 'demo-5m66fo', 'Amir', NULL, NULL, 'en', '2026-10-19 17:21:00+08', '2026-10-19 17:21:00+08');
INSERT INTO public.customers VALUES ('42c452e9-09cf-49a6-aa83-9bfda772b95a', 'FORNO7', 'telegram', 'demo-bjxvhk', 'Farhan', NULL, NULL, 'en', '2026-10-19 11:04:00+08', '2026-10-19 11:04:00+08');
INSERT INTO public.customers VALUES ('4f089bfa-7b6c-4161-bac3-08cc980c61dd', 'FORNO7', 'telegram', 'demo-599d1r', 'Deepa', NULL, NULL, 'en', '2026-10-19 21:04:00+08', '2026-10-19 21:04:00+08');
INSERT INTO public.customers VALUES ('4bed4387-8667-4620-9e83-c91fe8ecce64', 'FORNO7', 'telegram', 'demo-6zzuhh', 'Farhan', NULL, NULL, 'en', '2026-10-19 11:29:00+08', '2026-10-19 11:29:00+08');
INSERT INTO public.customers VALUES ('4b2bd34a-9e43-40d7-893a-c4c78740d48f', 'FORNO7', 'telegram', 'demo-6mj2sj', 'Farhan', NULL, NULL, 'en', '2026-10-19 11:34:00+08', '2026-10-19 11:34:00+08');
INSERT INTO public.customers VALUES ('aa00b2e9-6519-4e44-af21-7e54580603d3', 'FORNO7', 'telegram', 'demo-blt3em', 'Siew Mei', NULL, NULL, 'en', '2026-10-19 17:05:00+08', '2026-10-19 17:05:00+08');
INSERT INTO public.customers VALUES ('d0a88fd9-5662-466d-8e71-1fa0251c8aa0', 'FORNO7', 'whatsapp', 'demo-826tle', 'Siew Mei', NULL, NULL, 'en', '2026-10-19 21:57:00+08', '2026-10-19 21:57:00+08');
INSERT INTO public.customers VALUES ('6a12ab08-665d-46e3-95d8-3228434937dd', 'FORNO7', 'telegram', 'demo-a4t5zl', 'Kavitha S.', NULL, NULL, 'en', '2026-10-19 14:22:00+08', '2026-10-19 14:22:00+08');
INSERT INTO public.customers VALUES ('91732b3c-11bd-4b55-b98e-e2777010cd8f', 'FORNO7', 'telegram', 'demo-db55aa', 'Arif Danial', NULL, NULL, 'en', '2026-10-20 16:22:00+08', '2026-10-20 16:22:00+08');
INSERT INTO public.customers VALUES ('2fe3b7c7-36ea-4f5f-a742-904fb009cbb0', 'FORNO7', 'telegram', 'demo-d7kzt4', 'Ganesh', NULL, NULL, 'en', '2026-10-20 13:22:00+08', '2026-10-20 13:22:00+08');
INSERT INTO public.customers VALUES ('dca5504c-89dd-4fe6-ab1f-aa9d09d5696b', 'FORNO7', 'telegram', 'demo-9iok8z', 'Ken Lau', NULL, NULL, 'en', '2026-10-20 17:33:00+08', '2026-10-20 17:33:00+08');
INSERT INTO public.customers VALUES ('25c8b31e-58fd-4fd7-931a-21cd51ed67f6', 'FORNO7', 'telegram', 'demo-6z6f8d', 'Nur Amira', NULL, NULL, 'en', '2026-10-20 17:58:00+08', '2026-10-20 17:58:00+08');
INSERT INTO public.customers VALUES ('52dec090-ca07-41c2-a0d6-74276373f63d', 'FORNO7', 'telegram', 'demo-y4z2m', 'Melissa Tan', NULL, NULL, 'en', '2026-10-20 10:33:00+08', '2026-10-20 10:33:00+08');
INSERT INTO public.customers VALUES ('35a73859-12fe-49b2-b70d-d0d0ed5d9033', 'FORNO7', 'telegram', 'demo-d2vjx5', 'Jun Wei', NULL, NULL, 'en', '2026-10-20 13:30:00+08', '2026-10-20 13:30:00+08');
INSERT INTO public.customers VALUES ('28d6227c-c782-4e19-aca4-2b89ffea947b', 'FORNO7', 'whatsapp', 'demo-agfn4w', 'Farhan', NULL, NULL, 'en', '2026-10-20 18:13:00+08', '2026-10-20 18:13:00+08');
INSERT INTO public.customers VALUES ('e40565e6-f525-498a-bab1-329de19d2f17', 'FORNO7', 'simulator', 'demo-dd1s2t', 'Melissa Tan', NULL, NULL, 'en', '2026-10-20 21:07:00+08', '2026-10-20 21:07:00+08');
INSERT INTO public.customers VALUES ('9cfa4cab-88e4-4af2-870b-f8622ea018b4', 'FORNO7', 'telegram', 'demo-4ywpfz', 'Vanessa', NULL, NULL, 'en', '2026-10-20 14:04:00+08', '2026-10-20 14:04:00+08');
INSERT INTO public.customers VALUES ('f7a91bf2-1120-4aa7-b1ee-547d2cae3cfb', 'FORNO7', 'telegram', 'demo-1pfwu0', 'Kavitha S.', NULL, NULL, 'en', '2026-10-20 13:15:00+08', '2026-10-20 13:15:00+08');
INSERT INTO public.customers VALUES ('194a8788-c636-4777-93b2-0e47fe6d3632', 'FORNO7', 'telegram', 'demo-20htp5', 'Arif Danial', NULL, NULL, 'en', '2026-10-20 19:30:00+08', '2026-10-20 19:30:00+08');
INSERT INTO public.customers VALUES ('a3dcf9b6-269f-41a8-9e62-56f84c9a466b', 'FORNO7', 'telegram', 'demo-chztt8', 'Chloe Ng', NULL, NULL, 'en', '2026-10-20 18:32:00+08', '2026-10-20 18:32:00+08');
INSERT INTO public.customers VALUES ('ae195977-26d8-47e6-94ad-a0da8d8d41ae', 'FORNO7', 'telegram', 'demo-7ang6c', 'Nur Amira', NULL, NULL, 'en', '2026-10-20 17:48:00+08', '2026-10-20 17:48:00+08');
INSERT INTO public.customers VALUES ('aeac5cc4-6b44-4bb8-ae52-efab61f936c6', 'FORNO7', 'telegram', 'demo-6gy13p', 'Hakim', NULL, NULL, 'en', '2026-10-20 12:56:00+08', '2026-10-20 12:56:00+08');
INSERT INTO public.customers VALUES ('b2f732f5-964b-4980-aa03-542544ac1b19', 'FORNO7', 'simulator', 'demo-fxya2', 'Sharon Lee', NULL, NULL, 'en', '2026-10-20 15:09:00+08', '2026-10-20 15:09:00+08');
INSERT INTO public.customers VALUES ('54586f1f-2f42-41d8-87d8-7da2b8d0c6ea', 'FORNO7', 'telegram', 'demo-73bbsm', 'Ken Lau', NULL, NULL, 'en', '2026-10-20 17:51:00+08', '2026-10-20 17:51:00+08');
INSERT INTO public.customers VALUES ('5a87f0e0-053d-42fb-b5e9-432773a2e3f1', 'FORNO7', 'whatsapp', 'demo-27evqa', 'Nur Amira', NULL, NULL, 'en', '2026-10-20 12:06:00+08', '2026-10-20 12:06:00+08');
INSERT INTO public.customers VALUES ('b99fb31c-de0a-41db-9c19-36010d181f49', 'FORNO7', 'telegram', 'demo-2zbfhd', 'Siew Mei', NULL, NULL, 'en', '2026-10-20 15:22:00+08', '2026-10-20 15:22:00+08');
INSERT INTO public.customers VALUES ('75fc7e64-8f0d-43a0-9bc3-46ed36fcd724', 'FORNO7', 'simulator', 'demo-1qdi5r', 'Farhan', NULL, NULL, 'en', '2026-10-20 10:20:00+08', '2026-10-20 10:20:00+08');
INSERT INTO public.customers VALUES ('af17bf0f-09e5-474d-9822-71b11b1669d8', 'FORNO7', 'telegram', 'demo-2hk3kv', 'Puteri', NULL, NULL, 'en', '2026-10-20 18:17:00+08', '2026-10-20 18:17:00+08');
INSERT INTO public.customers VALUES ('af85d95c-fec4-4ca3-aaef-470170355ab0', 'FORNO7', 'whatsapp', 'demo-96n9vs', 'Chloe Ng', NULL, NULL, 'en', '2026-10-20 18:07:00+08', '2026-10-20 18:07:00+08');
INSERT INTO public.customers VALUES ('9398e3e7-3020-46cb-9bc8-ba79d7cc37cc', 'FORNO7', 'telegram', 'demo-aezve1', 'Sharon Lee', NULL, NULL, 'en', '2026-10-20 22:17:00+08', '2026-10-20 22:17:00+08');
INSERT INTO public.customers VALUES ('0a0229d1-d929-4136-a46d-521bc87d5478', 'FORNO7', 'telegram', 'demo-6jklfw', 'Chloe Ng', NULL, NULL, 'en', '2026-10-20 17:30:00+08', '2026-10-20 17:30:00+08');
INSERT INTO public.customers VALUES ('98bd9ebd-c2a8-4cc0-8a20-baeb84c28547', 'FORNO7', 'telegram', 'demo-8d5os1', 'Rachel Lim', NULL, NULL, 'en', '2026-10-20 15:03:00+08', '2026-10-20 15:03:00+08');
INSERT INTO public.customers VALUES ('b0118aae-5ee3-4c53-a420-40a0d3fe5d55', 'FORNO7', 'telegram', 'demo-emx7hn', 'Vanessa', NULL, NULL, 'en', '2026-10-20 22:15:00+08', '2026-10-20 22:15:00+08');
INSERT INTO public.customers VALUES ('fc59f0ab-5a65-4d45-88b0-c0d8ff5fbd18', 'FORNO7', 'telegram', 'demo-85csb', 'Amir', NULL, NULL, 'en', '2026-10-20 19:00:00+08', '2026-10-20 19:00:00+08');
INSERT INTO public.customers VALUES ('1e3130f7-246e-41dc-99cb-98fd6b659255', 'FORNO7', 'telegram', 'demo-dgwjvb', 'Chloe Ng', NULL, NULL, 'en', '2026-10-20 09:17:00+08', '2026-10-20 09:17:00+08');
INSERT INTO public.customers VALUES ('0365d026-25de-452a-9b86-4c9b7cc7870e', 'FORNO7', 'whatsapp', 'demo-f1o5o4', 'Nur Amira', NULL, NULL, 'en', '2026-10-20 16:03:00+08', '2026-10-20 16:03:00+08');
INSERT INTO public.customers VALUES ('1661ab25-75e8-4a9f-b536-8cb6ee798931', 'FORNO7', 'telegram', 'demo-b2uavg', 'Amir', NULL, NULL, 'en', '2026-10-20 15:44:00+08', '2026-10-20 15:44:00+08');
INSERT INTO public.customers VALUES ('83b7bd75-d55c-4a2f-99f8-117de00ce074', 'FORNO7', 'telegram', 'demo-5rq49n', 'Melissa Tan', NULL, NULL, 'en', '2026-10-20 18:25:00+08', '2026-10-20 18:25:00+08');
INSERT INTO public.customers VALUES ('2497d7a4-2c11-43b2-95eb-ed5918e53d04', 'FORNO7', 'whatsapp', 'demo-9v514n', 'Farhan', NULL, NULL, 'en', '2026-10-20 12:28:00+08', '2026-10-20 12:28:00+08');
INSERT INTO public.customers VALUES ('0e3a4830-d354-4fcb-9d3e-aef5358ac5be', 'FORNO7', 'telegram', 'demo-ej3ize', 'Deepa', NULL, NULL, 'en', '2026-10-20 16:46:00+08', '2026-10-20 16:46:00+08');
INSERT INTO public.customers VALUES ('8332009a-1ebc-4ba7-b8d9-822f0ff08d18', 'FORNO7', 'telegram', 'demo-bab2i5', 'Ganesh', NULL, NULL, 'en', '2026-10-20 22:29:00+08', '2026-10-20 22:29:00+08');
INSERT INTO public.customers VALUES ('3ffbd5c3-f282-46a8-9d8f-25c6bd96776e', 'FORNO7', 'whatsapp', 'demo-eys5f9', 'Melissa Tan', NULL, NULL, 'en', '2026-10-20 10:39:00+08', '2026-10-20 10:39:00+08');
INSERT INTO public.customers VALUES ('aec767d8-3670-4f58-a72c-dec4145b999e', 'FORNO7', 'whatsapp', 'demo-cfj7cw', 'Hakim', NULL, NULL, 'en', '2026-10-21 18:03:00+08', '2026-10-21 18:03:00+08');
INSERT INTO public.customers VALUES ('0cefb286-7827-4987-994d-9117b6c73b20', 'FORNO7', 'telegram', 'demo-4sbj4z', 'Ganesh', NULL, NULL, 'en', '2026-10-21 15:57:00+08', '2026-10-21 15:57:00+08');
INSERT INTO public.customers VALUES ('f305022c-1080-4825-a8b6-7feafa825ac3', 'FORNO7', 'telegram', 'demo-a094ne', 'Siew Mei', NULL, NULL, 'en', '2026-10-21 15:24:00+08', '2026-10-21 15:24:00+08');
INSERT INTO public.customers VALUES ('8a61a55e-0923-4537-88ad-97923f244971', 'FORNO7', 'telegram', 'demo-beety7', 'Ganesh', NULL, NULL, 'en', '2026-10-21 15:41:00+08', '2026-10-21 15:41:00+08');
INSERT INTO public.customers VALUES ('a0407077-44a2-4e28-8426-73aa26bf2273', 'FORNO7', 'telegram', 'demo-1qvgox', 'Melissa Tan', NULL, NULL, 'en', '2026-10-21 13:14:00+08', '2026-10-21 13:14:00+08');
INSERT INTO public.customers VALUES ('895db009-a160-4b5e-ab12-0b94607c4a81', 'FORNO7', 'telegram', 'demo-2gscy8', 'Adam K.', NULL, NULL, 'en', '2026-10-21 18:32:00+08', '2026-10-21 18:32:00+08');
INSERT INTO public.customers VALUES ('863ce1d7-e8d2-439d-8463-afdad788a465', 'FORNO7', 'whatsapp', 'demo-1p0nie', 'Nur Amira', NULL, NULL, 'en', '2026-10-21 16:17:00+08', '2026-10-21 16:17:00+08');
INSERT INTO public.customers VALUES ('f765044b-a2d2-4924-a605-83412832e62c', 'FORNO7', 'whatsapp', 'demo-ew7uu8', 'Farhan', NULL, NULL, 'en', '2026-10-21 15:50:00+08', '2026-10-21 15:50:00+08');
INSERT INTO public.customers VALUES ('7031750a-d414-4cca-b703-b5b8ac6ca370', 'FORNO7', 'telegram', 'demo-5kc942', 'Ken Lau', NULL, NULL, 'en', '2026-10-21 11:23:00+08', '2026-10-21 11:23:00+08');
INSERT INTO public.customers VALUES ('b7068cbe-744c-4e55-9e92-1d3e8931c175', 'FORNO7', 'telegram', 'demo-t0hju', 'Sharon Lee', NULL, NULL, 'en', '2026-10-21 16:41:00+08', '2026-10-21 16:41:00+08');
INSERT INTO public.customers VALUES ('23e27293-ec95-4126-8755-fd5937042ead', 'FORNO7', 'whatsapp', 'demo-avnro', 'Sharon Lee', NULL, NULL, 'en', '2026-10-21 09:20:00+08', '2026-10-21 09:20:00+08');
INSERT INTO public.customers VALUES ('9e56b4d1-5c4e-414a-8485-198629d24b95', 'FORNO7', 'telegram', 'demo-fo9jzq', 'Amir', NULL, NULL, 'en', '2026-10-21 11:03:00+08', '2026-10-21 11:03:00+08');
INSERT INTO public.customers VALUES ('21baf1c9-1d26-4daa-826f-ac12d253eb93', 'FORNO7', 'telegram', 'demo-bjfvik', 'Vanessa', NULL, NULL, 'en', '2026-10-21 16:55:00+08', '2026-10-21 16:55:00+08');
INSERT INTO public.customers VALUES ('00fb8e68-99ed-4541-9910-58e75042d777', 'FORNO7', 'telegram', 'demo-esv0el', 'Rachel Lim', NULL, NULL, 'en', '2026-10-21 12:58:00+08', '2026-10-21 12:58:00+08');
INSERT INTO public.customers VALUES ('88aae22c-cd08-4526-8f28-c0282d52c112', 'FORNO7', 'telegram', 'demo-7gyo38', 'Adam K.', NULL, NULL, 'en', '2026-10-21 10:14:00+08', '2026-10-21 10:14:00+08');
INSERT INTO public.customers VALUES ('1f47ccbe-1d32-492e-b6cf-742f5e734d80', 'FORNO7', 'telegram', 'demo-cdnfzc', 'Jun Wei', NULL, NULL, 'en', '2026-10-21 14:51:00+08', '2026-10-21 14:51:00+08');
INSERT INTO public.customers VALUES ('1c4d7229-fb3e-49ea-9c5b-5869ff8028c1', 'FORNO7', 'telegram', 'demo-dxagsi', 'Siew Mei', NULL, NULL, 'en', '2026-10-21 14:02:00+08', '2026-10-21 14:02:00+08');
INSERT INTO public.customers VALUES ('041859ce-af2c-4f57-9cbd-69f1e65008f8', 'FORNO7', 'whatsapp', 'demo-66ouj1', 'Kavitha S.', NULL, NULL, 'en', '2026-10-21 16:59:00+08', '2026-10-21 16:59:00+08');
INSERT INTO public.customers VALUES ('b23ab204-8d80-4199-88e3-6a2fa9ea9117', 'FORNO7', 'simulator', 'demo-9o6xbx', 'Farhan', NULL, NULL, 'en', '2026-10-21 18:24:00+08', '2026-10-21 18:24:00+08');
INSERT INTO public.customers VALUES ('9cd90161-dae8-4ad8-a7b9-6ddc2b20062a', 'FORNO7', 'whatsapp', 'demo-35hvyj', 'Melissa Tan', NULL, NULL, 'en', '2026-10-21 16:28:00+08', '2026-10-21 16:28:00+08');
INSERT INTO public.customers VALUES ('b082576a-93e0-4d91-a2d7-0b294920e754', 'FORNO7', 'telegram', 'demo-1ijh5n', 'Rachel Lim', NULL, NULL, 'en', '2026-10-21 19:13:00+08', '2026-10-21 19:13:00+08');
INSERT INTO public.customers VALUES ('312b4b03-76c3-4713-843a-37ecc2062e59', 'FORNO7', 'telegram', 'demo-2jq9of', 'Chloe Ng', NULL, NULL, 'en', '2026-10-21 19:31:00+08', '2026-10-21 19:31:00+08');
INSERT INTO public.customers VALUES ('ad76641d-2d79-4cf5-990e-7af1c14bcec1', 'FORNO7', 'whatsapp', 'demo-32w4yj', 'Haziq', NULL, NULL, 'en', '2026-10-21 12:39:00+08', '2026-10-21 12:39:00+08');
INSERT INTO public.customers VALUES ('0beb835c-70e9-4c1c-a1bd-e33e468df627', 'FORNO7', 'telegram', 'demo-b43k7n', 'Chloe Ng', NULL, NULL, 'en', '2026-10-21 11:38:00+08', '2026-10-21 11:38:00+08');
INSERT INTO public.customers VALUES ('ce2d0550-299e-4f66-8b58-a65978de4cdb', 'FORNO7', 'telegram', 'demo-6xkpec', 'Deepa', NULL, NULL, 'en', '2026-10-21 17:14:00+08', '2026-10-21 17:14:00+08');
INSERT INTO public.customers VALUES ('39ff828a-9461-481f-b495-b36f883c18a1', 'FORNO7', 'simulator', 'demo-45rzgw', 'Arif Danial', NULL, NULL, 'en', '2026-10-21 18:09:00+08', '2026-10-21 18:09:00+08');
INSERT INTO public.customers VALUES ('20b1f3a7-9fd9-4b06-b2bb-a7fd1e6d51c3', 'FORNO7', 'simulator', 'demo-1do1td', 'Siew Mei', NULL, NULL, 'en', '2026-10-21 10:49:00+08', '2026-10-21 10:49:00+08');
INSERT INTO public.customers VALUES ('f2435cc8-5296-4b4f-aa1b-63fedca32341', 'FORNO7', 'telegram', 'demo-ad1ipf', 'Ganesh', NULL, NULL, 'en', '2026-10-21 11:30:00+08', '2026-10-21 11:30:00+08');
INSERT INTO public.customers VALUES ('14ac072b-1134-4c58-9ab4-1bf430e2ec11', 'FORNO7', 'telegram', 'demo-c7rja8', 'Bryan Ooi', NULL, NULL, 'en', '2026-10-21 15:48:00+08', '2026-10-21 15:48:00+08');


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: jawab
--

INSERT INTO public.events VALUES (2578, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-21 15:50:00+08');
INSERT INTO public.events VALUES (2579, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2713}', true, '2026-10-21 15:50:02.713+08');
INSERT INTO public.events VALUES (2580, 'FORNO7', 'message.received', '{"topic": "drinks", "channel": "telegram"}', true, '2026-10-21 11:23:00+08');
INSERT INTO public.events VALUES (2581, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1791}', true, '2026-10-21 11:23:01.791+08');
INSERT INTO public.events VALUES (2582, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-21 16:41:00+08');
INSERT INTO public.events VALUES (2583, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 1518}', true, '2026-10-21 16:41:01.518+08');
INSERT INTO public.events VALUES (2588, 'FORNO7', 'message.received', '{"topic": "drinks", "channel": "whatsapp"}', true, '2026-10-21 09:20:00+08');
INSERT INTO public.events VALUES (2589, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1487}', true, '2026-10-21 09:20:01.487+08');
INSERT INTO public.events VALUES (2590, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-21 11:03:00+08');
INSERT INTO public.events VALUES (2591, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3472}', true, '2026-10-21 11:03:03.472+08');
INSERT INTO public.events VALUES (2592, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-21 16:55:00+08');
INSERT INTO public.events VALUES (2593, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2516}', true, '2026-10-21 16:55:02.516+08');
INSERT INTO public.events VALUES (2594, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-21 12:58:00+08');
INSERT INTO public.events VALUES (2595, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3450}', true, '2026-10-21 12:58:03.45+08');
INSERT INTO public.events VALUES (2596, 'FORNO7', 'message.received', '{"topic": "feedback", "channel": "telegram"}', true, '2026-10-21 10:14:00+08');
INSERT INTO public.events VALUES (2597, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1708}', true, '2026-10-21 10:14:01.708+08');
INSERT INTO public.events VALUES (2598, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-21 14:51:00+08');
INSERT INTO public.events VALUES (2599, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 3335}', true, '2026-10-21 14:51:03.335+08');
INSERT INTO public.events VALUES (2600, 'FORNO7', 'message.received', '{"topic": "complaints", "channel": "telegram"}', true, '2026-10-21 14:02:00+08');
INSERT INTO public.events VALUES (2601, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1860}', true, '2026-10-21 14:02:01.86+08');
INSERT INTO public.events VALUES (2602, 'FORNO7', 'message.received', '{"topic": "location", "channel": "whatsapp"}', true, '2026-10-21 16:59:00+08');
INSERT INTO public.events VALUES (2603, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2412}', true, '2026-10-21 16:59:02.412+08');
INSERT INTO public.events VALUES (2604, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "simulator"}', true, '2026-10-21 18:24:00+08');
INSERT INTO public.events VALUES (2605, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 1412}', true, '2026-10-21 18:24:01.412+08');
INSERT INTO public.events VALUES (2606, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "whatsapp"}', true, '2026-10-21 16:28:00+08');
INSERT INTO public.events VALUES (2607, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 1666}', true, '2026-10-21 16:28:01.666+08');
INSERT INTO public.events VALUES (2608, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-21 19:13:00+08');
INSERT INTO public.events VALUES (2609, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2805}', true, '2026-10-21 19:13:02.805+08');
INSERT INTO public.events VALUES (2610, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-21 19:31:00+08');
INSERT INTO public.events VALUES (2611, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2986}', true, '2026-10-21 19:31:02.986+08');
INSERT INTO public.events VALUES (2612, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-21 12:39:00+08');
INSERT INTO public.events VALUES (2613, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1821}', true, '2026-10-21 12:39:01.821+08');
INSERT INTO public.events VALUES (2614, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-21 11:38:00+08');
INSERT INTO public.events VALUES (2615, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3542}', true, '2026-10-21 11:38:03.542+08');
INSERT INTO public.events VALUES (2616, 'FORNO7', 'message.received', '{"topic": "allergens", "channel": "telegram"}', true, '2026-10-21 17:14:00+08');
INSERT INTO public.events VALUES (2617, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1601}', true, '2026-10-21 17:14:01.601+08');
INSERT INTO public.events VALUES (2618, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "simulator"}', true, '2026-10-21 18:09:00+08');
INSERT INTO public.events VALUES (2619, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 3103}', true, '2026-10-21 18:09:03.103+08');
INSERT INTO public.events VALUES (2620, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "simulator"}', true, '2026-10-21 10:49:00+08');
INSERT INTO public.events VALUES (2621, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "escalated", "latencyMs": 2933}', true, '2026-10-21 10:49:02.933+08');
INSERT INTO public.events VALUES (2622, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-21 11:30:00+08');
INSERT INTO public.events VALUES (2623, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1774}', true, '2026-10-21 11:30:01.774+08');
INSERT INTO public.events VALUES (2624, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-21 15:48:00+08');
INSERT INTO public.events VALUES (2625, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2685}', true, '2026-10-21 15:48:02.685+08');
INSERT INTO public.events VALUES (1972, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-14 21:20:00+08');
INSERT INTO public.events VALUES (1973, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2847}', true, '2026-10-14 21:20:02.847+08');
INSERT INTO public.events VALUES (1974, 'FORNO7', 'message.received', '{"topic": "stock", "channel": "telegram"}', true, '2026-10-14 09:26:00+08');
INSERT INTO public.events VALUES (1975, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2472}', true, '2026-10-14 09:26:02.472+08');
INSERT INTO public.events VALUES (1976, 'FORNO7', 'message.received', '{"topic": "merch", "channel": "telegram"}', true, '2026-10-14 13:28:00+08');
INSERT INTO public.events VALUES (1977, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2632}', true, '2026-10-14 13:28:02.632+08');
INSERT INTO public.events VALUES (1978, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-14 21:01:00+08');
INSERT INTO public.events VALUES (1979, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1379}', true, '2026-10-14 21:01:01.379+08');
INSERT INTO public.events VALUES (1982, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "telegram"}', true, '2026-10-14 19:04:00+08');
INSERT INTO public.events VALUES (1983, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 2448}', true, '2026-10-14 19:04:02.448+08');
INSERT INTO public.events VALUES (1984, 'FORNO7', 'message.received', '{"topic": "house", "channel": "whatsapp"}', true, '2026-10-14 17:05:00+08');
INSERT INTO public.events VALUES (1985, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1908}', true, '2026-10-14 17:05:01.908+08');
INSERT INTO public.events VALUES (1986, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-14 15:02:00+08');
INSERT INTO public.events VALUES (1987, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1951}', true, '2026-10-14 15:02:01.951+08');
INSERT INTO public.events VALUES (1988, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-14 10:49:00+08');
INSERT INTO public.events VALUES (1989, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1735}', true, '2026-10-14 10:49:01.735+08');
INSERT INTO public.events VALUES (1990, 'FORNO7', 'message.received', '{"topic": "house", "channel": "whatsapp"}', true, '2026-10-14 21:24:00+08');
INSERT INTO public.events VALUES (1991, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 3272}', true, '2026-10-14 21:24:03.272+08');
INSERT INTO public.events VALUES (1992, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-14 21:42:00+08');
INSERT INTO public.events VALUES (1993, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1313}', true, '2026-10-14 21:42:01.313+08');
INSERT INTO public.events VALUES (1994, 'FORNO7', 'message.received', '{"topic": "house", "channel": "simulator"}', true, '2026-10-14 09:24:00+08');
INSERT INTO public.events VALUES (1995, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 1593}', true, '2026-10-14 09:24:01.593+08');
INSERT INTO public.events VALUES (1996, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-14 14:51:00+08');
INSERT INTO public.events VALUES (1997, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 1985}', true, '2026-10-14 14:51:01.985+08');
INSERT INTO public.events VALUES (1998, 'FORNO7', 'message.received', '{"topic": "house", "channel": "whatsapp"}', true, '2026-10-14 13:10:00+08');
INSERT INTO public.events VALUES (1999, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2867}', true, '2026-10-14 13:10:02.867+08');
INSERT INTO public.events VALUES (2000, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-14 11:54:00+08');
INSERT INTO public.events VALUES (2001, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3148}', true, '2026-10-14 11:54:03.148+08');
INSERT INTO public.events VALUES (2002, 'FORNO7', 'message.received', '{"topic": "merch", "channel": "telegram"}', true, '2026-10-14 21:31:00+08');
INSERT INTO public.events VALUES (2003, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1700}', true, '2026-10-14 21:31:01.7+08');
INSERT INTO public.events VALUES (2004, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-14 20:48:00+08');
INSERT INTO public.events VALUES (2005, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2415}', true, '2026-10-14 20:48:02.415+08');
INSERT INTO public.events VALUES (2006, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-14 20:56:00+08');
INSERT INTO public.events VALUES (2007, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2834}', true, '2026-10-14 20:56:02.834+08');
INSERT INTO public.events VALUES (2008, 'FORNO7', 'message.received', '{"topic": "promotions", "channel": "telegram"}', true, '2026-10-14 11:07:00+08');
INSERT INTO public.events VALUES (2009, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2943}', true, '2026-10-14 11:07:02.943+08');
INSERT INTO public.events VALUES (2010, 'FORNO7', 'message.received', '{"topic": "location", "channel": "telegram"}', true, '2026-10-14 12:49:00+08');
INSERT INTO public.events VALUES (2011, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2565}', true, '2026-10-14 12:49:02.565+08');
INSERT INTO public.events VALUES (2012, 'FORNO7', 'message.received', '{"topic": "merch", "channel": "telegram"}', true, '2026-10-14 16:14:00+08');
INSERT INTO public.events VALUES (2013, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1996}', true, '2026-10-14 16:14:01.996+08');
INSERT INTO public.events VALUES (2014, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-14 16:40:00+08');
INSERT INTO public.events VALUES (2015, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1555}', true, '2026-10-14 16:40:01.555+08');
INSERT INTO public.events VALUES (2016, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-14 10:22:00+08');
INSERT INTO public.events VALUES (2017, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2886}', true, '2026-10-14 10:22:02.886+08');
INSERT INTO public.events VALUES (2020, 'FORNO7', 'message.received', '{"topic": "feedback", "channel": "telegram"}', true, '2026-10-14 16:51:00+08');
INSERT INTO public.events VALUES (2021, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1881}', true, '2026-10-14 16:51:01.881+08');
INSERT INTO public.events VALUES (2022, 'FORNO7', 'message.received', '{"topic": "stock", "channel": "telegram"}', true, '2026-10-14 22:19:00+08');
INSERT INTO public.events VALUES (2023, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2843}', true, '2026-10-14 22:19:02.843+08');
INSERT INTO public.events VALUES (2024, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-14 16:41:00+08');
INSERT INTO public.events VALUES (2025, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "booked", "latencyMs": 3562}', true, '2026-10-14 16:41:03.562+08');
INSERT INTO public.events VALUES (2028, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-14 13:00:00+08');
INSERT INTO public.events VALUES (2029, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 3050}', true, '2026-10-14 13:00:03.05+08');
INSERT INTO public.events VALUES (2030, 'FORNO7', 'message.received', '{"topic": "drinks", "channel": "telegram"}', true, '2026-10-14 15:35:00+08');
INSERT INTO public.events VALUES (2031, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2210}', true, '2026-10-14 15:35:02.21+08');
INSERT INTO public.events VALUES (2032, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "telegram"}', true, '2026-10-14 11:20:00+08');
INSERT INTO public.events VALUES (2033, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3210}', true, '2026-10-14 11:20:03.21+08');
INSERT INTO public.events VALUES (2034, 'FORNO7', 'message.received', '{"topic": "off_topic", "channel": "whatsapp"}', true, '2026-10-14 12:46:00+08');
INSERT INTO public.events VALUES (2035, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "declined", "latencyMs": 2028}', true, '2026-10-14 12:46:02.028+08');
INSERT INTO public.events VALUES (2036, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-14 12:54:00+08');
INSERT INTO public.events VALUES (2037, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2620}', true, '2026-10-14 12:54:02.62+08');
INSERT INTO public.events VALUES (2038, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-14 09:49:00+08');
INSERT INTO public.events VALUES (2039, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3576}', true, '2026-10-14 09:49:03.576+08');
INSERT INTO public.events VALUES (2040, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-14 19:17:00+08');
INSERT INTO public.events VALUES (2041, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2412}', true, '2026-10-14 19:17:02.412+08');
INSERT INTO public.events VALUES (2042, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "simulator"}', true, '2026-10-14 20:05:00+08');
INSERT INTO public.events VALUES (2043, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 2525}', true, '2026-10-14 20:05:02.525+08');
INSERT INTO public.events VALUES (2044, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-14 18:14:00+08');
INSERT INTO public.events VALUES (2045, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2452}', true, '2026-10-14 18:14:02.452+08');
INSERT INTO public.events VALUES (2046, 'FORNO7', 'message.received', '{"topic": "house", "channel": "whatsapp"}', true, '2026-10-14 09:39:00+08');
INSERT INTO public.events VALUES (2047, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 3270}', true, '2026-10-14 09:39:03.27+08');
INSERT INTO public.events VALUES (2048, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "telegram"}', true, '2026-10-14 20:56:00+08');
INSERT INTO public.events VALUES (2049, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2331}', true, '2026-10-14 20:56:02.331+08');
INSERT INTO public.events VALUES (2050, 'FORNO7', 'message.received', '{"topic": "partnership", "channel": "telegram"}', true, '2026-10-15 22:42:00+08');
INSERT INTO public.events VALUES (2051, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 3029}', true, '2026-10-15 22:42:03.029+08');
INSERT INTO public.events VALUES (2052, 'FORNO7', 'message.received', '{"topic": "promotions", "channel": "telegram"}', true, '2026-10-15 21:03:00+08');
INSERT INTO public.events VALUES (2053, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1298}', true, '2026-10-15 21:03:01.298+08');
INSERT INTO public.events VALUES (2054, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "whatsapp"}', true, '2026-10-15 20:20:00+08');
INSERT INTO public.events VALUES (2055, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2429}', true, '2026-10-15 20:20:02.429+08');
INSERT INTO public.events VALUES (2056, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-15 09:03:00+08');
INSERT INTO public.events VALUES (2057, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 3434}', true, '2026-10-15 09:03:03.434+08');
INSERT INTO public.events VALUES (2058, 'FORNO7', 'message.received', '{"topic": "merch", "channel": "telegram"}', true, '2026-10-15 15:55:00+08');
INSERT INTO public.events VALUES (2059, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2915}', true, '2026-10-15 15:55:02.915+08');
INSERT INTO public.events VALUES (2060, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-15 21:44:00+08');
INSERT INTO public.events VALUES (2061, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2532}', true, '2026-10-15 21:44:02.532+08');
INSERT INTO public.events VALUES (2062, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "simulator"}', true, '2026-10-15 22:32:00+08');
INSERT INTO public.events VALUES (2063, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 1414}', true, '2026-10-15 22:32:01.414+08');
INSERT INTO public.events VALUES (2066, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-15 10:55:00+08');
INSERT INTO public.events VALUES (2067, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 3538}', true, '2026-10-15 10:55:03.538+08');
INSERT INTO public.events VALUES (2068, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-15 21:15:00+08');
INSERT INTO public.events VALUES (2069, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2115}', true, '2026-10-15 21:15:02.115+08');
INSERT INTO public.events VALUES (2070, 'FORNO7', 'message.received', '{"topic": "payment", "channel": "whatsapp"}', true, '2026-10-15 22:56:00+08');
INSERT INTO public.events VALUES (2071, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 3109}', true, '2026-10-15 22:56:03.109+08');
INSERT INTO public.events VALUES (2072, 'FORNO7', 'message.received', '{"topic": "feedback", "channel": "telegram"}', true, '2026-10-15 11:21:00+08');
INSERT INTO public.events VALUES (2073, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2560}', true, '2026-10-15 11:21:02.56+08');
INSERT INTO public.events VALUES (2074, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-15 09:00:00+08');
INSERT INTO public.events VALUES (2075, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1283}', true, '2026-10-15 09:00:01.283+08');
INSERT INTO public.events VALUES (2076, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-15 14:40:00+08');
INSERT INTO public.events VALUES (2077, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2766}', true, '2026-10-15 14:40:02.766+08');
INSERT INTO public.events VALUES (2078, 'FORNO7', 'message.received', '{"topic": "drinks", "channel": "telegram"}', true, '2026-10-15 14:48:00+08');
INSERT INTO public.events VALUES (2079, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1524}', true, '2026-10-15 14:48:01.524+08');
INSERT INTO public.events VALUES (2080, 'FORNO7', 'message.received', '{"topic": "drinks", "channel": "telegram"}', true, '2026-10-15 15:02:00+08');
INSERT INTO public.events VALUES (2081, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3338}', true, '2026-10-15 15:02:03.338+08');
INSERT INTO public.events VALUES (2082, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-15 12:15:00+08');
INSERT INTO public.events VALUES (2083, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3542}', true, '2026-10-15 12:15:03.542+08');
INSERT INTO public.events VALUES (2086, 'FORNO7', 'message.received', '{"topic": "promotions", "channel": "telegram"}', true, '2026-10-15 16:08:00+08');
INSERT INTO public.events VALUES (2087, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3359}', true, '2026-10-15 16:08:03.359+08');
INSERT INTO public.events VALUES (2088, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-15 15:12:00+08');
INSERT INTO public.events VALUES (2089, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2701}', true, '2026-10-15 15:12:02.701+08');
INSERT INTO public.events VALUES (2090, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-15 13:34:00+08');
INSERT INTO public.events VALUES (2091, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1303}', true, '2026-10-15 13:34:01.303+08');
INSERT INTO public.events VALUES (2092, 'FORNO7', 'message.received', '{"topic": "jobs", "channel": "telegram"}', true, '2026-10-15 12:54:00+08');
INSERT INTO public.events VALUES (2093, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2322}', true, '2026-10-15 12:54:02.322+08');
INSERT INTO public.events VALUES (2094, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-15 21:01:00+08');
INSERT INTO public.events VALUES (2095, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 2668}', true, '2026-10-15 21:01:02.668+08');
INSERT INTO public.events VALUES (2096, 'FORNO7', 'message.received', '{"topic": "payment", "channel": "telegram"}', true, '2026-10-15 17:01:00+08');
INSERT INTO public.events VALUES (2097, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2482}', true, '2026-10-15 17:01:02.482+08');
INSERT INTO public.events VALUES (2102, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-15 22:57:00+08');
INSERT INTO public.events VALUES (2103, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1316}', true, '2026-10-15 22:57:01.316+08');
INSERT INTO public.events VALUES (2104, 'FORNO7', 'message.received', '{"topic": "feedback", "channel": "whatsapp"}', true, '2026-10-15 14:18:00+08');
INSERT INTO public.events VALUES (2105, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2998}', true, '2026-10-15 14:18:02.998+08');
INSERT INTO public.events VALUES (2106, 'FORNO7', 'message.received', '{"topic": "food", "channel": "telegram"}', true, '2026-10-15 20:49:00+08');
INSERT INTO public.events VALUES (2107, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3005}', true, '2026-10-15 20:49:03.005+08');
INSERT INTO public.events VALUES (2108, 'FORNO7', 'message.received', '{"topic": "house", "channel": "simulator"}', true, '2026-10-15 20:47:00+08');
INSERT INTO public.events VALUES (2109, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 1250}', true, '2026-10-15 20:47:01.25+08');
INSERT INTO public.events VALUES (2110, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-15 09:13:00+08');
INSERT INTO public.events VALUES (2111, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 1655}', true, '2026-10-15 09:13:01.655+08');
INSERT INTO public.events VALUES (2114, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-15 22:21:00+08');
INSERT INTO public.events VALUES (2115, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "booked", "latencyMs": 2851}', true, '2026-10-15 22:21:02.851+08');
INSERT INTO public.events VALUES (2118, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-15 22:20:00+08');
INSERT INTO public.events VALUES (2119, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 1877}', true, '2026-10-15 22:20:01.877+08');
INSERT INTO public.events VALUES (2120, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "whatsapp"}', true, '2026-10-15 09:53:00+08');
INSERT INTO public.events VALUES (2121, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 3139}', true, '2026-10-15 09:53:03.139+08');
INSERT INTO public.events VALUES (2122, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-15 17:29:00+08');
INSERT INTO public.events VALUES (2123, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2044}', true, '2026-10-15 17:29:02.044+08');
INSERT INTO public.events VALUES (2130, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-16 18:55:00+08');
INSERT INTO public.events VALUES (2131, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1414}', true, '2026-10-16 18:55:01.414+08');
INSERT INTO public.events VALUES (2132, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-16 17:16:00+08');
INSERT INTO public.events VALUES (2133, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2798}', true, '2026-10-16 17:16:02.798+08');
INSERT INTO public.events VALUES (2134, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-16 14:45:00+08');
INSERT INTO public.events VALUES (2135, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1655}', true, '2026-10-16 14:45:01.655+08');
INSERT INTO public.events VALUES (2136, 'FORNO7', 'message.received', '{"topic": "drinks", "channel": "telegram"}', true, '2026-10-16 21:40:00+08');
INSERT INTO public.events VALUES (2137, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1804}', true, '2026-10-16 21:40:01.804+08');
INSERT INTO public.events VALUES (2138, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-16 11:21:00+08');
INSERT INTO public.events VALUES (2139, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2355}', true, '2026-10-16 11:21:02.355+08');
INSERT INTO public.events VALUES (2140, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-16 14:06:00+08');
INSERT INTO public.events VALUES (2141, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3338}', true, '2026-10-16 14:06:03.338+08');
INSERT INTO public.events VALUES (2142, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-16 21:29:00+08');
INSERT INTO public.events VALUES (2143, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 3390}', true, '2026-10-16 21:29:03.39+08');
INSERT INTO public.events VALUES (2144, 'FORNO7', 'message.received', '{"topic": "partnership", "channel": "telegram"}', true, '2026-10-16 19:03:00+08');
INSERT INTO public.events VALUES (2145, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 2141}', true, '2026-10-16 19:03:02.141+08');
INSERT INTO public.events VALUES (2146, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "simulator"}', true, '2026-10-16 09:37:00+08');
INSERT INTO public.events VALUES (2147, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 2475}', true, '2026-10-16 09:37:02.475+08');
INSERT INTO public.events VALUES (2148, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-16 22:56:00+08');
INSERT INTO public.events VALUES (2149, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 1740}', true, '2026-10-16 22:56:01.74+08');
INSERT INTO public.events VALUES (2150, 'FORNO7', 'message.received', '{"topic": "allergens", "channel": "whatsapp"}', true, '2026-10-16 17:04:00+08');
INSERT INTO public.events VALUES (2151, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 2341}', true, '2026-10-16 17:04:02.341+08');
INSERT INTO public.events VALUES (2152, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-16 10:54:00+08');
INSERT INTO public.events VALUES (2153, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2474}', true, '2026-10-16 10:54:02.474+08');
INSERT INTO public.events VALUES (2154, 'FORNO7', 'message.received', '{"topic": "location", "channel": "telegram"}', true, '2026-10-16 20:05:00+08');
INSERT INTO public.events VALUES (2155, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2462}', true, '2026-10-16 20:05:02.462+08');
INSERT INTO public.events VALUES (2156, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-16 20:01:00+08');
INSERT INTO public.events VALUES (2157, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3135}', true, '2026-10-16 20:01:03.135+08');
INSERT INTO public.events VALUES (2158, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-16 19:16:00+08');
INSERT INTO public.events VALUES (2159, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 2888}', true, '2026-10-16 19:16:02.888+08');
INSERT INTO public.events VALUES (2160, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "simulator"}', true, '2026-10-16 12:53:00+08');
INSERT INTO public.events VALUES (2161, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "escalated", "latencyMs": 1782}', true, '2026-10-16 12:53:01.782+08');
INSERT INTO public.events VALUES (2164, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-16 11:48:00+08');
INSERT INTO public.events VALUES (2165, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 3069}', true, '2026-10-16 11:48:03.069+08');
INSERT INTO public.events VALUES (2168, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-16 20:43:00+08');
INSERT INTO public.events VALUES (2169, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "booked", "latencyMs": 2188}', true, '2026-10-16 20:43:02.188+08');
INSERT INTO public.events VALUES (2170, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "whatsapp"}', true, '2026-10-16 21:42:00+08');
INSERT INTO public.events VALUES (2171, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 2419}', true, '2026-10-16 21:42:02.419+08');
INSERT INTO public.events VALUES (2172, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "whatsapp"}', true, '2026-10-16 14:24:00+08');
INSERT INTO public.events VALUES (2173, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1383}', true, '2026-10-16 14:24:01.383+08');
INSERT INTO public.events VALUES (2174, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-16 14:33:00+08');
INSERT INTO public.events VALUES (2175, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1830}', true, '2026-10-16 14:33:01.83+08');
INSERT INTO public.events VALUES (2176, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "telegram"}', true, '2026-10-16 09:52:00+08');
INSERT INTO public.events VALUES (2177, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1549}', true, '2026-10-16 09:52:01.549+08');
INSERT INTO public.events VALUES (2178, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-16 14:38:00+08');
INSERT INTO public.events VALUES (2179, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2388}', true, '2026-10-16 14:38:02.388+08');
INSERT INTO public.events VALUES (2182, 'FORNO7', 'message.received', '{"topic": "events", "channel": "whatsapp"}', true, '2026-10-16 17:34:00+08');
INSERT INTO public.events VALUES (2183, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2376}', true, '2026-10-16 17:34:02.376+08');
INSERT INTO public.events VALUES (2184, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-16 13:43:00+08');
INSERT INTO public.events VALUES (2185, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3074}', true, '2026-10-16 13:43:03.074+08');
INSERT INTO public.events VALUES (2186, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-16 10:14:00+08');
INSERT INTO public.events VALUES (2187, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1736}', true, '2026-10-16 10:14:01.736+08');
INSERT INTO public.events VALUES (2188, 'FORNO7', 'message.received', '{"topic": "jobs", "channel": "telegram"}', true, '2026-10-16 20:32:00+08');
INSERT INTO public.events VALUES (2189, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3428}', true, '2026-10-16 20:32:03.428+08');
INSERT INTO public.events VALUES (2192, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "whatsapp"}', true, '2026-10-16 22:55:00+08');
INSERT INTO public.events VALUES (2193, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 3405}', true, '2026-10-16 22:55:03.405+08');
INSERT INTO public.events VALUES (2194, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-16 20:59:00+08');
INSERT INTO public.events VALUES (2195, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2662}', true, '2026-10-16 20:59:02.662+08');
INSERT INTO public.events VALUES (2196, 'FORNO7', 'message.received', '{"topic": "payment", "channel": "telegram"}', true, '2026-10-16 13:25:00+08');
INSERT INTO public.events VALUES (2197, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3062}', true, '2026-10-16 13:25:03.062+08');
INSERT INTO public.events VALUES (2198, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-16 13:00:00+08');
INSERT INTO public.events VALUES (2199, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1351}', true, '2026-10-16 13:00:01.351+08');
INSERT INTO public.events VALUES (2200, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "simulator"}', true, '2026-10-16 10:21:00+08');
INSERT INTO public.events VALUES (2201, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "booked", "latencyMs": 2102}', true, '2026-10-16 10:21:02.102+08');
INSERT INTO public.events VALUES (2202, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-16 09:29:00+08');
INSERT INTO public.events VALUES (2203, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1704}', true, '2026-10-16 09:29:01.704+08');
INSERT INTO public.events VALUES (2204, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-16 22:14:00+08');
INSERT INTO public.events VALUES (2205, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2598}', true, '2026-10-16 22:14:02.598+08');
INSERT INTO public.events VALUES (2206, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-16 20:09:00+08');
INSERT INTO public.events VALUES (2207, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2658}', true, '2026-10-16 20:09:02.658+08');
INSERT INTO public.events VALUES (2210, 'FORNO7', 'message.received', '{"topic": "merch", "channel": "telegram"}', true, '2026-10-16 19:41:00+08');
INSERT INTO public.events VALUES (2211, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3120}', true, '2026-10-16 19:41:03.12+08');
INSERT INTO public.events VALUES (2212, 'FORNO7', 'message.received', '{"topic": "complaints", "channel": "whatsapp"}', true, '2026-10-16 15:34:00+08');
INSERT INTO public.events VALUES (2213, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 3115}', true, '2026-10-16 15:34:03.115+08');
INSERT INTO public.events VALUES (2216, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-16 11:12:00+08');
INSERT INTO public.events VALUES (2217, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2481}', true, '2026-10-16 11:12:02.481+08');
INSERT INTO public.events VALUES (2218, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "simulator"}', true, '2026-10-16 13:08:00+08');
INSERT INTO public.events VALUES (2219, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 1372}', true, '2026-10-16 13:08:01.372+08');
INSERT INTO public.events VALUES (2220, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-16 22:07:00+08');
INSERT INTO public.events VALUES (2221, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1318}', true, '2026-10-16 22:07:01.318+08');
INSERT INTO public.events VALUES (2222, 'FORNO7', 'message.received', '{"topic": "stock", "channel": "telegram"}', true, '2026-10-16 16:06:00+08');
INSERT INTO public.events VALUES (2223, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1643}', true, '2026-10-16 16:06:01.643+08');
INSERT INTO public.events VALUES (2224, 'FORNO7', 'message.received', '{"topic": "location", "channel": "telegram"}', true, '2026-10-16 16:33:00+08');
INSERT INTO public.events VALUES (2225, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3025}', true, '2026-10-16 16:33:03.025+08');
INSERT INTO public.events VALUES (2226, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "telegram"}', true, '2026-10-16 22:54:00+08');
INSERT INTO public.events VALUES (2227, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1673}', true, '2026-10-16 22:54:01.673+08');
INSERT INTO public.events VALUES (2228, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "telegram"}', true, '2026-10-16 11:55:00+08');
INSERT INTO public.events VALUES (2229, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 3339}', true, '2026-10-16 11:55:03.339+08');
INSERT INTO public.events VALUES (2230, 'FORNO7', 'message.received', '{"topic": "feedback", "channel": "whatsapp"}', true, '2026-10-16 10:14:00+08');
INSERT INTO public.events VALUES (2231, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1607}', true, '2026-10-16 10:14:01.607+08');
INSERT INTO public.events VALUES (2232, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-16 13:15:00+08');
INSERT INTO public.events VALUES (2233, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2693}', true, '2026-10-16 13:15:02.693+08');
INSERT INTO public.events VALUES (2238, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-16 14:47:00+08');
INSERT INTO public.events VALUES (2239, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1638}', true, '2026-10-16 14:47:01.638+08');
INSERT INTO public.events VALUES (2242, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-16 16:04:00+08');
INSERT INTO public.events VALUES (2243, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3514}', true, '2026-10-16 16:04:03.514+08');
INSERT INTO public.events VALUES (2244, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-16 10:57:00+08');
INSERT INTO public.events VALUES (2245, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 1452}', true, '2026-10-16 10:57:01.452+08');
INSERT INTO public.events VALUES (2246, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-16 17:56:00+08');
INSERT INTO public.events VALUES (2247, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3084}', true, '2026-10-16 17:56:03.084+08');
INSERT INTO public.events VALUES (2248, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-16 22:49:00+08');
INSERT INTO public.events VALUES (2249, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "booked", "latencyMs": 2325}', true, '2026-10-16 22:49:02.325+08');
INSERT INTO public.events VALUES (2250, 'FORNO7', 'message.received', '{"topic": "location", "channel": "telegram"}', true, '2026-10-16 20:17:00+08');
INSERT INTO public.events VALUES (2251, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2368}', true, '2026-10-16 20:17:02.368+08');
INSERT INTO public.events VALUES (2252, 'FORNO7', 'message.received', '{"topic": "feedback", "channel": "whatsapp"}', true, '2026-10-16 22:12:00+08');
INSERT INTO public.events VALUES (2253, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2205}', true, '2026-10-16 22:12:02.205+08');
INSERT INTO public.events VALUES (2254, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-17 18:31:00+08');
INSERT INTO public.events VALUES (2255, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "booked", "latencyMs": 2408}', true, '2026-10-17 18:31:02.408+08');
INSERT INTO public.events VALUES (2260, 'FORNO7', 'message.received', '{"topic": "location", "channel": "whatsapp"}', true, '2026-10-17 19:06:00+08');
INSERT INTO public.events VALUES (2261, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 3101}', true, '2026-10-17 19:06:03.101+08');
INSERT INTO public.events VALUES (2262, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-17 09:54:00+08');
INSERT INTO public.events VALUES (2263, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3566}', true, '2026-10-17 09:54:03.566+08');
INSERT INTO public.events VALUES (2266, 'FORNO7', 'message.received', '{"topic": "stock", "channel": "telegram"}', true, '2026-10-17 21:35:00+08');
INSERT INTO public.events VALUES (2267, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1650}', true, '2026-10-17 21:35:01.65+08');
INSERT INTO public.events VALUES (2268, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-17 14:49:00+08');
INSERT INTO public.events VALUES (2269, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3111}', true, '2026-10-17 14:49:03.111+08');
INSERT INTO public.events VALUES (2270, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-17 21:37:00+08');
INSERT INTO public.events VALUES (2271, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2859}', true, '2026-10-17 21:37:02.859+08');
INSERT INTO public.events VALUES (2272, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-17 14:29:00+08');
INSERT INTO public.events VALUES (2273, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2173}', true, '2026-10-17 14:29:02.173+08');
INSERT INTO public.events VALUES (2274, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-17 12:40:00+08');
INSERT INTO public.events VALUES (2275, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2747}', true, '2026-10-17 12:40:02.747+08');
INSERT INTO public.events VALUES (2278, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-17 22:20:00+08');
INSERT INTO public.events VALUES (2279, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2533}', true, '2026-10-17 22:20:02.533+08');
INSERT INTO public.events VALUES (2280, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-17 19:22:00+08');
INSERT INTO public.events VALUES (2281, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2700}', true, '2026-10-17 19:22:02.7+08');
INSERT INTO public.events VALUES (2282, 'FORNO7', 'message.received', '{"topic": "payment", "channel": "telegram"}', true, '2026-10-17 13:26:00+08');
INSERT INTO public.events VALUES (2283, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2153}', true, '2026-10-17 13:26:02.153+08');
INSERT INTO public.events VALUES (2286, 'FORNO7', 'message.received', '{"topic": "merch", "channel": "telegram"}', true, '2026-10-17 14:25:00+08');
INSERT INTO public.events VALUES (2287, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2256}', true, '2026-10-17 14:25:02.256+08');
INSERT INTO public.events VALUES (2288, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-17 09:41:00+08');
INSERT INTO public.events VALUES (2289, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2931}', true, '2026-10-17 09:41:02.931+08');
INSERT INTO public.events VALUES (2290, 'FORNO7', 'message.received', '{"topic": "location", "channel": "telegram"}', true, '2026-10-17 20:30:00+08');
INSERT INTO public.events VALUES (2291, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1907}', true, '2026-10-17 20:30:01.907+08');
INSERT INTO public.events VALUES (2292, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "telegram"}', true, '2026-10-17 12:46:00+08');
INSERT INTO public.events VALUES (2293, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1689}', true, '2026-10-17 12:46:01.689+08');
INSERT INTO public.events VALUES (2294, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-17 18:32:00+08');
INSERT INTO public.events VALUES (2295, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2747}', true, '2026-10-17 18:32:02.747+08');
INSERT INTO public.events VALUES (2296, 'FORNO7', 'message.received', '{"topic": "feedback", "channel": "telegram"}', true, '2026-10-17 12:09:00+08');
INSERT INTO public.events VALUES (2297, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1396}', true, '2026-10-17 12:09:01.396+08');
INSERT INTO public.events VALUES (2300, 'FORNO7', 'message.received', '{"topic": "merch", "channel": "telegram"}', true, '2026-10-17 11:11:00+08');
INSERT INTO public.events VALUES (2301, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1254}', true, '2026-10-17 11:11:01.254+08');
INSERT INTO public.events VALUES (2302, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "telegram"}', true, '2026-10-17 12:18:00+08');
INSERT INTO public.events VALUES (2303, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2754}', true, '2026-10-17 12:18:02.754+08');
INSERT INTO public.events VALUES (2304, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-17 12:18:00+08');
INSERT INTO public.events VALUES (2305, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2995}', true, '2026-10-17 12:18:02.995+08');
INSERT INTO public.events VALUES (2306, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "whatsapp"}', true, '2026-10-17 18:04:00+08');
INSERT INTO public.events VALUES (2307, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2307}', true, '2026-10-17 18:04:02.307+08');
INSERT INTO public.events VALUES (2310, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-17 16:31:00+08');
INSERT INTO public.events VALUES (2311, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 1546}', true, '2026-10-17 16:31:01.546+08');
INSERT INTO public.events VALUES (2312, 'FORNO7', 'message.received', '{"topic": "merch", "channel": "telegram"}', true, '2026-10-17 09:11:00+08');
INSERT INTO public.events VALUES (2313, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1251}', true, '2026-10-17 09:11:01.251+08');
INSERT INTO public.events VALUES (2314, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "simulator"}', true, '2026-10-17 16:22:00+08');
INSERT INTO public.events VALUES (2315, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "booked", "latencyMs": 1220}', true, '2026-10-17 16:22:01.22+08');
INSERT INTO public.events VALUES (2318, 'FORNO7', 'message.received', '{"topic": "drinks", "channel": "whatsapp"}', true, '2026-10-17 13:24:00+08');
INSERT INTO public.events VALUES (2319, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1746}', true, '2026-10-17 13:24:01.746+08');
INSERT INTO public.events VALUES (2320, 'FORNO7', 'message.received', '{"topic": "feedback", "channel": "telegram"}', true, '2026-10-17 12:28:00+08');
INSERT INTO public.events VALUES (2321, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1996}', true, '2026-10-17 12:28:01.996+08');
INSERT INTO public.events VALUES (2322, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-17 16:46:00+08');
INSERT INTO public.events VALUES (2323, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3300}', true, '2026-10-17 16:46:03.3+08');
INSERT INTO public.events VALUES (2324, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-17 15:46:00+08');
INSERT INTO public.events VALUES (2325, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2515}', true, '2026-10-17 15:46:02.515+08');
INSERT INTO public.events VALUES (2326, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-17 16:30:00+08');
INSERT INTO public.events VALUES (2327, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 1653}', true, '2026-10-17 16:30:01.653+08');
INSERT INTO public.events VALUES (2328, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "telegram"}', true, '2026-10-17 18:36:00+08');
INSERT INTO public.events VALUES (2329, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1340}', true, '2026-10-17 18:36:01.34+08');
INSERT INTO public.events VALUES (2330, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-17 15:39:00+08');
INSERT INTO public.events VALUES (2331, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1565}', true, '2026-10-17 15:39:01.565+08');
INSERT INTO public.events VALUES (2332, 'FORNO7', 'message.received', '{"topic": "off_topic", "channel": "telegram"}', true, '2026-10-17 09:29:00+08');
INSERT INTO public.events VALUES (2333, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "declined", "latencyMs": 1259}', true, '2026-10-17 09:29:01.259+08');
INSERT INTO public.events VALUES (2334, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "telegram"}', true, '2026-10-17 21:11:00+08');
INSERT INTO public.events VALUES (2335, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1527}', true, '2026-10-17 21:11:01.527+08');
INSERT INTO public.events VALUES (2336, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-17 22:46:00+08');
INSERT INTO public.events VALUES (2337, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1232}', true, '2026-10-17 22:46:01.232+08');
INSERT INTO public.events VALUES (2338, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-17 11:26:00+08');
INSERT INTO public.events VALUES (2339, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2062}', true, '2026-10-17 11:26:02.062+08');
INSERT INTO public.events VALUES (2340, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-17 13:19:00+08');
INSERT INTO public.events VALUES (2341, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2997}', true, '2026-10-17 13:19:02.997+08');
INSERT INTO public.events VALUES (2342, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-17 17:09:00+08');
INSERT INTO public.events VALUES (2343, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2666}', true, '2026-10-17 17:09:02.666+08');
INSERT INTO public.events VALUES (2346, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-17 20:04:00+08');
INSERT INTO public.events VALUES (2347, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 3126}', true, '2026-10-17 20:04:03.126+08');
INSERT INTO public.events VALUES (2350, 'FORNO7', 'message.received', '{"topic": "complaints", "channel": "telegram"}', true, '2026-10-17 18:42:00+08');
INSERT INTO public.events VALUES (2351, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1352}', true, '2026-10-17 18:42:01.352+08');
INSERT INTO public.events VALUES (2352, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-17 21:46:00+08');
INSERT INTO public.events VALUES (2353, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2820}', true, '2026-10-17 21:46:02.82+08');
INSERT INTO public.events VALUES (2356, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-17 10:02:00+08');
INSERT INTO public.events VALUES (2357, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "booked", "latencyMs": 3125}', true, '2026-10-17 10:02:03.125+08');
INSERT INTO public.events VALUES (2358, 'FORNO7', 'message.received', '{"topic": "wholesale", "channel": "telegram"}', true, '2026-10-17 11:31:00+08');
INSERT INTO public.events VALUES (2359, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 2227}', true, '2026-10-17 11:31:02.227+08');
INSERT INTO public.events VALUES (2360, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-17 09:52:00+08');
INSERT INTO public.events VALUES (2361, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 3332}', true, '2026-10-17 09:52:03.332+08');
INSERT INTO public.events VALUES (2362, 'FORNO7', 'message.received', '{"topic": "drinks", "channel": "telegram"}', true, '2026-10-17 19:27:00+08');
INSERT INTO public.events VALUES (2363, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2569}', true, '2026-10-17 19:27:02.569+08');
INSERT INTO public.events VALUES (2364, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "whatsapp"}', true, '2026-10-17 18:28:00+08');
INSERT INTO public.events VALUES (2365, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 1270}', true, '2026-10-17 18:28:01.27+08');
INSERT INTO public.events VALUES (2366, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-17 18:41:00+08');
INSERT INTO public.events VALUES (2367, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2360}', true, '2026-10-17 18:41:02.36+08');
INSERT INTO public.events VALUES (2368, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-17 16:03:00+08');
INSERT INTO public.events VALUES (2369, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "booked", "latencyMs": 3236}', true, '2026-10-17 16:03:03.236+08');
INSERT INTO public.events VALUES (2370, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-17 11:25:00+08');
INSERT INTO public.events VALUES (2371, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2921}', true, '2026-10-17 11:25:02.921+08');
INSERT INTO public.events VALUES (2374, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "telegram"}', true, '2026-10-17 10:55:00+08');
INSERT INTO public.events VALUES (2375, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2132}', true, '2026-10-17 10:55:02.132+08');
INSERT INTO public.events VALUES (2378, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-18 21:22:00+08');
INSERT INTO public.events VALUES (2379, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2921}', true, '2026-10-18 21:22:02.921+08');
INSERT INTO public.events VALUES (2380, 'FORNO7', 'message.received', '{"topic": "payment", "channel": "whatsapp"}', true, '2026-10-18 13:03:00+08');
INSERT INTO public.events VALUES (2381, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1944}', true, '2026-10-18 13:03:01.944+08');
INSERT INTO public.events VALUES (2382, 'FORNO7', 'message.received', '{"topic": "allergens", "channel": "telegram"}', true, '2026-10-18 14:11:00+08');
INSERT INTO public.events VALUES (2383, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 3112}', true, '2026-10-18 14:11:03.112+08');
INSERT INTO public.events VALUES (2384, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-18 17:25:00+08');
INSERT INTO public.events VALUES (2385, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2913}', true, '2026-10-18 17:25:02.913+08');
INSERT INTO public.events VALUES (2386, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-18 19:03:00+08');
INSERT INTO public.events VALUES (2387, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2057}', true, '2026-10-18 19:03:02.057+08');
INSERT INTO public.events VALUES (2388, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "whatsapp"}', true, '2026-10-18 16:51:00+08');
INSERT INTO public.events VALUES (2389, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 3158}', true, '2026-10-18 16:51:03.158+08');
INSERT INTO public.events VALUES (2390, 'FORNO7', 'message.received', '{"topic": "food", "channel": "telegram"}', true, '2026-10-18 18:56:00+08');
INSERT INTO public.events VALUES (2391, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1751}', true, '2026-10-18 18:56:01.751+08');
INSERT INTO public.events VALUES (2392, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-18 15:17:00+08');
INSERT INTO public.events VALUES (2393, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3266}', true, '2026-10-18 15:17:03.266+08');
INSERT INTO public.events VALUES (2394, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-18 16:16:00+08');
INSERT INTO public.events VALUES (2395, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2572}', true, '2026-10-18 16:16:02.572+08');
INSERT INTO public.events VALUES (2396, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-18 14:22:00+08');
INSERT INTO public.events VALUES (2397, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1605}', true, '2026-10-18 14:22:01.605+08');
INSERT INTO public.events VALUES (2398, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-18 21:30:00+08');
INSERT INTO public.events VALUES (2399, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3383}', true, '2026-10-18 21:30:03.383+08');
INSERT INTO public.events VALUES (2400, 'FORNO7', 'message.received', '{"topic": "promotions", "channel": "telegram"}', true, '2026-10-18 14:11:00+08');
INSERT INTO public.events VALUES (2401, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 2908}', true, '2026-10-18 14:11:02.908+08');
INSERT INTO public.events VALUES (2404, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-18 13:04:00+08');
INSERT INTO public.events VALUES (2405, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "booked", "latencyMs": 2668}', true, '2026-10-18 13:04:02.668+08');
INSERT INTO public.events VALUES (2406, 'FORNO7', 'message.received', '{"topic": "partnership", "channel": "whatsapp"}', true, '2026-10-18 12:37:00+08');
INSERT INTO public.events VALUES (2407, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 1787}', true, '2026-10-18 12:37:01.787+08');
INSERT INTO public.events VALUES (2408, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "telegram"}', true, '2026-10-18 15:54:00+08');
INSERT INTO public.events VALUES (2409, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1879}', true, '2026-10-18 15:54:01.879+08');
INSERT INTO public.events VALUES (2410, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-18 18:31:00+08');
INSERT INTO public.events VALUES (2411, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1354}', true, '2026-10-18 18:31:01.354+08');
INSERT INTO public.events VALUES (2412, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-18 20:44:00+08');
INSERT INTO public.events VALUES (2413, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2114}', true, '2026-10-18 20:44:02.114+08');
INSERT INTO public.events VALUES (2414, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-18 16:26:00+08');
INSERT INTO public.events VALUES (2415, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2189}', true, '2026-10-18 16:26:02.189+08');
INSERT INTO public.events VALUES (2418, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-18 19:31:00+08');
INSERT INTO public.events VALUES (2419, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1745}', true, '2026-10-18 19:31:01.745+08');
INSERT INTO public.events VALUES (2420, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-18 22:26:00+08');
INSERT INTO public.events VALUES (2421, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3134}', true, '2026-10-18 22:26:03.134+08');
INSERT INTO public.events VALUES (2422, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-18 20:27:00+08');
INSERT INTO public.events VALUES (2423, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3547}', true, '2026-10-18 20:27:03.547+08');
INSERT INTO public.events VALUES (2424, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-18 13:06:00+08');
INSERT INTO public.events VALUES (2425, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3517}', true, '2026-10-18 13:06:03.517+08');
INSERT INTO public.events VALUES (2426, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "whatsapp"}', true, '2026-10-18 16:26:00+08');
INSERT INTO public.events VALUES (2427, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2527}', true, '2026-10-18 16:26:02.527+08');
INSERT INTO public.events VALUES (2428, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-18 13:35:00+08');
INSERT INTO public.events VALUES (2429, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 1796}', true, '2026-10-18 13:35:01.796+08');
INSERT INTO public.events VALUES (2430, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-18 20:13:00+08');
INSERT INTO public.events VALUES (2431, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2673}', true, '2026-10-18 20:13:02.673+08');
INSERT INTO public.events VALUES (2434, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "telegram"}', true, '2026-10-18 22:47:00+08');
INSERT INTO public.events VALUES (2435, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2142}', true, '2026-10-18 22:47:02.142+08');
INSERT INTO public.events VALUES (2436, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-18 09:57:00+08');
INSERT INTO public.events VALUES (2437, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2923}', true, '2026-10-18 09:57:02.923+08');
INSERT INTO public.events VALUES (2438, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "whatsapp"}', true, '2026-10-18 14:12:00+08');
INSERT INTO public.events VALUES (2439, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "booked", "latencyMs": 2728}', true, '2026-10-18 14:12:02.728+08');
INSERT INTO public.events VALUES (2440, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "simulator"}', true, '2026-10-18 16:24:00+08');
INSERT INTO public.events VALUES (2441, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 2821}', true, '2026-10-18 16:24:02.821+08');
INSERT INTO public.events VALUES (2442, 'FORNO7', 'message.received', '{"topic": "jobs", "channel": "whatsapp"}', true, '2026-10-18 22:16:00+08');
INSERT INTO public.events VALUES (2443, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1228}', true, '2026-10-18 22:16:01.228+08');
INSERT INTO public.events VALUES (2444, 'FORNO7', 'message.received', '{"topic": "merch", "channel": "telegram"}', true, '2026-10-18 22:14:00+08');
INSERT INTO public.events VALUES (2445, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3331}', true, '2026-10-18 22:14:03.331+08');
INSERT INTO public.events VALUES (2446, 'FORNO7', 'message.received', '{"topic": "feedback", "channel": "simulator"}', true, '2026-10-18 12:22:00+08');
INSERT INTO public.events VALUES (2447, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 3244}', true, '2026-10-18 12:22:03.244+08');
INSERT INTO public.events VALUES (2448, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "whatsapp"}', true, '2026-10-18 09:00:00+08');
INSERT INTO public.events VALUES (2449, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1982}', true, '2026-10-18 09:00:01.982+08');
INSERT INTO public.events VALUES (2450, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "telegram"}', true, '2026-10-18 15:45:00+08');
INSERT INTO public.events VALUES (2451, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1801}', true, '2026-10-18 15:45:01.801+08');
INSERT INTO public.events VALUES (2452, 'FORNO7', 'message.received', '{"topic": "drinks", "channel": "telegram"}', true, '2026-10-18 13:37:00+08');
INSERT INTO public.events VALUES (2453, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3163}', true, '2026-10-18 13:37:03.163+08');
INSERT INTO public.events VALUES (2456, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "telegram"}', true, '2026-10-18 22:23:00+08');
INSERT INTO public.events VALUES (2457, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1926}', true, '2026-10-18 22:23:01.926+08');
INSERT INTO public.events VALUES (2460, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "whatsapp"}', true, '2026-10-19 19:22:00+08');
INSERT INTO public.events VALUES (2461, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 3114}', true, '2026-10-19 19:22:03.114+08');
INSERT INTO public.events VALUES (2462, 'FORNO7', 'message.received', '{"topic": "jobs", "channel": "telegram"}', true, '2026-10-19 17:21:00+08');
INSERT INTO public.events VALUES (2463, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2127}', true, '2026-10-19 17:21:02.127+08');
INSERT INTO public.events VALUES (2464, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-19 11:04:00+08');
INSERT INTO public.events VALUES (2465, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1211}', true, '2026-10-19 11:04:01.211+08');
INSERT INTO public.events VALUES (2466, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-19 21:04:00+08');
INSERT INTO public.events VALUES (2467, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 1897}', true, '2026-10-19 21:04:01.897+08');
INSERT INTO public.events VALUES (2470, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-19 11:29:00+08');
INSERT INTO public.events VALUES (2471, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2384}', true, '2026-10-19 11:29:02.384+08');
INSERT INTO public.events VALUES (2472, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-19 11:34:00+08');
INSERT INTO public.events VALUES (2473, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1652}', true, '2026-10-19 11:34:01.652+08');
INSERT INTO public.events VALUES (2476, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-19 17:05:00+08');
INSERT INTO public.events VALUES (2477, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 1324}', true, '2026-10-19 17:05:01.324+08');
INSERT INTO public.events VALUES (2478, 'FORNO7', 'message.received', '{"topic": "delivery", "channel": "whatsapp"}', true, '2026-10-19 21:57:00+08');
INSERT INTO public.events VALUES (2479, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1373}', true, '2026-10-19 21:57:01.373+08');
INSERT INTO public.events VALUES (2480, 'FORNO7', 'message.received', '{"topic": "food", "channel": "telegram"}', true, '2026-10-19 14:22:00+08');
INSERT INTO public.events VALUES (2481, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2611}', true, '2026-10-19 14:22:02.611+08');
INSERT INTO public.events VALUES (2482, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "telegram"}', true, '2026-10-20 16:22:00+08');
INSERT INTO public.events VALUES (2483, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 3406}', true, '2026-10-20 16:22:03.406+08');
INSERT INTO public.events VALUES (2484, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-20 13:22:00+08');
INSERT INTO public.events VALUES (2485, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3485}', true, '2026-10-20 13:22:03.485+08');
INSERT INTO public.events VALUES (2486, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-20 17:33:00+08');
INSERT INTO public.events VALUES (2487, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3419}', true, '2026-10-20 17:33:03.419+08');
INSERT INTO public.events VALUES (2488, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-20 17:58:00+08');
INSERT INTO public.events VALUES (2489, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2471}', true, '2026-10-20 17:58:02.471+08');
INSERT INTO public.events VALUES (2490, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-20 10:33:00+08');
INSERT INTO public.events VALUES (2491, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3359}', true, '2026-10-20 10:33:03.359+08');
INSERT INTO public.events VALUES (2492, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-20 13:30:00+08');
INSERT INTO public.events VALUES (2493, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2161}', true, '2026-10-20 13:30:02.161+08');
INSERT INTO public.events VALUES (2494, 'FORNO7', 'message.received', '{"topic": "promotions", "channel": "whatsapp"}', true, '2026-10-20 18:13:00+08');
INSERT INTO public.events VALUES (2495, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 1952}', true, '2026-10-20 18:13:01.952+08');
INSERT INTO public.events VALUES (2496, 'FORNO7', 'message.received', '{"topic": "merch", "channel": "simulator"}', true, '2026-10-20 21:07:00+08');
INSERT INTO public.events VALUES (2497, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 3274}', true, '2026-10-20 21:07:03.274+08');
INSERT INTO public.events VALUES (2500, 'FORNO7', 'message.received', '{"topic": "food", "channel": "telegram"}', true, '2026-10-20 14:04:00+08');
INSERT INTO public.events VALUES (2501, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3047}', true, '2026-10-20 14:04:03.047+08');
INSERT INTO public.events VALUES (2502, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-20 13:15:00+08');
INSERT INTO public.events VALUES (2503, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1456}', true, '2026-10-20 13:15:01.456+08');
INSERT INTO public.events VALUES (2504, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-20 19:30:00+08');
INSERT INTO public.events VALUES (2505, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2271}', true, '2026-10-20 19:30:02.271+08');
INSERT INTO public.events VALUES (2508, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-20 18:32:00+08');
INSERT INTO public.events VALUES (2509, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1869}', true, '2026-10-20 18:32:01.869+08');
INSERT INTO public.events VALUES (2510, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-20 17:48:00+08');
INSERT INTO public.events VALUES (2511, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3476}', true, '2026-10-20 17:48:03.476+08');
INSERT INTO public.events VALUES (2514, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-20 12:56:00+08');
INSERT INTO public.events VALUES (2515, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2490}', true, '2026-10-20 12:56:02.49+08');
INSERT INTO public.events VALUES (2516, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "simulator"}', true, '2026-10-20 15:09:00+08');
INSERT INTO public.events VALUES (2517, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 2852}', true, '2026-10-20 15:09:02.852+08');
INSERT INTO public.events VALUES (2518, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-20 17:51:00+08');
INSERT INTO public.events VALUES (2519, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2945}', true, '2026-10-20 17:51:02.945+08');
INSERT INTO public.events VALUES (2520, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-20 12:06:00+08');
INSERT INTO public.events VALUES (2521, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 3576}', true, '2026-10-20 12:06:03.576+08');
INSERT INTO public.events VALUES (2524, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-20 15:22:00+08');
INSERT INTO public.events VALUES (2525, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2434}', true, '2026-10-20 15:22:02.434+08');
INSERT INTO public.events VALUES (2526, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "simulator"}', true, '2026-10-20 10:20:00+08');
INSERT INTO public.events VALUES (2527, 'FORNO7', 'message.answered', '{"channel": "simulator", "outcome": "auto_resolved", "latencyMs": 2341}', true, '2026-10-20 10:20:02.341+08');
INSERT INTO public.events VALUES (2528, 'FORNO7', 'message.received', '{"topic": "stock", "channel": "telegram"}', true, '2026-10-20 18:17:00+08');
INSERT INTO public.events VALUES (2529, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2791}', true, '2026-10-20 18:17:02.791+08');
INSERT INTO public.events VALUES (2530, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-20 18:07:00+08');
INSERT INTO public.events VALUES (2531, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1618}', true, '2026-10-20 18:07:01.618+08');
INSERT INTO public.events VALUES (2532, 'FORNO7', 'message.received', '{"topic": "drinks", "channel": "telegram"}', true, '2026-10-20 22:17:00+08');
INSERT INTO public.events VALUES (2533, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2156}', true, '2026-10-20 22:17:02.156+08');
INSERT INTO public.events VALUES (2534, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-20 17:30:00+08');
INSERT INTO public.events VALUES (2535, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2404}', true, '2026-10-20 17:30:02.404+08');
INSERT INTO public.events VALUES (2536, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-20 15:03:00+08');
INSERT INTO public.events VALUES (2537, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2920}', true, '2026-10-20 15:03:02.92+08');
INSERT INTO public.events VALUES (2538, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "telegram"}', true, '2026-10-20 22:15:00+08');
INSERT INTO public.events VALUES (2539, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "escalated", "latencyMs": 2701}', true, '2026-10-20 22:15:02.701+08');
INSERT INTO public.events VALUES (2540, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "telegram"}', true, '2026-10-20 19:00:00+08');
INSERT INTO public.events VALUES (2541, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2161}', true, '2026-10-20 19:00:02.161+08');
INSERT INTO public.events VALUES (2544, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-20 09:17:00+08');
INSERT INTO public.events VALUES (2545, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 3482}', true, '2026-10-20 09:17:03.482+08');
INSERT INTO public.events VALUES (2546, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "whatsapp"}', true, '2026-10-20 16:03:00+08');
INSERT INTO public.events VALUES (2547, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2787}', true, '2026-10-20 16:03:02.787+08');
INSERT INTO public.events VALUES (2548, 'FORNO7', 'message.received', '{"topic": "location", "channel": "telegram"}', true, '2026-10-20 15:44:00+08');
INSERT INTO public.events VALUES (2549, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1380}', true, '2026-10-20 15:44:01.38+08');
INSERT INTO public.events VALUES (2550, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-20 18:25:00+08');
INSERT INTO public.events VALUES (2551, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2643}', true, '2026-10-20 18:25:02.643+08');
INSERT INTO public.events VALUES (2552, 'FORNO7', 'message.received', '{"topic": "hours", "channel": "whatsapp"}', true, '2026-10-20 12:28:00+08');
INSERT INTO public.events VALUES (2553, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 2427}', true, '2026-10-20 12:28:02.427+08');
INSERT INTO public.events VALUES (2554, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-20 16:46:00+08');
INSERT INTO public.events VALUES (2555, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 1778}', true, '2026-10-20 16:46:01.778+08');
INSERT INTO public.events VALUES (2558, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-20 22:29:00+08');
INSERT INTO public.events VALUES (2559, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2853}', true, '2026-10-20 22:29:02.853+08');
INSERT INTO public.events VALUES (2560, 'FORNO7', 'message.received', '{"topic": "house", "channel": "whatsapp"}', true, '2026-10-20 10:39:00+08');
INSERT INTO public.events VALUES (2561, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 3584}', true, '2026-10-20 10:39:03.584+08');
INSERT INTO public.events VALUES (2562, 'FORNO7', 'message.received', '{"topic": "dietary", "channel": "whatsapp"}', true, '2026-10-21 18:03:00+08');
INSERT INTO public.events VALUES (2563, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "escalated", "latencyMs": 3386}', true, '2026-10-21 18:03:03.386+08');
INSERT INTO public.events VALUES (2564, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-21 15:57:00+08');
INSERT INTO public.events VALUES (2565, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 1282}', true, '2026-10-21 15:57:01.282+08');
INSERT INTO public.events VALUES (2566, 'FORNO7', 'message.received', '{"topic": "booking", "channel": "telegram"}', true, '2026-10-21 15:24:00+08');
INSERT INTO public.events VALUES (2567, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "booked", "latencyMs": 2595}', true, '2026-10-21 15:24:02.595+08');
INSERT INTO public.events VALUES (2570, 'FORNO7', 'message.received', '{"topic": "house", "channel": "telegram"}', true, '2026-10-21 15:41:00+08');
INSERT INTO public.events VALUES (2571, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2839}', true, '2026-10-21 15:41:02.839+08');
INSERT INTO public.events VALUES (2572, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "telegram"}', true, '2026-10-21 13:14:00+08');
INSERT INTO public.events VALUES (2573, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 1823}', true, '2026-10-21 13:14:01.823+08');
INSERT INTO public.events VALUES (2574, 'FORNO7', 'message.received', '{"topic": "location", "channel": "telegram"}', true, '2026-10-21 18:32:00+08');
INSERT INTO public.events VALUES (2575, 'FORNO7', 'message.answered', '{"channel": "telegram", "outcome": "auto_resolved", "latencyMs": 2292}', true, '2026-10-21 18:32:02.292+08');
INSERT INTO public.events VALUES (2576, 'FORNO7', 'message.received', '{"topic": "menu", "channel": "whatsapp"}', true, '2026-10-21 16:17:00+08');
INSERT INTO public.events VALUES (2577, 'FORNO7', 'message.answered', '{"channel": "whatsapp", "outcome": "auto_resolved", "latencyMs": 1695}', true, '2026-10-21 16:17:01.695+08');


--
--



--
--



--
--



--
-- Data for Name: kb_items; Type: TABLE DATA; Schema: public; Owner: jawab
--

INSERT INTO public.kb_items VALUES ('0ecde97e-13be-44dd-9c1f-8b8a2230798a', 'FORNO7', 'product', 'pizza', 'margherita', 'Margherita', 'San Marzano tomato, fior di latte, basil, extra-virgin olive oil.', '{"halal": true, "spicy": false, "vegan": false, "toppings": ["tomato", "fior di latte", "basil", "olive oil"], "allergens": ["gluten", "dairy"], "vegetarian": true}', '{vegetarian,halal}', true, NULL, 0, true, '2026-10-21 19:38:50.691256+08');
INSERT INTO public.kb_items VALUES ('a993187d-a04b-456e-946e-c15346bddb50', 'FORNO7', 'product', 'pizza', 'marinara', 'Marinara', 'Tomato, garlic, oregano, olive oil. No cheese.', '{"halal": true, "spicy": false, "vegan": true, "toppings": ["tomato", "garlic", "oregano", "olive oil"], "allergens": ["gluten"], "vegetarian": true}', '{vegetarian,vegan,halal}', true, NULL, 1, true, '2026-10-21 19:38:50.70258+08');
INSERT INTO public.kb_items VALUES ('7081646d-9939-4360-9e2c-a41525702fee', 'FORNO7', 'product', 'pizza', 'diavola', 'Diavola', 'Tomato, mozzarella, spicy beef pepperoni, Calabrian chilli oil.', '{"halal": true, "spicy": true, "vegan": false, "toppings": ["tomato", "mozzarella", "beef pepperoni", "chilli oil"], "allergens": ["gluten", "dairy"], "vegetarian": false}', '{spicy,halal}', true, NULL, 2, true, '2026-10-21 19:38:50.7126+08');
INSERT INTO public.kb_items VALUES ('e7791c21-b9db-43b1-80b6-d800969847aa', 'FORNO7', 'product', 'pizza', 'quattro-formaggi', 'Quattro Formaggi', 'Mozzarella, gorgonzola, parmigiano, smoked scamorza, wildflower honey.', '{"halal": true, "spicy": false, "vegan": false, "toppings": ["mozzarella", "gorgonzola", "parmigiano", "scamorza", "honey"], "allergens": ["gluten", "dairy"], "vegetarian": true}', '{vegetarian,halal}', true, NULL, 3, true, '2026-10-21 19:38:50.720649+08');
INSERT INTO public.kb_items VALUES ('d139363f-ed03-4a6a-8b82-6831d5f22190', 'FORNO7', 'product', 'pizza', 'funghi-tartufo', 'Funghi e Tartufo', 'Wild mushrooms, black truffle cream, mozzarella, thyme.', '{"halal": true, "spicy": false, "vegan": false, "toppings": ["mushrooms", "truffle cream", "mozzarella", "thyme"], "allergens": ["gluten", "dairy"], "vegetarian": true}', '{vegetarian,halal}', false, 'Truffle: sold out today. Our truffle delivery is late, back tomorrow.', 4, true, '2026-10-21 19:38:50.728329+08');
INSERT INTO public.kb_items VALUES ('217743da-2542-43d0-9b19-e6740ce54dfb', 'FORNO7', 'product', 'pizza', 'capricciosa', 'Capricciosa', 'Tomato, mozzarella, smoked turkey ham, artichoke, mushroom, olives.', '{"halal": true, "spicy": false, "vegan": false, "toppings": ["tomato", "mozzarella", "smoked turkey ham", "artichoke", "mushroom", "olives"], "allergens": ["gluten", "dairy"], "vegetarian": false}', '{halal}', true, NULL, 5, true, '2026-10-21 19:38:50.736188+08');
INSERT INTO public.kb_items VALUES ('59ddc3a4-a083-470b-bdf5-0d219a3537fb', 'FORNO7', 'product', 'pizza', 'pollo-pesto', 'Pollo Pesto', 'Basil pesto, grilled chicken, cherry tomato, mozzarella.', '{"halal": true, "spicy": false, "vegan": false, "toppings": ["basil pesto (pine nuts)", "grilled chicken", "cherry tomato", "mozzarella"], "allergens": ["gluten", "dairy", "tree nuts (pine nuts)"], "vegetarian": false}', '{halal}', true, NULL, 6, true, '2026-10-21 19:38:50.744293+08');
INSERT INTO public.kb_items VALUES ('7e18875a-b3f3-4e15-b387-ed49e4279d20', 'FORNO7', 'product', 'pizza', 'ortolana', 'Ortolana', 'Grilled zucchini, eggplant, peppers, red onion, mozzarella. Can be made without cheese.', '{"halal": true, "spicy": false, "vegan": false, "toppings": ["zucchini", "eggplant", "peppers", "red onion", "mozzarella"], "allergens": ["gluten", "dairy"], "vegetarian": true}', '{vegetarian,halal}', true, NULL, 7, true, '2026-10-21 19:38:50.751882+08');
INSERT INTO public.kb_items VALUES ('eb81587e-54a9-4032-9087-8bbaea5dc684', 'FORNO7', 'product', 'pizza', 'salsiccia', 'Salsiccia e Friarielli', 'Beef fennel sausage, broccoli rabe, smoked provola, chilli flakes.', '{"halal": true, "spicy": true, "vegan": false, "toppings": ["beef fennel sausage", "broccoli rabe", "smoked provola", "chilli flakes"], "allergens": ["gluten", "dairy"], "vegetarian": false}', '{spicy,halal}', true, NULL, 8, true, '2026-10-21 19:38:50.758765+08');
INSERT INTO public.kb_items VALUES ('6e5dfbb3-8b22-4b5f-8e56-f5076c33c09c', 'FORNO7', 'product', 'pizza', 'bianca-limone', 'Bianca al Limone', 'No tomato. Fior di latte, ricotta, lemon zest, mint, black pepper.', '{"halal": true, "spicy": false, "vegan": false, "toppings": ["fior di latte", "ricotta", "lemon zest", "mint"], "allergens": ["gluten", "dairy"], "vegetarian": true}', '{vegetarian,halal}', true, NULL, 9, true, '2026-10-21 19:38:50.766016+08');
INSERT INTO public.kb_items VALUES ('f775fd35-32fa-49eb-a86b-9956e808b10e', 'FORNO7', 'product', 'pizza', 'gamberi', 'Gamberi', 'Tiger prawns, garlic, chilli, cherry tomato, parsley, mozzarella.', '{"halal": true, "spicy": true, "vegan": false, "toppings": ["tiger prawns", "garlic", "chilli", "cherry tomato", "parsley", "mozzarella"], "allergens": ["gluten", "dairy", "shellfish"], "vegetarian": false}', '{spicy,halal}', true, NULL, 10, true, '2026-10-21 19:38:50.773191+08');
INSERT INTO public.kb_items VALUES ('b6898756-d378-4846-8955-a3fe81234819', 'FORNO7', 'product', 'pizza', 'vodka-rosa', 'Vodka Rosa', 'Vodka tomato cream, stracciatella, basil. Contains alcohol.', '{"halal": false, "spicy": false, "vegan": false, "toppings": ["vodka tomato cream", "stracciatella", "basil"], "allergens": ["gluten", "dairy"], "vegetarian": true}', '{vegetarian,"contains alcohol"}', true, NULL, 11, true, '2026-10-21 19:38:50.780865+08');
INSERT INTO public.kb_items VALUES ('ed7810f0-bf5b-4bf4-88d5-7fac6c75c9bc', 'FORNO7', 'product', 'pizza', 'rendang-rossa', 'Rendang Rossa', 'House signature. Slow-cooked beef rendang, red onion, mozzarella, crispy shallots, coriander.', '{"halal": true, "spicy": true, "vegan": false, "toppings": ["beef rendang", "red onion", "mozzarella", "crispy shallots", "coriander"], "allergens": ["gluten", "dairy"], "vegetarian": false}', '{spicy,halal}', true, NULL, 12, true, '2026-10-21 19:38:50.788626+08');
INSERT INTO public.kb_items VALUES ('5cec56db-f05b-4c75-af77-e248f9873072', 'FORNO7', 'product', 'pizza', 'agnello-piccante', 'Agnello Piccante', 'Spicy lamb spread, mozzarella, red onion, wildflower honey.', '{"halal": true, "spicy": true, "vegan": false, "toppings": ["spicy lamb", "mozzarella", "red onion", "honey"], "allergens": ["gluten", "dairy"], "vegetarian": false}', '{spicy,halal}', true, NULL, 13, true, '2026-10-21 19:38:50.795825+08');
INSERT INTO public.kb_items VALUES ('6ae131c6-211c-491d-88bf-9855fab9d1eb', 'FORNO7', 'product', 'sides', 'garlic-knots', 'Garlic knots (6)', 'Wood-fired dough knots, garlic butter, parsley.', '{"halal": true, "allergens": ["gluten", "dairy"], "vegetarian": true}', '{sides}', true, NULL, 14, true, '2026-10-21 19:38:50.80323+08');
INSERT INTO public.kb_items VALUES ('63a4c7da-0ca4-4366-8d52-fa4798f40750', 'FORNO7', 'product', 'sides', 'burrata-salad', 'Burrata and heirloom tomato', 'Whole burrata, tomatoes, basil oil, sourdough crumbs.', '{"halal": true, "allergens": ["gluten", "dairy"], "vegetarian": true}', '{sides}', true, NULL, 15, true, '2026-10-21 19:38:50.81008+08');
INSERT INTO public.kb_items VALUES ('011d9368-ae08-4ed2-9715-e1ba00113083', 'FORNO7', 'product', 'sides', 'rocket-salad', 'Rocket and pear salad', 'Rocket, pear, walnuts, parmigiano, balsamic.', '{"halal": true, "allergens": ["dairy", "tree nuts (walnuts)"], "vegetarian": true}', '{sides}', true, NULL, 16, true, '2026-10-21 19:38:50.817123+08');
INSERT INTO public.kb_items VALUES ('005c23b3-20cd-4f34-88b7-d0b9488047dd', 'FORNO7', 'product', 'desserts', 'tiramisu', 'Tiramisu', 'Mascarpone, espresso, cocoa. Alcohol-free.', '{"halal": true, "allergens": ["gluten", "dairy", "egg"], "vegetarian": true}', '{desserts}', true, NULL, 17, true, '2026-10-21 19:38:50.824027+08');
INSERT INTO public.kb_items VALUES ('b6333de5-cdf5-408d-84a5-8bba0d9e4e09', 'FORNO7', 'product', 'desserts', 'nutella-calzone', 'Nutella calzone', 'Folded dough, Nutella, hazelnuts, icing sugar. Shareable.', '{"halal": true, "allergens": ["gluten", "dairy", "tree nuts (hazelnuts)"], "vegetarian": true}', '{desserts}', true, NULL, 18, true, '2026-10-21 19:38:50.831029+08');
INSERT INTO public.kb_items VALUES ('cc06999a-3f97-4db0-a4d2-f8fe7f405c6a', 'FORNO7', 'product', 'drinks', 'house-lemonade', 'House lemonade', 'Fresh lemon, mint, soda. Non-alcoholic.', '{"halal": true, "allergens": [], "vegetarian": true}', '{drinks}', true, NULL, 19, true, '2026-10-21 19:38:50.838234+08');
INSERT INTO public.kb_items VALUES ('c1cf09e4-0078-4751-8cbd-c38c23710f9d', 'FORNO7', 'product', 'drinks', 'italian-soda', 'Italian soda', 'Blood orange, lemon or bergamot. Non-alcoholic.', '{"halal": true, "allergens": [], "vegetarian": true}', '{drinks}', true, NULL, 20, true, '2026-10-21 19:38:50.845204+08');
INSERT INTO public.kb_items VALUES ('31cc6bda-fcc1-4c4b-b39b-6ce739308b53', 'FORNO7', 'product', 'drinks', 'peroni', 'Peroni Nastro Azzurro (330ml)', 'Italian lager. 18+ only.', '{"halal": false, "allergens": ["gluten"], "vegetarian": true}', '{drinks}', true, NULL, 21, true, '2026-10-21 19:38:50.853149+08');
INSERT INTO public.kb_items VALUES ('0dc3560c-3660-4364-a753-f18cf5849ee0', 'FORNO7', 'product', 'merch', 'apron', 'Forno Sette canvas apron', 'Heavy cotton canvas, leather neck strap, two front pockets. Cut in four sizes.', '{"sizes": ["S", "M", "L", "XL"], "colors": ["Charcoal", "Brick Red", "Cream"]}', '{merch}', true, NULL, 22, true, '2026-10-21 19:38:50.860178+08');
INSERT INTO public.kb_items VALUES ('06262ca8-8d73-47b1-af20-f1b06d4afb81', 'FORNO7', 'product', 'merch', 'tshirt', 'Forno Sette T-shirt', 'Heavyweight 220gsm cotton tee with the oven-door print on the back.', '{"sizes": ["S", "M", "L", "XL"], "colors": ["Charcoal", "Brick Red", "Cream"]}', '{merch}', true, NULL, 23, true, '2026-10-21 19:38:50.869297+08');
INSERT INTO public.kb_items VALUES ('37188b1d-354c-4142-8186-5405606fe336', 'FORNO7', 'hours', 'hours', 'hours', 'Opening hours', 'Closed Mondays. Last orders 30 minutes before closing.', '{"weekly": {"fri": [["12:00", "23:30"]], "mon": [], "sat": [["12:00", "23:30"]], "sun": [["11:00", "22:00"]], "thu": [["12:00", "22:30"]], "tue": [["12:00", "22:30"]], "wed": [["12:00", "22:30"]]}, "exceptions": [{"date": "2026-10-31", "note": "Closed from 5pm for a private event", "hours": [["12:00", "17:00"]]}, {"date": "2026-12-24", "note": "Christmas Eve, dinner only, set menu", "hours": [["17:00", "23:30"]]}, {"date": "2026-12-25", "note": "Christmas Day", "hours": [["12:00", "22:00"]]}, {"date": "2026-12-28", "note": "Open this Monday for the holidays", "hours": [["12:00", "22:30"]]}, {"date": "2026-12-31", "note": "New Year''s Eve, open until 1am", "hours": [["17:00", "01:00"]]}, {"date": "2027-01-01", "note": "New Year''s Day, opening late", "hours": [["15:00", "22:00"]]}], "lastOrdersMinutesBeforeClose": 30}', '{}', true, NULL, 0, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('4995bd61-c371-480c-8185-fc337a8fe37e', 'FORNO7', 'info', 'delivery', 'delivery', 'Delivery zones and fees', 'Delivery runs during opening hours and stops 30 minutes before closing. Outside Zone A and B we''re on GrabFood and foodpanda (search Forno Sette Bangsar). We don''t run our own riders there.', '{"zones": [{"eta": "30–40 min", "fee": 5, "name": "Zone A", "areas": ["Bangsar", "Bangsar South", "Mid Valley", "Brickfields", "Damansara Heights", "KL Sentral"], "minOrder": 40}, {"eta": "45–60 min", "fee": 9, "name": "Zone B", "areas": ["Mont Kiara", "Sri Hartamas", "TTDI", "Seputeh", "Kuchai Lama", "Petaling Jaya SS2", "Bukit Bintang", "KLCC"], "minOrder": 60}]}', '{}', true, NULL, 0, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('016c0fa0-8d49-415f-b775-b5d7a96111dd', 'FORNO7', 'info', 'menu', 'extras', 'Extra toppings', 'Add-ons available on any pizza.', '{"extras": [{"name": "Extra mozzarella", "priceMinor": 400}, {"name": "Burrata (whole)", "priceMinor": 1200}, {"name": "Calabrian chilli oil", "priceMinor": 200}, {"name": "Rocket and parmigiano", "priceMinor": 500}, {"name": "Beef pepperoni", "priceMinor": 600}, {"name": "Grilled chicken", "priceMinor": 700}, {"name": "Fried egg", "priceMinor": 300}]}', '{}', true, NULL, 0, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('6a1a2895-4db6-481b-96c9-284008edc048', 'FORNO7', 'policy', 'location', 'policy-location', 'Address and getting here', '27 Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur. Two minutes'' walk from Bangsar Village II. Parking: Bangsar Village II basement, or street parking paid through the Flexi Parking app. Nearest LRT: Bangsar station, then a 10-minute walk or a short e-hailing ride. Ground floor is step-free and we have an accessible restroom.', '{}', '{}', true, NULL, 0, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('87a4bb8a-c032-419f-b900-1f3df6b89bcb', 'FORNO7', 'policy', 'halal', 'policy-halal', 'Halal and pork-free', 'Our kitchen is pork-free and all meat comes from JAKIM-certified halal suppliers. The restaurant itself is not halal-certified because we serve beer and wine, and the Vodka Rosa pizza contains alcohol. Every other pizza is made without alcohol.', '{}', '{}', true, NULL, 1, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('bb6de9e2-afd7-4059-abf0-bbd8f51d6b7a', 'FORNO7', 'policy', 'allergens', 'policy-allergens', 'Allergens', 'Each item lists its allergens. Our dough contains gluten. The kitchen handles tree nuts (pesto, walnuts, hazelnuts), shellfish (prawns), egg and dairy, so cross-contact is possible. We cannot guarantee any dish is free of an allergen. For severe allergies please speak with the manager before ordering.', '{}', '{}', true, NULL, 2, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('b80ec40b-61d3-4543-8f83-d5fd31b68b73', 'FORNO7', 'policy', 'payment', 'policy-payment', 'Payment methods', 'We accept cash, Visa, Mastercard, Amex, DuitNow QR, Touch ''n Go eWallet, GrabPay and Boost. No cheques. Groups of 8 or more pay a RM 100 deposit by DuitNow to confirm, deducted from the bill.', '{}', '{}', true, NULL, 3, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('e096d16a-52fe-4be8-bfec-deacefc4685c', 'FORNO7', 'policy', 'events', 'policy-events', 'Catering and private events', 'Private hire: the whole restaurant (40 seated, 60 standing) is available on Mondays, and for weekday lunches. Minimum spend RM 3,500 Tuesday–Thursday evenings and RM 6,000 Friday–Saturday. Mobile wood-fired oven catering for 30–150 guests starts from RM 45 per head. The events team sends a quote within one working day; we never confirm a private event over chat.', '{}', '{}', true, NULL, 5, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('51a9b42e-7595-44c3-9b79-bb004a01ff12', 'FORNO7', 'policy', 'complaints', 'policy-complaints', 'Complaints and refunds', 'If something is wrong with your order, tell us within 2 hours with a photo. The duty manager reviews every case personally and will remake the order or refund to the original payment method. Only the manager can approve a refund.', '{}', '{}', true, NULL, 6, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('2c1a791c-f878-45a0-a81c-ba6e3c2f8e86', 'FORNO7', 'policy', 'drinks', 'policy-drinks', 'Drinks and corkage', 'We serve Peroni, two local craft beers, Italian wines by the glass and bottle, house lemonade, Italian sodas and mocktails. Corkage is RM 40 per bottle of wine, maximum 2 bottles per table. Alcohol is served to guests aged 18+ only.', '{}', '{}', true, NULL, 7, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('894dedbc-7988-4325-965d-8ef1c1f0f585', 'FORNO7', 'policy', 'food', 'policy-dough', 'Our dough and sizes', 'Dough is fermented for 48 hours with Italian 00 flour. It''s not sourdough. Pizzas are baked at 450°C in about 90 seconds. Sizes: Small 9" (1 person), Medium 12" (1–2), Large 15" (2–3). Half-and-half is available on Medium and Large, priced at the more expensive half. No added MSG.', '{}', '{}', true, NULL, 8, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('b10ccf0f-629a-4cf9-a0bf-2fbd0a58c29f', 'FORNO7', 'policy', 'house', 'policy-house', 'House rules and facilities', 'No dress code. Dogs are welcome on the terrace (6 tables) and we bring water bowls. Smoking and vaping are not allowed anywhere, including the terrace, under Malaysian law. Free Wi-Fi; staff will share the password at your table. High chairs available. Bring your own birthday cake, no cake-cutting fee.', '{}', '{}', true, NULL, 9, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('3d2ae66b-ef1c-4c3b-890d-522b4ed8cecb', 'FORNO7', 'policy', 'promotions', 'policy-promos', 'Promotions', 'Lunch set Tuesday to Friday 12pm–3pm: any Small pizza + side salad + house lemonade or Italian soda for RM 29. No other promotions run right now, and discounts can''t be stacked.', '{}', '{}', true, NULL, 10, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('a53629f2-80b0-4f94-8ec2-8e70df420582', 'FORNO7', 'faq', 'halal', 'faq-01', 'u guys halal ah?', 'Our kitchen is pork-free and our meat comes from JAKIM-certified halal suppliers. We''re not halal-certified as a restaurant because we serve beer and wine, and the Vodka Rosa contains alcohol.', '{}', '{}', true, NULL, 0, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('f4b1062b-6c05-47da-9b94-bace254e2376', 'FORNO7', 'faq', 'hours', 'faq-02', 'open on monday?', 'We''re closed on Mondays. Tuesday to Sunday we''re open from midday (11am on Sundays).', '{}', '{}', true, NULL, 1, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('842a3302-e567-43c8-839e-c4ac25f9e519', 'FORNO7', 'faq', 'hours', 'faq-03', 'wat time u close tonite', 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '{}', '{}', true, NULL, 2, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('5278db13-43c8-4e33-840d-a2eb0b5588a8', 'FORNO7', 'faq', 'drinks', 'faq-04', 'can bring own wine? corkage how much', 'Yes. Corkage is RM 40 per bottle, maximum 2 bottles per table.', '{}', '{}', true, NULL, 3, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('8e7ff74f-f240-440f-8590-27114d34881a', 'FORNO7', 'faq', 'delivery', 'faq-05', 'do u deliver to mont kiara', 'Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.', '{}', '{}', true, NULL, 4, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('0e6e50d6-aa45-4304-ba68-02a750eafe00', 'FORNO7', 'faq', 'delivery', 'faq-06', 'delivery to subang can?', 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '{}', '{}', true, NULL, 5, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('856b1962-f7ea-4567-8e2c-b4d8bc986e49', 'FORNO7', 'faq', 'location', 'faq-07', 'parking got or not', 'Bangsar Village II basement is a 2-minute walk, or street parking through the Flexi Parking app.', '{}', '{}', true, NULL, 6, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('a61b81ab-f69e-465f-9c4f-47ec25e6710e', 'FORNO7', 'faq', 'menu', 'faq-08', 'is there vegan option', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '{}', '{}', true, NULL, 7, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('7312c593-add5-4e54-af1c-d8961badeec1', 'FORNO7', 'faq', 'payment', 'faq-09', 'can i pay with tng', 'Yes, Touch ''n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.', '{}', '{}', true, NULL, 8, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('86d8478f-bb3e-4ea6-b0a0-1ae89a77af94', 'FORNO7', 'faq', 'menu', 'faq-10', 'kids menu?', 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '{}', '{}', true, NULL, 9, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('f9008215-dcbf-4584-afe0-316f87c4c9a7', 'FORNO7', 'faq', 'house', 'faq-11', 'dog friendly??', 'Dogs are welcome on our terrace and we''ll bring a water bowl.', '{}', '{}', true, NULL, 10, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('16e52e2c-c875-4f20-8e13-97f7fcecda91', 'FORNO7', 'faq', 'location', 'faq-12', 'wheelchair accessible?', 'Yes. The ground floor is step-free and we have an accessible restroom.', '{}', '{}', true, NULL, 11, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('893c6da9-0c8e-44f7-98ba-f31adb8b1311', 'FORNO7', 'faq', 'menu', 'faq-13', 'how big is the large pizza', 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '{}', '{}', true, NULL, 12, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('a83f3aba-0e5b-4c0c-9ac5-56e02af02d78', 'FORNO7', 'faq', 'stock', 'faq-14', 'the truffle one available today?', 'Depends on the day''s stock; check the Funghi e Tartufo availability.', '{}', '{}', true, NULL, 13, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('f603ce06-ea4a-4e35-bc8e-b8c92d6c42a8', 'FORNO7', 'faq', 'menu', 'faq-15', 'got spicy pizza?', 'Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.', '{}', '{}', true, NULL, 14, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('904cb558-1d3a-4ef5-acc1-e5f3cea2745b', 'FORNO7', 'faq', 'booking', 'faq-16', 'can i reserve for 12 ppl', 'Up to 10 can be booked here. For 11 or more, our events team arranges the table personally.', '{}', '{}', true, NULL, 15, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('9102131c-acb4-4a65-894c-e7bce7352171', 'FORNO7', 'faq', 'house', 'faq-17', 'can bring birthday cake? any charge', 'Of course, bring your own cake. There''s no cake-cutting fee.', '{}', '{}', true, NULL, 16, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('8627a359-3df3-4cb9-90b2-b230155a6ec6', 'FORNO7', 'faq', 'house', 'faq-18', 'wifi pw?', 'We have free Wi-Fi; staff will share the password at your table.', '{}', '{}', true, NULL, 17, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('56c4177f-0c28-4653-be4f-416771a81172', 'FORNO7', 'faq', 'events', 'faq-19', 'do u do catering for office lunch', 'Yes, mobile wood-fired oven catering for 30–150 guests from RM 45 per head. Our events team sends a quote within one working day.', '{}', '{}', true, NULL, 18, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('5fd70ca4-69a8-48ca-8a84-480b9217cfb4', 'FORNO7', 'faq', 'promotions', 'faq-20', 'any promo now', 'Lunch set Tuesday to Friday, 12–3pm: Small pizza, side salad and a lemonade or Italian soda for RM 29.', '{}', '{}', true, NULL, 19, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('89125320-6a3b-414a-9398-7f19c030bb87', 'FORNO7', 'faq', 'food', 'faq-21', 'is ur dough sourdough', 'It''s a 48-hour fermented dough with Italian 00 flour, not sourdough.', '{}', '{}', true, NULL, 20, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('92e38ee8-caec-4c9f-9bb0-e43e759ab80a', 'FORNO7', 'faq', 'food', 'faq-22', 'msg free?', 'Yes, no added MSG.', '{}', '{}', true, NULL, 21, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('0a21a18f-8f83-4b05-87de-39e80243387d', 'FORNO7', 'faq', 'booking', 'faq-23', 'how long wait for walk in fri night', 'Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.', '{}', '{}', true, NULL, 22, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('4b861b14-7aa9-4978-ab84-108348d6c5fc', 'FORNO7', 'faq', 'booking', 'faq-24', 'how to cancel my booking', 'Send us your booking reference here. Cancellation is free up to 2 hours before.', '{}', '{}', true, NULL, 23, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('e3f94baa-363a-4c9c-a38b-4b618169d40c', 'FORNO7', 'faq', 'booking', 'faq-25', 'running 20 min late still can keep table?', 'We hold tables for 15 minutes. Send your booking reference and we''ll let the floor know you''re coming.', '{}', '{}', true, NULL, 24, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('f5388615-d063-4a6d-841a-63ecef479bc3', 'FORNO7', 'faq', 'merch', 'faq-26', 'the apron got in red?', 'Yes, in Brick Red. Stock depends on the size.', '{}', '{}', true, NULL, 25, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('beb5bc18-06d6-4561-bd81-b54c2bc86c15', 'FORNO7', 'faq', 'merch', 'faq-27', 'tshirt size M black ada?', 'Our dark tee is Charcoal; stock depends on the size.', '{}', '{}', true, NULL, 26, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('ced22b64-917e-403c-a00c-486ebc878aee', 'FORNO7', 'faq', 'allergens', 'faq-28', 'my son has nut allergy can he eat the pizza', 'The Pollo Pesto contains pine nuts, and our kitchen handles tree nuts, so cross-contact is possible. Our manager will talk you through it before you order.', '{}', '{}', true, NULL, 27, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('3a015198-ef9c-4834-9539-499288558d49', 'FORNO7', 'faq', 'location', 'faq-29', 'where exactly r u', '27 Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur, two minutes from Bangsar Village II.', '{}', '{}', true, NULL, 28, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('f0fe66d0-8fc0-46d2-9f1f-c2307e283b2d', 'FORNO7', 'faq', 'hours', 'faq-30', 'open christmas day?', 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '{}', '{}', true, NULL, 29, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('c4bb54a6-db25-4150-bfd1-1a7c92fb7971', 'FORNO7', 'faq', 'house', 'faq-31', 'any dress code', 'No dress code at all.', '{}', '{}', true, NULL, 30, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('ca3666a3-b378-4b02-ba72-7da204336337', 'FORNO7', 'faq', 'menu', 'faq-32', 'can do half half pizza?', 'Yes, on Medium and Large, priced at the more expensive half.', '{}', '{}', true, NULL, 31, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('47b036d7-b015-4eb2-8cda-f968b5634779', 'FORNO7', 'faq', 'menu', 'faq-33', 'extra cheese how much', 'Extra mozzarella RM 4, a whole burrata RM 12.', '{}', '{}', true, NULL, 32, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('36fe75f1-9104-4a2c-874f-8c4cbc7357b4', 'FORNO7', 'faq', 'drinks', 'faq-34', 'do u have beer', 'Peroni, two local craft beers, and Italian wines. 18+ only.', '{}', '{}', true, NULL, 33, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('2b93bfc1-9647-4e8c-a0ca-8a946720d57b', 'FORNO7', 'faq', 'drinks', 'faq-35', 'non alcoholic drinks got what', 'House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.', '{}', '{}', true, NULL, 34, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('624e7343-0955-4fce-a1cc-f66ac3c1c1bb', 'FORNO7', 'faq', 'booking', 'faq-36', 'hi um do you guys have like a table for two tomorrow around seven thanks', 'Check slots for tomorrow 7pm for 2 and offer to book.', '{}', '{}', true, NULL, 35, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('5f405741-6eab-4085-b5c6-783b9b8f2330', 'FORNO7', 'faq', 'jobs', 'faq-37', 'hiring? looking for part time kitchen job', 'We''re hiring pizza cooks. Send /apply to our Telegram bot to apply.', '{}', '{}', true, NULL, 36, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('d66b77e0-055d-46c8-8a58-7e9e4c6e421a', 'FORNO7', 'faq', 'house', 'faq-38', 'outdoor seating available?', 'Yes, 6 tables on the terrace. It''s non-smoking.', '{}', '{}', true, NULL, 37, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('2f37551d-095e-4390-9ddc-d250bb3125a9', 'FORNO7', 'faq', 'house', 'faq-39', 'can smoke at the terrace?', 'Sorry, smoking and vaping aren''t allowed anywhere at the restaurant, including the terrace.', '{}', '{}', true, NULL, 38, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('74f95618-93f4-4319-8e4c-205d07ed8127', 'FORNO7', 'faq', 'complaints', 'faq-40', 'pizza came cold n soggy wat la', 'So sorry. Please send a photo; our duty manager reviews it personally and will make it right.', '{}', '{}', true, NULL, 39, true, '2026-10-21 19:38:50.88372+08');
INSERT INTO public.kb_items VALUES ('9a9ed99a-ea78-4057-9313-d3c189b21e40', 'KASIH1', 'service', 'cuts', 'womens-cut', 'Women''s cut and blow-dry', 'Consultation, wash, cut and blow-dry.', '{"bookingType": "appointment", "durationMinutes": 60}', '{}', true, NULL, 0, true, '2026-10-21 19:38:59.761342+08');
INSERT INTO public.kb_items VALUES ('136aba06-a28a-4798-b4c1-b3829b5fa285', 'KASIH1', 'service', 'cuts', 'mens-cut', 'Men''s cut', 'Wash, cut and style.', '{"bookingType": "appointment", "durationMinutes": 30}', '{}', true, NULL, 1, true, '2026-10-21 19:38:59.769137+08');
INSERT INTO public.kb_items VALUES ('0ebf289b-bc1f-4c2a-8038-5c1965149556', 'KASIH1', 'service', 'cuts', 'kids-cut', 'Kids'' cut (under 12)', 'Quick cut for kids, no wash.', '{"bookingType": "appointment", "durationMinutes": 30}', '{}', true, NULL, 2, true, '2026-10-21 19:38:59.779633+08');
INSERT INTO public.kb_items VALUES ('867e55c9-3152-490c-8374-6b643b5168a7', 'KASIH1', 'service', 'colour', 'full-colour', 'Full colour', 'Single-process colour, root to tip, with blow-dry.', '{"bookingType": "appointment", "durationMinutes": 120}', '{}', true, NULL, 3, true, '2026-10-21 19:38:59.818366+08');
INSERT INTO public.kb_items VALUES ('b24f2123-6ecd-47f3-a584-324047188e91', 'KASIH1', 'service', 'colour', 'root-touch-up', 'Root touch-up', 'Regrowth colour up to 4 cm.', '{"bookingType": "appointment", "durationMinutes": 90}', '{}', true, NULL, 4, true, '2026-10-21 19:38:59.825847+08');
INSERT INTO public.kb_items VALUES ('59b6fa6f-433a-45e1-9326-536d22bde0e7', 'KASIH1', 'service', 'colour', 'highlights', 'Balayage / highlights', 'Hand-painted lightening with toner and blow-dry. Patch test needed 48 hours before for first-time colour clients.', '{"bookingType": "appointment", "durationMinutes": 180}', '{}', true, NULL, 5, true, '2026-10-21 19:38:59.833238+08');
INSERT INTO public.kb_items VALUES ('a3791abf-4c21-4adb-a031-86dd48a6385e', 'KASIH1', 'service', 'treatments', 'keratin', 'Keratin smoothing treatment', 'Frizz-reducing treatment that lasts about 3 months. Formaldehyde-free.', '{"bookingType": "appointment", "durationMinutes": 150}', '{}', true, NULL, 6, true, '2026-10-21 19:38:59.873008+08');
INSERT INTO public.kb_items VALUES ('04d8c292-41e8-41d1-9222-3ff5aa12c4d7', 'KASIH1', 'service', 'treatments', 'scalp-treatment', 'Scalp treatment', 'Exfoliating scalp scrub, massage and mask.', '{"bookingType": "appointment", "durationMinutes": 45}', '{}', true, NULL, 7, true, '2026-10-21 19:38:59.880441+08');
INSERT INTO public.kb_items VALUES ('7ba6430f-8cdc-4f1d-99cd-624dfd33e003', 'KASIH1', 'service', 'styling', 'blow-dry', 'Wash and blow-dry', 'Wash and styled blow-dry for events.', '{"bookingType": "appointment", "durationMinutes": 45}', '{}', true, NULL, 8, true, '2026-10-21 19:38:59.88775+08');
INSERT INTO public.kb_items VALUES ('8f19c529-507c-49ff-b8e1-544767dfecc8', 'KASIH1', 'service', 'styling', 'updo', 'Event updo', 'Bridal or event updo. Trial recommended for weddings.', '{"bookingType": "appointment", "durationMinutes": 60}', '{}', true, NULL, 9, true, '2026-10-21 19:38:59.894843+08');
INSERT INTO public.kb_items VALUES ('53b37d98-103c-4ede-9691-609a56a7a975', 'KASIH1', 'product', 'hair care', 'repair-shampoo', 'Bond repair shampoo 250ml', 'Sulphate-free shampoo for coloured hair.', '{}', '{}', true, NULL, 10, true, '2026-10-21 19:38:59.901518+08');
INSERT INTO public.kb_items VALUES ('ea27fc25-3b2a-46c8-a353-98929e8a7683', 'KASIH1', 'product', 'hair care', 'repair-mask', 'Bond repair mask 200ml', 'Weekly deep-conditioning mask.', '{}', '{}', true, NULL, 11, true, '2026-10-21 19:38:59.908537+08');
INSERT INTO public.kb_items VALUES ('039bdc48-78d2-4f71-b7fe-2f90dd9ec84d', 'KASIH1', 'product', 'hair care', 'heat-spray', 'Heat protect spray 150ml', 'Protects up to 230°C.', '{}', '{}', true, NULL, 12, true, '2026-10-21 19:38:59.91483+08');
INSERT INTO public.kb_items VALUES ('5e1462da-c2fe-4d83-bd13-bfc63c9d8854', 'KASIH1', 'hours', 'hours', 'hours', 'Opening hours', 'Closed Mondays.', '{"weekly": {"fri": [["10:00", "21:00"]], "mon": [], "sat": [["09:00", "19:00"]], "sun": [["10:00", "17:00"]], "thu": [["10:00", "21:00"]], "tue": [["10:00", "19:00"]], "wed": [["10:00", "19:00"]]}, "exceptions": [{"date": "2026-12-25", "note": "Closed for Christmas", "hours": []}], "lastOrdersMinutesBeforeClose": 0}', '{}', true, NULL, 0, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('811b998a-50bf-4fb0-9b77-caad3f518455', 'KASIH1', 'policy', 'colour', 'policy-patch-test', 'Colour patch test', 'First-time colour or lightening clients need a quick patch test at the salon at least 48 hours before the appointment. It''s free and takes 5 minutes.', '{}', '{}', true, NULL, 1, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('e9896fe6-55c8-4cff-a55e-554807ea18f7', 'KASIH1', 'policy', 'payment', 'policy-payment', 'Payment', 'Cash, cards, DuitNow QR, Touch ''n Go eWallet and GrabPay. Prices can change after the consultation if your hair needs more product or time; the stylist will tell you before starting.', '{}', '{}', true, NULL, 2, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('a6733337-6eed-4819-94b2-d4b2d8d428e0', 'KASIH1', 'policy', 'location', 'policy-location', 'Getting here', '2-7 Jalan Kiara 3, first floor above the bakery. Free parking in the building basement for 2 hours with our stamp.', '{}', '{}', true, NULL, 3, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('e1f496cb-7f0a-4e10-92de-4eacb5f93eee', 'KASIH1', 'policy', 'kids', 'policy-kids', 'Kids', 'Kids'' cuts are for under-12s. Children under 5 need a parent with them in the chair.', '{}', '{}', true, NULL, 4, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('22687cb8-12eb-4554-8e43-2b2b493de866', 'KASIH1', 'faq', 'prices', 'faq-01', 'how much for long hair cut ah', 'A women''s cut and blow-dry for long hair is RM 110.', '{}', '{}', true, NULL, 0, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('81d83802-ca94-45c0-9534-58fcd381b8ca', 'KASIH1', 'faq', 'booking', 'faq-02', 'can book tmr 3pm for haircut?', 'Check availability for tomorrow 3pm and offer to book.', '{}', '{}', true, NULL, 1, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('98cc7598-1e83-438a-9bba-d81ae5750e92', 'KASIH1', 'faq', 'booking', 'faq-03', 'got slot this sat?', 'Check Saturday''s availability for the service they want.', '{}', '{}', true, NULL, 2, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('71a11b6d-e78f-4c9b-93c2-10ed7485835d', 'KASIH1', 'faq', 'hours', 'faq-04', 'open on monday?', 'We''re closed on Mondays. Tuesday to Sunday from 10am (9am on Saturdays).', '{}', '{}', true, NULL, 3, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('8a5b0d1d-8e1a-4215-bc15-1866ef63a97d', 'KASIH1', 'faq', 'treatments', 'faq-05', 'do u do keratin', 'Yes, keratin smoothing from RM 350 for medium hair; it takes about 2.5 hours.', '{}', '{}', true, NULL, 4, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('432d43c5-4c71-4fa6-bcfd-4d03769c4efd', 'KASIH1', 'faq', 'colour', 'faq-06', 'balayage price', 'Balayage starts at RM 380 for medium hair and RM 450 for long hair.', '{}', '{}', true, NULL, 5, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('8afe9644-937f-45dd-97d4-5c57b9af3b8e', 'KASIH1', 'faq', 'colour', 'faq-07', 'need patch test?', 'Yes for first-time colour clients: a free 5-minute patch test at least 48 hours before.', '{}', '{}', true, NULL, 6, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('f148e751-52e5-4f58-9d16-d38b6eade169', 'KASIH1', 'faq', 'booking', 'faq-08', 'can cancel my appointment', 'Free up to 24 hours before. Send your booking reference and we''ll sort it.', '{}', '{}', true, NULL, 7, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('5be9cfe0-2e30-4247-b3ea-0a0cf5c3fea9', 'KASIH1', 'faq', 'location', 'faq-09', 'parking?', 'Free basement parking for 2 hours with our stamp.', '{}', '{}', true, NULL, 8, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('164690d9-a2b1-4363-9c0c-2cca38d21067', 'KASIH1', 'faq', 'cuts', 'faq-10', 'men haircut how long', 'About 30 minutes.', '{}', '{}', true, NULL, 9, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('2080b346-8e73-49bc-bd46-60f059accedc', 'KASIH1', 'faq', 'cuts', 'faq-11', 'do u cut kids hair', 'Yes, kids'' cuts for under-12s are RM 30.', '{}', '{}', true, NULL, 10, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('6cc2b1dc-3e61-440f-8acf-7e7c25b78f51', 'KASIH1', 'faq', 'stylists', 'faq-12', 'which stylist is best for curly hair', 'All three stylists cut curly hair; tell us your hair type and we''ll match you.', '{}', '{}', true, NULL, 11, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('9c70a5bd-f5af-4557-a722-0623458c1171', 'KASIH1', 'faq', 'products', 'faq-13', 'got sell shampoo?', 'Yes, bond repair shampoo and mask, and a heat protect spray. Ask about stock.', '{}', '{}', true, NULL, 12, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('9c1156df-2157-4093-b490-2d12712b007c', 'KASIH1', 'faq', 'styling', 'faq-14', 'bridal hair trial?', 'Yes, book an event updo as a trial; wedding packages are arranged with the team.', '{}', '{}', true, NULL, 13, true, '2026-10-21 19:38:59.92341+08');
INSERT INTO public.kb_items VALUES ('fdf4eb0e-8992-491b-8793-cd3f15e49988', 'KASIH1', 'faq', 'payment', 'faq-15', 'can pay tng?', 'Yes, Touch ''n Go eWallet works, plus cash, cards, DuitNow QR and GrabPay.', '{}', '{}', true, NULL, 14, true, '2026-10-21 19:38:59.92341+08');


--
-- Data for Name: kb_variants; Type: TABLE DATA; Schema: public; Owner: jawab
--

INSERT INTO public.kb_variants VALUES ('a6cd72ef-bc79-45b7-99aa-1dcf3ed7cb16', 'FORNO7', '0ecde97e-13be-44dd-9c1f-8b8a2230798a', 'S', NULL, NULL, 2800, NULL, 'margherita-S');
INSERT INTO public.kb_variants VALUES ('0d58682a-f138-4c97-affd-bbd18de69486', 'FORNO7', '0ecde97e-13be-44dd-9c1f-8b8a2230798a', 'M', NULL, NULL, 3800, NULL, 'margherita-M');
INSERT INTO public.kb_variants VALUES ('c6034552-92b6-4eec-b722-279d97aac6a8', 'FORNO7', '0ecde97e-13be-44dd-9c1f-8b8a2230798a', 'L', NULL, NULL, 5200, NULL, 'margherita-L');
INSERT INTO public.kb_variants VALUES ('7e7a3c72-7cc9-4b70-8946-8c6f3eb2107b', 'FORNO7', 'a993187d-a04b-456e-946e-c15346bddb50', 'S', NULL, NULL, 2400, NULL, 'marinara-S');
INSERT INTO public.kb_variants VALUES ('9207057f-e622-498a-b382-803bfdc119fc', 'FORNO7', 'a993187d-a04b-456e-946e-c15346bddb50', 'M', NULL, NULL, 3200, NULL, 'marinara-M');
INSERT INTO public.kb_variants VALUES ('b7162c09-8adc-468a-9a27-2bcb4706427f', 'FORNO7', 'a993187d-a04b-456e-946e-c15346bddb50', 'L', NULL, NULL, 4400, NULL, 'marinara-L');
INSERT INTO public.kb_variants VALUES ('217ccb06-c257-45a4-98af-40f71dc93372', 'FORNO7', '7081646d-9939-4360-9e2c-a41525702fee', 'S', NULL, NULL, 3400, NULL, 'diavola-S');
INSERT INTO public.kb_variants VALUES ('2e718394-665d-4319-8b44-9096c684766a', 'FORNO7', '7081646d-9939-4360-9e2c-a41525702fee', 'M', NULL, NULL, 4600, NULL, 'diavola-M');
INSERT INTO public.kb_variants VALUES ('61bbff24-8dfe-4aec-8ca8-5ff4adf9ecbb', 'FORNO7', '7081646d-9939-4360-9e2c-a41525702fee', 'L', NULL, NULL, 6200, NULL, 'diavola-L');
INSERT INTO public.kb_variants VALUES ('344b9bec-363f-473b-a448-bdd1d0baaf66', 'FORNO7', 'e7791c21-b9db-43b1-80b6-d800969847aa', 'S', NULL, NULL, 3600, NULL, 'quattro-formaggi-S');
INSERT INTO public.kb_variants VALUES ('ac7d15d7-1804-48f7-b812-0fb122d365f1', 'FORNO7', 'e7791c21-b9db-43b1-80b6-d800969847aa', 'M', NULL, NULL, 4900, NULL, 'quattro-formaggi-M');
INSERT INTO public.kb_variants VALUES ('51eb6ccd-59a8-4103-a739-32a9da8ba6e5', 'FORNO7', 'e7791c21-b9db-43b1-80b6-d800969847aa', 'L', NULL, NULL, 6600, NULL, 'quattro-formaggi-L');
INSERT INTO public.kb_variants VALUES ('687d23ba-752c-425f-9b15-fab8141b5bb3', 'FORNO7', 'd139363f-ed03-4a6a-8b82-6831d5f22190', 'S', NULL, NULL, 4200, NULL, 'funghi-tartufo-S');
INSERT INTO public.kb_variants VALUES ('c9d5e518-761a-43a0-ab89-6e084a450941', 'FORNO7', 'd139363f-ed03-4a6a-8b82-6831d5f22190', 'M', NULL, NULL, 5800, NULL, 'funghi-tartufo-M');
INSERT INTO public.kb_variants VALUES ('5e8bafcb-61e9-4822-8d81-d0cd87905e39', 'FORNO7', 'd139363f-ed03-4a6a-8b82-6831d5f22190', 'L', NULL, NULL, 7600, NULL, 'funghi-tartufo-L');
INSERT INTO public.kb_variants VALUES ('e17f8c94-0068-44ab-a0d5-3c3acc87b471', 'FORNO7', '217743da-2542-43d0-9b19-e6740ce54dfb', 'S', NULL, NULL, 3600, NULL, 'capricciosa-S');
INSERT INTO public.kb_variants VALUES ('b7ffe13e-4e89-40b3-9556-989fff2195d6', 'FORNO7', '217743da-2542-43d0-9b19-e6740ce54dfb', 'M', NULL, NULL, 4800, NULL, 'capricciosa-M');
INSERT INTO public.kb_variants VALUES ('d08c6f98-25c4-4958-a301-1d14b530b3b6', 'FORNO7', '217743da-2542-43d0-9b19-e6740ce54dfb', 'L', NULL, NULL, 6400, NULL, 'capricciosa-L');
INSERT INTO public.kb_variants VALUES ('2bb31549-b5d8-47b8-8dfa-c5ba6c544d1f', 'FORNO7', '59ddc3a4-a083-470b-bdf5-0d219a3537fb', 'S', NULL, NULL, 3400, NULL, 'pollo-pesto-S');
INSERT INTO public.kb_variants VALUES ('9a23394f-a845-4d05-bc1f-acb8b267b281', 'FORNO7', '59ddc3a4-a083-470b-bdf5-0d219a3537fb', 'M', NULL, NULL, 4600, NULL, 'pollo-pesto-M');
INSERT INTO public.kb_variants VALUES ('471c9f4d-bb7b-4433-b3cc-d9fd12e3ea6c', 'FORNO7', '59ddc3a4-a083-470b-bdf5-0d219a3537fb', 'L', NULL, NULL, 6200, NULL, 'pollo-pesto-L');
INSERT INTO public.kb_variants VALUES ('39d5f020-efd3-4721-90cd-bcedab950ca8', 'FORNO7', '7e18875a-b3f3-4e15-b387-ed49e4279d20', 'S', NULL, NULL, 3200, NULL, 'ortolana-S');
INSERT INTO public.kb_variants VALUES ('8837241a-5f38-46fd-baa3-9b6097fb3ef3', 'FORNO7', '7e18875a-b3f3-4e15-b387-ed49e4279d20', 'M', NULL, NULL, 4400, NULL, 'ortolana-M');
INSERT INTO public.kb_variants VALUES ('2bb1247a-5b9b-4bb6-8a61-f38082225020', 'FORNO7', '7e18875a-b3f3-4e15-b387-ed49e4279d20', 'L', NULL, NULL, 5800, NULL, 'ortolana-L');
INSERT INTO public.kb_variants VALUES ('68ecb367-10e8-4c67-8aa5-2b5e540720f6', 'FORNO7', 'eb81587e-54a9-4032-9087-8bbaea5dc684', 'S', NULL, NULL, 3800, NULL, 'salsiccia-S');
INSERT INTO public.kb_variants VALUES ('9e420bf8-4b78-4dcc-ba1c-73e880174d3a', 'FORNO7', 'eb81587e-54a9-4032-9087-8bbaea5dc684', 'M', NULL, NULL, 5200, NULL, 'salsiccia-M');
INSERT INTO public.kb_variants VALUES ('54e786e7-2633-4809-90aa-593d38b6143f', 'FORNO7', 'eb81587e-54a9-4032-9087-8bbaea5dc684', 'L', NULL, NULL, 7000, NULL, 'salsiccia-L');
INSERT INTO public.kb_variants VALUES ('58223f40-d3b6-4c3a-a550-d94600fb904e', 'FORNO7', '6e5dfbb3-8b22-4b5f-8e56-f5076c33c09c', 'S', NULL, NULL, 3200, NULL, 'bianca-limone-S');
INSERT INTO public.kb_variants VALUES ('488c091f-449e-4387-ab8f-3349bd92f136', 'FORNO7', '6e5dfbb3-8b22-4b5f-8e56-f5076c33c09c', 'M', NULL, NULL, 4400, NULL, 'bianca-limone-M');
INSERT INTO public.kb_variants VALUES ('5a47c096-065c-4214-bbe1-07ebf03d576d', 'FORNO7', '6e5dfbb3-8b22-4b5f-8e56-f5076c33c09c', 'L', NULL, NULL, 5800, NULL, 'bianca-limone-L');
INSERT INTO public.kb_variants VALUES ('c0384682-9ed1-4626-90df-6bc14270ea09', 'FORNO7', 'f775fd35-32fa-49eb-a86b-9956e808b10e', 'S', NULL, NULL, 4200, NULL, 'gamberi-S');
INSERT INTO public.kb_variants VALUES ('194d57c1-5631-4e8e-a083-3f887d834ba0', 'FORNO7', 'f775fd35-32fa-49eb-a86b-9956e808b10e', 'M', NULL, NULL, 5600, NULL, 'gamberi-M');
INSERT INTO public.kb_variants VALUES ('c0b3135f-6362-4bdd-8c14-ae494f21a046', 'FORNO7', 'f775fd35-32fa-49eb-a86b-9956e808b10e', 'L', NULL, NULL, 7400, NULL, 'gamberi-L');
INSERT INTO public.kb_variants VALUES ('a8d8f6ae-830b-4c45-a403-db5f2b4a216f', 'FORNO7', 'b6898756-d378-4846-8955-a3fe81234819', 'S', NULL, NULL, 3600, NULL, 'vodka-rosa-S');
INSERT INTO public.kb_variants VALUES ('aa84a6fa-e0b1-497b-abf4-3452d73c5d9b', 'FORNO7', 'b6898756-d378-4846-8955-a3fe81234819', 'M', NULL, NULL, 4900, NULL, 'vodka-rosa-M');
INSERT INTO public.kb_variants VALUES ('3848c2e0-69f1-4d77-b92e-1ccfd7560c92', 'FORNO7', 'b6898756-d378-4846-8955-a3fe81234819', 'L', NULL, NULL, 6600, NULL, 'vodka-rosa-L');
INSERT INTO public.kb_variants VALUES ('33adbef1-a26d-446e-8be6-57bbcd5ffe44', 'FORNO7', 'ed7810f0-bf5b-4bf4-88d5-7fac6c75c9bc', 'S', NULL, NULL, 3800, NULL, 'rendang-rossa-S');
INSERT INTO public.kb_variants VALUES ('e7d8a8dd-68ec-45db-8720-375fdbffd628', 'FORNO7', 'ed7810f0-bf5b-4bf4-88d5-7fac6c75c9bc', 'M', NULL, NULL, 5200, NULL, 'rendang-rossa-M');
INSERT INTO public.kb_variants VALUES ('9d648270-3383-46e7-9e6e-d097b1d8fcf7', 'FORNO7', 'ed7810f0-bf5b-4bf4-88d5-7fac6c75c9bc', 'L', NULL, NULL, 7000, NULL, 'rendang-rossa-L');
INSERT INTO public.kb_variants VALUES ('8180cd6b-6c9b-47ae-8262-dc852fd21b4b', 'FORNO7', '5cec56db-f05b-4c75-af77-e248f9873072', 'S', NULL, NULL, 4000, NULL, 'agnello-piccante-S');
INSERT INTO public.kb_variants VALUES ('bf6aa26b-ef0a-41d0-a1b5-7f4c83b9c17e', 'FORNO7', '5cec56db-f05b-4c75-af77-e248f9873072', 'M', NULL, NULL, 5400, NULL, 'agnello-piccante-M');
INSERT INTO public.kb_variants VALUES ('915898c4-8b35-494d-88b5-408bbc69c29c', 'FORNO7', '5cec56db-f05b-4c75-af77-e248f9873072', 'L', NULL, NULL, 7200, NULL, 'agnello-piccante-L');
INSERT INTO public.kb_variants VALUES ('810331ca-05d0-46b1-ac87-04ec84304b10', 'FORNO7', '6ae131c6-211c-491d-88bf-9855fab9d1eb', NULL, NULL, NULL, 1400, NULL, 'garlic-knots');
INSERT INTO public.kb_variants VALUES ('4ac1174e-7dc9-4003-a66f-0ffe12b4994f', 'FORNO7', '63a4c7da-0ca4-4366-8d52-fa4798f40750', NULL, NULL, NULL, 3200, NULL, 'burrata-salad');
INSERT INTO public.kb_variants VALUES ('3249e9db-0ff0-4d09-b5af-0276bd1ed792', 'FORNO7', '011d9368-ae08-4ed2-9715-e1ba00113083', NULL, NULL, NULL, 2200, NULL, 'rocket-salad');
INSERT INTO public.kb_variants VALUES ('95b27d20-73fa-48e7-8cbd-fd831b2493b6', 'FORNO7', '005c23b3-20cd-4f34-88b7-d0b9488047dd', NULL, NULL, NULL, 1800, NULL, 'tiramisu');
INSERT INTO public.kb_variants VALUES ('df36f4de-200f-4bc9-936c-91f1af6479dd', 'FORNO7', 'b6333de5-cdf5-408d-84a5-8bba0d9e4e09', NULL, NULL, NULL, 2400, NULL, 'nutella-calzone');
INSERT INTO public.kb_variants VALUES ('755ff44a-f481-455b-a598-5a5d24f6e8d6', 'FORNO7', 'cc06999a-3f97-4db0-a4d2-f8fe7f405c6a', NULL, NULL, NULL, 1200, NULL, 'house-lemonade');
INSERT INTO public.kb_variants VALUES ('6362206e-46e9-4e43-b0a8-8de4de3ec961', 'FORNO7', 'c1cf09e4-0078-4751-8cbd-c38c23710f9d', NULL, NULL, NULL, 1100, NULL, 'italian-soda');
INSERT INTO public.kb_variants VALUES ('32416245-264f-4265-82c0-01f3642f7e5f', 'FORNO7', '31cc6bda-fcc1-4c4b-b39b-6ce739308b53', NULL, NULL, NULL, 2600, NULL, 'peroni');
INSERT INTO public.kb_variants VALUES ('05920ab2-932f-4369-b5c3-efcfa3c15fcf', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'S', 'Charcoal', NULL, 6900, 4, 'apron-charcoal-S');
INSERT INTO public.kb_variants VALUES ('42a83f04-51a6-47ea-b783-4246c11243c7', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'M', 'Charcoal', NULL, 6900, 9, 'apron-charcoal-M');
INSERT INTO public.kb_variants VALUES ('7e82ae4f-35fe-4355-9dc7-39db11c72ce5', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'L', 'Charcoal', NULL, 6900, 7, 'apron-charcoal-L');
INSERT INTO public.kb_variants VALUES ('ea5167c3-fc88-4437-a31d-d7380b64e8cd', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'XL', 'Charcoal', NULL, 6900, 3, 'apron-charcoal-XL');
INSERT INTO public.kb_variants VALUES ('414efb8d-d9a7-45ab-b3d1-952b8c21903f', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'S', 'Brick Red', NULL, 6900, 2, 'apron-brickred-S');
INSERT INTO public.kb_variants VALUES ('389e490e-4b0c-49af-b43a-a1815db14340', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'M', 'Brick Red', NULL, 6900, 6, 'apron-brickred-M');
INSERT INTO public.kb_variants VALUES ('704ffabd-54f5-40c9-a164-95967822cdcd', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'L', 'Brick Red', NULL, 6900, 5, 'apron-brickred-L');
INSERT INTO public.kb_variants VALUES ('3338fd07-b709-4b8a-bba2-64ff1ed0c4a6', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'XL', 'Brick Red', NULL, 6900, 1, 'apron-brickred-XL');
INSERT INTO public.kb_variants VALUES ('debe4caf-81c0-4183-81d8-b5ee9e299c76', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'S', 'Cream', NULL, 6900, 0, 'apron-cream-S');
INSERT INTO public.kb_variants VALUES ('6d32e887-383d-4831-87a0-8470a998748b', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'M', 'Cream', NULL, 6900, 3, 'apron-cream-M');
INSERT INTO public.kb_variants VALUES ('45b449da-7cd4-46b3-a917-ccca722889cf', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'L', 'Cream', NULL, 6900, 4, 'apron-cream-L');
INSERT INTO public.kb_variants VALUES ('d4c92b69-a71f-4cba-aead-733465e8ed8a', 'FORNO7', '0dc3560c-3660-4364-a753-f18cf5849ee0', 'XL', 'Cream', NULL, 6900, 2, 'apron-cream-XL');
INSERT INTO public.kb_variants VALUES ('32b6ac3d-a6a9-46b3-ba3c-6b65d9b40fff', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'S', 'Charcoal', NULL, 5900, 6, 'tshirt-charcoal-S');
INSERT INTO public.kb_variants VALUES ('522ec182-54a8-471e-b03b-d41f278ee24a', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'M', 'Charcoal', NULL, 5900, 12, 'tshirt-charcoal-M');
INSERT INTO public.kb_variants VALUES ('ba0d25c8-ccbf-4015-b9de-88d4f282662c', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'L', 'Charcoal', NULL, 5900, 10, 'tshirt-charcoal-L');
INSERT INTO public.kb_variants VALUES ('90f7e85d-7251-41e8-9568-1b4aebccd7d0', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'XL', 'Charcoal', NULL, 5900, 4, 'tshirt-charcoal-XL');
INSERT INTO public.kb_variants VALUES ('48c08463-346b-436d-8681-2365d2e9c54a', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'S', 'Brick Red', NULL, 5900, 3, 'tshirt-brickred-S');
INSERT INTO public.kb_variants VALUES ('7145765b-4550-4421-ae04-c8f5e9b70b08', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'M', 'Brick Red', NULL, 5900, 8, 'tshirt-brickred-M');
INSERT INTO public.kb_variants VALUES ('afc626e1-0381-4a89-8961-dd3307ed0e4e', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'L', 'Brick Red', NULL, 5900, 6, 'tshirt-brickred-L');
INSERT INTO public.kb_variants VALUES ('18006396-0914-498e-8fb7-c66a78c1bb55', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'XL', 'Brick Red', NULL, 5900, 0, 'tshirt-brickred-XL');
INSERT INTO public.kb_variants VALUES ('470bf35e-0b9c-48e9-b6d2-191274ca14d5', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'S', 'Cream', NULL, 5900, 5, 'tshirt-cream-S');
INSERT INTO public.kb_variants VALUES ('3226e0d4-103b-41e4-9f58-77163054efdb', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'M', 'Cream', NULL, 5900, 7, 'tshirt-cream-M');
INSERT INTO public.kb_variants VALUES ('c2f25068-9805-46bd-9597-8e6ee24bb867', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'L', 'Cream', NULL, 5900, 2, 'tshirt-cream-L');
INSERT INTO public.kb_variants VALUES ('392ff1af-e1e3-4609-8e2b-398d6e45767d', 'FORNO7', '06262ca8-8d73-47b1-af20-f1b06d4afb81', 'XL', 'Cream', NULL, 5900, 1, 'tshirt-cream-XL');
INSERT INTO public.kb_variants VALUES ('b72bcda5-1f4d-44b7-bc35-e61f34549822', 'KASIH1', '9a9ed99a-ea78-4057-9313-d3c189b21e40', NULL, NULL, 'Short hair', 8500, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('7873cfe9-7ab5-48a4-beb1-7160fc163a82', 'KASIH1', '9a9ed99a-ea78-4057-9313-d3c189b21e40', NULL, NULL, 'Medium hair', 9500, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('f88177cd-f010-4965-b728-de689671e964', 'KASIH1', '9a9ed99a-ea78-4057-9313-d3c189b21e40', NULL, NULL, 'Long hair', 11000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('b279abfb-7efb-493d-9bea-c7819bfa664b', 'KASIH1', '136aba06-a28a-4798-b4c1-b3829b5fa285', NULL, NULL, 'Standard', 4500, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('8a3c3db8-8b9e-49c8-99d6-97e293916784', 'KASIH1', '0ebf289b-bc1f-4c2a-8038-5c1965149556', NULL, NULL, 'Standard', 3000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('4c80ab8c-b77b-40d8-9a35-d0a9df0d4213', 'KASIH1', '867e55c9-3152-490c-8374-6b643b5168a7', NULL, NULL, 'Short hair', 18000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('c7b12276-d6ca-4d6f-9b1f-77b1054b5a32', 'KASIH1', '867e55c9-3152-490c-8374-6b643b5168a7', NULL, NULL, 'Medium hair', 22000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('3f1db1fe-00dc-4480-b566-85e3d0cf37aa', 'KASIH1', '867e55c9-3152-490c-8374-6b643b5168a7', NULL, NULL, 'Long hair', 26000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('92dab22f-94f7-477c-a487-d5a13bc1f866', 'KASIH1', 'b24f2123-6ecd-47f3-a584-324047188e91', NULL, NULL, 'Standard', 14000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('dc144520-4136-4ffd-ac51-7dd8c0105c58', 'KASIH1', '59b6fa6f-433a-45e1-9326-536d22bde0e7', NULL, NULL, 'Medium hair', 38000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('a721b365-62ce-40c1-964e-e06dd1cadfad', 'KASIH1', '59b6fa6f-433a-45e1-9326-536d22bde0e7', NULL, NULL, 'Long hair', 45000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('027bf1ec-dc1e-447e-9c96-5d8952d86d23', 'KASIH1', 'a3791abf-4c21-4adb-a031-86dd48a6385e', NULL, NULL, 'Medium hair', 35000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('51f42347-49b4-4b56-ace3-b975369011f9', 'KASIH1', 'a3791abf-4c21-4adb-a031-86dd48a6385e', NULL, NULL, 'Long hair', 42000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('b7981842-a5f1-40f9-ab23-2611b5ba11fd', 'KASIH1', '04d8c292-41e8-41d1-9222-3ff5aa12c4d7', NULL, NULL, 'Standard', 9000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('c9de89e8-c679-4c7e-9dc4-8ff30f220ce2', 'KASIH1', '7ba6430f-8cdc-4f1d-99cd-624dfd33e003', NULL, NULL, 'Short hair', 5000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('05c4b197-2fda-4f0e-8acf-5e5c7974ea94', 'KASIH1', '7ba6430f-8cdc-4f1d-99cd-624dfd33e003', NULL, NULL, 'Long hair', 7000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('bfc70057-bbfc-4e20-a158-0cdf521fde54', 'KASIH1', '8f19c529-507c-49ff-b8e1-544767dfecc8', NULL, NULL, 'Standard', 15000, NULL, NULL);
INSERT INTO public.kb_variants VALUES ('ab9117fc-f2a9-462d-b7cc-6e653d140e41', 'KASIH1', '53b37d98-103c-4ede-9691-609a56a7a975', NULL, NULL, NULL, 7800, 12, NULL);
INSERT INTO public.kb_variants VALUES ('80877fcd-7692-491a-ad4f-ec6c1253b53d', 'KASIH1', 'ea27fc25-3b2a-46c8-a353-98929e8a7683', NULL, NULL, NULL, 9600, 4, NULL);
INSERT INTO public.kb_variants VALUES ('efd07528-12e7-460c-a228-4763cbd71e14', 'KASIH1', '039bdc48-78d2-4f71-b7fe-2f90dd9ec84d', NULL, NULL, NULL, 6500, 0, NULL);


--
-- Data for Name: threads; Type: TABLE DATA; Schema: public; Owner: jawab
--

INSERT INTO public.threads VALUES ('5276dd22-b944-4558-9441-1c45d30c5528', 'FORNO7', 'telegram', 'demo-8a4dcf', '64ba803c-227d-4406-a87c-a8f4e2f5cf0a', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 21:20:02.847+08', '2026-10-14 21:20:00+08', 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '2026-10-14 21:20:00+08');
INSERT INTO public.threads VALUES ('3dbc9095-1747-44ad-b3cf-dfae5225132f', 'FORNO7', 'telegram', 'demo-cyi4yl', '304e1549-cbae-4fdd-b8f4-d1a1fecffe13', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 09:26:02.472+08', '2026-10-14 09:26:00+08', 'Sorry, the Funghi e Tartufo is sold out today. Our truffle delivery is late, it''s back tomorrow. The Quattro Formaggi is the closest rich, cheesy pick.', '2026-10-14 09:26:00+08');
INSERT INTO public.threads VALUES ('5eb9ca6c-27aa-49cc-bf87-991bff2f9ab5', 'FORNO7', 'telegram', 'demo-97dv4z', '4f5fee3c-78b6-4b16-8b73-740cd1536fc5', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 13:28:02.632+08', '2026-10-14 13:28:00+08', 'Our dark tee is Charcoal and size M is in stock, RM 59. Want me to hold one at the counter?', '2026-10-14 13:28:00+08');
INSERT INTO public.threads VALUES ('32c0df05-aaf2-4518-bc1c-99933ae9b4eb', 'FORNO7', 'telegram', 'demo-4uftsl', 'e5613bd6-5be4-4b82-a088-fe3968b40858', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 21:01:01.379+08', '2026-10-14 21:01:00+08', 'No dress code at all.', '2026-10-14 21:01:00+08');
INSERT INTO public.threads VALUES ('d1425935-6a3d-41be-b677-022c09128da7', 'FORNO7', 'telegram', 'demo-2yxxrz', 'aafece14-913e-4082-b233-22bc92f8014a', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 19:04:02.448+08', '2026-10-14 19:04:00+08', 'Let me check with the team and get back to you.', '2026-10-14 19:04:00+08');
INSERT INTO public.threads VALUES ('5a7d9818-016a-425b-8be6-56c6c1c6fc1e', 'FORNO7', 'whatsapp', 'demo-c29vfq', '4e443ce7-092c-4cbd-837f-68b4f8c0042a', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 17:05:01.908+08', '2026-10-14 17:05:00+08', 'We have free Wi-Fi; staff will share the password at your table.', '2026-10-14 17:05:00+08');
INSERT INTO public.threads VALUES ('4e4dccae-5815-43c5-a42a-8a093abf5ae5', 'FORNO7', 'telegram', 'demo-bit5rc', 'cab2ca6c-1fa1-4ac2-94f4-2a604f243bcc', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 15:02:01.951+08', '2026-10-14 15:02:00+08', 'Yes, on Medium and Large, priced at the more expensive half.', '2026-10-14 15:02:00+08');
INSERT INTO public.threads VALUES ('f3417c0f-c457-4541-b6c6-b12701de59cd', 'FORNO7', 'telegram', 'demo-bkkt7h', 'a846fd1a-5305-4247-90cf-f9a8b9ca341a', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 10:49:01.735+08', '2026-10-14 10:49:00+08', 'I''ll check with the team and let you know here.', '2026-10-14 10:49:00+08');
INSERT INTO public.threads VALUES ('66fff1a1-9c48-417c-8112-dcd7bfc382e6', 'FORNO7', 'whatsapp', 'demo-2687c2', '3cd9ef59-2354-43f6-8ec1-62e1cf3342f0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 21:24:03.272+08', '2026-10-14 21:24:00+08', 'Of course, bring your own cake. There''s no cake-cutting fee.', '2026-10-14 21:24:00+08');
INSERT INTO public.threads VALUES ('052ec39c-69c5-4885-acca-da5845b21ffb', 'FORNO7', 'whatsapp', 'demo-31k9ec', 'db598671-fad0-4481-bd54-75e340e3f080', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 21:42:01.313+08', '2026-10-14 21:42:00+08', 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '2026-10-14 21:42:00+08');
INSERT INTO public.threads VALUES ('d8477a19-dec5-42c7-9770-cecaedbee2fe', 'FORNO7', 'simulator', 'demo-gckd2k', 'bd94e42a-919b-414d-9023-80e219d6d5c8', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 09:24:01.593+08', '2026-10-14 09:24:00+08', 'Dogs are welcome on our terrace and we''ll bring a water bowl.', '2026-10-14 09:24:00+08');
INSERT INTO public.threads VALUES ('a2386fda-f389-4a72-96f9-6c7a26a84461', 'FORNO7', 'telegram', 'demo-et8pbr', '3cec144b-bfa8-4392-bd2d-e8f124f47edf', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 14:51:01.985+08', '2026-10-14 14:51:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-14 14:51:00+08');
INSERT INTO public.threads VALUES ('1e3b40f7-4b3b-4ab9-83de-91697fbff130', 'FORNO7', 'whatsapp', 'demo-2sss9d', 'a329220d-2773-4e8d-8b84-14de824f44f0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 13:10:02.867+08', '2026-10-14 13:10:00+08', 'Of course, bring your own cake. There''s no cake-cutting fee.', '2026-10-14 13:10:00+08');
INSERT INTO public.threads VALUES ('97f62b35-5935-4830-989a-1606982fb07f', 'FORNO7', 'telegram', 'demo-f3cs8e', '5bcc2db1-8e72-4b75-8892-5947ef61ceb3', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 11:54:03.148+08', '2026-10-14 11:54:00+08', 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '2026-10-14 11:54:00+08');
INSERT INTO public.threads VALUES ('83fc99be-338b-4857-8ce1-413271e7e126', 'FORNO7', 'telegram', 'demo-dctidu', '9ccb2bb0-47b8-4af7-a0d4-3d9b9c84987e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 21:31:01.7+08', '2026-10-14 21:31:00+08', 'Our dark tee is Charcoal and size M is in stock, RM 59. Want me to hold one at the counter?', '2026-10-14 21:31:00+08');
INSERT INTO public.threads VALUES ('aa4521a8-b095-40fa-a3b9-651fa49695d9', 'FORNO7', 'telegram', 'demo-2ssprb', '0d501b19-c133-4982-9274-e3487be9484d', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 20:48:02.415+08', '2026-10-14 20:48:00+08', 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '2026-10-14 20:48:00+08');
INSERT INTO public.threads VALUES ('d606ae58-c59a-444d-ae50-b3dd7a996e24', 'FORNO7', 'telegram', 'demo-eiyqh3', 'cd576b93-3aca-48ad-9101-9b4e63a633ea', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 20:56:02.834+08', '2026-10-14 20:56:00+08', 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '2026-10-14 20:56:00+08');
INSERT INTO public.threads VALUES ('0b6c29c5-aed2-493a-9ce2-4beab281cb69', 'FORNO7', 'telegram', 'demo-aplj1a', '78742a2b-7881-47e3-93db-445f3f047808', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 11:07:02.943+08', '2026-10-14 11:07:00+08', 'Lunch set Tuesday to Friday, 12–3pm: Small pizza, side salad and a lemonade or Italian soda for RM 29.', '2026-10-14 11:07:00+08');
INSERT INTO public.threads VALUES ('6916f440-eb1c-44ee-97e3-b343b035fe59', 'FORNO7', 'telegram', 'demo-7ajtlg', '9fc89296-1b74-408b-b685-f9f72f934ef7', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 12:49:02.565+08', '2026-10-14 12:49:00+08', 'Bangsar Village II basement is a 2-minute walk, or street parking through the Flexi Parking app.', '2026-10-14 12:49:00+08');
INSERT INTO public.threads VALUES ('e049d90c-e345-401d-b888-1da5305c93d6', 'FORNO7', 'telegram', 'demo-712dff', '71646379-a9eb-4f82-b097-bc981e119318', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 16:14:01.996+08', '2026-10-14 16:14:00+08', 'Yes, Brick Red aprons are in stock in S, M and L (RM 69). XL has just one left.', '2026-10-14 16:14:00+08');
INSERT INTO public.threads VALUES ('0b24124f-5cc2-4297-8780-b9b3d3654992', 'FORNO7', 'telegram', 'demo-28orh', 'f58c81d1-081c-4b67-92ac-006475fad358', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 16:40:01.555+08', '2026-10-14 16:40:00+08', 'Sorry, smoking and vaping aren''t allowed anywhere at the restaurant, including the terrace.', '2026-10-14 16:40:00+08');
INSERT INTO public.threads VALUES ('e635688e-a7a6-49a7-bbd1-2a898e50917e', 'FORNO7', 'telegram', 'demo-3srh53', 'd50dae1f-c599-4317-88c6-fe97ee4a198b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 10:22:02.886+08', '2026-10-14 10:22:00+08', 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '2026-10-14 10:22:00+08');
INSERT INTO public.threads VALUES ('46b33bd0-97da-406a-b646-69721247f4a3', 'FORNO7', 'telegram', 'demo-5l50u5', '40b03e3c-ed8f-4185-a824-3b1d562d7dba', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 16:51:01.881+08', '2026-10-14 16:51:00+08', 'That made our day, thank you! Come back soon.', '2026-10-14 16:51:00+08');
INSERT INTO public.threads VALUES ('983b300f-96c7-498c-913f-0ac14d4e202c', 'FORNO7', 'telegram', 'demo-fgvq3s', 'c2f09aa8-a333-4069-8558-9518de0f2e5e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 22:19:02.843+08', '2026-10-14 22:19:00+08', 'Sorry, the Funghi e Tartufo is sold out today. Our truffle delivery is late, it''s back tomorrow. The Quattro Formaggi is the closest rich, cheesy pick.', '2026-10-14 22:19:00+08');
INSERT INTO public.threads VALUES ('6f4af4ab-adaf-45ae-923d-046df5d989b3', 'FORNO7', 'whatsapp', 'demo-fzpk2z', '8e35d37f-6d6b-4d53-acb4-5c75e5b9e03a', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 16:41:03.562+08', '2026-10-14 16:41:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-14 16:41:00+08');
INSERT INTO public.threads VALUES ('f1d93280-f94d-4418-a8e4-573248152832', 'FORNO7', 'telegram', 'demo-afjhuy', 'ed39c690-bdb5-45f5-a0f0-c178fbe9e673', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 13:00:03.05+08', '2026-10-14 13:00:00+08', 'I''ll check with the team and let you know here.', '2026-10-14 13:00:00+08');
INSERT INTO public.threads VALUES ('8e29d1c6-64e2-471b-8374-20908730161c', 'FORNO7', 'telegram', 'demo-b610ym', '03ccb318-319a-47f1-9133-64a1fe21ea34', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 15:35:02.21+08', '2026-10-14 15:35:00+08', 'Yes. Corkage is RM 40 per bottle, maximum 2 bottles per table.', '2026-10-14 15:35:00+08');
INSERT INTO public.threads VALUES ('36835bb7-2ac2-480c-8483-726e2c0cec3a', 'FORNO7', 'telegram', 'demo-dp2pfr', '76a20fd7-07ba-4e28-8104-24c4581a8ea4', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 11:20:03.21+08', '2026-10-14 11:20:00+08', 'Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.', '2026-10-14 11:20:00+08');
INSERT INTO public.threads VALUES ('f4716ec2-df86-4272-b130-bef0c83a14bf', 'FORNO7', 'whatsapp', 'demo-eorxs6', 'b9bb1943-b43d-48bc-b7ab-5a9157b51144', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 12:46:02.028+08', '2026-10-14 12:46:00+08', 'Sorry, I can only help with Forno Sette''s menu, bookings and orders.', '2026-10-14 12:46:00+08');
INSERT INTO public.threads VALUES ('9a1afaa5-a8d8-4a56-be16-6c261739fd75', 'FORNO7', 'whatsapp', 'demo-82lrhy', 'e52b4abe-4040-4be8-bc4f-295d05cad5fa', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 12:54:02.62+08', '2026-10-14 12:54:00+08', 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '2026-10-14 12:54:00+08');
INSERT INTO public.threads VALUES ('58a3601d-783b-4f7d-ad37-632e8c4fe992', 'FORNO7', 'telegram', 'demo-3sw653', '91ccb105-b5e9-402d-90cb-648feaf8adca', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 09:49:03.576+08', '2026-10-14 09:49:00+08', 'We''re closed on Mondays. Tuesday to Sunday we''re open from midday (11am on Sundays).', '2026-10-14 09:49:00+08');
INSERT INTO public.threads VALUES ('b8a833b1-17f3-46ad-aff1-b6335682c6ba', 'FORNO7', 'telegram', 'demo-cznnle', '698a33b0-3509-4d3f-8549-18d5e829deaf', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 19:17:02.412+08', '2026-10-14 19:17:00+08', 'Large Margherita (15") is RM 52. Medium RM 38, Small RM 28.', '2026-10-14 19:17:00+08');
INSERT INTO public.threads VALUES ('0e84efee-fc1e-4977-b33d-d0abc72b269f', 'FORNO7', 'simulator', 'demo-2emj5p', '4fe882cb-6567-4ee4-8529-a1662fedfc67', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 20:05:02.525+08', '2026-10-14 20:05:00+08', 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '2026-10-14 20:05:00+08');
INSERT INTO public.threads VALUES ('9dfed34b-00c3-4310-91c0-89018ad92474', 'FORNO7', 'whatsapp', 'demo-f8ydqc', 'f02adeb5-aff2-401b-9b3a-2c0cf83b183a', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 18:14:02.452+08', '2026-10-14 18:14:00+08', 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '2026-10-14 18:14:00+08');
INSERT INTO public.threads VALUES ('4c53f247-9855-46ea-8d51-045e82ae6ddd', 'FORNO7', 'whatsapp', 'demo-45gk9c', 'bb8ae0ee-f466-4171-8d2b-496f140d8d62', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 09:39:03.27+08', '2026-10-14 09:39:00+08', 'Of course, bring your own cake. There''s no cake-cutting fee.', '2026-10-14 09:39:00+08');
INSERT INTO public.threads VALUES ('bfaacc5b-c927-491b-80f6-c5af5c12f6d2', 'FORNO7', 'telegram', 'demo-3i0nfx', 'a6e01eed-a607-4ca0-beaa-2a7f6c0265bd', 'resolved', false, NULL, '{}', NULL, true, '2026-10-14 20:56:02.331+08', '2026-10-14 20:56:00+08', 'Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.', '2026-10-14 20:56:00+08');
INSERT INTO public.threads VALUES ('66584375-ad0f-4ae9-9413-ee2789a4209d', 'FORNO7', 'telegram', 'demo-8kgtfw', 'd39eb77c-b900-48dc-a38e-32ac4d3e3316', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 22:42:03.029+08', '2026-10-15 22:42:00+08', 'Thanks for your interest! I''ve passed this to our owner, who handles partnerships personally. They''ll reply here soon.', '2026-10-15 22:42:00+08');
INSERT INTO public.threads VALUES ('da0ee50b-5ac9-40bd-ae70-168d49664285', 'FORNO7', 'telegram', 'demo-8c1qs9', '7037bab0-86fd-4937-8778-364baf1163d6', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 21:03:01.298+08', '2026-10-15 21:03:00+08', 'Lunch set Tuesday to Friday, 12–3pm: Small pizza, side salad and a lemonade or Italian soda for RM 29.', '2026-10-15 21:03:00+08');
INSERT INTO public.threads VALUES ('8fc48d9c-3221-45bd-9d08-1f73a43313e6', 'FORNO7', 'whatsapp', 'demo-7yrdnm', '4046004b-c24d-49dc-bce6-1cc929f4b25c', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 20:20:02.429+08', '2026-10-15 20:20:00+08', 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '2026-10-15 20:20:00+08');
INSERT INTO public.threads VALUES ('eee49df7-c147-44bc-8452-e7f61666f7a5', 'FORNO7', 'telegram', 'demo-c03tjv', 'da548507-486b-4e83-8dd6-6bc3b12ed829', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 09:03:03.434+08', '2026-10-15 09:03:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-15 09:03:00+08');
INSERT INTO public.threads VALUES ('9eb9e283-06da-4cc9-9927-ef3649d5d9d3', 'FORNO7', 'telegram', 'demo-208k7d', '0cec5a6a-7466-497f-9e2c-1791c10c0ee4', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 15:55:02.915+08', '2026-10-15 15:55:00+08', 'Yes, Brick Red aprons are in stock in S, M and L (RM 69). XL has just one left.', '2026-10-15 15:55:00+08');
INSERT INTO public.threads VALUES ('61cfab1f-b17a-4f50-89ed-c939d4b3c8ab', 'FORNO7', 'telegram', 'demo-b9zamj', '1f1184fb-81ae-4f8e-b22c-b34c6a0a26d0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 21:44:02.532+08', '2026-10-15 21:44:00+08', 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '2026-10-15 21:44:00+08');
INSERT INTO public.threads VALUES ('90000df6-a761-44bb-8e52-57b8be5ab965', 'FORNO7', 'simulator', 'demo-2mum7c', 'c4c3bb43-6425-4fca-a6c7-372d9dbc5da5', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 22:32:01.414+08', '2026-10-15 22:32:00+08', 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '2026-10-15 22:32:00+08');
INSERT INTO public.threads VALUES ('682304cd-288d-4366-889c-957769fa55cc', 'FORNO7', 'whatsapp', 'demo-aibeh4', '1fa1a088-3d72-4a6b-b905-3bb6d9c7ddd4', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 10:55:03.538+08', '2026-10-15 10:55:00+08', 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '2026-10-15 10:55:00+08');
INSERT INTO public.threads VALUES ('c153297b-223c-4091-a419-bceb329b39ed', 'FORNO7', 'whatsapp', 'demo-7pzgyv', 'adf294d7-8245-413a-90dc-ae6e37bb987c', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 21:15:02.115+08', '2026-10-15 21:15:00+08', 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '2026-10-15 21:15:00+08');
INSERT INTO public.threads VALUES ('361a7f72-61cb-4b06-bd10-e52d0ff3c140', 'FORNO7', 'whatsapp', 'demo-anhap4', 'fd4d1cb0-93a1-424d-8052-332c54d536dc', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 22:56:03.109+08', '2026-10-15 22:56:00+08', 'Yes, Touch ''n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.', '2026-10-15 22:56:00+08');
INSERT INTO public.threads VALUES ('cb52e3fa-a820-4824-9cc2-dd0fdb765c72', 'FORNO7', 'telegram', 'demo-bpo2nq', '5ed37c07-a3e8-462e-855b-f97a23a7d739', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 11:21:02.56+08', '2026-10-15 11:21:00+08', 'That made our day, thank you! Come back soon.', '2026-10-15 11:21:00+08');
INSERT INTO public.threads VALUES ('e3ecd880-841a-4f7a-94e9-74acc50eac30', 'FORNO7', 'telegram', 'demo-1esf', '10378edd-a4f3-4d58-a9d1-5f43db5e40a6', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 09:00:01.283+08', '2026-10-15 09:00:00+08', 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '2026-10-15 09:00:00+08');
INSERT INTO public.threads VALUES ('bad27a6f-b4f9-45bb-84fd-54c32c34b693', 'FORNO7', 'telegram', 'demo-ca4k7k', 'bd95e579-3c68-4f6d-90b2-665eb5745f6b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 14:40:02.766+08', '2026-10-15 14:40:00+08', 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '2026-10-15 14:40:00+08');
INSERT INTO public.threads VALUES ('7ec38460-46bb-4eaa-af89-e487eeed5a0a', 'FORNO7', 'telegram', 'demo-37v3ir', 'ced65af0-0119-4e93-aaa7-48f9677cd5ef', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 14:48:01.524+08', '2026-10-15 14:48:00+08', 'House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.', '2026-10-15 14:48:00+08');
INSERT INTO public.threads VALUES ('5bc21fce-e9be-4468-9b90-a331abad83af', 'FORNO7', 'telegram', 'demo-g6rzct', '76c3f01c-e6ed-45a1-8ecf-4c0cbddc29e0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 15:02:03.338+08', '2026-10-15 15:02:00+08', 'House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.', '2026-10-15 15:02:00+08');
INSERT INTO public.threads VALUES ('30a926ca-bc13-4e64-9a8f-e4d823440fd7', 'FORNO7', 'telegram', 'demo-8d4arg', '5f45a96c-ae58-4f75-b670-d7bfdbb1d58e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 12:15:03.542+08', '2026-10-15 12:15:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-15 12:15:00+08');
INSERT INTO public.threads VALUES ('7b6096eb-7331-411b-ac72-18e57a6a8016', 'FORNO7', 'telegram', 'demo-9fjw0x', 'c2910800-c3c5-4b0b-b6ab-f06f6f3e6692', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 16:08:03.359+08', '2026-10-15 16:08:00+08', 'Lunch set Tuesday to Friday, 12–3pm: Small pizza, side salad and a lemonade or Italian soda for RM 29.', '2026-10-15 16:08:00+08');
INSERT INTO public.threads VALUES ('67f376f7-8e0a-4e63-9f86-d2e4bdb47b04', 'FORNO7', 'telegram', 'demo-ax4g4h', '51dc1141-8129-4d4d-b4ec-e59febef941b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 15:12:02.701+08', '2026-10-15 15:12:00+08', 'Yes, 6 tables on the terrace. It''s non-smoking.', '2026-10-15 15:12:00+08');
INSERT INTO public.threads VALUES ('4e95d0fb-3895-4f5f-8eac-a4932d7b1672', 'FORNO7', 'telegram', 'demo-4ndh0n', 'a510f50f-2eca-42b9-8831-22e2b6e2f3ba', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 13:34:01.303+08', '2026-10-15 13:34:00+08', 'We''re closed on Mondays. Tuesday to Sunday we''re open from midday (11am on Sundays).', '2026-10-15 13:34:00+08');
INSERT INTO public.threads VALUES ('a1c6fee3-3ad2-4b8e-86c9-39612370b297', 'FORNO7', 'telegram', 'demo-a6pj6h', 'a2cfd7d9-abdf-4c6a-9eb2-82e4bcae1a30', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 12:54:02.322+08', '2026-10-15 12:54:00+08', 'We''re hiring pizza cooks. Send /apply to our Telegram bot to apply.', '2026-10-15 12:54:00+08');
INSERT INTO public.threads VALUES ('ca977b74-fc42-4f0c-bd60-917807132936', 'FORNO7', 'telegram', 'demo-axr0w3', 'a3bb95d0-56c5-41dd-8f01-622bd9ee7782', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 21:01:02.668+08', '2026-10-15 21:01:00+08', 'I''ll check with the team and let you know here.', '2026-10-15 21:01:00+08');
INSERT INTO public.threads VALUES ('1c92afa0-a967-4985-900a-bbc2e0b0cf6f', 'FORNO7', 'telegram', 'demo-1kk4d2', 'e0cec588-4f2a-44b1-9782-015107c93911', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 17:01:02.482+08', '2026-10-15 17:01:00+08', 'Yes, Touch ''n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.', '2026-10-15 17:01:00+08');
INSERT INTO public.threads VALUES ('e3d0979d-2b1b-48b5-b818-bf2f34432435', 'FORNO7', 'telegram', 'demo-2k0qmg', 'b1a5da68-6b37-4f33-8d52-a2be323195b8', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 22:57:01.316+08', '2026-10-15 22:57:00+08', 'Dogs are welcome on our terrace and we''ll bring a water bowl.', '2026-10-15 22:57:00+08');
INSERT INTO public.threads VALUES ('70e8fb23-8ba2-41a5-9a9a-dcef46748377', 'FORNO7', 'whatsapp', 'demo-5ri868', '2cece751-38c4-467e-aaaf-9fede762692e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 14:18:02.998+08', '2026-10-15 14:18:00+08', 'Thank you! The oven crew will be very happy to hear it.', '2026-10-15 14:18:00+08');
INSERT INTO public.threads VALUES ('40250b70-cb91-45fc-970f-553cdea3e242', 'FORNO7', 'telegram', 'demo-q08xe', '53b2c08c-0421-4461-999e-060ad5dfe521', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 20:49:03.005+08', '2026-10-15 20:49:00+08', 'It''s a 48-hour fermented dough with Italian 00 flour, not sourdough.', '2026-10-15 20:49:00+08');
INSERT INTO public.threads VALUES ('70dc2c82-fe10-46dc-afbd-647495d78f0b', 'FORNO7', 'simulator', 'demo-6wjrma', '34ac993d-da76-4539-9678-14e191f31e23', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 20:47:01.25+08', '2026-10-15 20:47:00+08', 'Dogs are welcome on our terrace and we''ll bring a water bowl.', '2026-10-15 20:47:00+08');
INSERT INTO public.threads VALUES ('d06c9dab-ce8c-4c2f-9276-6e3fb5e84f72', 'FORNO7', 'whatsapp', 'demo-223y32', '989777f6-4f36-4910-91b7-688efeede9aa', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 09:13:01.655+08', '2026-10-15 09:13:00+08', 'I''ll check with the team and let you know here.', '2026-10-15 09:13:00+08');
INSERT INTO public.threads VALUES ('f856c7b0-64df-4d90-abd5-0a676ad8a4c1', 'FORNO7', 'whatsapp', 'demo-ahze26', '56841408-d384-4c87-bd05-c3186043ede9', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 22:21:02.851+08', '2026-10-15 22:21:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-15 22:21:00+08');
INSERT INTO public.threads VALUES ('eb4fce92-2df2-4ae9-8e43-81675c885071', 'FORNO7', 'whatsapp', 'demo-5yiiwi', 'd130c1b8-5cf4-4f92-bbac-9ab6ab3ad998', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 22:20:01.877+08', '2026-10-15 22:20:00+08', 'I''ll check with the team and let you know here.', '2026-10-15 22:20:00+08');
INSERT INTO public.threads VALUES ('e47f1c44-86f7-4a27-8df9-e81f313ea995', 'FORNO7', 'whatsapp', 'demo-6wjusd', 'a486f0e2-b365-4c7b-bf16-0869189005a0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 09:53:03.139+08', '2026-10-15 09:53:00+08', 'Good question. I''ll check with the team and get back to you here shortly.', '2026-10-15 09:53:00+08');
INSERT INTO public.threads VALUES ('5a748e8c-4ec1-4d13-b534-e6b130eddeda', 'FORNO7', 'whatsapp', 'demo-6pb7bv', 'bb555e02-0da5-4eb3-9059-6e9c257d655d', 'resolved', false, NULL, '{}', NULL, true, '2026-10-15 17:29:02.044+08', '2026-10-15 17:29:00+08', 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '2026-10-15 17:29:00+08');
INSERT INTO public.threads VALUES ('46defe49-1ba8-4887-bcf4-1b81172d469b', 'FORNO7', 'telegram', 'demo-d6tdsk', 'b71f406d-9a2b-4eed-972a-9f82ca8e04a6', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 18:55:01.414+08', '2026-10-16 18:55:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-16 18:55:00+08');
INSERT INTO public.threads VALUES ('b30f36b6-843c-4d94-8e2d-39f722698ebb', 'FORNO7', 'whatsapp', 'demo-c8ejib', '8d85c686-53d5-4bfa-9e94-7708869119fa', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 17:16:02.798+08', '2026-10-16 17:16:00+08', 'Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.', '2026-10-16 17:16:00+08');
INSERT INTO public.threads VALUES ('7b2ee5f5-4135-4e8f-ae42-9a458a00044a', 'FORNO7', 'telegram', 'demo-5uyvrl', 'f5df32a4-d153-43d5-9985-6fa92e73d679', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 14:45:01.655+08', '2026-10-16 14:45:00+08', 'Send us your booking reference here. Cancellation is free up to 2 hours before.', '2026-10-16 14:45:00+08');
INSERT INTO public.threads VALUES ('476a12de-82b6-4d6a-aa5b-ac8f807afb95', 'FORNO7', 'telegram', 'demo-e534e0', '2e9dfa95-e63b-4cac-9e52-f0a5fc3df54b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 21:40:01.804+08', '2026-10-16 21:40:00+08', 'House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.', '2026-10-16 21:40:00+08');
INSERT INTO public.threads VALUES ('48bc0098-23de-4bc3-97c8-bdcd787c4693', 'FORNO7', 'telegram', 'demo-g0wg57', '2bb986c2-5b8f-43a6-b0dc-9d785452093e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 11:21:02.355+08', '2026-10-16 11:21:00+08', 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '2026-10-16 11:21:00+08');
INSERT INTO public.threads VALUES ('edb5df45-f72a-47fe-ac7e-1cd7cc48cf76', 'FORNO7', 'telegram', 'demo-cfyoie', '771ba0cc-8015-41c6-b81f-d8d7749dd8ee', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 14:06:03.338+08', '2026-10-16 14:06:00+08', 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '2026-10-16 14:06:00+08');
INSERT INTO public.threads VALUES ('4b06129d-a8db-42d8-bf60-a5e4bfb84abd', 'FORNO7', 'whatsapp', 'demo-8h32k0', '1b19ce4b-a804-43b4-8f9b-69815a2ba60f', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 21:29:03.39+08', '2026-10-16 21:29:00+08', 'Large Margherita (15") is RM 52. Medium RM 38, Small RM 28.', '2026-10-16 21:29:00+08');
INSERT INTO public.threads VALUES ('99cfe2f4-4153-4a70-b260-1b181865d83f', 'FORNO7', 'telegram', 'demo-dvkceq', '5db854af-74dd-4011-bc36-c234558c8341', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 19:03:02.141+08', '2026-10-16 19:03:00+08', 'Thanks for your interest! I''ve passed this to our owner, who handles partnerships personally. They''ll reply here soon.', '2026-10-16 19:03:00+08');
INSERT INTO public.threads VALUES ('c1d5992b-3b9a-4f85-85d4-f68afd498017', 'FORNO7', 'simulator', 'demo-9e0cju', '726132a9-1883-4439-8009-44b3d4751d05', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 09:37:02.475+08', '2026-10-16 09:37:00+08', 'Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.', '2026-10-16 09:37:00+08');
INSERT INTO public.threads VALUES ('90b1c236-2df4-48b1-87d2-3f2dc8324ce1', 'FORNO7', 'telegram', 'demo-3fjba2', 'a19b4f8d-1b50-41a5-8aba-7bcfdafc8b66', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 22:56:01.74+08', '2026-10-16 22:56:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-16 22:56:00+08');
INSERT INTO public.threads VALUES ('f5a61f05-2a2e-44c0-add9-2e55905ba25b', 'FORNO7', 'whatsapp', 'demo-838gcc', '9f85a09f-076b-4ee3-aca6-fb540458380c', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 17:04:02.341+08', '2026-10-16 17:04:00+08', 'The Pollo Pesto contains pine nuts, and our kitchen handles tree nuts, so cross-contact is possible. Our manager will talk you through it before you order.', '2026-10-16 17:04:00+08');
INSERT INTO public.threads VALUES ('442def73-c60e-49ea-bfd0-ee3f3d87d0dc', 'FORNO7', 'telegram', 'demo-1nd1p9', '3f8f5ce4-c71a-456e-b067-796601228a5e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 10:54:02.474+08', '2026-10-16 10:54:00+08', 'We have free Wi-Fi; staff will share the password at your table.', '2026-10-16 10:54:00+08');
INSERT INTO public.threads VALUES ('7b357a4c-f589-4c59-b69d-48fb46aaaa79', 'FORNO7', 'telegram', 'demo-99kzup', '72c62fd5-a2a5-4a5f-9eb6-62017adc16e6', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 20:05:02.462+08', '2026-10-16 20:05:00+08', '27 Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur, two minutes from Bangsar Village II.', '2026-10-16 20:05:00+08');
INSERT INTO public.threads VALUES ('10d46ec0-b5ab-471b-9c5b-1186b6731c2f', 'FORNO7', 'telegram', 'demo-3xb1p5', '904fdda9-d181-4af3-8655-aa7554f4b7b3', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 20:01:03.135+08', '2026-10-16 20:01:00+08', 'Yes, on Medium and Large, priced at the more expensive half.', '2026-10-16 20:01:00+08');
INSERT INTO public.threads VALUES ('5af0e60b-12d4-4b6c-bf95-2ba853bfb7a9', 'FORNO7', 'telegram', 'demo-f2wwgy', '72f94838-0677-41a1-b1ba-b6a6c8744f48', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 19:16:02.888+08', '2026-10-16 19:16:00+08', 'I''ll check with the team and let you know here.', '2026-10-16 19:16:00+08');
INSERT INTO public.threads VALUES ('68de1acc-0439-4ae4-9e47-856fcba847c4', 'FORNO7', 'simulator', 'demo-g64tly', 'c60f3e4a-0271-4c9a-a04d-41355092d777', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 12:53:01.782+08', '2026-10-16 12:53:00+08', 'I''ll check with the team and let you know here.', '2026-10-16 12:53:00+08');
INSERT INTO public.threads VALUES ('73cbb556-296e-484d-883d-b2199150245b', 'FORNO7', 'telegram', 'demo-3nqq8r', '9b594d44-6fd4-41dd-9454-352852a77ef0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 11:48:03.069+08', '2026-10-16 11:48:00+08', 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '2026-10-16 11:48:00+08');
INSERT INTO public.threads VALUES ('ff533a40-6c2e-4220-9a98-c5821084e98b', 'FORNO7', 'whatsapp', 'demo-4ap4jr', '92bb93b4-733c-49ef-bac0-a95013e1174b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 20:43:02.188+08', '2026-10-16 20:43:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-16 20:43:00+08');
INSERT INTO public.threads VALUES ('fc6a6b8b-c847-4d14-ae1d-f94811c1d25c', 'FORNO7', 'whatsapp', 'demo-3a091h', 'b503ee9f-427f-4402-8b99-7f3a83112515', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 21:42:02.419+08', '2026-10-16 21:42:00+08', 'Let me check with the team and get back to you.', '2026-10-16 21:42:00+08');
INSERT INTO public.threads VALUES ('645ab1fc-f799-4a44-bbc8-23912b72b7b7', 'FORNO7', 'whatsapp', 'demo-3b711h', 'af89d1c7-88e2-4f7a-ae4a-c0d301030461', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 14:24:01.383+08', '2026-10-16 14:24:00+08', 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '2026-10-16 14:24:00+08');
INSERT INTO public.threads VALUES ('fb0d9975-7433-4c2e-b2c2-5d7e63fa9874', 'FORNO7', 'telegram', 'demo-3s81ku', '18658bd2-9a00-4d6a-87db-a88b90517309', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 14:33:01.83+08', '2026-10-16 14:33:00+08', 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '2026-10-16 14:33:00+08');
INSERT INTO public.threads VALUES ('c201eada-7839-4da4-86e5-48182198868c', 'FORNO7', 'telegram', 'demo-1xjqqm', '04c1f045-e9cd-4cc5-95f8-b9fc550f5067', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 09:52:01.549+08', '2026-10-16 09:52:00+08', 'Let me check with the team and come back to you here.', '2026-10-16 09:52:00+08');
INSERT INTO public.threads VALUES ('5eeb9ef6-dbb1-4e3a-a25f-34d2373543c4', 'FORNO7', 'telegram', 'demo-15u234', '5b3e3c06-675c-4ed7-9519-e0d923356775', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 14:38:02.388+08', '2026-10-16 14:38:00+08', 'We have free Wi-Fi; staff will share the password at your table.', '2026-10-16 14:38:00+08');
INSERT INTO public.threads VALUES ('a6de91fc-78f7-41d1-8695-5abf08ce9700', 'FORNO7', 'whatsapp', 'demo-46y9y0', 'cc20a777-bb00-4b1c-8271-e12dc990313d', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 17:34:02.376+08', '2026-10-16 17:34:00+08', 'Yes, mobile wood-fired oven catering for 30–150 guests from RM 45 per head. Our events team sends a quote within one working day.', '2026-10-16 17:34:00+08');
INSERT INTO public.threads VALUES ('363f6542-0daa-4aed-bc8a-6db91e2e3246', 'FORNO7', 'telegram', 'demo-40ldjh', '76455732-2539-4081-af87-80023dfb0f5e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 13:43:03.074+08', '2026-10-16 13:43:00+08', 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '2026-10-16 13:43:00+08');
INSERT INTO public.threads VALUES ('aaaa9718-5d78-4d67-a31c-f98885353df5', 'FORNO7', 'telegram', 'demo-do4nto', '689226c1-478c-4611-8262-63846396bc4d', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 10:14:01.736+08', '2026-10-16 10:14:00+08', 'Extra mozzarella RM 4, a whole burrata RM 12.', '2026-10-16 10:14:00+08');
INSERT INTO public.threads VALUES ('8bb07920-af01-4e12-ac3a-c33793a8b021', 'FORNO7', 'telegram', 'demo-bdg3bg', '9ad1e543-b5ac-4f97-8ab0-c1c569d3500f', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 20:32:03.428+08', '2026-10-16 20:32:00+08', 'We''re hiring pizza cooks. Send /apply to our Telegram bot to apply.', '2026-10-16 20:32:00+08');
INSERT INTO public.threads VALUES ('3e33742c-91b3-46b7-8493-bbb2ba97995a', 'FORNO7', 'whatsapp', 'demo-8pzi2j', '985c25cd-37ce-412d-a9d6-701dc97dc3ca', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 22:55:03.405+08', '2026-10-16 22:55:00+08', 'Good question. I''ll check with the team and get back to you here shortly.', '2026-10-16 22:55:00+08');
INSERT INTO public.threads VALUES ('b16e1e47-1b5c-44c4-b40b-217f7a50c19f', 'FORNO7', 'telegram', 'demo-5kky9o', 'a9735e4a-1a0e-4513-bfe4-21769eef5cdd', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 20:59:02.662+08', '2026-10-16 20:59:00+08', 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '2026-10-16 20:59:00+08');
INSERT INTO public.threads VALUES ('06cce211-a362-4338-846d-7b3d8f941e3f', 'FORNO7', 'telegram', 'demo-3jvfii', 'd7b1014b-118a-498e-aa1f-a86c3c924320', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 13:25:03.062+08', '2026-10-16 13:25:00+08', 'Yes, Touch ''n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.', '2026-10-16 13:25:00+08');
INSERT INTO public.threads VALUES ('81b82141-3c4a-4c23-bcfc-3178e2e13d37', 'FORNO7', 'telegram', 'demo-crz9s3', 'd364b959-a27a-43e5-9018-6e37c4f643e8', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 13:00:01.351+08', '2026-10-16 13:00:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-16 13:00:00+08');
INSERT INTO public.threads VALUES ('8456be65-0102-4b1f-b593-d93504fc382e', 'FORNO7', 'simulator', 'demo-7swgkl', 'fd42988c-c6ee-4160-ab36-a241f95afc62', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 10:21:02.102+08', '2026-10-16 10:21:00+08', 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '2026-10-16 10:21:00+08');
INSERT INTO public.threads VALUES ('5e1ee8d1-4eaf-4ef4-bc3a-650a4ada6917', 'FORNO7', 'whatsapp', 'demo-6c22c5', '94c4b1d0-1b78-4212-960c-7a3870067336', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 09:29:01.704+08', '2026-10-16 09:29:00+08', 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '2026-10-16 09:29:00+08');
INSERT INTO public.threads VALUES ('19170203-1046-483b-87d0-9cb36dec28f2', 'FORNO7', 'telegram', 'demo-fzpd0t', 'da118caf-8ab7-45ab-8fd7-aa4463b61482', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 22:14:02.598+08', '2026-10-16 22:14:00+08', 'Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.', '2026-10-16 22:14:00+08');
INSERT INTO public.threads VALUES ('35d5246f-e108-41c4-9152-6724a638e354', 'FORNO7', 'telegram', 'demo-fiveci', 'e32bdbd1-ba1f-4a02-af04-6dff06c4253d', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 20:09:02.658+08', '2026-10-16 20:09:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-16 20:09:00+08');
INSERT INTO public.threads VALUES ('fd3793f2-0410-496d-99ec-cbafed77b16b', 'FORNO7', 'telegram', 'demo-1k19kk', '754f22d2-45f4-4534-8e08-60c0cf51b217', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 19:41:03.12+08', '2026-10-16 19:41:00+08', 'Our dark tee is Charcoal and size M is in stock, RM 59. Want me to hold one at the counter?', '2026-10-16 19:41:00+08');
INSERT INTO public.threads VALUES ('3cad0f0f-521a-4b5d-ade6-725137a0005f', 'FORNO7', 'whatsapp', 'demo-2uzshl', '2f652a22-6093-4070-ba8c-785f5f9bb7d6', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 15:34:03.115+08', '2026-10-16 15:34:00+08', 'So sorry. Please send a photo; our duty manager reviews it personally and will make it right.', '2026-10-16 15:34:00+08');
INSERT INTO public.threads VALUES ('bcd81c2d-1bf7-486c-8e1f-75ad5818bbaa', 'FORNO7', 'telegram', 'demo-fwv1us', 'd57f74a1-1acc-41da-bf1e-a668f184feed', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 11:12:02.481+08', '2026-10-16 11:12:00+08', 'Yes, on Medium and Large, priced at the more expensive half.', '2026-10-16 11:12:00+08');
INSERT INTO public.threads VALUES ('866f5ff4-6734-47ff-964f-5fe920e1ae2e', 'FORNO7', 'simulator', 'demo-7s74iq', 'd7d7ec14-fd0b-440a-b3b3-4fe42e2aca50', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 13:08:01.372+08', '2026-10-16 13:08:00+08', 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '2026-10-16 13:08:00+08');
INSERT INTO public.threads VALUES ('079d628b-6a9e-4007-a7f4-19a8d2815a12', 'FORNO7', 'whatsapp', 'demo-7buqi4', '21ff71ba-8c70-49a6-bc81-38cec01cf2e9', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 22:07:01.318+08', '2026-10-16 22:07:00+08', 'Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.', '2026-10-16 22:07:00+08');
INSERT INTO public.threads VALUES ('7fd892e5-dd91-40d6-8435-415bcee973d1', 'FORNO7', 'telegram', 'demo-ce78lu', '3656bc19-09f6-4424-a5b5-fd93a69fe8ed', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 16:06:01.643+08', '2026-10-16 16:06:00+08', 'Sorry, the Funghi e Tartufo is sold out today. Our truffle delivery is late, it''s back tomorrow. The Quattro Formaggi is the closest rich, cheesy pick.', '2026-10-16 16:06:00+08');
INSERT INTO public.threads VALUES ('abfb0814-c650-4273-93c5-51d1ff07abb1', 'FORNO7', 'telegram', 'demo-fshnr2', '9d42c14b-5c96-4e58-a730-8515959ce450', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 16:33:03.025+08', '2026-10-16 16:33:00+08', 'Yes. The ground floor is step-free and we have an accessible restroom.', '2026-10-16 16:33:00+08');
INSERT INTO public.threads VALUES ('f0e45831-178b-4637-a4cd-559254c6aa82', 'FORNO7', 'telegram', 'demo-33nuwf', '1ca73526-5121-40db-9fbe-47477752e54d', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 22:54:01.673+08', '2026-10-16 22:54:00+08', 'Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.', '2026-10-16 22:54:00+08');
INSERT INTO public.threads VALUES ('cb4ddb39-5f21-4d3b-9e26-dfbbce3e8550', 'FORNO7', 'telegram', 'demo-26epy5', '3745e9ed-833d-4100-976b-39cc47b05342', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 11:55:03.339+08', '2026-10-16 11:55:00+08', 'Good question. I''ll check with the team and get back to you here shortly.', '2026-10-16 11:55:00+08');
INSERT INTO public.threads VALUES ('4037304e-d72d-4dac-8155-9272b751c58c', 'FORNO7', 'whatsapp', 'demo-cdq17v', '7e715a01-2c2a-431a-a808-29ac529aa3b7', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 10:14:01.607+08', '2026-10-16 10:14:00+08', 'Thank you! The oven crew will be very happy to hear it.', '2026-10-16 10:14:00+08');
INSERT INTO public.threads VALUES ('7becabbc-f375-4521-a816-0f1301d16316', 'FORNO7', 'telegram', 'demo-26jzk2', '2c3fcda4-9edb-4b95-8ab7-8825bdc90ee2', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 13:15:02.693+08', '2026-10-16 13:15:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-16 13:15:00+08');
INSERT INTO public.threads VALUES ('e017e6ac-f1d7-4149-a443-a07169097257', 'FORNO7', 'whatsapp', 'demo-5ksmzb', '9add354e-001c-4542-b763-823aef830bb8', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 14:47:01.638+08', '2026-10-16 14:47:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-16 14:47:00+08');
INSERT INTO public.threads VALUES ('aec9364d-f655-440a-ba50-c00f2ab2cb58', 'FORNO7', 'telegram', 'demo-dtrya3', '8d900ae1-c870-412d-af52-6c2ba2834bce', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 16:04:03.514+08', '2026-10-16 16:04:00+08', 'Extra mozzarella RM 4, a whole burrata RM 12.', '2026-10-16 16:04:00+08');
INSERT INTO public.threads VALUES ('b8052ec7-efb8-4aab-8019-d30af038c8ef', 'FORNO7', 'telegram', 'demo-2t2ohi', '9b002271-b075-4426-868f-a13bc3ae8541', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 10:57:01.452+08', '2026-10-16 10:57:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-16 10:57:00+08');
INSERT INTO public.threads VALUES ('2a249705-6a60-430e-85c2-36f3b7de8682', 'FORNO7', 'telegram', 'demo-q2yk3', '1f882ee6-2963-43bd-80e3-f415c7b2e7ad', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 17:56:03.084+08', '2026-10-16 17:56:00+08', 'We''re closed on Mondays. Tuesday to Sunday we''re open from midday (11am on Sundays).', '2026-10-16 17:56:00+08');
INSERT INTO public.threads VALUES ('7e01669b-6aa4-41ef-b5c3-472c10060e09', 'FORNO7', 'whatsapp', 'demo-a98ssg', '752d6754-858f-4dc6-946d-d172504861e1', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 22:49:02.325+08', '2026-10-16 22:49:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-16 22:49:00+08');
INSERT INTO public.threads VALUES ('9966cf76-4e73-4fc3-a724-6bb2eb3a7c38', 'FORNO7', 'telegram', 'demo-b1zde0', '0b910062-38fe-4cd0-ab84-7ed575618772', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 20:17:02.368+08', '2026-10-16 20:17:00+08', 'Yes. The ground floor is step-free and we have an accessible restroom.', '2026-10-16 20:17:00+08');
INSERT INTO public.threads VALUES ('585ca296-593c-4c52-84fb-5e585c9c324c', 'FORNO7', 'whatsapp', 'demo-afbkl8', '07363467-c288-4d43-8524-466aeb319b8f', 'resolved', false, NULL, '{}', NULL, true, '2026-10-16 22:12:02.205+08', '2026-10-16 22:12:00+08', 'Thank you! The oven crew will be very happy to hear it.', '2026-10-16 22:12:00+08');
INSERT INTO public.threads VALUES ('708aeb4c-e62d-4aac-9595-5a8560ebfc48', 'FORNO7', 'whatsapp', 'demo-ersj1a', 'd7239f94-c4a5-43ee-9bcb-ce4b3983b517', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 18:31:02.408+08', '2026-10-17 18:31:00+08', 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '2026-10-17 18:31:00+08');
INSERT INTO public.threads VALUES ('dd67e3a7-a4c9-4329-9c38-6602a737eaec', 'FORNO7', 'whatsapp', 'demo-27kpde', '778f32ec-a57d-48f9-a3b9-2074405d1d7f', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 19:06:03.101+08', '2026-10-17 19:06:00+08', 'Bangsar Village II basement is a 2-minute walk, or street parking through the Flexi Parking app.', '2026-10-17 19:06:00+08');
INSERT INTO public.threads VALUES ('0a6e630a-b707-48de-9c6c-61a2ff176098', 'FORNO7', 'telegram', 'demo-7td9af', '4c361c47-a987-4dd0-84f6-62c686718306', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 09:54:03.566+08', '2026-10-17 09:54:00+08', 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '2026-10-17 09:54:00+08');
INSERT INTO public.threads VALUES ('cdd70eb0-51f1-4e34-a261-f3fe848a0a72', 'FORNO7', 'telegram', 'demo-8wahge', 'ebbf2c32-1aff-4480-9ea4-b85e229d12a3', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 21:35:01.65+08', '2026-10-17 21:35:00+08', 'Sorry, the Funghi e Tartufo is sold out today. Our truffle delivery is late, it''s back tomorrow. The Quattro Formaggi is the closest rich, cheesy pick.', '2026-10-17 21:35:00+08');
INSERT INTO public.threads VALUES ('0de63916-e7ca-405c-84ec-7e8ba4336a93', 'FORNO7', 'telegram', 'demo-ce98wv', '74982a2e-d5f2-446b-bad8-eb5d1f9ac208', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 14:49:03.111+08', '2026-10-17 14:49:00+08', 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '2026-10-17 14:49:00+08');
INSERT INTO public.threads VALUES ('edd9ea39-cb1d-41c5-ba87-596e32036149', 'FORNO7', 'whatsapp', 'demo-asfkfe', '8702457d-4e1d-4eba-8c33-eef818c09d9c', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 21:37:02.859+08', '2026-10-17 21:37:00+08', 'Yes, on Medium and Large, priced at the more expensive half.', '2026-10-17 21:37:00+08');
INSERT INTO public.threads VALUES ('c8711a8b-2e3c-45a1-bd37-3b3db731ca66', 'FORNO7', 'telegram', 'demo-b2wxlw', 'f1ee1816-0956-4cdd-a2b3-14289e91db0d', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 14:29:02.173+08', '2026-10-17 14:29:00+08', 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '2026-10-17 14:29:00+08');
INSERT INTO public.threads VALUES ('80c03259-d4e6-4ebb-814c-dcd873f5a1d6', 'FORNO7', 'telegram', 'demo-c0b2t5', 'c99b9f28-7500-4aef-93a0-4b1d265738d0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 12:40:02.747+08', '2026-10-17 12:40:00+08', 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '2026-10-17 12:40:00+08');
INSERT INTO public.threads VALUES ('7df3d541-f56e-4312-be85-5b23851f47e4', 'FORNO7', 'telegram', 'demo-14pqqj', '46b33352-12ef-4070-8fea-efb0b5a2cee6', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 22:20:02.533+08', '2026-10-17 22:20:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-17 22:20:00+08');
INSERT INTO public.threads VALUES ('878274f3-388f-442e-9db5-825a97bf8ce0', 'FORNO7', 'whatsapp', 'demo-8ozpxj', 'f5c1f298-ba20-473b-92ae-be2a0d078c3e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 19:22:02.7+08', '2026-10-17 19:22:00+08', 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '2026-10-17 19:22:00+08');
INSERT INTO public.threads VALUES ('e96070b3-5986-435a-ac9e-e5a3dea54b9d', 'FORNO7', 'telegram', 'demo-evkk64', '56f69597-55a4-4475-85ce-728a4d6be7c5', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 13:26:02.153+08', '2026-10-17 13:26:00+08', 'Yes, Touch ''n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.', '2026-10-17 13:26:00+08');
INSERT INTO public.threads VALUES ('05cf803b-e6f7-4498-9ceb-0910c89a54fc', 'FORNO7', 'telegram', 'demo-35zavj', '670aa114-0e52-49f7-944e-5d9c6ee8c67b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 14:25:02.256+08', '2026-10-17 14:25:00+08', 'Our dark tee is Charcoal and size M is in stock, RM 59. Want me to hold one at the counter?', '2026-10-17 14:25:00+08');
INSERT INTO public.threads VALUES ('c56f8ba4-12bc-4f30-8ad2-b6899a28fe2e', 'FORNO7', 'telegram', 'demo-46nwxp', '52602099-2b43-4ca3-bde0-604831049b8f', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 09:41:02.931+08', '2026-10-17 09:41:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-17 09:41:00+08');
INSERT INTO public.threads VALUES ('a516d6b8-6b4a-417a-953a-71705e1d76ad', 'FORNO7', 'telegram', 'demo-4tvz5k', '946c83f9-f549-4848-8869-60111eb262d5', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 20:30:01.907+08', '2026-10-17 20:30:00+08', 'Yes. The ground floor is step-free and we have an accessible restroom.', '2026-10-17 20:30:00+08');
INSERT INTO public.threads VALUES ('b1b03b91-878a-452e-b74e-910443709d5c', 'FORNO7', 'telegram', 'demo-2zxqzi', 'c8b2f195-2d05-494b-bf1f-4e80bee40ee7', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 12:46:01.689+08', '2026-10-17 12:46:00+08', 'Let me check with the team and come back to you here.', '2026-10-17 12:46:00+08');
INSERT INTO public.threads VALUES ('01d66fb6-316e-4425-95fd-3368355e37f5', 'FORNO7', 'telegram', 'demo-iadyx', '55a38d39-3659-41f9-a30c-53aa4449b0a0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 18:32:02.747+08', '2026-10-17 18:32:00+08', 'Yes, 6 tables on the terrace. It''s non-smoking.', '2026-10-17 18:32:00+08');
INSERT INTO public.threads VALUES ('757882a8-0c4d-4386-af4f-fc0c1c53963a', 'FORNO7', 'telegram', 'demo-3smqh1', '233b68fc-862d-4b92-a419-5230ef308121', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 12:09:01.396+08', '2026-10-17 12:09:00+08', 'That made our day, thank you! Come back soon.', '2026-10-17 12:09:00+08');
INSERT INTO public.threads VALUES ('d3aea845-97f7-45e0-8a49-17beeab683b7', 'FORNO7', 'telegram', 'demo-9a1zm6', '42738f18-1bff-4877-8231-355753e0505e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 11:11:01.254+08', '2026-10-17 11:11:00+08', 'Our dark tee is Charcoal and size M is in stock, RM 59. Want me to hold one at the counter?', '2026-10-17 11:11:00+08');
INSERT INTO public.threads VALUES ('2df88739-bd33-469f-b721-557ef6ede220', 'FORNO7', 'telegram', 'demo-hbsrz', '4d20a699-0fa3-47ca-81bb-cffe21816db0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 12:18:02.754+08', '2026-10-17 12:18:00+08', 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '2026-10-17 12:18:00+08');
INSERT INTO public.threads VALUES ('317c100c-3638-42cc-bbf5-e012aeb8c881', 'FORNO7', 'telegram', 'demo-6nl8fz', '05357cc6-082b-48b6-9d12-6cf5324efbf7', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 12:18:02.995+08', '2026-10-17 12:18:00+08', 'Extra mozzarella RM 4, a whole burrata RM 12.', '2026-10-17 12:18:00+08');
INSERT INTO public.threads VALUES ('3451b7a2-043c-46e1-bbb1-6198515b9fda', 'FORNO7', 'whatsapp', 'demo-bn8j0n', '2a28edf8-1670-4f50-8e73-edd4e6ca821b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 18:04:02.307+08', '2026-10-17 18:04:00+08', 'Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.', '2026-10-17 18:04:00+08');
INSERT INTO public.threads VALUES ('753063f6-28c0-41e0-8e92-c5d2622cdeba', 'FORNO7', 'telegram', 'demo-fup4y', '02b7365e-d0b0-439d-9a63-ca5860adbe5d', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 16:31:01.546+08', '2026-10-17 16:31:00+08', 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '2026-10-17 16:31:00+08');
INSERT INTO public.threads VALUES ('9b51041d-9640-418b-8aef-3ac3b3083fac', 'FORNO7', 'telegram', 'demo-7vzxz2', '6fdaf8d3-f2f3-4139-a409-bc5e0a5f5d82', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 09:11:01.251+08', '2026-10-17 09:11:00+08', 'Yes, Brick Red aprons are in stock in S, M and L (RM 69). XL has just one left.', '2026-10-17 09:11:00+08');
INSERT INTO public.threads VALUES ('4be2ac6b-2e2d-4413-8fde-59fc1688da04', 'FORNO7', 'simulator', 'demo-dp6o9m', '9f486886-b057-4183-b8f8-c74f910a3783', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 16:22:01.22+08', '2026-10-17 16:22:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-17 16:22:00+08');
INSERT INTO public.threads VALUES ('28dc9569-3ef1-4a2b-beb8-c2545e58d8b9', 'FORNO7', 'whatsapp', 'demo-1ar9s', '2401b862-e217-4bb4-92c9-d42d93b4dbdf', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 13:24:01.746+08', '2026-10-17 13:24:00+08', 'Yes. Corkage is RM 40 per bottle, maximum 2 bottles per table.', '2026-10-17 13:24:00+08');
INSERT INTO public.threads VALUES ('9b11a45c-e951-4ac0-abc0-d9c62e8eedf1', 'FORNO7', 'telegram', 'demo-lazne', '7dcf63b4-7b08-42f2-aaa9-07b34f330cd4', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 12:28:01.996+08', '2026-10-17 12:28:00+08', 'That made our day, thank you! Come back soon.', '2026-10-17 12:28:00+08');
INSERT INTO public.threads VALUES ('4f4a25e1-f6cf-4fa8-baf3-1ea2c553085e', 'FORNO7', 'telegram', 'demo-8xb0s3', 'd2d5bb3f-e32b-43cc-85aa-26b3aa7bc880', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 16:46:03.3+08', '2026-10-17 16:46:00+08', 'No dress code at all.', '2026-10-17 16:46:00+08');
INSERT INTO public.threads VALUES ('4c2f68a6-db06-47bb-ad22-b475abc2001b', 'FORNO7', 'telegram', 'demo-dx7rvf', '6cd6b5b8-c72c-428b-818a-51ddfc544fb7', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 15:46:02.515+08', '2026-10-17 15:46:00+08', 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '2026-10-17 15:46:00+08');
INSERT INTO public.threads VALUES ('27b9adae-c8fc-454c-955f-588cc0c02092', 'FORNO7', 'telegram', 'demo-7harhp', 'b5731eaa-6b21-4f0c-be00-aa7d7be344b1', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 16:30:01.653+08', '2026-10-17 16:30:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-17 16:30:00+08');
INSERT INTO public.threads VALUES ('39be4d1c-1b3f-4142-bf4b-cf9766b3ac42', 'FORNO7', 'telegram', 'demo-3g1mdu', '911a433f-cd7a-4004-9cd6-2b5837e963e7', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 18:36:01.34+08', '2026-10-17 18:36:00+08', 'Let me check with the team and come back to you here.', '2026-10-17 18:36:00+08');
INSERT INTO public.threads VALUES ('bf084f72-4b41-422e-b2a8-91ae85702ce6', 'FORNO7', 'telegram', 'demo-1ylan6', '5f05adc9-ebb7-41bc-b966-a4fac122b54e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 15:39:01.565+08', '2026-10-17 15:39:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-17 15:39:00+08');
INSERT INTO public.threads VALUES ('d84eca4f-4758-433e-9539-4337b69ddbe2', 'FORNO7', 'telegram', 'demo-1hrt82', 'f45b7b10-0445-473a-886a-0bc2a6d595c7', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 09:29:01.259+08', '2026-10-17 09:29:00+08', 'Sorry, I can only help with Forno Sette''s menu, bookings and orders.', '2026-10-17 09:29:00+08');
INSERT INTO public.threads VALUES ('dea2891a-8b58-4dba-a725-64fd9e6171dd', 'FORNO7', 'telegram', 'demo-7yocjl', 'dfbda23d-1289-498b-840b-1ab45ae8deb8', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 21:11:01.527+08', '2026-10-17 21:11:00+08', 'Good question. I''ll check with the team and get back to you here shortly.', '2026-10-17 21:11:00+08');
INSERT INTO public.threads VALUES ('40d63d7e-3854-4ccc-ab20-d76ae7d7b7ba', 'FORNO7', 'telegram', 'demo-fak4ej', 'c1f7f45d-9769-408d-9ad4-545e0392008f', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 22:46:01.232+08', '2026-10-17 22:46:00+08', 'Of course, bring your own cake. There''s no cake-cutting fee.', '2026-10-17 22:46:00+08');
INSERT INTO public.threads VALUES ('39fa342f-f0de-4f90-ae20-f507706ea508', 'FORNO7', 'whatsapp', 'demo-2hwoyb', '9daf3698-ab51-4f6b-a910-bd3a0514a49c', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 11:26:02.062+08', '2026-10-17 11:26:00+08', 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '2026-10-17 11:26:00+08');
INSERT INTO public.threads VALUES ('0fc264f6-ac62-4868-ab24-8a63838095bc', 'FORNO7', 'telegram', 'demo-7i5via', 'b3f1340b-6c8a-4e51-9477-b7df673923af', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 13:19:02.997+08', '2026-10-17 13:19:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-17 13:19:00+08');
INSERT INTO public.threads VALUES ('6050b219-34fc-4dff-9186-4f3f3d79af08', 'FORNO7', 'telegram', 'demo-5v3nzn', '8fcff20c-6ddb-4d09-a9b4-89430f8c7e93', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 17:09:02.666+08', '2026-10-17 17:09:00+08', 'Dogs are welcome on our terrace and we''ll bring a water bowl.', '2026-10-17 17:09:00+08');
INSERT INTO public.threads VALUES ('c4fefd19-4ac3-4f16-b381-7dfcc3389fda', 'FORNO7', 'telegram', 'demo-37j8qw', 'af672798-6667-46bf-80fb-a97350da0a74', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 20:04:03.126+08', '2026-10-17 20:04:00+08', 'I''ll check with the team and let you know here.', '2026-10-17 20:04:00+08');
INSERT INTO public.threads VALUES ('3c0a9d46-af3a-48f9-a237-b51227f01a70', 'FORNO7', 'telegram', 'demo-cvxgiy', 'd77ade01-90c6-4163-b17a-c8eeeedd1c92', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 18:42:01.352+08', '2026-10-17 18:42:00+08', 'So sorry. Please send a photo; our duty manager reviews it personally and will make it right.', '2026-10-17 18:42:00+08');
INSERT INTO public.threads VALUES ('364f1662-473b-44eb-9682-609c9a6f7240', 'FORNO7', 'telegram', 'demo-kjyb4', '73c5908c-59b4-4e0a-bed7-3f27a0d59604', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 21:46:02.82+08', '2026-10-17 21:46:00+08', 'Yes, on Medium and Large, priced at the more expensive half.', '2026-10-17 21:46:00+08');
INSERT INTO public.threads VALUES ('f7c476ac-57ee-498d-9d71-5834e9d941c6', 'FORNO7', 'whatsapp', 'demo-9gkuz', '5064f399-f5b6-42a0-ad78-576c0ff56cb9', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 10:02:03.125+08', '2026-10-17 10:02:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-17 10:02:00+08');
INSERT INTO public.threads VALUES ('01d6c52e-f7c1-49ef-a45c-569adaf6f26e', 'FORNO7', 'telegram', 'demo-g8s2nt', '1185a560-6936-4e28-96bc-80d3f6cd1d8e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 11:31:02.227+08', '2026-10-17 11:31:00+08', 'Thank you! I''ve shared this with our team, and someone will reach out here.', '2026-10-17 11:31:00+08');
INSERT INTO public.threads VALUES ('b6888f91-1d36-48f3-845f-a6702c219048', 'FORNO7', 'whatsapp', 'demo-fng4hs', '09e2ae55-aa18-4ab4-95cd-c20307f0a564', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 09:52:03.332+08', '2026-10-17 09:52:00+08', 'Send us your booking reference here. Cancellation is free up to 2 hours before.', '2026-10-17 09:52:00+08');
INSERT INTO public.threads VALUES ('f69aaf27-f663-4cfd-9a29-c484f265ad17', 'FORNO7', 'telegram', 'demo-bu50q4', '856867af-0ead-4a00-a671-13184e1babd8', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 19:27:02.569+08', '2026-10-17 19:27:00+08', 'House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.', '2026-10-17 19:27:00+08');
INSERT INTO public.threads VALUES ('d2eb4070-0a67-4446-a954-eb1590d3b03a', 'FORNO7', 'whatsapp', 'demo-1jd4dy', '4f682ee0-c636-419d-9632-12f8a3d7438f', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 18:28:01.27+08', '2026-10-17 18:28:00+08', 'Let me check with the team and come back to you here.', '2026-10-17 18:28:00+08');
INSERT INTO public.threads VALUES ('7222d610-1727-4545-98d2-e40f7df9f181', 'FORNO7', 'telegram', 'demo-eb3135', '5542fca9-5d2d-4487-b731-cd0b7748ebb6', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 18:41:02.36+08', '2026-10-17 18:41:00+08', 'We hold tables for 15 minutes. Send your booking reference and we''ll let the floor know you''re coming.', '2026-10-17 18:41:00+08');
INSERT INTO public.threads VALUES ('3fdaf061-a1b4-4fc4-9c58-4e94bcff42e1', 'FORNO7', 'whatsapp', 'demo-cpnd51', 'e6a8fe6d-3dda-4fcc-a5bf-f4e69bffb5d9', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 16:03:03.236+08', '2026-10-17 16:03:00+08', 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '2026-10-17 16:03:00+08');
INSERT INTO public.threads VALUES ('d3fed828-6796-4b9e-bcc5-95e1761bff56', 'FORNO7', 'telegram', 'demo-93bukq', 'ea209b90-0b5f-4ac5-b379-69270c2a237b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 11:25:02.921+08', '2026-10-17 11:25:00+08', 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '2026-10-17 11:25:00+08');
INSERT INTO public.threads VALUES ('59f0d53e-0d5a-4002-8a6a-ff4521881844', 'FORNO7', 'telegram', 'demo-32970v', '00b04800-b9fe-4d05-9f52-6a56a0d7e738', 'resolved', false, NULL, '{}', NULL, true, '2026-10-17 10:55:02.132+08', '2026-10-17 10:55:00+08', 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '2026-10-17 10:55:00+08');
INSERT INTO public.threads VALUES ('5160c90c-6c63-4ca3-af7a-591a80a98abb', 'FORNO7', 'telegram', 'demo-bqn4si', '8e6473cc-ef7f-4569-91ad-dd84c1e3aa31', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 21:22:02.921+08', '2026-10-18 21:22:00+08', 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '2026-10-18 21:22:00+08');
INSERT INTO public.threads VALUES ('1f172aeb-67f6-4e24-b901-e90712b263bb', 'FORNO7', 'whatsapp', 'demo-11mtj3', '49a3464c-8360-45bf-ae29-a88b7031f42b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 13:03:01.944+08', '2026-10-18 13:03:00+08', 'Yes, Touch ''n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.', '2026-10-18 13:03:00+08');
INSERT INTO public.threads VALUES ('40c6507b-a279-4e58-b2c1-0ee301caee37', 'FORNO7', 'telegram', 'demo-dvbwcc', '1798c5c5-f3f7-41ef-9cec-6728f3ac8be4', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 14:11:03.112+08', '2026-10-18 14:11:00+08', 'The Pollo Pesto contains pine nuts, and our kitchen handles tree nuts, so cross-contact is possible. Our manager will talk you through it before you order.', '2026-10-18 14:11:00+08');
INSERT INTO public.threads VALUES ('26983643-9ed5-4700-b919-1c17b830ddab', 'FORNO7', 'telegram', 'demo-5x95tv', '88551b6e-50bd-409c-add1-c75be9a7f6a9', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 17:25:02.913+08', '2026-10-18 17:25:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-18 17:25:00+08');
INSERT INTO public.threads VALUES ('11c72fac-f301-4739-af5a-240454e6ae92', 'FORNO7', 'whatsapp', 'demo-bb67go', 'dcdbaf44-b979-4db7-8de1-c1aeff705042', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 19:03:02.057+08', '2026-10-18 19:03:00+08', 'Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.', '2026-10-18 19:03:00+08');
INSERT INTO public.threads VALUES ('01448773-4d8e-4010-a3a4-9648995493e8', 'FORNO7', 'whatsapp', 'demo-777xom', '32e97a11-6e4c-4b00-919d-66c978afb541', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 16:51:03.158+08', '2026-10-18 16:51:00+08', 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '2026-10-18 16:51:00+08');
INSERT INTO public.threads VALUES ('1e775adc-79c3-4f18-b040-90836f1f3e5a', 'FORNO7', 'telegram', 'demo-24qt3t', 'ec9eb378-53f1-4507-b873-556e44cfa970', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 18:56:01.751+08', '2026-10-18 18:56:00+08', 'It''s a 48-hour fermented dough with Italian 00 flour, not sourdough.', '2026-10-18 18:56:00+08');
INSERT INTO public.threads VALUES ('ba48d238-f34c-4da8-8ac4-53703b0804a6', 'FORNO7', 'telegram', 'demo-buj74j', '5cbf5366-fa30-4f64-9a36-b4bb1ceed059', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 15:17:03.266+08', '2026-10-18 15:17:00+08', 'Yes, on Medium and Large, priced at the more expensive half.', '2026-10-18 15:17:00+08');
INSERT INTO public.threads VALUES ('e45faafb-60bf-4d71-a139-66289ab21a11', 'FORNO7', 'telegram', 'demo-drk58y', 'd04dac5e-5b24-4fd4-8d23-4cd897753466', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 16:16:02.572+08', '2026-10-18 16:16:00+08', 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '2026-10-18 16:16:00+08');
INSERT INTO public.threads VALUES ('2536b770-186f-4423-8c32-9033b8bf2b23', 'FORNO7', 'telegram', 'demo-ag6q0s', '49dd269c-0fe8-4f0f-8eed-de4f45afd12c', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 14:22:01.605+08', '2026-10-18 14:22:00+08', 'Up to 10 can be booked here. For 11 or more, our events team arranges the table personally.', '2026-10-18 14:22:00+08');
INSERT INTO public.threads VALUES ('2d7716fc-d60e-4316-af46-1f7ff9edcf6d', 'FORNO7', 'telegram', 'demo-znzu5', 'd9383216-bb7b-4f1a-baab-9b7c6b7c0378', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 21:30:03.383+08', '2026-10-18 21:30:00+08', 'We have free Wi-Fi; staff will share the password at your table.', '2026-10-18 21:30:00+08');
INSERT INTO public.threads VALUES ('0066a90c-d33b-47a2-aaeb-e0e4bc781a5e', 'FORNO7', 'telegram', 'demo-esfs9k', 'f623e084-7805-48dc-be97-1af342381240', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 14:11:02.908+08', '2026-10-18 14:11:00+08', 'I''ll check with the team and reply here soon.', '2026-10-18 14:11:00+08');
INSERT INTO public.threads VALUES ('b2e4dd66-be1d-4e00-a59e-c1837935ca25', 'FORNO7', 'whatsapp', 'demo-ai85ok', '85433477-c94c-4aa3-9198-180d25379221', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 13:04:02.668+08', '2026-10-18 13:04:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-18 13:04:00+08');
INSERT INTO public.threads VALUES ('d632ec36-b267-48f7-8f02-15ee31ac1386', 'FORNO7', 'whatsapp', 'demo-hkm44', '54a428a4-5f58-478d-9e09-5709d0b9ebbc', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 12:37:01.787+08', '2026-10-18 12:37:00+08', 'Thanks for your interest! I''ve passed this to our owner, who handles partnerships personally. They''ll reply here soon.', '2026-10-18 12:37:00+08');
INSERT INTO public.threads VALUES ('cc441ba9-837a-4a74-b9b4-5e45ba19717e', 'FORNO7', 'telegram', 'demo-8ikkzx', '6b179ade-f1ca-4deb-8997-18553f087479', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 15:54:01.879+08', '2026-10-18 15:54:00+08', 'Good question. I''ll check with the team and get back to you here shortly.', '2026-10-18 15:54:00+08');
INSERT INTO public.threads VALUES ('d40bd721-6a29-420c-8c9e-3ed9b83a3a13', 'FORNO7', 'telegram', 'demo-g81vuc', '75d4e73b-2537-4f6e-bc97-4d774c06d256', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 18:31:01.354+08', '2026-10-18 18:31:00+08', 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '2026-10-18 18:31:00+08');
INSERT INTO public.threads VALUES ('5657e473-91dc-4f15-9f17-17be1e3a6cc2', 'FORNO7', 'whatsapp', 'demo-1obez9', '0ccdf676-92a4-4810-899a-23c3b6e8b44c', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 20:44:02.114+08', '2026-10-18 20:44:00+08', 'Yes, on Medium and Large, priced at the more expensive half.', '2026-10-18 20:44:00+08');
INSERT INTO public.threads VALUES ('64701343-de15-4df8-be81-a58d5c19817b', 'FORNO7', 'telegram', 'demo-cp8xa7', 'f4022fb4-8f32-4e95-95f8-6fcedcf4f7d9', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 16:26:02.189+08', '2026-10-18 16:26:00+08', 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '2026-10-18 16:26:00+08');
INSERT INTO public.threads VALUES ('379a5dba-67a7-4e99-8f3e-258d4b5cafc4', 'FORNO7', 'telegram', 'demo-806lzz', '014bf3a4-14c7-42b5-853d-82badb7b4a96', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 19:31:01.745+08', '2026-10-18 19:31:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-18 19:31:00+08');
INSERT INTO public.threads VALUES ('029c1b25-fcb8-4b5d-b428-d114ba55de8c', 'FORNO7', 'telegram', 'demo-b30vke', '34237b02-d2ab-462f-8191-d534d19e5d2e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 22:26:03.134+08', '2026-10-18 22:26:00+08', 'Yes, on Medium and Large, priced at the more expensive half.', '2026-10-18 22:26:00+08');
INSERT INTO public.threads VALUES ('d1905f7d-25d9-4cc2-ba9b-31f0d520818f', 'FORNO7', 'telegram', 'demo-3ft51y', '8806daef-0e45-4e01-a78d-771dfefcbd74', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 20:27:03.547+08', '2026-10-18 20:27:00+08', 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '2026-10-18 20:27:00+08');
INSERT INTO public.threads VALUES ('ed7328c9-d6d8-45e3-bf80-e082758e25a7', 'FORNO7', 'telegram', 'demo-1mghe4', 'e031c0b7-01ca-4aee-9ad7-5df0be4ef507', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 13:06:03.517+08', '2026-10-18 13:06:00+08', 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '2026-10-18 13:06:00+08');
INSERT INTO public.threads VALUES ('ab8855ce-e7b2-41ec-8baa-a117d85d3d3f', 'FORNO7', 'whatsapp', 'demo-eti9ne', 'dfcfd6e6-0ffe-4dc6-acb0-d0a38767980b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 16:26:02.527+08', '2026-10-18 16:26:00+08', 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '2026-10-18 16:26:00+08');
INSERT INTO public.threads VALUES ('026a3daf-2b6f-4b81-b621-15f7a3c4d328', 'FORNO7', 'telegram', 'demo-e7636d', 'f327da76-80fa-427c-9f47-6a6a93dec818', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 13:35:01.796+08', '2026-10-18 13:35:00+08', 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '2026-10-18 13:35:00+08');
INSERT INTO public.threads VALUES ('33f2bc41-1788-4a1b-b6ad-b7810288225e', 'FORNO7', 'telegram', 'demo-c5i3n5', '8399b52d-0df8-4871-9a73-89da40c81643', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 20:13:02.673+08', '2026-10-18 20:13:00+08', 'Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.', '2026-10-18 20:13:00+08');
INSERT INTO public.threads VALUES ('3697ffa9-7619-4993-b51f-cdaf0547b317', 'FORNO7', 'telegram', 'demo-gh9bff', '4226e908-2014-486d-80fa-4dc18ed34085', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 22:47:02.142+08', '2026-10-18 22:47:00+08', 'Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.', '2026-10-18 22:47:00+08');
INSERT INTO public.threads VALUES ('01a3bbd6-7c89-4f7f-9bc9-e2b204ea94fb', 'FORNO7', 'telegram', 'demo-8ej4vc', '072bc6d6-2279-450e-8252-dc669771c48a', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 09:57:02.923+08', '2026-10-18 09:57:00+08', 'Sorry, smoking and vaping aren''t allowed anywhere at the restaurant, including the terrace.', '2026-10-18 09:57:00+08');
INSERT INTO public.threads VALUES ('65dc3648-5e0a-4746-ab09-682fd3c2fa18', 'FORNO7', 'whatsapp', 'demo-bmoz5z', 'bf66afac-103b-4571-b944-cd0957e33264', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 14:12:02.728+08', '2026-10-18 14:12:00+08', 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '2026-10-18 14:12:00+08');
INSERT INTO public.threads VALUES ('a61ae524-60be-4610-9863-dabe305c1d99', 'FORNO7', 'simulator', 'demo-5gx2d2', 'cf43209b-fa39-497b-b395-089e2933639e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 16:24:02.821+08', '2026-10-18 16:24:00+08', 'Large Margherita (15") is RM 52. Medium RM 38, Small RM 28.', '2026-10-18 16:24:00+08');
INSERT INTO public.threads VALUES ('a89ba199-fdf9-491b-8c24-065bdaedad31', 'FORNO7', 'whatsapp', 'demo-91hg91', '273b8d7d-1f37-42c0-b7b6-c355589587b6', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 22:16:01.228+08', '2026-10-18 22:16:00+08', 'We''re hiring pizza cooks. Send /apply to our Telegram bot to apply.', '2026-10-18 22:16:00+08');
INSERT INTO public.threads VALUES ('1feb3923-7d68-4ebd-bfb0-bef86cccecc9', 'FORNO7', 'telegram', 'demo-e7g2qq', 'c62606df-8136-4230-ad01-045313b24645', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 22:14:03.331+08', '2026-10-18 22:14:00+08', 'Yes, Brick Red aprons are in stock in S, M and L (RM 69). XL has just one left.', '2026-10-18 22:14:00+08');
INSERT INTO public.threads VALUES ('b58755da-0ee0-4d2f-8840-6411f68b2be1', 'FORNO7', 'simulator', 'demo-aaejlw', '9aa9b188-b370-4b18-9c11-5f43a7b2264c', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 12:22:03.244+08', '2026-10-18 12:22:00+08', 'That made our day, thank you! Come back soon.', '2026-10-18 12:22:00+08');
INSERT INTO public.threads VALUES ('7f4cd5fc-8b5b-4d03-b19a-63554cf5eb87', 'FORNO7', 'whatsapp', 'demo-9zb25j', '0029565b-6735-4a82-91ed-307aecb2665e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 09:00:01.982+08', '2026-10-18 09:00:00+08', 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '2026-10-18 09:00:00+08');
INSERT INTO public.threads VALUES ('627b4a9f-b447-4b98-85cd-9c0d61054349', 'FORNO7', 'telegram', 'demo-4zal91', 'd710e205-6a9b-41d4-9a30-e9bb0dd83313', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 15:45:01.801+08', '2026-10-18 15:45:00+08', 'Good question. I''ll check with the team and get back to you here shortly.', '2026-10-18 15:45:00+08');
INSERT INTO public.threads VALUES ('ec31aa22-a82c-42c3-9e8e-406220af10f9', 'FORNO7', 'telegram', 'demo-46ppgk', 'dff130f4-a7d6-4c1d-b959-e63cfbd1b8bf', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 13:37:03.163+08', '2026-10-18 13:37:00+08', 'Yes. Corkage is RM 40 per bottle, maximum 2 bottles per table.', '2026-10-18 13:37:00+08');
INSERT INTO public.threads VALUES ('ebd9bf69-df02-4dc6-b8f9-627de10663b8', 'FORNO7', 'telegram', 'demo-1equul', '3693154f-b07d-4721-b561-27e57703e31f', 'resolved', false, NULL, '{}', NULL, true, '2026-10-18 22:23:01.926+08', '2026-10-18 22:23:00+08', 'Good question. I''ll check with the team and get back to you here shortly.', '2026-10-18 22:23:00+08');
INSERT INTO public.threads VALUES ('6e57c75d-ee3b-4bb0-99a5-670d4b984b9d', 'FORNO7', 'whatsapp', 'demo-9d4w3x', 'a61f149b-95f8-4d06-82bb-44b444504788', 'resolved', false, NULL, '{}', NULL, true, '2026-10-19 19:22:03.114+08', '2026-10-19 19:22:00+08', 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '2026-10-19 19:22:00+08');
INSERT INTO public.threads VALUES ('b320d77c-dd6e-4e2b-bd86-f2c461520eb0', 'FORNO7', 'telegram', 'demo-5m66fo', 'ae093341-084c-45ca-8999-d027005fc04f', 'resolved', false, NULL, '{}', NULL, true, '2026-10-19 17:21:02.127+08', '2026-10-19 17:21:00+08', 'We''re hiring pizza cooks. Send /apply to our Telegram bot to apply.', '2026-10-19 17:21:00+08');
INSERT INTO public.threads VALUES ('57abb75b-d0de-4695-8e45-8d23ba1778bf', 'FORNO7', 'telegram', 'demo-bjxvhk', '42c452e9-09cf-49a6-aa83-9bfda772b95a', 'resolved', false, NULL, '{}', NULL, true, '2026-10-19 11:04:01.211+08', '2026-10-19 11:04:00+08', 'I''ll check with the team and let you know here.', '2026-10-19 11:04:00+08');
INSERT INTO public.threads VALUES ('b26ff72a-44a5-4e28-8e29-f6a867d4804a', 'FORNO7', 'telegram', 'demo-599d1r', '4f089bfa-7b6c-4161-bac3-08cc980c61dd', 'resolved', false, NULL, '{}', NULL, true, '2026-10-19 21:04:01.897+08', '2026-10-19 21:04:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-19 21:04:00+08');
INSERT INTO public.threads VALUES ('42c3a37f-1ea2-45f4-9288-8edb64220404', 'FORNO7', 'telegram', 'demo-6zzuhh', '4bed4387-8667-4620-9e83-c91fe8ecce64', 'resolved', false, NULL, '{}', NULL, true, '2026-10-19 11:29:02.384+08', '2026-10-19 11:29:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-19 11:29:00+08');
INSERT INTO public.threads VALUES ('4b13f10d-6b45-4cdb-a925-a530a6b0002f', 'FORNO7', 'telegram', 'demo-6mj2sj', '4b2bd34a-9e43-40d7-893a-c4c78740d48f', 'resolved', false, NULL, '{}', NULL, true, '2026-10-19 11:34:01.652+08', '2026-10-19 11:34:00+08', 'Yes, 6 tables on the terrace. It''s non-smoking.', '2026-10-19 11:34:00+08');
INSERT INTO public.threads VALUES ('aa4bb260-3653-478c-b1fd-300d95d61a5d', 'FORNO7', 'telegram', 'demo-blt3em', 'aa00b2e9-6519-4e44-af21-7e54580603d3', 'resolved', false, NULL, '{}', NULL, true, '2026-10-19 17:05:01.324+08', '2026-10-19 17:05:00+08', 'I''ll check with the team and let you know here.', '2026-10-19 17:05:00+08');
INSERT INTO public.threads VALUES ('a6431bef-300a-4c72-a158-f03d8f27bf08', 'FORNO7', 'whatsapp', 'demo-826tle', 'd0a88fd9-5662-466d-8e71-1fa0251c8aa0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-19 21:57:01.373+08', '2026-10-19 21:57:00+08', 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '2026-10-19 21:57:00+08');
INSERT INTO public.threads VALUES ('e20c6d7a-f362-4311-bc01-73dd1b620488', 'FORNO7', 'telegram', 'demo-a4t5zl', '6a12ab08-665d-46e3-95d8-3228434937dd', 'resolved', false, NULL, '{}', NULL, true, '2026-10-19 14:22:02.611+08', '2026-10-19 14:22:00+08', 'Yes, no added MSG.', '2026-10-19 14:22:00+08');
INSERT INTO public.threads VALUES ('f31b8025-4686-4489-ad60-df8d2d44cd6b', 'FORNO7', 'telegram', 'demo-db55aa', '91732b3c-11bd-4b55-b98e-e2777010cd8f', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 16:22:03.406+08', '2026-10-20 16:22:00+08', 'Let me check with the team and get back to you.', '2026-10-20 16:22:00+08');
INSERT INTO public.threads VALUES ('8d687a57-8f88-48b7-9b08-aa60ae471566', 'FORNO7', 'telegram', 'demo-d7kzt4', '2fe3b7c7-36ea-4f5f-a742-904fb009cbb0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 13:22:03.485+08', '2026-10-20 13:22:00+08', 'Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.', '2026-10-20 13:22:00+08');
INSERT INTO public.threads VALUES ('2c4c99f5-3823-44a0-a769-eaec27910743', 'FORNO7', 'telegram', 'demo-9iok8z', 'dca5504c-89dd-4fe6-ab1f-aa9d09d5696b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 17:33:03.419+08', '2026-10-20 17:33:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-20 17:33:00+08');
INSERT INTO public.threads VALUES ('2d4d54fa-8d62-4ce3-b749-d29712602910', 'FORNO7', 'telegram', 'demo-6z6f8d', '25c8b31e-58fd-4fd7-931a-21cd51ed67f6', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 17:58:02.471+08', '2026-10-20 17:58:00+08', 'Send us your booking reference here. Cancellation is free up to 2 hours before.', '2026-10-20 17:58:00+08');
INSERT INTO public.threads VALUES ('48cd5efa-fc08-43dd-92ad-c7293c8aab34', 'FORNO7', 'telegram', 'demo-y4z2m', '52dec090-ca07-41c2-a0d6-74276373f63d', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 10:33:03.359+08', '2026-10-20 10:33:00+08', 'Up to 10 can be booked here. For 11 or more, our events team arranges the table personally.', '2026-10-20 10:33:00+08');
INSERT INTO public.threads VALUES ('9746ba32-df9f-40c3-8db5-8bb5547ce0fa', 'FORNO7', 'telegram', 'demo-d2vjx5', '35a73859-12fe-49b2-b70d-d0d0ed5d9033', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 13:30:02.161+08', '2026-10-20 13:30:00+08', 'Of course, bring your own cake. There''s no cake-cutting fee.', '2026-10-20 13:30:00+08');
INSERT INTO public.threads VALUES ('b9889ccb-58d4-4fdf-b33b-7fe4b1784d6a', 'FORNO7', 'whatsapp', 'demo-agfn4w', '28d6227c-c782-4e19-aca4-2b89ffea947b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 18:13:01.952+08', '2026-10-20 18:13:00+08', 'I''ll check with the team and reply here soon.', '2026-10-20 18:13:00+08');
INSERT INTO public.threads VALUES ('a7bd3bfa-fd06-4500-b014-94b793eed399', 'FORNO7', 'simulator', 'demo-dd1s2t', 'e40565e6-f525-498a-bab1-329de19d2f17', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 21:07:03.274+08', '2026-10-20 21:07:00+08', 'Yes, Brick Red aprons are in stock in S, M and L (RM 69). XL has just one left.', '2026-10-20 21:07:00+08');
INSERT INTO public.threads VALUES ('70b851a3-07c0-41af-8ef4-00534ac5b895', 'FORNO7', 'telegram', 'demo-4ywpfz', '9cfa4cab-88e4-4af2-870b-f8622ea018b4', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 14:04:03.047+08', '2026-10-20 14:04:00+08', 'Yes, no added MSG.', '2026-10-20 14:04:00+08');
INSERT INTO public.threads VALUES ('c84870fd-a0f2-41b1-a58a-e1431d5076e8', 'FORNO7', 'telegram', 'demo-1pfwu0', 'f7a91bf2-1120-4aa7-b1ee-547d2cae3cfb', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 13:15:01.456+08', '2026-10-20 13:15:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-20 13:15:00+08');
INSERT INTO public.threads VALUES ('b9000dfc-fc54-431a-9789-13b0f8c98262', 'FORNO7', 'telegram', 'demo-20htp5', '194a8788-c636-4777-93b2-0e47fe6d3632', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 19:30:02.271+08', '2026-10-20 19:30:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-20 19:30:00+08');
INSERT INTO public.threads VALUES ('95f5824c-ba03-4ed3-93b2-ebcc51eeb0ba', 'FORNO7', 'telegram', 'demo-chztt8', 'a3dcf9b6-269f-41a8-9e62-56f84c9a466b', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 18:32:01.869+08', '2026-10-20 18:32:00+08', 'Large Margherita (15") is RM 52. Medium RM 38, Small RM 28.', '2026-10-20 18:32:00+08');
INSERT INTO public.threads VALUES ('c905f347-6112-404e-9559-e9457d810612', 'FORNO7', 'telegram', 'demo-7ang6c', 'ae195977-26d8-47e6-94ad-a0da8d8d41ae', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 17:48:03.476+08', '2026-10-20 17:48:00+08', 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '2026-10-20 17:48:00+08');
INSERT INTO public.threads VALUES ('381f111e-12e3-451c-a99d-afa22cc2c292', 'FORNO7', 'telegram', 'demo-6gy13p', 'aeac5cc4-6b44-4bb8-ae52-efab61f936c6', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 12:56:02.49+08', '2026-10-20 12:56:00+08', 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '2026-10-20 12:56:00+08');
INSERT INTO public.threads VALUES ('5dfafd98-98cc-4958-9346-85779806070f', 'FORNO7', 'simulator', 'demo-fxya2', 'b2f732f5-964b-4980-aa03-542544ac1b19', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 15:09:02.852+08', '2026-10-20 15:09:00+08', 'We''re closed on Mondays. Tuesday to Sunday we''re open from midday (11am on Sundays).', '2026-10-20 15:09:00+08');
INSERT INTO public.threads VALUES ('56405e62-0ca0-44ad-abfe-0e67780c9980', 'FORNO7', 'telegram', 'demo-73bbsm', '54586f1f-2f42-41d8-87d8-7da2b8d0c6ea', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 17:51:02.945+08', '2026-10-20 17:51:00+08', 'Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.', '2026-10-20 17:51:00+08');
INSERT INTO public.threads VALUES ('038e5bf9-2340-4be6-b20d-fafeea128381', 'FORNO7', 'whatsapp', 'demo-27evqa', '5a87f0e0-053d-42fb-b5e9-432773a2e3f1', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 12:06:03.576+08', '2026-10-20 12:06:00+08', 'Yes, on Medium and Large, priced at the more expensive half.', '2026-10-20 12:06:00+08');
INSERT INTO public.threads VALUES ('1c37665a-97eb-4f06-9ebb-96fac353588c', 'FORNO7', 'telegram', 'demo-2zbfhd', 'b99fb31c-de0a-41db-9c19-36010d181f49', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 15:22:02.434+08', '2026-10-20 15:22:00+08', 'Send us your booking reference here. Cancellation is free up to 2 hours before.', '2026-10-20 15:22:00+08');
INSERT INTO public.threads VALUES ('8ea48af2-8fe6-47d4-be51-5a6f3abf980a', 'FORNO7', 'simulator', 'demo-1qdi5r', '75fc7e64-8f0d-43a0-9bc3-46ed36fcd724', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 10:20:02.341+08', '2026-10-20 10:20:00+08', 'Up to 10 can be booked here. For 11 or more, our events team arranges the table personally.', '2026-10-20 10:20:00+08');
INSERT INTO public.threads VALUES ('560a013a-de13-4c1a-a167-a11da9407734', 'FORNO7', 'telegram', 'demo-2hk3kv', 'af17bf0f-09e5-474d-9822-71b11b1669d8', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 18:17:02.791+08', '2026-10-20 18:17:00+08', 'Sorry, the Funghi e Tartufo is sold out today. Our truffle delivery is late, it''s back tomorrow. The Quattro Formaggi is the closest rich, cheesy pick.', '2026-10-20 18:17:00+08');
INSERT INTO public.threads VALUES ('ab5e6df1-7060-49a8-9c1e-24751da7bec9', 'FORNO7', 'whatsapp', 'demo-96n9vs', 'af85d95c-fec4-4ca3-aaef-470170355ab0', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 18:07:01.618+08', '2026-10-20 18:07:00+08', 'Extra mozzarella RM 4, a whole burrata RM 12.', '2026-10-20 18:07:00+08');
INSERT INTO public.threads VALUES ('4462de1e-d561-4dea-ba17-bb0312c71f35', 'FORNO7', 'telegram', 'demo-aezve1', '9398e3e7-3020-46cb-9bc8-ba79d7cc37cc', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 22:17:02.156+08', '2026-10-20 22:17:00+08', 'House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.', '2026-10-20 22:17:00+08');
INSERT INTO public.threads VALUES ('ea5b3a32-210c-48a4-a934-0e8192dd117d', 'FORNO7', 'telegram', 'demo-6jklfw', '0a0229d1-d929-4136-a46d-521bc87d5478', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 17:30:02.404+08', '2026-10-20 17:30:00+08', 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '2026-10-20 17:30:00+08');
INSERT INTO public.threads VALUES ('6281acda-00f2-46af-b896-59710afd3390', 'FORNO7', 'telegram', 'demo-8d5os1', '98bd9ebd-c2a8-4cc0-8a20-baeb84c28547', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 15:03:02.92+08', '2026-10-20 15:03:00+08', 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '2026-10-20 15:03:00+08');
INSERT INTO public.threads VALUES ('83cd1aea-879d-4b4d-a951-3223243bbeac', 'FORNO7', 'telegram', 'demo-emx7hn', 'b0118aae-5ee3-4c53-a420-40a0d3fe5d55', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 22:15:02.701+08', '2026-10-20 22:15:00+08', 'Let me check with the team and get back to you.', '2026-10-20 22:15:00+08');
INSERT INTO public.threads VALUES ('2d516a79-9363-4238-a2a0-6641c586d20b', 'FORNO7', 'telegram', 'demo-85csb', 'fc59f0ab-5a65-4d45-88b0-c0d8ff5fbd18', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 19:00:02.161+08', '2026-10-20 19:00:00+08', 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '2026-10-20 19:00:00+08');
INSERT INTO public.threads VALUES ('f52ea72e-cefd-4b92-92e2-f815478f6dc5', 'FORNO7', 'telegram', 'demo-dgwjvb', '1e3130f7-246e-41dc-99cb-98fd6b659255', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 09:17:03.482+08', '2026-10-20 09:17:00+08', 'Large Margherita (15") is RM 52. Medium RM 38, Small RM 28.', '2026-10-20 09:17:00+08');
INSERT INTO public.threads VALUES ('a3aa3536-6ce5-4d5e-80f9-8f1daa385d3f', 'FORNO7', 'whatsapp', 'demo-f1o5o4', '0365d026-25de-452a-9b86-4c9b7cc7870e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 16:03:02.787+08', '2026-10-20 16:03:00+08', 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '2026-10-20 16:03:00+08');
INSERT INTO public.threads VALUES ('6bf60aab-5f5f-4783-9d2a-f458842d6d6e', 'FORNO7', 'telegram', 'demo-b2uavg', '1661ab25-75e8-4a9f-b536-8cb6ee798931', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 15:44:01.38+08', '2026-10-20 15:44:00+08', 'Yes. The ground floor is step-free and we have an accessible restroom.', '2026-10-20 15:44:00+08');
INSERT INTO public.threads VALUES ('01993c7b-5118-4886-a9c9-8f1f7ee46746', 'FORNO7', 'telegram', 'demo-5rq49n', '83b7bd75-d55c-4a2f-99f8-117de00ce074', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 18:25:02.643+08', '2026-10-20 18:25:00+08', 'Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.', '2026-10-20 18:25:00+08');
INSERT INTO public.threads VALUES ('23be8580-dccb-45aa-b4a9-5baf881b6b05', 'FORNO7', 'whatsapp', 'demo-9v514n', '2497d7a4-2c11-43b2-95eb-ed5918e53d04', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 12:28:02.427+08', '2026-10-20 12:28:00+08', 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '2026-10-20 12:28:00+08');
INSERT INTO public.threads VALUES ('bd0e9938-9ccd-49f5-a6d0-08cbbed3b2de', 'FORNO7', 'telegram', 'demo-ej3ize', '0e3a4830-d354-4fcb-9d3e-aef5358ac5be', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 16:46:01.778+08', '2026-10-20 16:46:00+08', 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '2026-10-20 16:46:00+08');
INSERT INTO public.threads VALUES ('1865fa8c-fe32-41cd-81d8-aaddd240102c', 'FORNO7', 'telegram', 'demo-bab2i5', '8332009a-1ebc-4ba7-b8d9-822f0ff08d18', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 22:29:02.853+08', '2026-10-20 22:29:00+08', 'Extra mozzarella RM 4, a whole burrata RM 12.', '2026-10-20 22:29:00+08');
INSERT INTO public.threads VALUES ('c28f0616-5bfc-420d-8cc3-fb18684bafcd', 'FORNO7', 'whatsapp', 'demo-eys5f9', '3ffbd5c3-f282-46a8-9d8f-25c6bd96776e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-20 10:39:03.584+08', '2026-10-20 10:39:00+08', 'We have free Wi-Fi; staff will share the password at your table.', '2026-10-20 10:39:00+08');
INSERT INTO public.threads VALUES ('67690ceb-77ef-4354-9c89-8f2f6b204b72', 'FORNO7', 'whatsapp', 'demo-cfj7cw', 'aec767d8-3670-4f58-a72c-dec4145b999e', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 18:03:03.386+08', '2026-10-21 18:03:00+08', 'Let me check with the team and come back to you here.', '2026-10-21 18:03:00+08');
INSERT INTO public.threads VALUES ('2b14345c-af55-4793-8fe7-136b26ce114a', 'FORNO7', 'telegram', 'demo-4sbj4z', '0cefb286-7827-4987-994d-9117b6c73b20', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 15:57:01.282+08', '2026-10-21 15:57:00+08', 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '2026-10-21 15:57:00+08');
INSERT INTO public.threads VALUES ('042429ba-3593-4484-9f44-37f7668e83d7', 'FORNO7', 'telegram', 'demo-a094ne', 'f305022c-1080-4825-a8b6-7feafa825ac3', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 15:24:02.595+08', '2026-10-21 15:24:00+08', 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '2026-10-21 15:24:00+08');
INSERT INTO public.threads VALUES ('ea752b88-87fa-48d6-81aa-95dba14f8c1a', 'FORNO7', 'telegram', 'demo-beety7', '8a61a55e-0923-4537-88ad-97923f244971', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 15:41:02.839+08', '2026-10-21 15:41:00+08', 'Dogs are welcome on our terrace and we''ll bring a water bowl.', '2026-10-21 15:41:00+08');
INSERT INTO public.threads VALUES ('4c397e1a-bc61-49ec-8751-20b18596b24e', 'FORNO7', 'telegram', 'demo-1qvgox', 'a0407077-44a2-4e28-8426-73aa26bf2273', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 13:14:01.823+08', '2026-10-21 13:14:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-21 13:14:00+08');
INSERT INTO public.threads VALUES ('2ae0bfce-0800-439e-ada2-4537c0e13eda', 'FORNO7', 'telegram', 'demo-2gscy8', '895db009-a160-4b5e-ab12-0b94607c4a81', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 18:32:02.292+08', '2026-10-21 18:32:00+08', '27 Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur, two minutes from Bangsar Village II.', '2026-10-21 18:32:00+08');
INSERT INTO public.threads VALUES ('38911f8c-f99e-4267-90c0-dc09b77bb253', 'FORNO7', 'whatsapp', 'demo-1p0nie', '863ce1d7-e8d2-439d-8463-afdad788a465', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 16:17:01.695+08', '2026-10-21 16:17:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-21 16:17:00+08');
INSERT INTO public.threads VALUES ('fac9385d-cc52-4744-90c3-53379496fc5e', 'FORNO7', 'whatsapp', 'demo-ew7uu8', 'f765044b-a2d2-4924-a605-83412832e62c', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 15:50:02.713+08', '2026-10-21 15:50:00+08', 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '2026-10-21 15:50:00+08');
INSERT INTO public.threads VALUES ('20e66e7a-37ae-408f-a764-9d95594afa62', 'FORNO7', 'telegram', 'demo-5kc942', '7031750a-d414-4cca-b703-b5b8ac6ca370', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 11:23:01.791+08', '2026-10-21 11:23:00+08', 'Peroni, two local craft beers, and Italian wines. 18+ only.', '2026-10-21 11:23:00+08');
INSERT INTO public.threads VALUES ('fb4f2675-613d-4b34-9cd3-5de1a4aa7625', 'FORNO7', 'telegram', 'demo-t0hju', 'b7068cbe-744c-4e55-9e92-1d3e8931c175', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 16:41:01.518+08', '2026-10-21 16:41:00+08', 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '2026-10-21 16:41:00+08');
INSERT INTO public.threads VALUES ('4d4b5c85-6bf0-419f-ac45-975384dbffbd', 'FORNO7', 'whatsapp', 'demo-avnro', '23e27293-ec95-4126-8755-fd5937042ead', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 09:20:01.487+08', '2026-10-21 09:20:00+08', 'Peroni, two local craft beers, and Italian wines. 18+ only.', '2026-10-21 09:20:00+08');
INSERT INTO public.threads VALUES ('57d4db16-9a36-41c4-87ff-a8f30d8b05cc', 'FORNO7', 'telegram', 'demo-fo9jzq', '9e56b4d1-5c4e-414a-8485-198629d24b95', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 11:03:03.472+08', '2026-10-21 11:03:00+08', 'Extra mozzarella RM 4, a whole burrata RM 12.', '2026-10-21 11:03:00+08');
INSERT INTO public.threads VALUES ('35174849-68e0-4994-a782-44b856871b1b', 'FORNO7', 'telegram', 'demo-bjfvik', '21baf1c9-1d26-4daa-826f-ac12d253eb93', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 16:55:02.516+08', '2026-10-21 16:55:00+08', 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '2026-10-21 16:55:00+08');
INSERT INTO public.threads VALUES ('6a3a3404-36c8-4da3-8341-8636a9c921fe', 'FORNO7', 'telegram', 'demo-esv0el', '00fb8e68-99ed-4541-9910-58e75042d777', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 12:58:03.45+08', '2026-10-21 12:58:00+08', 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '2026-10-21 12:58:00+08');
INSERT INTO public.threads VALUES ('bba8281c-5e7a-41f6-9683-78b32be5d4d4', 'FORNO7', 'telegram', 'demo-7gyo38', '88aae22c-cd08-4526-8f28-c0282d52c112', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 10:14:01.708+08', '2026-10-21 10:14:00+08', 'Thank you! The oven crew will be very happy to hear it.', '2026-10-21 10:14:00+08');
INSERT INTO public.threads VALUES ('1ceb7a09-4599-4071-8399-30b9b1411e36', 'FORNO7', 'telegram', 'demo-cdnfzc', '1f47ccbe-1d32-492e-b6cf-742f5e734d80', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 14:51:03.335+08', '2026-10-21 14:51:00+08', 'I''ll check with the team and let you know here.', '2026-10-21 14:51:00+08');
INSERT INTO public.threads VALUES ('c0965d2c-517a-45f1-87e7-8a16a851a385', 'FORNO7', 'telegram', 'demo-dxagsi', '1c4d7229-fb3e-49ea-9c5b-5869ff8028c1', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 14:02:01.86+08', '2026-10-21 14:02:00+08', 'So sorry. Please send a photo; our duty manager reviews it personally and will make it right.', '2026-10-21 14:02:00+08');
INSERT INTO public.threads VALUES ('4fa57ba0-986e-4a8e-a632-639dac03923d', 'FORNO7', 'whatsapp', 'demo-66ouj1', '041859ce-af2c-4f57-9cbd-69f1e65008f8', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 16:59:02.412+08', '2026-10-21 16:59:00+08', '27 Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur, two minutes from Bangsar Village II.', '2026-10-21 16:59:00+08');
INSERT INTO public.threads VALUES ('0d42a830-ca7f-48a5-a19a-ab6bdbc353d5', 'FORNO7', 'simulator', 'demo-9o6xbx', 'b23ab204-8d80-4199-88e3-6a2fa9ea9117', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 18:24:01.412+08', '2026-10-21 18:24:00+08', 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '2026-10-21 18:24:00+08');
INSERT INTO public.threads VALUES ('f3d6c311-489d-4af9-9ee0-efc7640cc0ce', 'FORNO7', 'whatsapp', 'demo-35hvyj', '9cd90161-dae8-4ad8-a7b9-6ddc2b20062a', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 16:28:01.666+08', '2026-10-21 16:28:00+08', 'Let me check with the team and come back to you here.', '2026-10-21 16:28:00+08');
INSERT INTO public.threads VALUES ('eba0fe7b-e7e2-48ef-b7d0-55544daa53f7', 'FORNO7', 'telegram', 'demo-1ijh5n', 'b082576a-93e0-4d91-a2d7-0b294920e754', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 19:13:02.805+08', '2026-10-21 19:13:00+08', 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '2026-10-21 19:13:00+08');
INSERT INTO public.threads VALUES ('1ad9b09b-d713-4b45-98f2-f4a7098216f0', 'FORNO7', 'telegram', 'demo-2jq9of', '312b4b03-76c3-4713-843a-37ecc2062e59', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 19:31:02.986+08', '2026-10-21 19:31:00+08', 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '2026-10-21 19:31:00+08');
INSERT INTO public.threads VALUES ('08cfa963-273b-44d7-8dd2-d5038ebc2fa0', 'FORNO7', 'whatsapp', 'demo-32w4yj', 'ad76641d-2d79-4cf5-990e-7af1c14bcec1', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 12:39:01.821+08', '2026-10-21 12:39:00+08', 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '2026-10-21 12:39:00+08');
INSERT INTO public.threads VALUES ('b3b96970-562b-438c-82e7-25dbfe20ab16', 'FORNO7', 'telegram', 'demo-b43k7n', '0beb835c-70e9-4c1c-a1bd-e33e468df627', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 11:38:03.542+08', '2026-10-21 11:38:00+08', 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '2026-10-21 11:38:00+08');
INSERT INTO public.threads VALUES ('8750e4f7-2984-4035-b7ef-68a9fe8c192f', 'FORNO7', 'telegram', 'demo-6xkpec', 'ce2d0550-299e-4f66-8b58-a65978de4cdb', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 17:14:01.601+08', '2026-10-21 17:14:00+08', 'The Pollo Pesto contains pine nuts, and our kitchen handles tree nuts, so cross-contact is possible. Our manager will talk you through it before you order.', '2026-10-21 17:14:00+08');
INSERT INTO public.threads VALUES ('14f0241f-f4bb-47fa-8882-430ce1968f49', 'FORNO7', 'simulator', 'demo-45rzgw', '39ff828a-9461-481f-b495-b36f883c18a1', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 18:09:03.103+08', '2026-10-21 18:09:00+08', 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '2026-10-21 18:09:00+08');
INSERT INTO public.threads VALUES ('c03fc05a-1978-43c1-a79a-d8ee32e25f10', 'FORNO7', 'simulator', 'demo-1do1td', '20b1f3a7-9fd9-4b06-b2bb-a7fd1e6d51c3', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 10:49:02.933+08', '2026-10-21 10:49:00+08', 'Let me check with the team and come back to you here.', '2026-10-21 10:49:00+08');
INSERT INTO public.threads VALUES ('a8b5eb4a-39ce-4305-a7f6-a6fe32f49e7f', 'FORNO7', 'telegram', 'demo-ad1ipf', 'f2435cc8-5296-4b4f-aa1b-63fedca32341', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 11:30:01.774+08', '2026-10-21 11:30:00+08', 'Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.', '2026-10-21 11:30:00+08');
INSERT INTO public.threads VALUES ('075496a8-529d-46f7-a4c5-c1e2dd8fa210', 'FORNO7', 'telegram', 'demo-c7rja8', '14ac072b-1134-4c58-9ab4-1bf430e2ec11', 'resolved', false, NULL, '{}', NULL, true, '2026-10-21 15:48:02.685+08', '2026-10-21 15:48:00+08', 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '2026-10-21 15:48:00+08');


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: jawab
--

INSERT INTO public.messages VALUES ('cefcdf66-3f1c-4cef-9767-99a83cd95b09', 'FORNO7', '5276dd22-b944-4558-9441-1c45d30c5528', 'in', 'customer', NULL, 'sunday lunch 6 pax 1pm got table?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 21:20:00+08');
INSERT INTO public.messages VALUES ('53c1a88c-a037-41f8-af1e-a1021d31ec94', 'FORNO7', '5276dd22-b944-4558-9441-1c45d30c5528', 'out', 'ai', NULL, 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '[]', 'sent', NULL, '0e7cab40-a781-4f62-b428-aac97af36bb4', NULL, true, '2026-10-14 21:20:02.847+08');
INSERT INTO public.messages VALUES ('9297ad9a-361d-4b5d-a0ba-94f009afda63', 'FORNO7', '3dbc9095-1747-44ad-b3cf-dfae5225132f', 'in', 'customer', NULL, 'the truffle one available today?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 09:26:00+08');
INSERT INTO public.messages VALUES ('1f999e3a-8722-481b-ab9a-bed9607b3ac9', 'FORNO7', '3dbc9095-1747-44ad-b3cf-dfae5225132f', 'out', 'ai', NULL, 'Sorry, the Funghi e Tartufo is sold out today. Our truffle delivery is late, it''s back tomorrow. The Quattro Formaggi is the closest rich, cheesy pick.', '[]', 'sent', NULL, 'ccee426b-18f8-4c3b-b7b4-71c48c8036ae', NULL, true, '2026-10-14 09:26:02.472+08');
INSERT INTO public.messages VALUES ('c16284e4-fa01-46db-924d-75ca9fd17963', 'FORNO7', '5eb9ca6c-27aa-49cc-bf87-991bff2f9ab5', 'in', 'customer', NULL, 'tshirt size M black ada?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 13:28:00+08');
INSERT INTO public.messages VALUES ('385fc4e4-ade6-4256-9fa7-e55208d205a9', 'FORNO7', '5eb9ca6c-27aa-49cc-bf87-991bff2f9ab5', 'out', 'ai', NULL, 'Our dark tee is Charcoal and size M is in stock, RM 59. Want me to hold one at the counter?', '[]', 'sent', NULL, '02fcdbe3-cb31-4765-aec7-15900b61ac5d', NULL, true, '2026-10-14 13:28:02.632+08');
INSERT INTO public.messages VALUES ('7eea7708-9dab-45ad-ac81-7677d500a068', 'FORNO7', '32c0df05-aaf2-4518-bc1c-99933ae9b4eb', 'in', 'customer', NULL, 'any dress code', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 21:01:00+08');
INSERT INTO public.messages VALUES ('79fda19b-5dfb-4928-87a9-9c73dcf5742d', 'FORNO7', '32c0df05-aaf2-4518-bc1c-99933ae9b4eb', 'out', 'ai', NULL, 'No dress code at all.', '[]', 'sent', NULL, '5c097a8d-02a2-45c2-9655-e97c162a784f', NULL, true, '2026-10-14 21:01:01.379+08');
INSERT INTO public.messages VALUES ('bdde0f29-cfad-40a6-8a28-7834c8275a0a', 'FORNO7', 'd1425935-6a3d-41be-b677-022c09128da7', 'in', 'customer', NULL, 'cauliflower crust can?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 19:04:00+08');
INSERT INTO public.messages VALUES ('eca68ff9-e444-4198-9fe1-2c6752113ef9', 'FORNO7', 'd1425935-6a3d-41be-b677-022c09128da7', 'out', 'ai', NULL, 'Let me check with the team and get back to you.', '[]', 'sent', NULL, 'a6861610-aa21-4107-860f-f36a370697ba', NULL, true, '2026-10-14 19:04:02.448+08');
INSERT INTO public.messages VALUES ('1f26554e-d6ea-4e90-bb7f-c20e13b7b90f', 'FORNO7', '5a7d9818-016a-425b-8be6-56c6c1c6fc1e', 'in', 'customer', NULL, 'wifi pw?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 17:05:00+08');
INSERT INTO public.messages VALUES ('304dbc5b-a808-4c51-8af7-a4f10adcb7b1', 'FORNO7', '5a7d9818-016a-425b-8be6-56c6c1c6fc1e', 'out', 'ai', NULL, 'We have free Wi-Fi; staff will share the password at your table.', '[]', 'sent', NULL, 'cc8ad320-d99b-4267-a9d4-3134d5b9b5db', NULL, true, '2026-10-14 17:05:01.908+08');
INSERT INTO public.messages VALUES ('e9075423-b1ad-46ae-b04e-517f5f3ef1d1', 'FORNO7', '4e4dccae-5815-43c5-a42a-8a093abf5ae5', 'in', 'customer', NULL, 'can do half half pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 15:02:00+08');
INSERT INTO public.messages VALUES ('99a9601f-d426-482f-b8ad-373208197fe5', 'FORNO7', '4e4dccae-5815-43c5-a42a-8a093abf5ae5', 'out', 'ai', NULL, 'Yes, on Medium and Large, priced at the more expensive half.', '[]', 'sent', NULL, '3cb0e21a-f95b-41b5-b1e8-fe1d36ee5b1c', NULL, true, '2026-10-14 15:02:01.951+08');
INSERT INTO public.messages VALUES ('b708d6d0-e31e-4b89-b915-2ade310455f3', 'FORNO7', 'f3417c0f-c457-4541-b6c6-b12701de59cd', 'in', 'customer', NULL, 'sell frozen pizza to bring home?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 10:49:00+08');
INSERT INTO public.messages VALUES ('0430205b-b0a7-42de-b9cc-5109f9d0e539', 'FORNO7', 'f3417c0f-c457-4541-b6c6-b12701de59cd', 'out', 'ai', NULL, 'I''ll check with the team and let you know here.', '[]', 'sent', NULL, 'dded741b-567c-43b7-8b7a-080447f98504', NULL, true, '2026-10-14 10:49:01.735+08');
INSERT INTO public.messages VALUES ('0b98150a-aad5-4a9d-bf65-87aafee17457', 'FORNO7', '66fff1a1-9c48-417c-8112-dcd7bfc382e6', 'in', 'customer', NULL, 'can bring birthday cake? any charge', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 21:24:00+08');
INSERT INTO public.messages VALUES ('9cdf1718-8b45-4b32-a1ca-667325c665b2', 'FORNO7', '66fff1a1-9c48-417c-8112-dcd7bfc382e6', 'out', 'ai', NULL, 'Of course, bring your own cake. There''s no cake-cutting fee.', '[]', 'sent', NULL, '4513215c-62d4-4ae3-a7ed-a78bb194714e', NULL, true, '2026-10-14 21:24:03.272+08');
INSERT INTO public.messages VALUES ('8f91106a-1f5b-4a27-bcda-a6ea4379184a', 'FORNO7', '052ec39c-69c5-4885-acca-da5845b21ffb', 'in', 'customer', NULL, 'kids menu?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 21:42:00+08');
INSERT INTO public.messages VALUES ('ceb3006c-0846-4011-b0f6-185a019fbbdb', 'FORNO7', '052ec39c-69c5-4885-acca-da5845b21ffb', 'out', 'ai', NULL, 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '[]', 'sent', NULL, '7dc96c65-e9c5-4d0e-afb7-80d5b8381fd6', NULL, true, '2026-10-14 21:42:01.313+08');
INSERT INTO public.messages VALUES ('aa3558a4-85c5-4cc1-a7ac-3f31e9055049', 'FORNO7', 'd8477a19-dec5-42c7-9770-cecaedbee2fe', 'in', 'customer', NULL, 'dog friendly??', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 09:24:00+08');
INSERT INTO public.messages VALUES ('a35694a2-835a-41a4-a522-ea99d324b275', 'FORNO7', 'd8477a19-dec5-42c7-9770-cecaedbee2fe', 'out', 'ai', NULL, 'Dogs are welcome on our terrace and we''ll bring a water bowl.', '[]', 'sent', NULL, 'f0f266cc-7248-47e2-a41c-00e401573df2', NULL, true, '2026-10-14 09:24:01.593+08');
INSERT INTO public.messages VALUES ('7e2d3a30-53de-440f-8e28-8d51d14bba65', 'FORNO7', 'a2386fda-f389-4a72-96f9-6c7a26a84461', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 14:51:00+08');
INSERT INTO public.messages VALUES ('82c4704f-8a6b-4520-a063-2e911b2eed3e', 'FORNO7', 'a2386fda-f389-4a72-96f9-6c7a26a84461', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, 'b4732df5-6d7f-4b4c-af0b-1df6a7ad8457', NULL, true, '2026-10-14 14:51:01.985+08');
INSERT INTO public.messages VALUES ('c62406ed-f9a4-47c9-97a2-8a50fa81a42e', 'FORNO7', '1e3b40f7-4b3b-4ab9-83de-91697fbff130', 'in', 'customer', NULL, 'can bring birthday cake? any charge', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 13:10:00+08');
INSERT INTO public.messages VALUES ('bfd19ad3-c9e6-44d9-a4de-582449abcc92', 'FORNO7', '1e3b40f7-4b3b-4ab9-83de-91697fbff130', 'out', 'ai', NULL, 'Of course, bring your own cake. There''s no cake-cutting fee.', '[]', 'sent', NULL, 'e05a9095-5a2b-4f7f-8f5c-dea81e7f66fa', NULL, true, '2026-10-14 13:10:02.867+08');
INSERT INTO public.messages VALUES ('2c5a0858-aa80-491a-a7c6-790ae3c0375a', 'FORNO7', '97f62b35-5935-4830-989a-1606982fb07f', 'in', 'customer', NULL, 'open christmas day?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 11:54:00+08');
INSERT INTO public.messages VALUES ('781713dd-23fb-44c1-9fa0-a4c834b54d2b', 'FORNO7', '97f62b35-5935-4830-989a-1606982fb07f', 'out', 'ai', NULL, 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '[]', 'sent', NULL, 'e0ed366b-af3e-47f2-8d21-09773b5fee12', NULL, true, '2026-10-14 11:54:03.148+08');
INSERT INTO public.messages VALUES ('e88ed56d-7bab-426a-ab93-53ff16f4cb98', 'FORNO7', '83fc99be-338b-4857-8ce1-413271e7e126', 'in', 'customer', NULL, 'tshirt size M black ada?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 21:31:00+08');
INSERT INTO public.messages VALUES ('185b9dab-b775-4291-a7cf-5e12e682d124', 'FORNO7', '83fc99be-338b-4857-8ce1-413271e7e126', 'out', 'ai', NULL, 'Our dark tee is Charcoal and size M is in stock, RM 59. Want me to hold one at the counter?', '[]', 'sent', NULL, 'bf3831c3-4294-4854-8fb6-b69541703458', NULL, true, '2026-10-14 21:31:01.7+08');
INSERT INTO public.messages VALUES ('e5524f40-cb7d-417b-80a6-fa597ecc204e', 'FORNO7', 'aa4521a8-b095-40fa-a3b9-651fa49695d9', 'in', 'customer', NULL, 'sunday lunch 6 pax 1pm got table?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 20:48:00+08');
INSERT INTO public.messages VALUES ('7d2a2c48-b3a0-45fb-98a9-9e4851db9978', 'FORNO7', 'aa4521a8-b095-40fa-a3b9-651fa49695d9', 'out', 'ai', NULL, 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '[]', 'sent', NULL, 'c7845581-d818-498a-8593-bf7adf96cabd', NULL, true, '2026-10-14 20:48:02.415+08');
INSERT INTO public.messages VALUES ('08ae8a2a-9670-407a-b840-8382414aaec8', 'FORNO7', 'd606ae58-c59a-444d-ae50-b3dd7a996e24', 'in', 'customer', NULL, 'hi um do you guys have like a table for two tomorrow around seven thanks', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 20:56:00+08');
INSERT INTO public.messages VALUES ('f7c52ee4-3938-43c9-9efc-08212e164477', 'FORNO7', 'd606ae58-c59a-444d-ae50-b3dd7a996e24', 'out', 'ai', NULL, 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '[]', 'sent', NULL, 'e944fbd4-a872-495b-92b3-1d277af6d168', NULL, true, '2026-10-14 20:56:02.834+08');
INSERT INTO public.messages VALUES ('602876c8-6cb9-4cd9-91b1-546e98defbb8', 'FORNO7', '0b6c29c5-aed2-493a-9ce2-4beab281cb69', 'in', 'customer', NULL, 'any promo now', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 11:07:00+08');
INSERT INTO public.messages VALUES ('8dcfd2bc-1c8e-4b0a-9bc1-984ec6c2e129', 'FORNO7', '0b6c29c5-aed2-493a-9ce2-4beab281cb69', 'out', 'ai', NULL, 'Lunch set Tuesday to Friday, 12–3pm: Small pizza, side salad and a lemonade or Italian soda for RM 29.', '[]', 'sent', NULL, '6f15429c-2490-4659-adf1-c5ef06b7248a', NULL, true, '2026-10-14 11:07:02.943+08');
INSERT INTO public.messages VALUES ('05fa80ab-4cb8-4a12-a257-bf1f4146841e', 'FORNO7', '6916f440-eb1c-44ee-97e3-b343b035fe59', 'in', 'customer', NULL, 'parking got or not', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 12:49:00+08');
INSERT INTO public.messages VALUES ('5f84aadb-1e4b-4cfe-a920-1d827e2cdb5f', 'FORNO7', '6916f440-eb1c-44ee-97e3-b343b035fe59', 'out', 'ai', NULL, 'Bangsar Village II basement is a 2-minute walk, or street parking through the Flexi Parking app.', '[]', 'sent', NULL, '34f4fe2b-ef9e-4c4e-930c-52dacd0e0ca0', NULL, true, '2026-10-14 12:49:02.565+08');
INSERT INTO public.messages VALUES ('da85f486-cd0f-47ba-b177-9440954d58c1', 'FORNO7', 'e049d90c-e345-401d-b888-1da5305c93d6', 'in', 'customer', NULL, 'the apron got in red?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 16:14:00+08');
INSERT INTO public.messages VALUES ('81fd7c5c-d826-40e2-af9b-b22d31669c11', 'FORNO7', 'e049d90c-e345-401d-b888-1da5305c93d6', 'out', 'ai', NULL, 'Yes, Brick Red aprons are in stock in S, M and L (RM 69). XL has just one left.', '[]', 'sent', NULL, '2704e25f-0f1e-485b-8f14-508ce648566b', NULL, true, '2026-10-14 16:14:01.996+08');
INSERT INTO public.messages VALUES ('de74d738-90bd-421f-8541-1f3820b3b4a1', 'FORNO7', '0b24124f-5cc2-4297-8780-b9b3d3654992', 'in', 'customer', NULL, 'can smoke at the terrace?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 16:40:00+08');
INSERT INTO public.messages VALUES ('bb121749-9e01-4fe0-b2c7-c7c53c10d410', 'FORNO7', '0b24124f-5cc2-4297-8780-b9b3d3654992', 'out', 'ai', NULL, 'Sorry, smoking and vaping aren''t allowed anywhere at the restaurant, including the terrace.', '[]', 'sent', NULL, 'fbf4c540-fc5c-40ec-9ed6-f713bc388930', NULL, true, '2026-10-14 16:40:01.555+08');
INSERT INTO public.messages VALUES ('46a62fbe-9e88-4812-98cd-8b9bfb650529', 'FORNO7', 'e635688e-a7a6-49a7-bbd1-2a898e50917e', 'in', 'customer', NULL, 'rendang pizza spicy or not', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 10:22:00+08');
INSERT INTO public.messages VALUES ('b6311c14-1ea5-4aa3-9b8b-b275cbed845a', 'FORNO7', 'e635688e-a7a6-49a7-bbd1-2a898e50917e', 'out', 'ai', NULL, 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '[]', 'sent', NULL, 'cf8ede8d-688b-4e12-a878-999a5a1bd703', NULL, true, '2026-10-14 10:22:02.886+08');
INSERT INTO public.messages VALUES ('a6eab984-10eb-4f93-9d6b-2a1f7ded0e73', 'FORNO7', '46b33bd0-97da-406a-b646-69721247f4a3', 'in', 'customer', NULL, 'thank youuu the pizza was amazing last night!!', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 16:51:00+08');
INSERT INTO public.messages VALUES ('3069b735-868e-4b60-8d0f-b3bc8c2f6c6d', 'FORNO7', '46b33bd0-97da-406a-b646-69721247f4a3', 'out', 'ai', NULL, 'That made our day, thank you! Come back soon.', '[]', 'sent', NULL, '579025b9-22bc-4988-b913-b81eacf844a5', NULL, true, '2026-10-14 16:51:01.881+08');
INSERT INTO public.messages VALUES ('3f2ae502-244f-48bb-8720-14028ceccffb', 'FORNO7', '983b300f-96c7-498c-913f-0ac14d4e202c', 'in', 'customer', NULL, 'the truffle one available today?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 22:19:00+08');
INSERT INTO public.messages VALUES ('bf7fb445-3fb0-44ed-b5ab-aa2233556fa8', 'FORNO7', '983b300f-96c7-498c-913f-0ac14d4e202c', 'out', 'ai', NULL, 'Sorry, the Funghi e Tartufo is sold out today. Our truffle delivery is late, it''s back tomorrow. The Quattro Formaggi is the closest rich, cheesy pick.', '[]', 'sent', NULL, '0c6058e2-56a5-42b5-b2e7-d9f814ef630c', NULL, true, '2026-10-14 22:19:02.843+08');
INSERT INTO public.messages VALUES ('5e24a189-a73e-436d-93ad-f2a42677aeea', 'FORNO7', '6f4af4ab-adaf-45ae-923d-046df5d989b3', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 16:41:00+08');
INSERT INTO public.messages VALUES ('68467562-46ab-45db-86f4-6848e24c6746', 'FORNO7', '6f4af4ab-adaf-45ae-923d-046df5d989b3', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, 'ed5ee639-7dfe-4536-a3ac-d5981e286c4f', NULL, true, '2026-10-14 16:41:03.562+08');
INSERT INTO public.messages VALUES ('c7b8eab9-ce58-469d-8c36-eedbe7598ce3', 'FORNO7', 'f1d93280-f94d-4418-a8e4-573248152832', 'in', 'customer', NULL, 'sell frozen pizza to bring home?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 13:00:00+08');
INSERT INTO public.messages VALUES ('3a470405-e34b-49c8-bcf0-c30b11f4a5c0', 'FORNO7', 'f1d93280-f94d-4418-a8e4-573248152832', 'out', 'ai', NULL, 'I''ll check with the team and let you know here.', '[]', 'sent', NULL, 'bd417c9d-c733-47da-90fe-468b51fc1058', NULL, true, '2026-10-14 13:00:03.05+08');
INSERT INTO public.messages VALUES ('b98665d9-3b0f-4ce8-9b37-4a781929e4c8', 'FORNO7', '8e29d1c6-64e2-471b-8374-20908730161c', 'in', 'customer', NULL, 'can bring own wine? corkage how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 15:35:00+08');
INSERT INTO public.messages VALUES ('39cb5212-ebd7-4073-99c9-e068138db309', 'FORNO7', '8e29d1c6-64e2-471b-8374-20908730161c', 'out', 'ai', NULL, 'Yes. Corkage is RM 40 per bottle, maximum 2 bottles per table.', '[]', 'sent', NULL, '4e17527f-9fae-444f-9671-bde425c5d826', NULL, true, '2026-10-14 15:35:02.21+08');
INSERT INTO public.messages VALUES ('3d5355ee-ee9f-4e04-b10a-134d627dcd8e', 'FORNO7', '36835bb7-2ac2-480c-8483-726e2c0cec3a', 'in', 'customer', NULL, 'do u deliver to mont kiara', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 11:20:00+08');
INSERT INTO public.messages VALUES ('4831603d-5513-47e6-9da1-6882a1174dbd', 'FORNO7', '36835bb7-2ac2-480c-8483-726e2c0cec3a', 'out', 'ai', NULL, 'Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.', '[]', 'sent', NULL, '86f724fe-5b8a-438a-8b6c-e37d7baf48a9', NULL, true, '2026-10-14 11:20:03.21+08');
INSERT INTO public.messages VALUES ('89a5b534-dfe2-4b3f-9759-e547a5a23bf7', 'FORNO7', 'f4716ec2-df86-4272-b130-bef0c83a14bf', 'in', 'customer', NULL, 'can write my assignment about italy', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 12:46:00+08');
INSERT INTO public.messages VALUES ('c2de3dfc-e5f0-458c-b1fe-50bae7c720b1', 'FORNO7', 'f4716ec2-df86-4272-b130-bef0c83a14bf', 'out', 'ai', NULL, 'Sorry, I can only help with Forno Sette''s menu, bookings and orders.', '[]', 'sent', NULL, '8abaa6a8-84c0-4365-ba84-035e90d9842f', NULL, true, '2026-10-14 12:46:02.028+08');
INSERT INTO public.messages VALUES ('0e020ac1-041b-4df3-b096-4df837b39a10', 'FORNO7', '9a1afaa5-a8d8-4a56-be16-6c261739fd75', 'in', 'customer', NULL, 'how big is the large pizza', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 12:54:00+08');
INSERT INTO public.messages VALUES ('2aee49fd-97cb-4b94-a969-a495f1bf061a', 'FORNO7', '9a1afaa5-a8d8-4a56-be16-6c261739fd75', 'out', 'ai', NULL, 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '[]', 'sent', NULL, '36722699-43ff-48ba-b702-b1fda02fa4ea', NULL, true, '2026-10-14 12:54:02.62+08');
INSERT INTO public.messages VALUES ('48d9c96c-bebf-4a01-a2cb-4984a9236a1c', 'FORNO7', '58a3601d-783b-4f7d-ad37-632e8c4fe992', 'in', 'customer', NULL, 'open on monday?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 09:49:00+08');
INSERT INTO public.messages VALUES ('42a22994-938b-463f-add9-213b98d82243', 'FORNO7', '58a3601d-783b-4f7d-ad37-632e8c4fe992', 'out', 'ai', NULL, 'We''re closed on Mondays. Tuesday to Sunday we''re open from midday (11am on Sundays).', '[]', 'sent', NULL, '9c1fcdae-e1bc-46a6-a3d4-4e0483d53ca6', NULL, true, '2026-10-14 09:49:03.576+08');
INSERT INTO public.messages VALUES ('cd1b20f2-3de8-44e2-b2cd-5af8768fc0e1', 'FORNO7', 'b8a833b1-17f3-46ad-aff1-b6335682c6ba', 'in', 'customer', NULL, 'large margherita how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 19:17:00+08');
INSERT INTO public.messages VALUES ('351ae64a-afb7-4ae1-b721-76548c294d20', 'FORNO7', 'b8a833b1-17f3-46ad-aff1-b6335682c6ba', 'out', 'ai', NULL, 'Large Margherita (15") is RM 52. Medium RM 38, Small RM 28.', '[]', 'sent', NULL, 'e408d1a4-458b-4309-bc5d-a3c1945fbae9', NULL, true, '2026-10-14 19:17:02.412+08');
INSERT INTO public.messages VALUES ('bbb5f468-fbc2-4eca-9971-8a6fd92a34ef', 'FORNO7', '0e84efee-fc1e-4977-b33d-d0abc72b269f', 'in', 'customer', NULL, 'open christmas day?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 20:05:00+08');
INSERT INTO public.messages VALUES ('d9401043-0b2e-4ede-9120-e46d8018a546', 'FORNO7', '0e84efee-fc1e-4977-b33d-d0abc72b269f', 'out', 'ai', NULL, 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '[]', 'sent', NULL, 'a4d18114-171a-42f5-acd6-a06dcdd60b62', NULL, true, '2026-10-14 20:05:02.525+08');
INSERT INTO public.messages VALUES ('3f6c9c62-2b10-4528-9ff1-3f24e5d6e623', 'FORNO7', '9dfed34b-00c3-4310-91c0-89018ad92474', 'in', 'customer', NULL, 'hi um do you guys have like a table for two tomorrow around seven thanks', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 18:14:00+08');
INSERT INTO public.messages VALUES ('abde3873-ef9e-4ddc-ac35-33a5f416f9f9', 'FORNO7', '9dfed34b-00c3-4310-91c0-89018ad92474', 'out', 'ai', NULL, 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '[]', 'sent', NULL, '5d1772e1-eec6-4f83-a080-56ebd8445694', NULL, true, '2026-10-14 18:14:02.452+08');
INSERT INTO public.messages VALUES ('d4e7afc1-87bc-46f2-98e5-cdc27aabd8fa', 'FORNO7', '4c53f247-9855-46ea-8d51-045e82ae6ddd', 'in', 'customer', NULL, 'can bring birthday cake? any charge', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 09:39:00+08');
INSERT INTO public.messages VALUES ('6b8cdff7-6bbb-46c4-8cd5-fb09ec8dbe41', 'FORNO7', '4c53f247-9855-46ea-8d51-045e82ae6ddd', 'out', 'ai', NULL, 'Of course, bring your own cake. There''s no cake-cutting fee.', '[]', 'sent', NULL, 'b15a0461-6bd2-4fed-94bd-880eb3b40452', NULL, true, '2026-10-14 09:39:03.27+08');
INSERT INTO public.messages VALUES ('589f30c5-3547-46f3-ad4b-0ac221ae9f83', 'FORNO7', 'bfaacc5b-c927-491b-80f6-c5af5c12f6d2', 'in', 'customer', NULL, 'do u deliver to mont kiara', '[]', 'received', NULL, NULL, NULL, true, '2026-10-14 20:56:00+08');
INSERT INTO public.messages VALUES ('61f82a14-8f6f-49ac-ba0f-566a540deaa1', 'FORNO7', 'bfaacc5b-c927-491b-80f6-c5af5c12f6d2', 'out', 'ai', NULL, 'Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.', '[]', 'sent', NULL, '6767c033-b1fd-46be-b500-8f7b8ac33d3c', NULL, true, '2026-10-14 20:56:02.331+08');
INSERT INTO public.messages VALUES ('17e3f44d-81eb-421c-99fa-19e817c76035', 'FORNO7', '66584375-ad0f-4ae9-9413-ee2789a4209d', 'in', 'customer', NULL, 'I want to discuss a franchise for Penang', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 22:42:00+08');
INSERT INTO public.messages VALUES ('9e41a75e-f293-4aba-8947-7c54f1da68e3', 'FORNO7', '66584375-ad0f-4ae9-9413-ee2789a4209d', 'out', 'ai', NULL, 'Thanks for your interest! I''ve passed this to our owner, who handles partnerships personally. They''ll reply here soon.', '[]', 'sent', NULL, 'ab1bf8f0-2515-4f56-93f0-766569be556a', NULL, true, '2026-10-15 22:42:03.029+08');
INSERT INTO public.messages VALUES ('d363807c-e388-44e3-96c3-bfe179e2563f', 'FORNO7', 'da0ee50b-5ac9-40bd-ae70-168d49664285', 'in', 'customer', NULL, 'any promo now', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 21:03:00+08');
INSERT INTO public.messages VALUES ('84dc10db-e8ee-4aa7-909b-6c1ee770bc35', 'FORNO7', 'da0ee50b-5ac9-40bd-ae70-168d49664285', 'out', 'ai', NULL, 'Lunch set Tuesday to Friday, 12–3pm: Small pizza, side salad and a lemonade or Italian soda for RM 29.', '[]', 'sent', NULL, '62dc4d70-f159-4b68-b178-385a45fefe02', NULL, true, '2026-10-15 21:03:01.298+08');
INSERT INTO public.messages VALUES ('7ebe4436-cf49-487e-88e0-44696b631ca1', 'FORNO7', '8fc48d9c-3221-45bd-9d08-1f73a43313e6', 'in', 'customer', NULL, 'wat time u close tonite', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 20:20:00+08');
INSERT INTO public.messages VALUES ('ef852786-ae2a-475c-9680-743aca34e97a', 'FORNO7', '8fc48d9c-3221-45bd-9d08-1f73a43313e6', 'out', 'ai', NULL, 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '[]', 'sent', NULL, '652b0c1e-3fde-4883-9068-8e90d4016295', NULL, true, '2026-10-15 20:20:02.429+08');
INSERT INTO public.messages VALUES ('ad9cbbf7-81cb-4bb8-b2f7-5ad3f18c71a9', 'FORNO7', 'eee49df7-c147-44bc-8452-e7f61666f7a5', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 09:03:00+08');
INSERT INTO public.messages VALUES ('d141fdf8-7c08-4d45-b343-f227e0e36fd0', 'FORNO7', 'eee49df7-c147-44bc-8452-e7f61666f7a5', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, '328c7b3e-37af-4ae3-8db8-8ffcd7b8fbb4', NULL, true, '2026-10-15 09:03:03.434+08');
INSERT INTO public.messages VALUES ('6908dfde-c741-437a-a18b-ff87519d0c0c', 'FORNO7', '9eb9e283-06da-4cc9-9927-ef3649d5d9d3', 'in', 'customer', NULL, 'the apron got in red?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 15:55:00+08');
INSERT INTO public.messages VALUES ('0290be4e-7b4b-4255-8e91-793163939af0', 'FORNO7', '9eb9e283-06da-4cc9-9927-ef3649d5d9d3', 'out', 'ai', NULL, 'Yes, Brick Red aprons are in stock in S, M and L (RM 69). XL has just one left.', '[]', 'sent', NULL, 'e379e24c-6084-4596-9429-2ec112d5a138', NULL, true, '2026-10-15 15:55:02.915+08');
INSERT INTO public.messages VALUES ('df26c34e-75dc-4309-9c17-f7f32ee08949', 'FORNO7', '61cfab1f-b17a-4f50-89ed-c939d4b3c8ab', 'in', 'customer', NULL, 'wat time u close tonite', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 21:44:00+08');
INSERT INTO public.messages VALUES ('91388c5d-deec-4113-a383-b7aa63affbb0', 'FORNO7', '61cfab1f-b17a-4f50-89ed-c939d4b3c8ab', 'out', 'ai', NULL, 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '[]', 'sent', NULL, 'c91a3184-003a-4879-be1c-693d81a41759', NULL, true, '2026-10-15 21:44:02.532+08');
INSERT INTO public.messages VALUES ('d6444319-9fc0-4891-b08d-8d7df4b07594', 'FORNO7', '90000df6-a761-44bb-8e52-57b8be5ab965', 'in', 'customer', NULL, 'rendang pizza spicy or not', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 22:32:00+08');
INSERT INTO public.messages VALUES ('9f9e1988-ad7e-4ee6-a052-975823390004', 'FORNO7', '90000df6-a761-44bb-8e52-57b8be5ab965', 'out', 'ai', NULL, 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '[]', 'sent', NULL, '185ca1d3-4f74-4374-b838-023fd7ea9bb5', NULL, true, '2026-10-15 22:32:01.414+08');
INSERT INTO public.messages VALUES ('c27d1c3c-837d-4e62-928a-ef5b20e76407', 'FORNO7', '682304cd-288d-4366-889c-957769fa55cc', 'in', 'customer', NULL, 'how big is the large pizza', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 10:55:00+08');
INSERT INTO public.messages VALUES ('ab4dbef0-74e6-483c-9a06-9fab8b4a342a', 'FORNO7', '682304cd-288d-4366-889c-957769fa55cc', 'out', 'ai', NULL, 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '[]', 'sent', NULL, '256ad2fd-6de3-42a4-aa19-6d877a981048', NULL, true, '2026-10-15 10:55:03.538+08');
INSERT INTO public.messages VALUES ('1334f232-0c14-4695-85e7-9727e9a16282', 'FORNO7', 'c153297b-223c-4091-a419-bceb329b39ed', 'in', 'customer', NULL, 'how big is the large pizza', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 21:15:00+08');
INSERT INTO public.messages VALUES ('38bbb085-0019-4090-b6c2-625d6192444f', 'FORNO7', 'c153297b-223c-4091-a419-bceb329b39ed', 'out', 'ai', NULL, 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '[]', 'sent', NULL, '2ee1426f-a00e-453e-a841-ade88ff1f2eb', NULL, true, '2026-10-15 21:15:02.115+08');
INSERT INTO public.messages VALUES ('3bc9251d-6d24-4ed1-983b-fd9eb0632551', 'FORNO7', '361a7f72-61cb-4b06-bd10-e52d0ff3c140', 'in', 'customer', NULL, 'can i pay with tng', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 22:56:00+08');
INSERT INTO public.messages VALUES ('448d9e47-093e-4b6a-94db-056f55ba0514', 'FORNO7', '361a7f72-61cb-4b06-bd10-e52d0ff3c140', 'out', 'ai', NULL, 'Yes, Touch ''n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.', '[]', 'sent', NULL, '04e9936d-bb9a-4584-b3e0-ce5f7b2efc98', NULL, true, '2026-10-15 22:56:03.109+08');
INSERT INTO public.messages VALUES ('a8a42981-7e4b-463a-914a-c0f86a857622', 'FORNO7', 'cb52e3fa-a820-4824-9cc2-dd0fdb765c72', 'in', 'customer', NULL, 'thank youuu the pizza was amazing last night!!', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 11:21:00+08');
INSERT INTO public.messages VALUES ('e204da51-1fb4-4f85-9269-d74d3f43b129', 'FORNO7', 'cb52e3fa-a820-4824-9cc2-dd0fdb765c72', 'out', 'ai', NULL, 'That made our day, thank you! Come back soon.', '[]', 'sent', NULL, '0afb2d4d-9a8c-4f33-a8d5-6fdd02e0f135', NULL, true, '2026-10-15 11:21:02.56+08');
INSERT INTO public.messages VALUES ('0eb6b0fe-daf3-4db3-991a-db4047ad6b03', 'FORNO7', 'e3ecd880-841a-4f7a-94e9-74acc50eac30', 'in', 'customer', NULL, 'wat time u close tonite', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 09:00:00+08');
INSERT INTO public.messages VALUES ('f7ee25d2-ea3f-490b-9452-7b980244f2dc', 'FORNO7', 'e3ecd880-841a-4f7a-94e9-74acc50eac30', 'out', 'ai', NULL, 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '[]', 'sent', NULL, 'db99f47e-39ff-46b0-9bcd-c6354f0570cb', NULL, true, '2026-10-15 09:00:01.283+08');
INSERT INTO public.messages VALUES ('031a63ca-1738-4d3b-9b39-a3bbc8854ada', 'FORNO7', 'bad27a6f-b4f9-45bb-84fd-54c32c34b693', 'in', 'customer', NULL, 'rendang pizza spicy or not', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 14:40:00+08');
INSERT INTO public.messages VALUES ('967e3d57-73ad-4bf6-a229-48584959469f', 'FORNO7', 'bad27a6f-b4f9-45bb-84fd-54c32c34b693', 'out', 'ai', NULL, 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '[]', 'sent', NULL, '8bc0a61b-76a4-4158-a611-a1352ea63dd4', NULL, true, '2026-10-15 14:40:02.766+08');
INSERT INTO public.messages VALUES ('84a26710-f22f-4297-abdf-e8f31e0734c3', 'FORNO7', '7ec38460-46bb-4eaa-af89-e487eeed5a0a', 'in', 'customer', NULL, 'non alcoholic drinks got what', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 14:48:00+08');
INSERT INTO public.messages VALUES ('03f240cc-d779-4213-9296-9a0e03145f53', 'FORNO7', '7ec38460-46bb-4eaa-af89-e487eeed5a0a', 'out', 'ai', NULL, 'House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.', '[]', 'sent', NULL, 'd5afc9d7-fbe8-4ef2-99f1-da55f222b5de', NULL, true, '2026-10-15 14:48:01.524+08');
INSERT INTO public.messages VALUES ('e8530f19-eba6-4c6b-bc31-c0e20772e69f', 'FORNO7', '5bc21fce-e9be-4468-9b90-a331abad83af', 'in', 'customer', NULL, 'non alcoholic drinks got what', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 15:02:00+08');
INSERT INTO public.messages VALUES ('4aba49ca-bb82-46a3-93fa-2101be036230', 'FORNO7', '5bc21fce-e9be-4468-9b90-a331abad83af', 'out', 'ai', NULL, 'House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.', '[]', 'sent', NULL, '48d64fb3-887c-4ace-b112-3066fc2e2980', NULL, true, '2026-10-15 15:02:03.338+08');
INSERT INTO public.messages VALUES ('1e46fbbc-72f5-4ff1-961c-8dada18d0716', 'FORNO7', '30a926ca-bc13-4e64-9a8f-e4d823440fd7', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 12:15:00+08');
INSERT INTO public.messages VALUES ('56b33792-bc31-4b3c-b059-760f689763bc', 'FORNO7', '30a926ca-bc13-4e64-9a8f-e4d823440fd7', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, 'e1ceab11-e3b8-45fa-985e-fe62e4a8545a', NULL, true, '2026-10-15 12:15:03.542+08');
INSERT INTO public.messages VALUES ('c6bb40af-c62d-41e5-b4ba-e383b010883b', 'FORNO7', '7b6096eb-7331-411b-ac72-18e57a6a8016', 'in', 'customer', NULL, 'any promo now', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 16:08:00+08');
INSERT INTO public.messages VALUES ('f1c77c1d-6145-4217-8f51-9066577c3e11', 'FORNO7', '7b6096eb-7331-411b-ac72-18e57a6a8016', 'out', 'ai', NULL, 'Lunch set Tuesday to Friday, 12–3pm: Small pizza, side salad and a lemonade or Italian soda for RM 29.', '[]', 'sent', NULL, '6ef168c8-5e00-4deb-8c21-59190868b0e8', NULL, true, '2026-10-15 16:08:03.359+08');
INSERT INTO public.messages VALUES ('f30cc551-7453-4ab6-abdd-a8c8fe2838d0', 'FORNO7', '67f376f7-8e0a-4e63-9f86-d2e4bdb47b04', 'in', 'customer', NULL, 'outdoor seating available?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 15:12:00+08');
INSERT INTO public.messages VALUES ('e2db237d-b20b-42b2-aec6-09866305a2b6', 'FORNO7', '67f376f7-8e0a-4e63-9f86-d2e4bdb47b04', 'out', 'ai', NULL, 'Yes, 6 tables on the terrace. It''s non-smoking.', '[]', 'sent', NULL, '0de131e9-00bd-4f52-aa33-f29607f550ea', NULL, true, '2026-10-15 15:12:02.701+08');
INSERT INTO public.messages VALUES ('d667503b-1c6c-44a7-82f3-a85dec2335fd', 'FORNO7', '4e95d0fb-3895-4f5f-8eac-a4932d7b1672', 'in', 'customer', NULL, 'open on monday?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 13:34:00+08');
INSERT INTO public.messages VALUES ('6787e9cc-dc6b-4755-a72b-d2c06f21a17c', 'FORNO7', '4e95d0fb-3895-4f5f-8eac-a4932d7b1672', 'out', 'ai', NULL, 'We''re closed on Mondays. Tuesday to Sunday we''re open from midday (11am on Sundays).', '[]', 'sent', NULL, 'e3d003d5-afb5-4c29-ab00-4c230b0d8f51', NULL, true, '2026-10-15 13:34:01.303+08');
INSERT INTO public.messages VALUES ('d6118d05-2d5e-407d-8bfd-b5d96fa4eada', 'FORNO7', 'a1c6fee3-3ad2-4b8e-86c9-39612370b297', 'in', 'customer', NULL, 'hiring? looking for part time kitchen job', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 12:54:00+08');
INSERT INTO public.messages VALUES ('da9732be-5bab-45b3-81e3-47af16de49cd', 'FORNO7', 'a1c6fee3-3ad2-4b8e-86c9-39612370b297', 'out', 'ai', NULL, 'We''re hiring pizza cooks. Send /apply to our Telegram bot to apply.', '[]', 'sent', NULL, 'b14328e5-7546-4758-b947-a78a8e1fb903', NULL, true, '2026-10-15 12:54:02.322+08');
INSERT INTO public.messages VALUES ('aacdcbb3-a52d-48b2-89a7-0d7da7fd63ae', 'FORNO7', 'ca977b74-fc42-4f0c-bd60-917807132936', 'in', 'customer', NULL, 'sell frozen pizza to bring home?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 21:01:00+08');
INSERT INTO public.messages VALUES ('6e89f727-c0b4-4954-850b-f8197b64986e', 'FORNO7', 'ca977b74-fc42-4f0c-bd60-917807132936', 'out', 'ai', NULL, 'I''ll check with the team and let you know here.', '[]', 'sent', NULL, 'c9c86aff-5302-40ae-b551-bc0d6ea940c1', NULL, true, '2026-10-15 21:01:02.668+08');
INSERT INTO public.messages VALUES ('30ae3803-58f8-4313-9df3-f99e543eb842', 'FORNO7', '1c92afa0-a967-4985-900a-bbc2e0b0cf6f', 'in', 'customer', NULL, 'can i pay with tng', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 17:01:00+08');
INSERT INTO public.messages VALUES ('95214b4b-bbc1-483a-bc18-09080dc96f2f', 'FORNO7', '1c92afa0-a967-4985-900a-bbc2e0b0cf6f', 'out', 'ai', NULL, 'Yes, Touch ''n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.', '[]', 'sent', NULL, 'bc9f5b44-a80e-4d52-b423-82d23a4c3f42', NULL, true, '2026-10-15 17:01:02.482+08');
INSERT INTO public.messages VALUES ('0c33bcc7-9b0c-41b2-aa38-dcd230585ec9', 'FORNO7', 'e3d0979d-2b1b-48b5-b818-bf2f34432435', 'in', 'customer', NULL, 'dog friendly??', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 22:57:00+08');
INSERT INTO public.messages VALUES ('fc0783a0-9b05-45e2-a2ec-2d3f1fa246ca', 'FORNO7', 'e3d0979d-2b1b-48b5-b818-bf2f34432435', 'out', 'ai', NULL, 'Dogs are welcome on our terrace and we''ll bring a water bowl.', '[]', 'sent', NULL, '15c79566-0ed4-4f8a-9298-d4ee28d39803', NULL, true, '2026-10-15 22:57:01.316+08');
INSERT INTO public.messages VALUES ('a3dc39ed-e248-492b-bda1-7550de2a601e', 'FORNO7', '70e8fb23-8ba2-41a5-9a9a-dcef46748377', 'in', 'customer', NULL, 'best pizza in bangsar fr', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 14:18:00+08');
INSERT INTO public.messages VALUES ('e73e0acf-4174-4d77-bd5f-27d5c17225af', 'FORNO7', '70e8fb23-8ba2-41a5-9a9a-dcef46748377', 'out', 'ai', NULL, 'Thank you! The oven crew will be very happy to hear it.', '[]', 'sent', NULL, '01cc49d0-4795-416c-9209-536626156982', NULL, true, '2026-10-15 14:18:02.998+08');
INSERT INTO public.messages VALUES ('57ec682f-379c-424e-b5d8-d318ab719d08', 'FORNO7', '40250b70-cb91-45fc-970f-553cdea3e242', 'in', 'customer', NULL, 'is ur dough sourdough', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 20:49:00+08');
INSERT INTO public.messages VALUES ('70ce9923-c3f0-49be-b5d1-b34fad9f93d6', 'FORNO7', '40250b70-cb91-45fc-970f-553cdea3e242', 'out', 'ai', NULL, 'It''s a 48-hour fermented dough with Italian 00 flour, not sourdough.', '[]', 'sent', NULL, 'c0c6fca0-bf7b-4e37-911e-a17c2b102475', NULL, true, '2026-10-15 20:49:03.005+08');
INSERT INTO public.messages VALUES ('2c6d9f73-79c0-476b-a8af-ac3a03e06a38', 'FORNO7', '70dc2c82-fe10-46dc-afbd-647495d78f0b', 'in', 'customer', NULL, 'dog friendly??', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 20:47:00+08');
INSERT INTO public.messages VALUES ('e85e79b0-4aef-440f-9d99-3db676d387c9', 'FORNO7', '70dc2c82-fe10-46dc-afbd-647495d78f0b', 'out', 'ai', NULL, 'Dogs are welcome on our terrace and we''ll bring a water bowl.', '[]', 'sent', NULL, '464346ad-9a30-4c0f-9880-7b18a262bca6', NULL, true, '2026-10-15 20:47:01.25+08');
INSERT INTO public.messages VALUES ('ec5c99f2-24d2-444d-87a8-6139fdc209a6', 'FORNO7', 'd06c9dab-ce8c-4c2f-9276-6e3fb5e84f72', 'in', 'customer', NULL, 'sell frozen pizza to bring home?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 09:13:00+08');
INSERT INTO public.messages VALUES ('9067e0e2-0b26-42d2-abbb-164592338e45', 'FORNO7', 'd06c9dab-ce8c-4c2f-9276-6e3fb5e84f72', 'out', 'ai', NULL, 'I''ll check with the team and let you know here.', '[]', 'sent', NULL, '686cade6-0a60-4e83-9bbb-66502fe52f59', NULL, true, '2026-10-15 09:13:01.655+08');
INSERT INTO public.messages VALUES ('489ada23-f8de-4761-8286-b62e6a654edf', 'FORNO7', 'f856c7b0-64df-4d90-abd5-0a676ad8a4c1', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 22:21:00+08');
INSERT INTO public.messages VALUES ('a4249003-9276-49a9-a50c-9f0fafd0c783', 'FORNO7', 'f856c7b0-64df-4d90-abd5-0a676ad8a4c1', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, '93ced94e-c757-4813-9456-9728ae079d1d', NULL, true, '2026-10-15 22:21:02.851+08');
INSERT INTO public.messages VALUES ('7957de99-a95f-45af-9239-37bf1960e515', 'FORNO7', 'eb4fce92-2df2-4ae9-8e43-81675c885071', 'in', 'customer', NULL, 'sell frozen pizza to bring home?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 22:20:00+08');
INSERT INTO public.messages VALUES ('affeb962-2d21-4aee-8880-68539cfaca2e', 'FORNO7', 'eb4fce92-2df2-4ae9-8e43-81675c885071', 'out', 'ai', NULL, 'I''ll check with the team and let you know here.', '[]', 'sent', NULL, 'd7292c20-a507-43a6-b40b-6460e5c55dbb', NULL, true, '2026-10-15 22:20:01.877+08');
INSERT INTO public.messages VALUES ('24e2f76c-77f4-4cd1-93a9-a4e8d4c0a491', 'FORNO7', 'e47f1c44-86f7-4a27-8df9-e81f313ea995', 'in', 'customer', NULL, 'do u have gluten free base?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 09:53:00+08');
INSERT INTO public.messages VALUES ('dc857f18-c479-4de1-9eb0-ad1d5345c6c2', 'FORNO7', 'e47f1c44-86f7-4a27-8df9-e81f313ea995', 'out', 'ai', NULL, 'Good question. I''ll check with the team and get back to you here shortly.', '[]', 'sent', NULL, '6537b098-0466-46b5-be78-50aa54cb3be4', NULL, true, '2026-10-15 09:53:03.139+08');
INSERT INTO public.messages VALUES ('54212b9a-b1df-4ea7-ad99-61f845644002', 'FORNO7', '5a748e8c-4ec1-4d13-b534-e6b130eddeda', 'in', 'customer', NULL, 'hi um do you guys have like a table for two tomorrow around seven thanks', '[]', 'received', NULL, NULL, NULL, true, '2026-10-15 17:29:00+08');
INSERT INTO public.messages VALUES ('15cb97da-c78b-474b-b5d9-b1c9f11e6096', 'FORNO7', '5a748e8c-4ec1-4d13-b534-e6b130eddeda', 'out', 'ai', NULL, 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '[]', 'sent', NULL, '74d38ee9-37cd-4d6a-978d-5d5f6578f2a3', NULL, true, '2026-10-15 17:29:02.044+08');
INSERT INTO public.messages VALUES ('aef9af94-0e51-44cb-a044-f70cbcd0a50a', 'FORNO7', '46defe49-1ba8-4887-bcf4-1b81172d469b', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 18:55:00+08');
INSERT INTO public.messages VALUES ('4d116e1a-a082-4557-a0f9-6c7a12663908', 'FORNO7', '46defe49-1ba8-4887-bcf4-1b81172d469b', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, '6560c326-c537-4d81-badf-efde383dd00b', NULL, true, '2026-10-16 18:55:01.414+08');
INSERT INTO public.messages VALUES ('77f6d235-2393-4034-a09d-804ffbe6cbe2', 'FORNO7', 'b30f36b6-843c-4d94-8e2d-39f722698ebb', 'in', 'customer', NULL, 'got spicy pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 17:16:00+08');
INSERT INTO public.messages VALUES ('55e3044e-2373-46e3-8ae3-7087e55169e1', 'FORNO7', 'b30f36b6-843c-4d94-8e2d-39f722698ebb', 'out', 'ai', NULL, 'Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.', '[]', 'sent', NULL, '39a81c6d-5ac7-4985-ac9e-3e91c3386884', NULL, true, '2026-10-16 17:16:02.798+08');
INSERT INTO public.messages VALUES ('4d60ecad-cec2-4f28-ac60-e9e4458d270f', 'FORNO7', '7b2ee5f5-4135-4e8f-ae42-9a458a00044a', 'in', 'customer', NULL, 'how to cancel my booking', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 14:45:00+08');
INSERT INTO public.messages VALUES ('54d81780-a41a-4638-b462-aaee0b78c000', 'FORNO7', '7b2ee5f5-4135-4e8f-ae42-9a458a00044a', 'out', 'ai', NULL, 'Send us your booking reference here. Cancellation is free up to 2 hours before.', '[]', 'sent', NULL, '5d5c2315-3bf4-4915-969b-18a12ffee076', NULL, true, '2026-10-16 14:45:01.655+08');
INSERT INTO public.messages VALUES ('f2ef6133-a108-4a40-8ea3-7ed4f174b6eb', 'FORNO7', '476a12de-82b6-4d6a-aa5b-ac8f807afb95', 'in', 'customer', NULL, 'non alcoholic drinks got what', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 21:40:00+08');
INSERT INTO public.messages VALUES ('86e98b36-85a3-4e97-9448-048adfd5eabb', 'FORNO7', '476a12de-82b6-4d6a-aa5b-ac8f807afb95', 'out', 'ai', NULL, 'House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.', '[]', 'sent', NULL, '5dd1302b-f737-4f40-9d15-e4760a32f620', NULL, true, '2026-10-16 21:40:01.804+08');
INSERT INTO public.messages VALUES ('f521ea03-0e85-41d9-b359-20956adaacbf', 'FORNO7', '48bc0098-23de-4bc3-97c8-bdcd787c4693', 'in', 'customer', NULL, 'how big is the large pizza', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 11:21:00+08');
INSERT INTO public.messages VALUES ('2d4cdfae-6a83-40b9-b36b-b358fa2420c9', 'FORNO7', '48bc0098-23de-4bc3-97c8-bdcd787c4693', 'out', 'ai', NULL, 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '[]', 'sent', NULL, '82ca82f0-d7f8-474a-b656-02067eb91af0', NULL, true, '2026-10-16 11:21:02.355+08');
INSERT INTO public.messages VALUES ('96787370-8867-4e2c-8a97-35c5d4220908', 'FORNO7', 'edb5df45-f72a-47fe-ac7e-1cd7cc48cf76', 'in', 'customer', NULL, 'how big is the large pizza', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 14:06:00+08');
INSERT INTO public.messages VALUES ('378199a4-c81c-43a2-8e30-78176289cd0f', 'FORNO7', 'edb5df45-f72a-47fe-ac7e-1cd7cc48cf76', 'out', 'ai', NULL, 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '[]', 'sent', NULL, '64910a58-7664-4e26-a5e5-00fb836caf30', NULL, true, '2026-10-16 14:06:03.338+08');
INSERT INTO public.messages VALUES ('2cfb0c54-32af-45b8-bb95-c44170a0fdfc', 'FORNO7', '4b06129d-a8db-42d8-bf60-a5e4bfb84abd', 'in', 'customer', NULL, 'large margherita how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 21:29:00+08');
INSERT INTO public.messages VALUES ('1d24d9ff-696c-435b-bfd6-d8b81d8184c9', 'FORNO7', '4b06129d-a8db-42d8-bf60-a5e4bfb84abd', 'out', 'ai', NULL, 'Large Margherita (15") is RM 52. Medium RM 38, Small RM 28.', '[]', 'sent', NULL, '60cf4f9b-d417-4ab3-9d12-31354efff1f8', NULL, true, '2026-10-16 21:29:03.39+08');
INSERT INTO public.messages VALUES ('c9bc3939-f7e7-4dcf-aae9-ffe889fdaa16', 'FORNO7', '99cfe2f4-4153-4a70-b260-1b181865d83f', 'in', 'customer', NULL, 'I want to discuss a franchise for Penang', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 19:03:00+08');
INSERT INTO public.messages VALUES ('c6842569-d709-42c0-8dae-4f972c5668cb', 'FORNO7', '99cfe2f4-4153-4a70-b260-1b181865d83f', 'out', 'ai', NULL, 'Thanks for your interest! I''ve passed this to our owner, who handles partnerships personally. They''ll reply here soon.', '[]', 'sent', NULL, '3bb5be1e-bd75-477f-9d14-ce26a9e99f77', NULL, true, '2026-10-16 19:03:02.141+08');
INSERT INTO public.messages VALUES ('8435cebc-7fe0-44db-832f-95781e819948', 'FORNO7', 'c1d5992b-3b9a-4f85-85d4-f68afd498017', 'in', 'customer', NULL, 'got spicy pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 09:37:00+08');
INSERT INTO public.messages VALUES ('a3c25cf9-d452-44cd-a4a2-5c46ff2006f2', 'FORNO7', 'c1d5992b-3b9a-4f85-85d4-f68afd498017', 'out', 'ai', NULL, 'Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.', '[]', 'sent', NULL, '0690fd71-2f30-43c5-acf5-829906f99364', NULL, true, '2026-10-16 09:37:02.475+08');
INSERT INTO public.messages VALUES ('d6470945-13e1-4cbe-a600-a2e4659610d9', 'FORNO7', '90b1c236-2df4-48b1-87d2-3f2dc8324ce1', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 22:56:00+08');
INSERT INTO public.messages VALUES ('fa9bdbed-c4e2-4d14-8a0b-b019f5ce7927', 'FORNO7', '90b1c236-2df4-48b1-87d2-3f2dc8324ce1', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, 'c49d970c-3b4a-4a75-944c-bbf735b9fe84', NULL, true, '2026-10-16 22:56:01.74+08');
INSERT INTO public.messages VALUES ('439d797d-c940-4d88-9854-88fbb97da2f3', 'FORNO7', 'f5a61f05-2a2e-44c0-add9-2e55905ba25b', 'in', 'customer', NULL, 'my son has nut allergy can he eat the pizza', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 17:04:00+08');
INSERT INTO public.messages VALUES ('e7658440-ae86-499d-ae3a-1e8240ee8398', 'FORNO7', 'f5a61f05-2a2e-44c0-add9-2e55905ba25b', 'out', 'ai', NULL, 'The Pollo Pesto contains pine nuts, and our kitchen handles tree nuts, so cross-contact is possible. Our manager will talk you through it before you order.', '[]', 'sent', NULL, 'e5660f45-32d1-4ce2-bc8f-c742d6ac8d1e', NULL, true, '2026-10-16 17:04:02.341+08');
INSERT INTO public.messages VALUES ('42358bb2-b8b4-4b73-8c22-e74e065a364e', 'FORNO7', '442def73-c60e-49ea-bfd0-ee3f3d87d0dc', 'in', 'customer', NULL, 'wifi pw?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 10:54:00+08');
INSERT INTO public.messages VALUES ('cbb3b6dc-c3fb-4f79-aa5a-9ce91988de2a', 'FORNO7', '442def73-c60e-49ea-bfd0-ee3f3d87d0dc', 'out', 'ai', NULL, 'We have free Wi-Fi; staff will share the password at your table.', '[]', 'sent', NULL, '0c81e1a9-f6b9-4c3d-a6f2-122a41729fa4', NULL, true, '2026-10-16 10:54:02.474+08');
INSERT INTO public.messages VALUES ('812a1f72-1ace-437c-bee3-815dfa47acb3', 'FORNO7', '7b357a4c-f589-4c59-b69d-48fb46aaaa79', 'in', 'customer', NULL, 'where exactly r u', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 20:05:00+08');
INSERT INTO public.messages VALUES ('8c743189-44b2-4c92-883d-9f9affd86032', 'FORNO7', '7b357a4c-f589-4c59-b69d-48fb46aaaa79', 'out', 'ai', NULL, '27 Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur, two minutes from Bangsar Village II.', '[]', 'sent', NULL, 'b97314c8-7f73-427a-a242-ac2a40835a7f', NULL, true, '2026-10-16 20:05:02.462+08');
INSERT INTO public.messages VALUES ('51248d94-7c16-44bd-beb7-5d2f3af13086', 'FORNO7', '10d46ec0-b5ab-471b-9c5b-1186b6731c2f', 'in', 'customer', NULL, 'can do half half pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 20:01:00+08');
INSERT INTO public.messages VALUES ('fd3afbbd-5c54-4cbc-9573-7cfd54d71447', 'FORNO7', '10d46ec0-b5ab-471b-9c5b-1186b6731c2f', 'out', 'ai', NULL, 'Yes, on Medium and Large, priced at the more expensive half.', '[]', 'sent', NULL, 'c5aa95e0-b1c4-41af-9e6a-8cd319751be7', NULL, true, '2026-10-16 20:01:03.135+08');
INSERT INTO public.messages VALUES ('4e275ac1-a3c2-4c26-8268-ddbbc94f7555', 'FORNO7', '5af0e60b-12d4-4b6c-bf95-2ba853bfb7a9', 'in', 'customer', NULL, 'sell frozen pizza to bring home?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 19:16:00+08');
INSERT INTO public.messages VALUES ('cf3539ad-1669-4890-a379-def7cf7fd58e', 'FORNO7', '5af0e60b-12d4-4b6c-bf95-2ba853bfb7a9', 'out', 'ai', NULL, 'I''ll check with the team and let you know here.', '[]', 'sent', NULL, '66f8b9c6-cb24-45c7-858d-cb2c8525ff11', NULL, true, '2026-10-16 19:16:02.888+08');
INSERT INTO public.messages VALUES ('64a1558e-8b67-473b-a79a-dde59d68f668', 'FORNO7', '68de1acc-0439-4ae4-9e47-856fcba847c4', 'in', 'customer', NULL, 'sell frozen pizza to bring home?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 12:53:00+08');
INSERT INTO public.messages VALUES ('33ae493b-aae4-45f1-82a3-b83a73966741', 'FORNO7', '68de1acc-0439-4ae4-9e47-856fcba847c4', 'out', 'ai', NULL, 'I''ll check with the team and let you know here.', '[]', 'sent', NULL, 'ae2a5c65-142c-4929-9ac2-b5a19c273539', NULL, true, '2026-10-16 12:53:01.782+08');
INSERT INTO public.messages VALUES ('ce1a6a06-f406-4a9c-b992-d3e39611e731', 'FORNO7', '73cbb556-296e-484d-883d-b2199150245b', 'in', 'customer', NULL, 'sunday lunch 6 pax 1pm got table?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 11:48:00+08');
INSERT INTO public.messages VALUES ('613487a3-9774-4cbf-996a-bb6679b84299', 'FORNO7', '73cbb556-296e-484d-883d-b2199150245b', 'out', 'ai', NULL, 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '[]', 'sent', NULL, '09c14422-31fe-4c76-97ff-8b602fa24cf7', NULL, true, '2026-10-16 11:48:03.069+08');
INSERT INTO public.messages VALUES ('e784a97f-d1ba-4aed-b248-b3b105d29bd7', 'FORNO7', 'ff533a40-6c2e-4220-9a98-c5821084e98b', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 20:43:00+08');
INSERT INTO public.messages VALUES ('cbc95455-c66a-4b34-8f92-844887c4a400', 'FORNO7', 'ff533a40-6c2e-4220-9a98-c5821084e98b', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, '4b88aff0-f4ff-4ec7-a47b-c86ccb7a060e', NULL, true, '2026-10-16 20:43:02.188+08');
INSERT INTO public.messages VALUES ('1fc6eda1-e53c-48b0-936d-8ceeab8e15bc', 'FORNO7', 'fc6a6b8b-c847-4d14-ae1d-f94811c1d25c', 'in', 'customer', NULL, 'cauliflower crust can?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 21:42:00+08');
INSERT INTO public.messages VALUES ('682dcc02-9ea1-423a-aff0-d161eb99c58c', 'FORNO7', 'fc6a6b8b-c847-4d14-ae1d-f94811c1d25c', 'out', 'ai', NULL, 'Let me check with the team and get back to you.', '[]', 'sent', NULL, '6ed5956d-c5b5-4ad4-8036-97df55f9473b', NULL, true, '2026-10-16 21:42:02.419+08');
INSERT INTO public.messages VALUES ('e9e25a46-22ea-48af-856f-a3a286869e63', 'FORNO7', '645ab1fc-f799-4a44-bbc8-23912b72b7b7', 'in', 'customer', NULL, 'delivery to subang can?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 14:24:00+08');
INSERT INTO public.messages VALUES ('80afda3d-ae00-4a53-99f9-ab121f2a6d2e', 'FORNO7', '645ab1fc-f799-4a44-bbc8-23912b72b7b7', 'out', 'ai', NULL, 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '[]', 'sent', NULL, '47208e07-d62e-4b12-8fc7-ffb5d0bbc325', NULL, true, '2026-10-16 14:24:01.383+08');
INSERT INTO public.messages VALUES ('dace48eb-8563-4d53-b94f-5fdb776e1588', 'FORNO7', 'fb0d9975-7433-4c2e-b2c2-5d7e63fa9874', 'in', 'customer', NULL, 'open christmas day?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 14:33:00+08');
INSERT INTO public.messages VALUES ('becbb63d-165e-4abf-a5f5-b88719a18bbd', 'FORNO7', 'fb0d9975-7433-4c2e-b2c2-5d7e63fa9874', 'out', 'ai', NULL, 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '[]', 'sent', NULL, 'f70578d2-dbed-4dfa-a700-c163225ba21c', NULL, true, '2026-10-16 14:33:01.83+08');
INSERT INTO public.messages VALUES ('f998fce6-a643-4700-b7c5-ba68c422e818', 'FORNO7', 'c201eada-7839-4da4-86e5-48182198868c', 'in', 'customer', NULL, 'gluten free pizza available?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 09:52:00+08');
INSERT INTO public.messages VALUES ('25cfe28f-065b-4584-86af-60cb7195c99f', 'FORNO7', 'c201eada-7839-4da4-86e5-48182198868c', 'out', 'ai', NULL, 'Let me check with the team and come back to you here.', '[]', 'sent', NULL, 'b31a2641-2fc5-4c56-943c-de377573765b', NULL, true, '2026-10-16 09:52:01.549+08');
INSERT INTO public.messages VALUES ('13170673-328a-42fa-9e96-d83db8522dde', 'FORNO7', '5eeb9ef6-dbb1-4e3a-a25f-34d2373543c4', 'in', 'customer', NULL, 'wifi pw?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 14:38:00+08');
INSERT INTO public.messages VALUES ('7412db61-deda-4989-8669-8160e1dc81f2', 'FORNO7', '5eeb9ef6-dbb1-4e3a-a25f-34d2373543c4', 'out', 'ai', NULL, 'We have free Wi-Fi; staff will share the password at your table.', '[]', 'sent', NULL, 'b5cdd093-5296-41ee-89e8-ed04aae4aef7', NULL, true, '2026-10-16 14:38:02.388+08');
INSERT INTO public.messages VALUES ('e2779206-b9df-4d09-a358-77502255e47e', 'FORNO7', 'a6de91fc-78f7-41d1-8695-5abf08ce9700', 'in', 'customer', NULL, 'do u do catering for office lunch', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 17:34:00+08');
INSERT INTO public.messages VALUES ('16b4d6a3-cf1d-45b3-8887-09f87b924c9e', 'FORNO7', 'a6de91fc-78f7-41d1-8695-5abf08ce9700', 'out', 'ai', NULL, 'Yes, mobile wood-fired oven catering for 30–150 guests from RM 45 per head. Our events team sends a quote within one working day.', '[]', 'sent', NULL, 'c6a8a113-fcd4-4893-ab5c-46a65b62e449', NULL, true, '2026-10-16 17:34:02.376+08');
INSERT INTO public.messages VALUES ('82fb8469-a498-40d6-b5d3-82a15520ebf1', 'FORNO7', '363f6542-0daa-4aed-bc8a-6db91e2e3246', 'in', 'customer', NULL, 'how big is the large pizza', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 13:43:00+08');
INSERT INTO public.messages VALUES ('82958e22-8c70-4f5a-b182-a362237a7189', 'FORNO7', '363f6542-0daa-4aed-bc8a-6db91e2e3246', 'out', 'ai', NULL, 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '[]', 'sent', NULL, 'e7b012c5-95d4-44b5-b9d2-91e05a6e3e1b', NULL, true, '2026-10-16 13:43:03.074+08');
INSERT INTO public.messages VALUES ('393c83e3-4ed8-466f-a1e1-7f7a439eda35', 'FORNO7', 'aaaa9718-5d78-4d67-a31c-f98885353df5', 'in', 'customer', NULL, 'extra cheese how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 10:14:00+08');
INSERT INTO public.messages VALUES ('e2abd1e8-89c5-48e9-87c6-a961ed94cc5f', 'FORNO7', 'aaaa9718-5d78-4d67-a31c-f98885353df5', 'out', 'ai', NULL, 'Extra mozzarella RM 4, a whole burrata RM 12.', '[]', 'sent', NULL, 'a1b3d765-d3a6-49b5-81f0-3b1c788bddc1', NULL, true, '2026-10-16 10:14:01.736+08');
INSERT INTO public.messages VALUES ('9f776947-5ba9-4223-8ed8-415e9152f08a', 'FORNO7', '8bb07920-af01-4e12-ac3a-c33793a8b021', 'in', 'customer', NULL, 'hiring? looking for part time kitchen job', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 20:32:00+08');
INSERT INTO public.messages VALUES ('dd46ad83-300d-4ec2-af4d-d381a7604de1', 'FORNO7', '8bb07920-af01-4e12-ac3a-c33793a8b021', 'out', 'ai', NULL, 'We''re hiring pizza cooks. Send /apply to our Telegram bot to apply.', '[]', 'sent', NULL, 'f1a492fe-68ad-49d3-9196-4e79d23d50e6', NULL, true, '2026-10-16 20:32:03.428+08');
INSERT INTO public.messages VALUES ('99a60ecb-bc29-4a2e-998e-03b6aeec96c7', 'FORNO7', '3e33742c-91b3-46b7-8493-bbb2ba97995a', 'in', 'customer', NULL, 'do u have gluten free base?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 22:55:00+08');
INSERT INTO public.messages VALUES ('ce0dfdc9-0d50-4751-b9c1-7043ecfe4e31', 'FORNO7', '3e33742c-91b3-46b7-8493-bbb2ba97995a', 'out', 'ai', NULL, 'Good question. I''ll check with the team and get back to you here shortly.', '[]', 'sent', NULL, '97a5a5c5-ba05-499f-ae82-0dcca08fddd6', NULL, true, '2026-10-16 22:55:03.405+08');
INSERT INTO public.messages VALUES ('d5225d0d-9c89-4cf5-a06b-36b461877c8b', 'FORNO7', 'b16e1e47-1b5c-44c4-b40b-217f7a50c19f', 'in', 'customer', NULL, 'hi um do you guys have like a table for two tomorrow around seven thanks', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 20:59:00+08');
INSERT INTO public.messages VALUES ('ab608196-f704-4309-91bd-93535dc18a2d', 'FORNO7', 'b16e1e47-1b5c-44c4-b40b-217f7a50c19f', 'out', 'ai', NULL, 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '[]', 'sent', NULL, '2e1e9206-c67b-4101-9f6d-fefe77e1ef48', NULL, true, '2026-10-16 20:59:02.662+08');
INSERT INTO public.messages VALUES ('dd165cf6-1e47-4a57-89b8-0d39236ffbae', 'FORNO7', '06cce211-a362-4338-846d-7b3d8f941e3f', 'in', 'customer', NULL, 'can i pay with tng', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 13:25:00+08');
INSERT INTO public.messages VALUES ('debe0dbe-8ff6-4520-b867-e400c18ddd12', 'FORNO7', '06cce211-a362-4338-846d-7b3d8f941e3f', 'out', 'ai', NULL, 'Yes, Touch ''n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.', '[]', 'sent', NULL, '764620ce-b5b5-41b1-a025-3da40db4fd9b', NULL, true, '2026-10-16 13:25:03.062+08');
INSERT INTO public.messages VALUES ('6727dd08-dd1a-4190-88d6-38b0b06f117e', 'FORNO7', '81b82141-3c4a-4c23-bcfc-3178e2e13d37', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 13:00:00+08');
INSERT INTO public.messages VALUES ('f42de3bd-55d2-4574-b4a5-7a8205ae8966', 'FORNO7', '81b82141-3c4a-4c23-bcfc-3178e2e13d37', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, '6a41feb7-c33d-474a-98c1-64787befd58b', NULL, true, '2026-10-16 13:00:01.351+08');
INSERT INTO public.messages VALUES ('1e8d5bf4-a2a5-4a2f-97e8-dde682991c89', 'FORNO7', '8456be65-0102-4b1f-b593-d93504fc382e', 'in', 'customer', NULL, 'sunday lunch 6 pax 1pm got table?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 10:21:00+08');
INSERT INTO public.messages VALUES ('a7e62b4d-fd60-4024-8a1a-8ce788841692', 'FORNO7', '8456be65-0102-4b1f-b593-d93504fc382e', 'out', 'ai', NULL, 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '[]', 'sent', NULL, 'b8049b01-8c73-4106-a65a-9d4100d8d1c9', NULL, true, '2026-10-16 10:21:02.102+08');
INSERT INTO public.messages VALUES ('d98cf330-9339-46bd-866f-1dc4c8571138', 'FORNO7', '5e1ee8d1-4eaf-4ef4-bc3a-650a4ada6917', 'in', 'customer', NULL, 'kids menu?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 09:29:00+08');
INSERT INTO public.messages VALUES ('1476ffaa-742a-4a95-868e-fd6295c07164', 'FORNO7', '5e1ee8d1-4eaf-4ef4-bc3a-650a4ada6917', 'out', 'ai', NULL, 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '[]', 'sent', NULL, '8eee74dd-8f4f-4dbc-8880-a61afaf7f099', NULL, true, '2026-10-16 09:29:01.704+08');
INSERT INTO public.messages VALUES ('f9e62157-97fa-4232-b1d0-cda31d7004a3', 'FORNO7', '19170203-1046-483b-87d0-9cb36dec28f2', 'in', 'customer', NULL, 'how long wait for walk in fri night', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 22:14:00+08');
INSERT INTO public.messages VALUES ('5424664a-6ac0-4141-8763-e74270aea7f2', 'FORNO7', '19170203-1046-483b-87d0-9cb36dec28f2', 'out', 'ai', NULL, 'Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.', '[]', 'sent', NULL, '3755da7b-33ba-4b7d-bca5-2308dd8aa733', NULL, true, '2026-10-16 22:14:02.598+08');
INSERT INTO public.messages VALUES ('1a42de5d-7591-4ffd-b579-d02e41e02f97', 'FORNO7', '35d5246f-e108-41c4-9152-6724a638e354', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 20:09:00+08');
INSERT INTO public.messages VALUES ('d448f80e-7fb5-4b76-a814-bb49451e4581', 'FORNO7', '35d5246f-e108-41c4-9152-6724a638e354', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, '313b9655-8c64-4c0f-9901-4b673c2870ea', NULL, true, '2026-10-16 20:09:02.658+08');
INSERT INTO public.messages VALUES ('1ef7ae37-be1a-466b-aa13-469477c7963b', 'FORNO7', 'fd3793f2-0410-496d-99ec-cbafed77b16b', 'in', 'customer', NULL, 'tshirt size M black ada?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 19:41:00+08');
INSERT INTO public.messages VALUES ('7ce7c406-ea0d-4859-8323-8526eed07b7a', 'FORNO7', 'fd3793f2-0410-496d-99ec-cbafed77b16b', 'out', 'ai', NULL, 'Our dark tee is Charcoal and size M is in stock, RM 59. Want me to hold one at the counter?', '[]', 'sent', NULL, '0109ba80-f698-4913-9d13-e43f41dd9bb6', NULL, true, '2026-10-16 19:41:03.12+08');
INSERT INTO public.messages VALUES ('89b7cbf8-8913-4aef-81cb-310e26cc5154', 'FORNO7', '3cad0f0f-521a-4b5d-ade6-725137a0005f', 'in', 'customer', NULL, 'pizza came cold n soggy wat la', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 15:34:00+08');
INSERT INTO public.messages VALUES ('40251d37-619c-4188-ac73-dd083125b06b', 'FORNO7', '3cad0f0f-521a-4b5d-ade6-725137a0005f', 'out', 'ai', NULL, 'So sorry. Please send a photo; our duty manager reviews it personally and will make it right.', '[]', 'sent', NULL, '7843af94-9027-4d81-ae0e-23bc6abfc6fa', NULL, true, '2026-10-16 15:34:03.115+08');
INSERT INTO public.messages VALUES ('6749c607-523a-4bc5-8a7a-9389844cb21f', 'FORNO7', 'bcd81c2d-1bf7-486c-8e1f-75ad5818bbaa', 'in', 'customer', NULL, 'can do half half pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 11:12:00+08');
INSERT INTO public.messages VALUES ('5c0ae551-6c5c-4b5d-9ba6-d7957495a76a', 'FORNO7', 'bcd81c2d-1bf7-486c-8e1f-75ad5818bbaa', 'out', 'ai', NULL, 'Yes, on Medium and Large, priced at the more expensive half.', '[]', 'sent', NULL, 'd7fe2803-2cf3-4886-9f0c-fe7af1f5d71f', NULL, true, '2026-10-16 11:12:02.481+08');
INSERT INTO public.messages VALUES ('f9dfc0ea-c3e8-462d-8949-bf3ffd64f3f3', 'FORNO7', '866f5ff4-6734-47ff-964f-5fe920e1ae2e', 'in', 'customer', NULL, 'delivery to subang can?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 13:08:00+08');
INSERT INTO public.messages VALUES ('f1f3d3db-1304-4072-b7a3-c915f0bcd58b', 'FORNO7', '866f5ff4-6734-47ff-964f-5fe920e1ae2e', 'out', 'ai', NULL, 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '[]', 'sent', NULL, 'fbe8adef-68d8-4692-a24e-bbcc36bb1b0a', NULL, true, '2026-10-16 13:08:01.372+08');
INSERT INTO public.messages VALUES ('d8a9fb9c-53a9-4670-bc8f-058676875df4', 'FORNO7', '079d628b-6a9e-4007-a7f4-19a8d2815a12', 'in', 'customer', NULL, 'how long wait for walk in fri night', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 22:07:00+08');
INSERT INTO public.messages VALUES ('c1948af8-d289-4a19-b6a5-053315de7313', 'FORNO7', '079d628b-6a9e-4007-a7f4-19a8d2815a12', 'out', 'ai', NULL, 'Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.', '[]', 'sent', NULL, '1c596514-4299-4763-a738-937e0ff04edc', NULL, true, '2026-10-16 22:07:01.318+08');
INSERT INTO public.messages VALUES ('f02870d8-6ccf-43ac-8ded-73b315d5b92f', 'FORNO7', '7fd892e5-dd91-40d6-8435-415bcee973d1', 'in', 'customer', NULL, 'the truffle one available today?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 16:06:00+08');
INSERT INTO public.messages VALUES ('a11c8efc-9214-4b0c-9f2a-1480a80e530b', 'FORNO7', '7fd892e5-dd91-40d6-8435-415bcee973d1', 'out', 'ai', NULL, 'Sorry, the Funghi e Tartufo is sold out today. Our truffle delivery is late, it''s back tomorrow. The Quattro Formaggi is the closest rich, cheesy pick.', '[]', 'sent', NULL, '09c062d4-c4eb-4c9b-a27d-c9e663681e4a', NULL, true, '2026-10-16 16:06:01.643+08');
INSERT INTO public.messages VALUES ('4c4093d3-e3a7-48f6-9fca-ed16cf9fbb64', 'FORNO7', 'abfb0814-c650-4273-93c5-51d1ff07abb1', 'in', 'customer', NULL, 'wheelchair accessible?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 16:33:00+08');
INSERT INTO public.messages VALUES ('87e477a2-b6df-4e06-a443-db4b5b9ba543', 'FORNO7', 'abfb0814-c650-4273-93c5-51d1ff07abb1', 'out', 'ai', NULL, 'Yes. The ground floor is step-free and we have an accessible restroom.', '[]', 'sent', NULL, 'd7d570d2-b85c-42c4-937b-4c0d4bb7e1d7', NULL, true, '2026-10-16 16:33:03.025+08');
INSERT INTO public.messages VALUES ('31eee150-5f3c-4a3f-bf46-10d8b8f77d80', 'FORNO7', 'f0e45831-178b-4637-a4cd-559254c6aa82', 'in', 'customer', NULL, 'do u deliver to mont kiara', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 22:54:00+08');
INSERT INTO public.messages VALUES ('756901ad-7b86-42ac-976c-124db515e369', 'FORNO7', 'f0e45831-178b-4637-a4cd-559254c6aa82', 'out', 'ai', NULL, 'Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.', '[]', 'sent', NULL, '613c78fc-4f3e-449e-92a8-e77380b9175f', NULL, true, '2026-10-16 22:54:01.673+08');
INSERT INTO public.messages VALUES ('02812327-9d58-4a06-a0dd-4827ffd5c63d', 'FORNO7', 'cb4ddb39-5f21-4d3b-9e26-dfbbce3e8550', 'in', 'customer', NULL, 'do u have gluten free base?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 11:55:00+08');
INSERT INTO public.messages VALUES ('0cfdc51a-2e2d-42d7-b002-18fbeebb38eb', 'FORNO7', 'cb4ddb39-5f21-4d3b-9e26-dfbbce3e8550', 'out', 'ai', NULL, 'Good question. I''ll check with the team and get back to you here shortly.', '[]', 'sent', NULL, '45f9132d-4ee0-4845-be51-158a4b76ab98', NULL, true, '2026-10-16 11:55:03.339+08');
INSERT INTO public.messages VALUES ('3979cb0d-cbd0-4e25-90db-f87676a2fb5b', 'FORNO7', '4037304e-d72d-4dac-8155-9272b751c58c', 'in', 'customer', NULL, 'best pizza in bangsar fr', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 10:14:00+08');
INSERT INTO public.messages VALUES ('629665c5-9d1f-4c3d-9061-19939ddb0af5', 'FORNO7', '4037304e-d72d-4dac-8155-9272b751c58c', 'out', 'ai', NULL, 'Thank you! The oven crew will be very happy to hear it.', '[]', 'sent', NULL, '9be6c943-efb4-4743-81d5-f99809f61430', NULL, true, '2026-10-16 10:14:01.607+08');
INSERT INTO public.messages VALUES ('9daea54b-d430-4384-abdf-01ca04f8c2c5', 'FORNO7', '7becabbc-f375-4521-a816-0f1301d16316', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 13:15:00+08');
INSERT INTO public.messages VALUES ('0131cb56-f17d-421c-b18a-660d31df35e1', 'FORNO7', '7becabbc-f375-4521-a816-0f1301d16316', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, '401c35b6-db56-4f6f-b60e-112c5295ece5', NULL, true, '2026-10-16 13:15:02.693+08');
INSERT INTO public.messages VALUES ('b8964a05-c13f-46c2-a1c6-7d86e48f26ce', 'FORNO7', 'e017e6ac-f1d7-4149-a443-a07169097257', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 14:47:00+08');
INSERT INTO public.messages VALUES ('6ee5ceea-6ff6-4d91-a2fd-51bfbcc03a69', 'FORNO7', 'e017e6ac-f1d7-4149-a443-a07169097257', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, 'c4b08150-c870-4e06-9a8b-69e41e15a921', NULL, true, '2026-10-16 14:47:01.638+08');
INSERT INTO public.messages VALUES ('f2fc16b0-4c69-4187-bba6-3064fc838841', 'FORNO7', 'aec9364d-f655-440a-ba50-c00f2ab2cb58', 'in', 'customer', NULL, 'extra cheese how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 16:04:00+08');
INSERT INTO public.messages VALUES ('7bc2f557-45a4-4cfb-9b9a-ac4b7f684be3', 'FORNO7', 'aec9364d-f655-440a-ba50-c00f2ab2cb58', 'out', 'ai', NULL, 'Extra mozzarella RM 4, a whole burrata RM 12.', '[]', 'sent', NULL, 'a28b7cba-2326-4375-94a1-de9a086b6caa', NULL, true, '2026-10-16 16:04:03.514+08');
INSERT INTO public.messages VALUES ('a097ec43-6718-4fee-97f1-b24713d9b8d8', 'FORNO7', 'b8052ec7-efb8-4aab-8019-d30af038c8ef', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 10:57:00+08');
INSERT INTO public.messages VALUES ('1a391a31-0a8f-44dd-ade9-e0713262c10e', 'FORNO7', 'b8052ec7-efb8-4aab-8019-d30af038c8ef', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, 'a0544cb3-0687-4151-94a4-b4b66743e3ae', NULL, true, '2026-10-16 10:57:01.452+08');
INSERT INTO public.messages VALUES ('46f0f156-5d69-492c-9bcd-013863c78c2e', 'FORNO7', '2a249705-6a60-430e-85c2-36f3b7de8682', 'in', 'customer', NULL, 'open on monday?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 17:56:00+08');
INSERT INTO public.messages VALUES ('a7784621-3dab-48f2-a3c0-cb379d99f42c', 'FORNO7', '2a249705-6a60-430e-85c2-36f3b7de8682', 'out', 'ai', NULL, 'We''re closed on Mondays. Tuesday to Sunday we''re open from midday (11am on Sundays).', '[]', 'sent', NULL, '81efaedc-6b73-4e07-a51d-168880da361f', NULL, true, '2026-10-16 17:56:03.084+08');
INSERT INTO public.messages VALUES ('c5e701a0-c2af-48dd-b852-401511a29be5', 'FORNO7', '7e01669b-6aa4-41ef-b5c3-472c10060e09', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 22:49:00+08');
INSERT INTO public.messages VALUES ('3e785180-0b28-4977-8c7f-9bd101309cfb', 'FORNO7', '7e01669b-6aa4-41ef-b5c3-472c10060e09', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, '0f9618db-3b4b-4311-ac17-bfd5957a43a1', NULL, true, '2026-10-16 22:49:02.325+08');
INSERT INTO public.messages VALUES ('d2f61495-3e71-410c-b9a4-18a1eeac52ef', 'FORNO7', '9966cf76-4e73-4fc3-a724-6bb2eb3a7c38', 'in', 'customer', NULL, 'wheelchair accessible?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 20:17:00+08');
INSERT INTO public.messages VALUES ('d5691625-2d28-4fa3-9013-dfd82ea99d00', 'FORNO7', '9966cf76-4e73-4fc3-a724-6bb2eb3a7c38', 'out', 'ai', NULL, 'Yes. The ground floor is step-free and we have an accessible restroom.', '[]', 'sent', NULL, 'deae1324-967e-4035-9ea2-b4ba17089923', NULL, true, '2026-10-16 20:17:02.368+08');
INSERT INTO public.messages VALUES ('5128aaac-a4cf-45e0-b120-fe76f6d217bb', 'FORNO7', '585ca296-593c-4c52-84fb-5e585c9c324c', 'in', 'customer', NULL, 'best pizza in bangsar fr', '[]', 'received', NULL, NULL, NULL, true, '2026-10-16 22:12:00+08');
INSERT INTO public.messages VALUES ('8da82f81-8862-4f32-b584-2db589f8154e', 'FORNO7', '585ca296-593c-4c52-84fb-5e585c9c324c', 'out', 'ai', NULL, 'Thank you! The oven crew will be very happy to hear it.', '[]', 'sent', NULL, '6cd0e672-88e4-487b-ad68-6b5abbcee94a', NULL, true, '2026-10-16 22:12:02.205+08');
INSERT INTO public.messages VALUES ('3b0908a7-4c0e-46f5-acde-965388f35c0a', 'FORNO7', '708aeb4c-e62d-4aac-9595-5a8560ebfc48', 'in', 'customer', NULL, 'can book for 2 sat 730pm', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 18:31:00+08');
INSERT INTO public.messages VALUES ('96dce501-91ee-46ee-8629-59712e41f13b', 'FORNO7', '708aeb4c-e62d-4aac-9595-5a8560ebfc48', 'out', 'ai', NULL, 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '[]', 'sent', NULL, '93dc5a6b-caee-4da2-bf56-daa04cf9bfc7', NULL, true, '2026-10-17 18:31:02.408+08');
INSERT INTO public.messages VALUES ('521adad3-99d6-421a-ac2c-7898703a5a76', 'FORNO7', 'dd67e3a7-a4c9-4329-9c38-6602a737eaec', 'in', 'customer', NULL, 'parking got or not', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 19:06:00+08');
INSERT INTO public.messages VALUES ('6d33e4ab-1c21-45de-905d-5ffd88ab8b2d', 'FORNO7', 'dd67e3a7-a4c9-4329-9c38-6602a737eaec', 'out', 'ai', NULL, 'Bangsar Village II basement is a 2-minute walk, or street parking through the Flexi Parking app.', '[]', 'sent', NULL, 'db6e68d6-afef-4f17-bcf5-b9b4b9c50463', NULL, true, '2026-10-17 19:06:03.101+08');
INSERT INTO public.messages VALUES ('222f1399-79f4-4543-bd6f-5d22f381edff', 'FORNO7', '0a6e630a-b707-48de-9c6c-61a2ff176098', 'in', 'customer', NULL, 'open christmas day?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 09:54:00+08');
INSERT INTO public.messages VALUES ('059527bd-4f45-4c51-a9a0-366168ac6d39', 'FORNO7', '0a6e630a-b707-48de-9c6c-61a2ff176098', 'out', 'ai', NULL, 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '[]', 'sent', NULL, '885fa63a-9f6f-4bd3-b59c-7d505f904000', NULL, true, '2026-10-17 09:54:03.566+08');
INSERT INTO public.messages VALUES ('76b7952f-e1a6-4912-a304-804a5415dbd5', 'FORNO7', 'cdd70eb0-51f1-4e34-a261-f3fe848a0a72', 'in', 'customer', NULL, 'the truffle one available today?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 21:35:00+08');
INSERT INTO public.messages VALUES ('e7bc5491-62c7-41b3-9b29-36d77bcdbac3', 'FORNO7', 'cdd70eb0-51f1-4e34-a261-f3fe848a0a72', 'out', 'ai', NULL, 'Sorry, the Funghi e Tartufo is sold out today. Our truffle delivery is late, it''s back tomorrow. The Quattro Formaggi is the closest rich, cheesy pick.', '[]', 'sent', NULL, '692ae1aa-ce6c-4b75-94a2-ea563c1fe809', NULL, true, '2026-10-17 21:35:01.65+08');
INSERT INTO public.messages VALUES ('7d92ce36-d8c5-4527-adaa-a781477f8b16', 'FORNO7', '0de63916-e7ca-405c-84ec-7e8ba4336a93', 'in', 'customer', NULL, 'kids menu?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 14:49:00+08');
INSERT INTO public.messages VALUES ('ddcc50bd-a788-4df4-be95-c132e6be9b6e', 'FORNO7', '0de63916-e7ca-405c-84ec-7e8ba4336a93', 'out', 'ai', NULL, 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '[]', 'sent', NULL, '6033d44a-f0f6-464b-b550-8fec95ece853', NULL, true, '2026-10-17 14:49:03.111+08');
INSERT INTO public.messages VALUES ('0951a206-8df9-4143-83d4-ede11fd83c8c', 'FORNO7', 'edd9ea39-cb1d-41c5-ba87-596e32036149', 'in', 'customer', NULL, 'can do half half pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 21:37:00+08');
INSERT INTO public.messages VALUES ('17020794-e79a-4cfa-8701-9a0c0f5d18c9', 'FORNO7', 'edd9ea39-cb1d-41c5-ba87-596e32036149', 'out', 'ai', NULL, 'Yes, on Medium and Large, priced at the more expensive half.', '[]', 'sent', NULL, '9a7ad590-6c83-49fa-9498-10d8cbdae729', NULL, true, '2026-10-17 21:37:02.859+08');
INSERT INTO public.messages VALUES ('7a7a854f-210b-4a94-8b26-d10af8d2832e', 'FORNO7', 'c8711a8b-2e3c-45a1-bd37-3b3db731ca66', 'in', 'customer', NULL, 'can book for 2 sat 730pm', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 14:29:00+08');
INSERT INTO public.messages VALUES ('34a509e5-1864-4013-b46f-9cef31831286', 'FORNO7', 'c8711a8b-2e3c-45a1-bd37-3b3db731ca66', 'out', 'ai', NULL, 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '[]', 'sent', NULL, '1200643f-0905-4d31-9d00-8da83642ed70', NULL, true, '2026-10-17 14:29:02.173+08');
INSERT INTO public.messages VALUES ('e0bcfaac-53bb-4551-860a-5b2ba73c4241', 'FORNO7', '80c03259-d4e6-4ebb-814c-dcd873f5a1d6', 'in', 'customer', NULL, 'rendang pizza spicy or not', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 12:40:00+08');
INSERT INTO public.messages VALUES ('29048b51-e30e-463e-8766-c9e7ef31d0f7', 'FORNO7', '80c03259-d4e6-4ebb-814c-dcd873f5a1d6', 'out', 'ai', NULL, 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '[]', 'sent', NULL, '55d643d3-b4bc-4758-a927-9fc99ebe52fe', NULL, true, '2026-10-17 12:40:02.747+08');
INSERT INTO public.messages VALUES ('75f33fc3-a799-428b-b386-295bbdbf2ad7', 'FORNO7', '7df3d541-f56e-4312-be85-5b23851f47e4', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 22:20:00+08');
INSERT INTO public.messages VALUES ('c4b268ef-fb13-4a70-8179-06890193f2e7', 'FORNO7', '7df3d541-f56e-4312-be85-5b23851f47e4', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, '904c3c49-8146-4828-bda2-b16359c99e22', NULL, true, '2026-10-17 22:20:02.533+08');
INSERT INTO public.messages VALUES ('48ad40df-28db-4f09-88b5-2a567e365717', 'FORNO7', '878274f3-388f-442e-9db5-825a97bf8ce0', 'in', 'customer', NULL, 'rendang pizza spicy or not', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 19:22:00+08');
INSERT INTO public.messages VALUES ('336fec02-4d61-41d8-95cd-e9ea07dfccaf', 'FORNO7', '878274f3-388f-442e-9db5-825a97bf8ce0', 'out', 'ai', NULL, 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '[]', 'sent', NULL, '879b2084-68c4-495c-8527-59b0130cf7cc', NULL, true, '2026-10-17 19:22:02.7+08');
INSERT INTO public.messages VALUES ('7a29515b-fa98-45e1-925f-8370736495c0', 'FORNO7', 'e96070b3-5986-435a-ac9e-e5a3dea54b9d', 'in', 'customer', NULL, 'can i pay with tng', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 13:26:00+08');
INSERT INTO public.messages VALUES ('4dd6b4ce-d4c7-4dfb-be3f-a3daad3d7001', 'FORNO7', 'e96070b3-5986-435a-ac9e-e5a3dea54b9d', 'out', 'ai', NULL, 'Yes, Touch ''n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.', '[]', 'sent', NULL, '5a40d5ab-1d69-49f5-bba5-4fca347833a9', NULL, true, '2026-10-17 13:26:02.153+08');
INSERT INTO public.messages VALUES ('4cba1fc3-7526-4701-99a4-3cfcd1281f4b', 'FORNO7', '05cf803b-e6f7-4498-9ceb-0910c89a54fc', 'in', 'customer', NULL, 'tshirt size M black ada?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 14:25:00+08');
INSERT INTO public.messages VALUES ('1b802b40-9bb2-42b9-8ca1-c3b29f4ebb11', 'FORNO7', '05cf803b-e6f7-4498-9ceb-0910c89a54fc', 'out', 'ai', NULL, 'Our dark tee is Charcoal and size M is in stock, RM 59. Want me to hold one at the counter?', '[]', 'sent', NULL, '6bed195f-8fd8-4a7d-89bc-7993ff2b6176', NULL, true, '2026-10-17 14:25:02.256+08');
INSERT INTO public.messages VALUES ('753eac46-b2aa-438c-8951-e0e09c4f7603', 'FORNO7', 'c56f8ba4-12bc-4f30-8ad2-b6899a28fe2e', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 09:41:00+08');
INSERT INTO public.messages VALUES ('3a6116fc-8f1c-4702-b2bb-8388de22db75', 'FORNO7', 'c56f8ba4-12bc-4f30-8ad2-b6899a28fe2e', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, '60979d94-d7cd-4cda-8c3b-a061e9f0223b', NULL, true, '2026-10-17 09:41:02.931+08');
INSERT INTO public.messages VALUES ('ef8fcba0-f73c-4348-8bb1-c422d049ff10', 'FORNO7', 'a516d6b8-6b4a-417a-953a-71705e1d76ad', 'in', 'customer', NULL, 'wheelchair accessible?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 20:30:00+08');
INSERT INTO public.messages VALUES ('88592140-518b-4f64-900c-f53d18f87e8f', 'FORNO7', 'a516d6b8-6b4a-417a-953a-71705e1d76ad', 'out', 'ai', NULL, 'Yes. The ground floor is step-free and we have an accessible restroom.', '[]', 'sent', NULL, 'a39de551-652d-4c16-8cdd-b44e189616f7', NULL, true, '2026-10-17 20:30:01.907+08');
INSERT INTO public.messages VALUES ('865bbcaa-b89f-4920-8b83-8dc12856b8c5', 'FORNO7', 'b1b03b91-878a-452e-b74e-910443709d5c', 'in', 'customer', NULL, 'gluten free pizza available?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 12:46:00+08');
INSERT INTO public.messages VALUES ('0df60de7-4c8c-4456-a505-29107453717f', 'FORNO7', 'b1b03b91-878a-452e-b74e-910443709d5c', 'out', 'ai', NULL, 'Let me check with the team and come back to you here.', '[]', 'sent', NULL, '381784db-13d2-4cbf-9a68-c285e73b3429', NULL, true, '2026-10-17 12:46:01.689+08');
INSERT INTO public.messages VALUES ('08ec9afe-dbf4-4a9b-aba2-f77356cb578d', 'FORNO7', '01d66fb6-316e-4425-95fd-3368355e37f5', 'in', 'customer', NULL, 'outdoor seating available?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 18:32:00+08');
INSERT INTO public.messages VALUES ('c55c9eef-67fe-4fd2-bf89-49d2049f96cd', 'FORNO7', '01d66fb6-316e-4425-95fd-3368355e37f5', 'out', 'ai', NULL, 'Yes, 6 tables on the terrace. It''s non-smoking.', '[]', 'sent', NULL, '4828deaa-39b1-4889-a68a-192a8263571d', NULL, true, '2026-10-17 18:32:02.747+08');
INSERT INTO public.messages VALUES ('d5085552-9be6-46ce-babd-648c35a75def', 'FORNO7', '757882a8-0c4d-4386-af4f-fc0c1c53963a', 'in', 'customer', NULL, 'thank youuu the pizza was amazing last night!!', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 12:09:00+08');
INSERT INTO public.messages VALUES ('84cca1ea-53f5-4aa2-b419-6cff447261c0', 'FORNO7', '757882a8-0c4d-4386-af4f-fc0c1c53963a', 'out', 'ai', NULL, 'That made our day, thank you! Come back soon.', '[]', 'sent', NULL, '44f681ce-37c1-44b2-a48d-49d8c2397ae2', NULL, true, '2026-10-17 12:09:01.396+08');
INSERT INTO public.messages VALUES ('e798da63-e05e-4c46-adee-b1c8283e47c4', 'FORNO7', 'd3aea845-97f7-45e0-8a49-17beeab683b7', 'in', 'customer', NULL, 'tshirt size M black ada?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 11:11:00+08');
INSERT INTO public.messages VALUES ('d0566a90-89f8-4f70-aaf3-e42561c688ac', 'FORNO7', 'd3aea845-97f7-45e0-8a49-17beeab683b7', 'out', 'ai', NULL, 'Our dark tee is Charcoal and size M is in stock, RM 59. Want me to hold one at the counter?', '[]', 'sent', NULL, '649560a7-fef1-4ec0-8f05-6a6f8f4f0854', NULL, true, '2026-10-17 11:11:01.254+08');
INSERT INTO public.messages VALUES ('0874ab68-81f2-4172-865b-150a3d8d5766', 'FORNO7', '2df88739-bd33-469f-b721-557ef6ede220', 'in', 'customer', NULL, 'delivery to subang can?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 12:18:00+08');
INSERT INTO public.messages VALUES ('7894e0e2-40d7-4e3e-a999-2e031870311f', 'FORNO7', '2df88739-bd33-469f-b721-557ef6ede220', 'out', 'ai', NULL, 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '[]', 'sent', NULL, '8ffa0827-2ee0-447c-bcd3-61e03c02ec34', NULL, true, '2026-10-17 12:18:02.754+08');
INSERT INTO public.messages VALUES ('bee2627d-60b9-4c3d-8ca0-36a8a9b442fa', 'FORNO7', '317c100c-3638-42cc-bbf5-e012aeb8c881', 'in', 'customer', NULL, 'extra cheese how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 12:18:00+08');
INSERT INTO public.messages VALUES ('fe65943c-22b4-4182-9444-cea19edb99d4', 'FORNO7', '317c100c-3638-42cc-bbf5-e012aeb8c881', 'out', 'ai', NULL, 'Extra mozzarella RM 4, a whole burrata RM 12.', '[]', 'sent', NULL, '6e929264-63dc-4832-802b-982669a2cdfb', NULL, true, '2026-10-17 12:18:02.995+08');
INSERT INTO public.messages VALUES ('7250a77c-c124-4830-a818-a53fe994dfe3', 'FORNO7', '3451b7a2-043c-46e1-bbb1-6198515b9fda', 'in', 'customer', NULL, 'do u deliver to mont kiara', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 18:04:00+08');
INSERT INTO public.messages VALUES ('a7982c44-4628-4259-872a-8114114227c6', 'FORNO7', '3451b7a2-043c-46e1-bbb1-6198515b9fda', 'out', 'ai', NULL, 'Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.', '[]', 'sent', NULL, '00e54c7e-b076-4b12-b59f-d1bf8a1f294c', NULL, true, '2026-10-17 18:04:02.307+08');
INSERT INTO public.messages VALUES ('f0884caa-f354-4d8e-b802-5ae569b747a7', 'FORNO7', '753063f6-28c0-41e0-8e92-c5d2622cdeba', 'in', 'customer', NULL, 'can book for 2 sat 730pm', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 16:31:00+08');
INSERT INTO public.messages VALUES ('905398ca-b675-405c-b962-abfb61b5bcc2', 'FORNO7', '753063f6-28c0-41e0-8e92-c5d2622cdeba', 'out', 'ai', NULL, 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '[]', 'sent', NULL, 'ef077c67-18f1-44c7-a356-b27a96272900', NULL, true, '2026-10-17 16:31:01.546+08');
INSERT INTO public.messages VALUES ('2a744257-97a7-4e21-a4e5-9373cdbfa68e', 'FORNO7', '9b51041d-9640-418b-8aef-3ac3b3083fac', 'in', 'customer', NULL, 'the apron got in red?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 09:11:00+08');
INSERT INTO public.messages VALUES ('426710cc-d6a8-43c5-9741-1aa0adf0eb4d', 'FORNO7', '9b51041d-9640-418b-8aef-3ac3b3083fac', 'out', 'ai', NULL, 'Yes, Brick Red aprons are in stock in S, M and L (RM 69). XL has just one left.', '[]', 'sent', NULL, '7dbc4431-2a4b-46e6-8463-592168275411', NULL, true, '2026-10-17 09:11:01.251+08');
INSERT INTO public.messages VALUES ('642904ea-04fc-4484-aaba-a607026e6702', 'FORNO7', '4be2ac6b-2e2d-4413-8fde-59fc1688da04', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 16:22:00+08');
INSERT INTO public.messages VALUES ('6a46be5c-bcb1-4b7c-8091-39de6559e64b', 'FORNO7', '4be2ac6b-2e2d-4413-8fde-59fc1688da04', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, '9bc99330-53c8-45fc-9f41-76b98185520e', NULL, true, '2026-10-17 16:22:01.22+08');
INSERT INTO public.messages VALUES ('dec0c12e-dd16-49c1-bbfb-cfcad1ec58d1', 'FORNO7', '28dc9569-3ef1-4a2b-beb8-c2545e58d8b9', 'in', 'customer', NULL, 'can bring own wine? corkage how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 13:24:00+08');
INSERT INTO public.messages VALUES ('6d32ff2a-2817-499d-af0a-f73d759e4402', 'FORNO7', '28dc9569-3ef1-4a2b-beb8-c2545e58d8b9', 'out', 'ai', NULL, 'Yes. Corkage is RM 40 per bottle, maximum 2 bottles per table.', '[]', 'sent', NULL, '01fa15b0-f60e-4518-86ed-bc2cec9fd2ba', NULL, true, '2026-10-17 13:24:01.746+08');
INSERT INTO public.messages VALUES ('d47fcc3c-9720-4da6-b162-30c733ac63cc', 'FORNO7', '9b11a45c-e951-4ac0-abc0-d9c62e8eedf1', 'in', 'customer', NULL, 'thank youuu the pizza was amazing last night!!', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 12:28:00+08');
INSERT INTO public.messages VALUES ('1ea59fe4-b377-4879-a62b-cb3204924ba0', 'FORNO7', '9b11a45c-e951-4ac0-abc0-d9c62e8eedf1', 'out', 'ai', NULL, 'That made our day, thank you! Come back soon.', '[]', 'sent', NULL, '6990840d-13b8-47ee-bd59-a25237db24d2', NULL, true, '2026-10-17 12:28:01.996+08');
INSERT INTO public.messages VALUES ('e5081fe8-e3be-44ea-8559-b3d3417bb237', 'FORNO7', '4f4a25e1-f6cf-4fa8-baf3-1ea2c553085e', 'in', 'customer', NULL, 'any dress code', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 16:46:00+08');
INSERT INTO public.messages VALUES ('c5d3c139-ba5c-4a86-b2c0-cd513f26debf', 'FORNO7', '4f4a25e1-f6cf-4fa8-baf3-1ea2c553085e', 'out', 'ai', NULL, 'No dress code at all.', '[]', 'sent', NULL, 'bff47f64-a8c5-45ef-aa1e-cfe8c4ee484c', NULL, true, '2026-10-17 16:46:03.3+08');
INSERT INTO public.messages VALUES ('3d5aee3b-2d60-4f80-be64-15023541cecf', 'FORNO7', '4c2f68a6-db06-47bb-ad22-b475abc2001b', 'in', 'customer', NULL, 'can book for 2 sat 730pm', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 15:46:00+08');
INSERT INTO public.messages VALUES ('283f5d1b-63d0-433f-92e4-25d394440e26', 'FORNO7', '4c2f68a6-db06-47bb-ad22-b475abc2001b', 'out', 'ai', NULL, 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '[]', 'sent', NULL, '0f75e10c-a01b-4b04-a946-63f1b77cab26', NULL, true, '2026-10-17 15:46:02.515+08');
INSERT INTO public.messages VALUES ('c360e3fb-21c0-4fad-8a1c-d146abacf5c6', 'FORNO7', '27b9adae-c8fc-454c-955f-588cc0c02092', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 16:30:00+08');
INSERT INTO public.messages VALUES ('82288374-297c-4b02-befa-a0a33cc64ca8', 'FORNO7', '27b9adae-c8fc-454c-955f-588cc0c02092', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, 'cd70fd00-91ce-4b59-a8f5-d6a62cc46f2b', NULL, true, '2026-10-17 16:30:01.653+08');
INSERT INTO public.messages VALUES ('a657f07b-beee-4fc2-b75a-20cc811a2236', 'FORNO7', '39be4d1c-1b3f-4142-bf4b-cf9766b3ac42', 'in', 'customer', NULL, 'gluten free pizza available?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 18:36:00+08');
INSERT INTO public.messages VALUES ('1c38ff76-7279-4ecc-9f8a-9e2747586763', 'FORNO7', '39be4d1c-1b3f-4142-bf4b-cf9766b3ac42', 'out', 'ai', NULL, 'Let me check with the team and come back to you here.', '[]', 'sent', NULL, '48a0c168-d6fd-4b81-991e-09e66a0c50ec', NULL, true, '2026-10-17 18:36:01.34+08');
INSERT INTO public.messages VALUES ('6ab403e3-efd8-4b58-9497-aae40193b509', 'FORNO7', 'bf084f72-4b41-422e-b2a8-91ae85702ce6', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 15:39:00+08');
INSERT INTO public.messages VALUES ('16b0e90d-ea86-4f18-8e9c-3923debb2121', 'FORNO7', 'bf084f72-4b41-422e-b2a8-91ae85702ce6', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, '3ce69f15-5cbb-4616-b2ff-9fd6449bf3a0', NULL, true, '2026-10-17 15:39:01.565+08');
INSERT INTO public.messages VALUES ('6460e8ac-a065-49fc-a894-5f71114ef026', 'FORNO7', 'd84eca4f-4758-433e-9539-4337b69ddbe2', 'in', 'customer', NULL, 'can write my assignment about italy', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 09:29:00+08');
INSERT INTO public.messages VALUES ('7755a2e8-9f85-4d33-b5ac-a3152cfa7301', 'FORNO7', 'd84eca4f-4758-433e-9539-4337b69ddbe2', 'out', 'ai', NULL, 'Sorry, I can only help with Forno Sette''s menu, bookings and orders.', '[]', 'sent', NULL, '09f0ce0f-49c6-48ce-9902-42a1291235b0', NULL, true, '2026-10-17 09:29:01.259+08');
INSERT INTO public.messages VALUES ('3defaa81-5ba7-4879-a2ce-a150c986968c', 'FORNO7', 'dea2891a-8b58-4dba-a725-64fd9e6171dd', 'in', 'customer', NULL, 'do u have gluten free base?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 21:11:00+08');
INSERT INTO public.messages VALUES ('7d05e534-bc4a-4980-9350-546e450e1bc7', 'FORNO7', 'dea2891a-8b58-4dba-a725-64fd9e6171dd', 'out', 'ai', NULL, 'Good question. I''ll check with the team and get back to you here shortly.', '[]', 'sent', NULL, '6d72be06-f6bb-4a8a-beef-a8cc753d100e', NULL, true, '2026-10-17 21:11:01.527+08');
INSERT INTO public.messages VALUES ('c116ac32-f4fb-4770-9e16-eb6f27844410', 'FORNO7', '40d63d7e-3854-4ccc-ab20-d76ae7d7b7ba', 'in', 'customer', NULL, 'can bring birthday cake? any charge', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 22:46:00+08');
INSERT INTO public.messages VALUES ('dae99384-94a8-4320-b351-df00493e9041', 'FORNO7', '40d63d7e-3854-4ccc-ab20-d76ae7d7b7ba', 'out', 'ai', NULL, 'Of course, bring your own cake. There''s no cake-cutting fee.', '[]', 'sent', NULL, '9c042d49-4a14-4dfe-bddd-4fa2eb263d0f', NULL, true, '2026-10-17 22:46:01.232+08');
INSERT INTO public.messages VALUES ('179e1a33-ebbc-4219-835f-ad7d33af3df0', 'FORNO7', '39fa342f-f0de-4f90-ae20-f507706ea508', 'in', 'customer', NULL, 'rendang pizza spicy or not', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 11:26:00+08');
INSERT INTO public.messages VALUES ('97a934b4-ac6f-4963-b6b2-1f266ea68941', 'FORNO7', '39fa342f-f0de-4f90-ae20-f507706ea508', 'out', 'ai', NULL, 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '[]', 'sent', NULL, '9957fa44-03da-4bb7-a5e6-b5f8dd047e99', NULL, true, '2026-10-17 11:26:02.062+08');
INSERT INTO public.messages VALUES ('0ed9a25e-17c5-4ad3-a03c-5136aca8b14f', 'FORNO7', '0fc264f6-ac62-4868-ab24-8a63838095bc', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 13:19:00+08');
INSERT INTO public.messages VALUES ('15833fe3-d578-4300-a1b1-74f9bd0ff7fd', 'FORNO7', '0fc264f6-ac62-4868-ab24-8a63838095bc', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, '5a7a55b3-d46d-41f2-acdb-9d275b3fc0f2', NULL, true, '2026-10-17 13:19:02.997+08');
INSERT INTO public.messages VALUES ('4a0b62a4-0a31-4b23-a51a-6e2db12ca256', 'FORNO7', '6050b219-34fc-4dff-9186-4f3f3d79af08', 'in', 'customer', NULL, 'dog friendly??', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 17:09:00+08');
INSERT INTO public.messages VALUES ('96101a2d-e166-4c04-be54-b0a6eb383d2a', 'FORNO7', '6050b219-34fc-4dff-9186-4f3f3d79af08', 'out', 'ai', NULL, 'Dogs are welcome on our terrace and we''ll bring a water bowl.', '[]', 'sent', NULL, 'b8800449-8347-4141-b4a5-c35dc530a5f7', NULL, true, '2026-10-17 17:09:02.666+08');
INSERT INTO public.messages VALUES ('053689fc-0034-4576-868a-a108a726e386', 'FORNO7', 'c4fefd19-4ac3-4f16-b381-7dfcc3389fda', 'in', 'customer', NULL, 'sell frozen pizza to bring home?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 20:04:00+08');
INSERT INTO public.messages VALUES ('47ffd673-10ef-46a2-9118-c5485903b289', 'FORNO7', 'c4fefd19-4ac3-4f16-b381-7dfcc3389fda', 'out', 'ai', NULL, 'I''ll check with the team and let you know here.', '[]', 'sent', NULL, '8e0bc906-11b2-45b7-a0cc-f997b171d8d5', NULL, true, '2026-10-17 20:04:03.126+08');
INSERT INTO public.messages VALUES ('fce61a15-6489-4071-8c23-a72c0ec32218', 'FORNO7', '3c0a9d46-af3a-48f9-a237-b51227f01a70', 'in', 'customer', NULL, 'pizza came cold n soggy wat la', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 18:42:00+08');
INSERT INTO public.messages VALUES ('d215d61d-ccaf-4132-8746-ad6c9c4779fb', 'FORNO7', '3c0a9d46-af3a-48f9-a237-b51227f01a70', 'out', 'ai', NULL, 'So sorry. Please send a photo; our duty manager reviews it personally and will make it right.', '[]', 'sent', NULL, '39399ca8-38fa-475b-8d45-596a29c80285', NULL, true, '2026-10-17 18:42:01.352+08');
INSERT INTO public.messages VALUES ('06007407-b828-44b9-a4e6-394d05d029ca', 'FORNO7', '364f1662-473b-44eb-9682-609c9a6f7240', 'in', 'customer', NULL, 'can do half half pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 21:46:00+08');
INSERT INTO public.messages VALUES ('61da8a79-cf46-4a22-ae01-884efbc71d69', 'FORNO7', '364f1662-473b-44eb-9682-609c9a6f7240', 'out', 'ai', NULL, 'Yes, on Medium and Large, priced at the more expensive half.', '[]', 'sent', NULL, 'a406cb8d-d5f0-49c1-bc78-ef42cf36d8e9', NULL, true, '2026-10-17 21:46:02.82+08');
INSERT INTO public.messages VALUES ('0540e198-ddea-4ea7-b62b-dc2bb22b32c4', 'FORNO7', 'f7c476ac-57ee-498d-9d71-5834e9d941c6', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 10:02:00+08');
INSERT INTO public.messages VALUES ('4c37642a-b3d5-4759-81a2-7fd9c3eceb7c', 'FORNO7', 'f7c476ac-57ee-498d-9d71-5834e9d941c6', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, 'cdd8d8c7-6230-40fd-b1cc-ac25510255d2', NULL, true, '2026-10-17 10:02:03.125+08');
INSERT INTO public.messages VALUES ('40196f07-573b-4521-b1e7-103f232276dd', 'FORNO7', '01d6c52e-f7c1-49ef-a45c-569adaf6f26e', 'in', 'customer', NULL, 'we supply mozzarella, can talk to your purchasing?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 11:31:00+08');
INSERT INTO public.messages VALUES ('dc9c3cc4-38cc-445a-92db-3207fe1be38d', 'FORNO7', '01d6c52e-f7c1-49ef-a45c-569adaf6f26e', 'out', 'ai', NULL, 'Thank you! I''ve shared this with our team, and someone will reach out here.', '[]', 'sent', NULL, '4d412bde-e057-4300-879a-caff3ea5f18b', NULL, true, '2026-10-17 11:31:02.227+08');
INSERT INTO public.messages VALUES ('a96fc5c8-0432-4b17-9ba6-971a8e612f72', 'FORNO7', 'b6888f91-1d36-48f3-845f-a6702c219048', 'in', 'customer', NULL, 'how to cancel my booking', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 09:52:00+08');
INSERT INTO public.messages VALUES ('2ba790c6-e9a7-4bd3-be16-f159b291983d', 'FORNO7', 'b6888f91-1d36-48f3-845f-a6702c219048', 'out', 'ai', NULL, 'Send us your booking reference here. Cancellation is free up to 2 hours before.', '[]', 'sent', NULL, '5d53da31-36c1-45d4-a2f5-c9245f92449f', NULL, true, '2026-10-17 09:52:03.332+08');
INSERT INTO public.messages VALUES ('be78b2df-7dd6-4248-b422-ccd754147423', 'FORNO7', 'f69aaf27-f663-4cfd-9a29-c484f265ad17', 'in', 'customer', NULL, 'non alcoholic drinks got what', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 19:27:00+08');
INSERT INTO public.messages VALUES ('b2d73012-d5c3-4996-ad29-e530adf7ff30', 'FORNO7', 'f69aaf27-f663-4cfd-9a29-c484f265ad17', 'out', 'ai', NULL, 'House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.', '[]', 'sent', NULL, 'c8c61590-592b-401a-bd2e-fb9e5eef80cc', NULL, true, '2026-10-17 19:27:02.569+08');
INSERT INTO public.messages VALUES ('59bf2e70-73b8-48ab-9b7f-055d1e34c3a6', 'FORNO7', 'd2eb4070-0a67-4446-a954-eb1590d3b03a', 'in', 'customer', NULL, 'gluten free pizza available?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 18:28:00+08');
INSERT INTO public.messages VALUES ('a27d2277-be16-4f8b-a6b1-597ef14e9ea4', 'FORNO7', 'd2eb4070-0a67-4446-a954-eb1590d3b03a', 'out', 'ai', NULL, 'Let me check with the team and come back to you here.', '[]', 'sent', NULL, '2df2563e-8033-45e1-9434-1d04f6a1350b', NULL, true, '2026-10-17 18:28:01.27+08');
INSERT INTO public.messages VALUES ('bcf9c599-ea08-4577-90fb-580146332cbb', 'FORNO7', '7222d610-1727-4545-98d2-e40f7df9f181', 'in', 'customer', NULL, 'running 20 min late still can keep table?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 18:41:00+08');
INSERT INTO public.messages VALUES ('cb1fb2bd-cd11-4679-ace7-c70fdcd1b36b', 'FORNO7', '7222d610-1727-4545-98d2-e40f7df9f181', 'out', 'ai', NULL, 'We hold tables for 15 minutes. Send your booking reference and we''ll let the floor know you''re coming.', '[]', 'sent', NULL, 'feee3b70-50c7-4632-824d-139232583931', NULL, true, '2026-10-17 18:41:02.36+08');
INSERT INTO public.messages VALUES ('7fcc45fe-b83d-45ae-913c-1a42cd48b89f', 'FORNO7', '3fdaf061-a1b4-4fc4-9c58-4e94bcff42e1', 'in', 'customer', NULL, 'sunday lunch 6 pax 1pm got table?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 16:03:00+08');
INSERT INTO public.messages VALUES ('5cd89258-6110-4da8-826a-cc2e6bfb80a5', 'FORNO7', '3fdaf061-a1b4-4fc4-9c58-4e94bcff42e1', 'out', 'ai', NULL, 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '[]', 'sent', NULL, '8901cde4-11a1-492b-869f-7f39170da704', NULL, true, '2026-10-17 16:03:03.236+08');
INSERT INTO public.messages VALUES ('eb11a445-939e-4fd2-8415-bd5f0b3de0ea', 'FORNO7', 'd3fed828-6796-4b9e-bcc5-95e1761bff56', 'in', 'customer', NULL, 'open christmas day?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 11:25:00+08');
INSERT INTO public.messages VALUES ('fcce5bc1-fe45-4e87-9b46-48861249307c', 'FORNO7', 'd3fed828-6796-4b9e-bcc5-95e1761bff56', 'out', 'ai', NULL, 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '[]', 'sent', NULL, '3278d825-87f7-4591-a686-17de908287ad', NULL, true, '2026-10-17 11:25:02.921+08');
INSERT INTO public.messages VALUES ('db7fd665-ca23-4156-8dad-dfa33884bf17', 'FORNO7', '59f0d53e-0d5a-4002-8a6a-ff4521881844', 'in', 'customer', NULL, 'delivery to subang can?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-17 10:55:00+08');
INSERT INTO public.messages VALUES ('4f70964f-08cc-40dd-8e5c-022694c2e712', 'FORNO7', '59f0d53e-0d5a-4002-8a6a-ff4521881844', 'out', 'ai', NULL, 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '[]', 'sent', NULL, '8b209af3-a368-48f5-942e-319a60733233', NULL, true, '2026-10-17 10:55:02.132+08');
INSERT INTO public.messages VALUES ('e626c4d1-76fe-41bf-9feb-6be1791c876e', 'FORNO7', '5160c90c-6c63-4ca3-af7a-591a80a98abb', 'in', 'customer', NULL, 'wat time u close tonite', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 21:22:00+08');
INSERT INTO public.messages VALUES ('fa69a791-f596-4cb1-990e-69345948386c', 'FORNO7', '5160c90c-6c63-4ca3-af7a-591a80a98abb', 'out', 'ai', NULL, 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '[]', 'sent', NULL, '52eaf26c-b062-446b-8129-cf04ede9d4a5', NULL, true, '2026-10-18 21:22:02.921+08');
INSERT INTO public.messages VALUES ('ec7b6645-0814-4fe9-a005-2aaebd686bfd', 'FORNO7', '1f172aeb-67f6-4e24-b901-e90712b263bb', 'in', 'customer', NULL, 'can i pay with tng', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 13:03:00+08');
INSERT INTO public.messages VALUES ('6dab5af1-f316-456f-909c-9c19933c5ab8', 'FORNO7', '1f172aeb-67f6-4e24-b901-e90712b263bb', 'out', 'ai', NULL, 'Yes, Touch ''n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.', '[]', 'sent', NULL, '1caf591a-99ae-4aab-9c4b-300c185c896f', NULL, true, '2026-10-18 13:03:01.944+08');
INSERT INTO public.messages VALUES ('67b7208e-018b-47c8-8415-56cc2fdec243', 'FORNO7', '40c6507b-a279-4e58-b2c1-0ee301caee37', 'in', 'customer', NULL, 'my son has nut allergy can he eat the pizza', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 14:11:00+08');
INSERT INTO public.messages VALUES ('2f60b5c3-574c-47c5-8743-366f668545f1', 'FORNO7', '40c6507b-a279-4e58-b2c1-0ee301caee37', 'out', 'ai', NULL, 'The Pollo Pesto contains pine nuts, and our kitchen handles tree nuts, so cross-contact is possible. Our manager will talk you through it before you order.', '[]', 'sent', NULL, 'da5e0b2f-6f5c-44ec-aca0-591abd296e39', NULL, true, '2026-10-18 14:11:03.112+08');
INSERT INTO public.messages VALUES ('03ce0693-59db-4dda-ab1b-f3efe722c7f0', 'FORNO7', '26983643-9ed5-4700-b919-1c17b830ddab', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 17:25:00+08');
INSERT INTO public.messages VALUES ('9b357599-2988-47ef-8256-8dbd79ef59f7', 'FORNO7', '26983643-9ed5-4700-b919-1c17b830ddab', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, '3ca483c9-1f03-4a33-ba8e-973c21018c3b', NULL, true, '2026-10-18 17:25:02.913+08');
INSERT INTO public.messages VALUES ('10311e69-d1a8-409e-a4f3-f48c08d8c07a', 'FORNO7', '11c72fac-f301-4739-af5a-240454e6ae92', 'in', 'customer', NULL, 'how long wait for walk in fri night', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 19:03:00+08');
INSERT INTO public.messages VALUES ('d7d8feb8-50f0-4c7f-abbb-908efb75ac12', 'FORNO7', '11c72fac-f301-4739-af5a-240454e6ae92', 'out', 'ai', NULL, 'Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.', '[]', 'sent', NULL, 'e41f808b-da00-4a10-ab0f-e43e80188be5', NULL, true, '2026-10-18 19:03:02.057+08');
INSERT INTO public.messages VALUES ('a28fbdb8-4b4c-48b9-a835-db3b8718f353', 'FORNO7', '01448773-4d8e-4010-a3a4-9648995493e8', 'in', 'customer', NULL, 'delivery to subang can?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 16:51:00+08');
INSERT INTO public.messages VALUES ('cf7672d6-157a-41be-ac6d-87f6d837d8ca', 'FORNO7', '01448773-4d8e-4010-a3a4-9648995493e8', 'out', 'ai', NULL, 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '[]', 'sent', NULL, '5344bd3e-006d-480c-a987-4d61b6fd079f', NULL, true, '2026-10-18 16:51:03.158+08');
INSERT INTO public.messages VALUES ('f163c7d0-a324-42dd-b84c-012d08ab5fd6', 'FORNO7', '1e775adc-79c3-4f18-b040-90836f1f3e5a', 'in', 'customer', NULL, 'is ur dough sourdough', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 18:56:00+08');
INSERT INTO public.messages VALUES ('314a977c-78c0-4044-9224-4e1fa909b1ff', 'FORNO7', '1e775adc-79c3-4f18-b040-90836f1f3e5a', 'out', 'ai', NULL, 'It''s a 48-hour fermented dough with Italian 00 flour, not sourdough.', '[]', 'sent', NULL, '06e77435-cb95-45cd-a777-3400424ee625', NULL, true, '2026-10-18 18:56:01.751+08');
INSERT INTO public.messages VALUES ('b22eab11-76e3-4c2a-947a-f66d327a8368', 'FORNO7', 'ba48d238-f34c-4da8-8ac4-53703b0804a6', 'in', 'customer', NULL, 'can do half half pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 15:17:00+08');
INSERT INTO public.messages VALUES ('33c3ae32-8bb3-4c47-89a4-608d5e33238c', 'FORNO7', 'ba48d238-f34c-4da8-8ac4-53703b0804a6', 'out', 'ai', NULL, 'Yes, on Medium and Large, priced at the more expensive half.', '[]', 'sent', NULL, 'd758215f-d639-4e50-858b-75fe462aedfd', NULL, true, '2026-10-18 15:17:03.266+08');
INSERT INTO public.messages VALUES ('3404e9fa-db80-470d-9061-30ee8d15db53', 'FORNO7', 'e45faafb-60bf-4d71-a139-66289ab21a11', 'in', 'customer', NULL, 'kids menu?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 16:16:00+08');
INSERT INTO public.messages VALUES ('1ba87c00-6e7f-4468-9b50-cffe8ea0ea33', 'FORNO7', 'e45faafb-60bf-4d71-a139-66289ab21a11', 'out', 'ai', NULL, 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '[]', 'sent', NULL, '29ecac76-e0a6-4b8b-9c41-4f5034b45a6f', NULL, true, '2026-10-18 16:16:02.572+08');
INSERT INTO public.messages VALUES ('c50f9414-7748-4bff-99a9-6d84258916c2', 'FORNO7', '2536b770-186f-4423-8c32-9033b8bf2b23', 'in', 'customer', NULL, 'can i reserve for 12 ppl', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 14:22:00+08');
INSERT INTO public.messages VALUES ('b3f11f7d-e894-4594-9c5b-649bc44d38c6', 'FORNO7', '2536b770-186f-4423-8c32-9033b8bf2b23', 'out', 'ai', NULL, 'Up to 10 can be booked here. For 11 or more, our events team arranges the table personally.', '[]', 'sent', NULL, 'ab2f2732-6387-4548-b324-4395d262b320', NULL, true, '2026-10-18 14:22:01.605+08');
INSERT INTO public.messages VALUES ('155a7892-1caf-4a98-aaf0-fe5273457746', 'FORNO7', '2d7716fc-d60e-4316-af46-1f7ff9edcf6d', 'in', 'customer', NULL, 'wifi pw?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 21:30:00+08');
INSERT INTO public.messages VALUES ('c13361a8-66c8-460e-8c4e-d9fcd6f0c0a9', 'FORNO7', '2d7716fc-d60e-4316-af46-1f7ff9edcf6d', 'out', 'ai', NULL, 'We have free Wi-Fi; staff will share the password at your table.', '[]', 'sent', NULL, 'a9140080-8f27-481e-94e3-e7d73c2f6b8b', NULL, true, '2026-10-18 21:30:03.383+08');
INSERT INTO public.messages VALUES ('6a51e43c-8bee-4056-8d7b-c0a5801de8c6', 'FORNO7', '0066a90c-d33b-47a2-aaeb-e0e4bc781a5e', 'in', 'customer', NULL, 'student discount ada?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 14:11:00+08');
INSERT INTO public.messages VALUES ('43ad2264-5dcc-4310-8e47-ea5823c2d6e1', 'FORNO7', '0066a90c-d33b-47a2-aaeb-e0e4bc781a5e', 'out', 'ai', NULL, 'I''ll check with the team and reply here soon.', '[]', 'sent', NULL, '2b51d62a-9dda-4764-a008-f3b665698198', NULL, true, '2026-10-18 14:11:02.908+08');
INSERT INTO public.messages VALUES ('5c5b6c7b-5d95-477c-845b-ea34af2db5a9', 'FORNO7', 'b2e4dd66-be1d-4e00-a59e-c1837935ca25', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 13:04:00+08');
INSERT INTO public.messages VALUES ('0f37b361-079b-4f75-ba8e-4b60016ad8be', 'FORNO7', 'b2e4dd66-be1d-4e00-a59e-c1837935ca25', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, 'e6408621-89fa-45e2-8612-29d7865b68f4', NULL, true, '2026-10-18 13:04:02.668+08');
INSERT INTO public.messages VALUES ('183534de-fd1a-4dcf-be24-965434004590', 'FORNO7', 'd632ec36-b267-48f7-8f02-15ee31ac1386', 'in', 'customer', NULL, 'I want to discuss a franchise for Penang', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 12:37:00+08');
INSERT INTO public.messages VALUES ('1604331b-60e7-4268-aec8-77c47df9d2a7', 'FORNO7', 'd632ec36-b267-48f7-8f02-15ee31ac1386', 'out', 'ai', NULL, 'Thanks for your interest! I''ve passed this to our owner, who handles partnerships personally. They''ll reply here soon.', '[]', 'sent', NULL, '24c1e359-3fac-47db-be32-3f9e482b506b', NULL, true, '2026-10-18 12:37:01.787+08');
INSERT INTO public.messages VALUES ('a2d7aee3-e4af-401f-a449-f2340c419e2c', 'FORNO7', 'cc441ba9-837a-4a74-b9b4-5e45ba19717e', 'in', 'customer', NULL, 'do u have gluten free base?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 15:54:00+08');
INSERT INTO public.messages VALUES ('50523d74-93a9-4a34-9b80-f2015efe597f', 'FORNO7', 'cc441ba9-837a-4a74-b9b4-5e45ba19717e', 'out', 'ai', NULL, 'Good question. I''ll check with the team and get back to you here shortly.', '[]', 'sent', NULL, '18b18d76-13e9-4957-a6cf-0f12dcb275cc', NULL, true, '2026-10-18 15:54:01.879+08');
INSERT INTO public.messages VALUES ('86c4ce18-cf06-4550-81b3-fec274383f82', 'FORNO7', 'd40bd721-6a29-420c-8c9e-3ed9b83a3a13', 'in', 'customer', NULL, 'rendang pizza spicy or not', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 18:31:00+08');
INSERT INTO public.messages VALUES ('385295bb-2922-4869-a51f-c28cc7c5047a', 'FORNO7', 'd40bd721-6a29-420c-8c9e-3ed9b83a3a13', 'out', 'ai', NULL, 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '[]', 'sent', NULL, '83f352ee-3d70-4cb3-a6bf-3bd703cf4915', NULL, true, '2026-10-18 18:31:01.354+08');
INSERT INTO public.messages VALUES ('87dcb66f-aaed-47a5-a12b-1a965ea75b46', 'FORNO7', '5657e473-91dc-4f15-9f17-17be1e3a6cc2', 'in', 'customer', NULL, 'can do half half pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 20:44:00+08');
INSERT INTO public.messages VALUES ('11d1ed37-c081-4d82-8cc5-4e7a5a567bce', 'FORNO7', '5657e473-91dc-4f15-9f17-17be1e3a6cc2', 'out', 'ai', NULL, 'Yes, on Medium and Large, priced at the more expensive half.', '[]', 'sent', NULL, '1fae7a94-4966-473c-bd3e-eb87ce962ef1', NULL, true, '2026-10-18 20:44:02.114+08');
INSERT INTO public.messages VALUES ('7900d87e-2350-423e-95b9-07615336eb01', 'FORNO7', '64701343-de15-4df8-be81-a58d5c19817b', 'in', 'customer', NULL, 'how big is the large pizza', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 16:26:00+08');
INSERT INTO public.messages VALUES ('cab6b745-0923-459f-bd4a-914a842762e4', 'FORNO7', '64701343-de15-4df8-be81-a58d5c19817b', 'out', 'ai', NULL, 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '[]', 'sent', NULL, '74e14546-4419-488c-96cf-50aa4e5a8da4', NULL, true, '2026-10-18 16:26:02.189+08');
INSERT INTO public.messages VALUES ('8d016656-e85f-451e-9384-65cc729f75b6', 'FORNO7', '379a5dba-67a7-4e99-8f3e-258d4b5cafc4', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 19:31:00+08');
INSERT INTO public.messages VALUES ('53e8b892-90e3-487e-9856-8936bd7a0810', 'FORNO7', '379a5dba-67a7-4e99-8f3e-258d4b5cafc4', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, 'bc7c9f9c-d4c3-4134-89b1-fce3a8ef152f', NULL, true, '2026-10-18 19:31:01.745+08');
INSERT INTO public.messages VALUES ('6682791a-6bf8-4cd7-b4e5-7455903a11d7', 'FORNO7', '029c1b25-fcb8-4b5d-b428-d114ba55de8c', 'in', 'customer', NULL, 'can do half half pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 22:26:00+08');
INSERT INTO public.messages VALUES ('df84a772-9c1d-4c20-9a31-f3c0bcacdae0', 'FORNO7', '029c1b25-fcb8-4b5d-b428-d114ba55de8c', 'out', 'ai', NULL, 'Yes, on Medium and Large, priced at the more expensive half.', '[]', 'sent', NULL, 'ff0d88f6-fce5-4f12-a8f1-8ab3c69da88f', NULL, true, '2026-10-18 22:26:03.134+08');
INSERT INTO public.messages VALUES ('bf46cee2-3668-4518-a86c-6b69bbf24996', 'FORNO7', 'd1905f7d-25d9-4cc2-ba9b-31f0d520818f', 'in', 'customer', NULL, 'how big is the large pizza', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 20:27:00+08');
INSERT INTO public.messages VALUES ('b4a8e0dc-105c-4e3e-8575-114a3db36f1f', 'FORNO7', 'd1905f7d-25d9-4cc2-ba9b-31f0d520818f', 'out', 'ai', NULL, 'Large is 15" and feeds 2–3 people. Medium is 12", Small is 9".', '[]', 'sent', NULL, '7818586c-9442-4cb9-8f58-e059f439b7a6', NULL, true, '2026-10-18 20:27:03.547+08');
INSERT INTO public.messages VALUES ('ff776a2f-fb61-4b85-b9c0-ae10b024a87e', 'FORNO7', 'ed7328c9-d6d8-45e3-bf80-e082758e25a7', 'in', 'customer', NULL, 'kids menu?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 13:06:00+08');
INSERT INTO public.messages VALUES ('d387381f-937c-4c7e-b6f2-c17a964ff9fc', 'FORNO7', 'ed7328c9-d6d8-45e3-bf80-e082758e25a7', 'out', 'ai', NULL, 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '[]', 'sent', NULL, '315fa087-974b-4d6a-8035-fb24fdbf158f', NULL, true, '2026-10-18 13:06:03.517+08');
INSERT INTO public.messages VALUES ('4f77f788-6dd7-4d27-8c32-97af91f330ed', 'FORNO7', 'ab8855ce-e7b2-41ec-8baa-a117d85d3d3f', 'in', 'customer', NULL, 'delivery to subang can?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 16:26:00+08');
INSERT INTO public.messages VALUES ('6aae9ba9-8adb-4712-9825-456f3aab38b9', 'FORNO7', 'ab8855ce-e7b2-41ec-8baa-a117d85d3d3f', 'out', 'ai', NULL, 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '[]', 'sent', NULL, '70a6725e-a5b9-43ef-94e7-457a9e884c68', NULL, true, '2026-10-18 16:26:02.527+08');
INSERT INTO public.messages VALUES ('eae29ccd-b08d-4e02-8108-45b3cd4042de', 'FORNO7', '026a3daf-2b6f-4b81-b621-15f7a3c4d328', 'in', 'customer', NULL, 'can book for 2 sat 730pm', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 13:35:00+08');
INSERT INTO public.messages VALUES ('1e530175-9b8a-42d6-aea5-8d2ae7b4b73e', 'FORNO7', '026a3daf-2b6f-4b81-b621-15f7a3c4d328', 'out', 'ai', NULL, 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '[]', 'sent', NULL, '8dc98ee7-9da3-4455-b834-8b23eb59a463', NULL, true, '2026-10-18 13:35:01.796+08');
INSERT INTO public.messages VALUES ('75d78819-95eb-4cec-8f0d-198fb92fe6db', 'FORNO7', '33f2bc41-1788-4a1b-b6ad-b7810288225e', 'in', 'customer', NULL, 'got spicy pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 20:13:00+08');
INSERT INTO public.messages VALUES ('691091c6-7cd8-454c-95cf-d3711b32cb01', 'FORNO7', '33f2bc41-1788-4a1b-b6ad-b7810288225e', 'out', 'ai', NULL, 'Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.', '[]', 'sent', NULL, '487d8166-bda2-4438-86af-034b14b2376e', NULL, true, '2026-10-18 20:13:02.673+08');
INSERT INTO public.messages VALUES ('e2a4cd94-f510-4192-9766-44d8e2b0dd29', 'FORNO7', '3697ffa9-7619-4993-b51f-cdaf0547b317', 'in', 'customer', NULL, 'do u deliver to mont kiara', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 22:47:00+08');
INSERT INTO public.messages VALUES ('f0416edb-d7d2-4f10-8658-da74d64274a9', 'FORNO7', '3697ffa9-7619-4993-b51f-cdaf0547b317', 'out', 'ai', NULL, 'Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.', '[]', 'sent', NULL, '1fd0235d-a892-4740-8982-110e5e42c446', NULL, true, '2026-10-18 22:47:02.142+08');
INSERT INTO public.messages VALUES ('9a98463e-8a65-4812-8eb8-fd1cfc089e17', 'FORNO7', '01a3bbd6-7c89-4f7f-9bc9-e2b204ea94fb', 'in', 'customer', NULL, 'can smoke at the terrace?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 09:57:00+08');
INSERT INTO public.messages VALUES ('537d89a2-d0e6-46ca-a7cc-ad863df34069', 'FORNO7', '01a3bbd6-7c89-4f7f-9bc9-e2b204ea94fb', 'out', 'ai', NULL, 'Sorry, smoking and vaping aren''t allowed anywhere at the restaurant, including the terrace.', '[]', 'sent', NULL, '09d84a48-1968-4901-a482-659e341e0827', NULL, true, '2026-10-18 09:57:02.923+08');
INSERT INTO public.messages VALUES ('567b5237-815f-4714-b0f1-2df799df6d9a', 'FORNO7', '65dc3648-5e0a-4746-ab09-682fd3c2fa18', 'in', 'customer', NULL, 'sunday lunch 6 pax 1pm got table?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 14:12:00+08');
INSERT INTO public.messages VALUES ('59699a48-b154-418f-bd21-e33dd612bbdc', 'FORNO7', '65dc3648-5e0a-4746-ab09-682fd3c2fa18', 'out', 'ai', NULL, 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '[]', 'sent', NULL, 'a01a870a-6406-4fcc-b494-0f26964cf127', NULL, true, '2026-10-18 14:12:02.728+08');
INSERT INTO public.messages VALUES ('11b0a091-ec30-41db-a416-53378f047bf6', 'FORNO7', 'a61ae524-60be-4610-9863-dabe305c1d99', 'in', 'customer', NULL, 'large margherita how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 16:24:00+08');
INSERT INTO public.messages VALUES ('415e0e2b-7f12-48b2-b955-dbd8fe340083', 'FORNO7', 'a61ae524-60be-4610-9863-dabe305c1d99', 'out', 'ai', NULL, 'Large Margherita (15") is RM 52. Medium RM 38, Small RM 28.', '[]', 'sent', NULL, 'e0edaf77-60a9-4137-bb9c-72aa960b9b92', NULL, true, '2026-10-18 16:24:02.821+08');
INSERT INTO public.messages VALUES ('316b89aa-b15b-4894-a62d-328ab65312a5', 'FORNO7', 'a89ba199-fdf9-491b-8c24-065bdaedad31', 'in', 'customer', NULL, 'hiring? looking for part time kitchen job', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 22:16:00+08');
INSERT INTO public.messages VALUES ('6291a042-0769-4b14-b9a2-a47aabac1717', 'FORNO7', 'a89ba199-fdf9-491b-8c24-065bdaedad31', 'out', 'ai', NULL, 'We''re hiring pizza cooks. Send /apply to our Telegram bot to apply.', '[]', 'sent', NULL, 'a1900190-d114-408e-a9e3-372f5f8f8660', NULL, true, '2026-10-18 22:16:01.228+08');
INSERT INTO public.messages VALUES ('bd4f9339-9255-49dc-adc9-3d16f0f34aec', 'FORNO7', '1feb3923-7d68-4ebd-bfb0-bef86cccecc9', 'in', 'customer', NULL, 'the apron got in red?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 22:14:00+08');
INSERT INTO public.messages VALUES ('a9182ff1-b3ed-4e2c-8a2c-482adb2d1d5e', 'FORNO7', '1feb3923-7d68-4ebd-bfb0-bef86cccecc9', 'out', 'ai', NULL, 'Yes, Brick Red aprons are in stock in S, M and L (RM 69). XL has just one left.', '[]', 'sent', NULL, '5c65f4bb-7b79-4c01-9669-b589dd482319', NULL, true, '2026-10-18 22:14:03.331+08');
INSERT INTO public.messages VALUES ('b93f7738-c63a-435f-b318-e5fae7572617', 'FORNO7', 'b58755da-0ee0-4d2f-8840-6411f68b2be1', 'in', 'customer', NULL, 'thank youuu the pizza was amazing last night!!', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 12:22:00+08');
INSERT INTO public.messages VALUES ('5c43622f-8f51-48db-8aa2-9c29718bdb5e', 'FORNO7', 'b58755da-0ee0-4d2f-8840-6411f68b2be1', 'out', 'ai', NULL, 'That made our day, thank you! Come back soon.', '[]', 'sent', NULL, 'e50279df-66d6-410b-a7d7-dbb3cfb0debc', NULL, true, '2026-10-18 12:22:03.244+08');
INSERT INTO public.messages VALUES ('c01f7908-8f2c-4f08-9b97-268752bf4bbf', 'FORNO7', '7f4cd5fc-8b5b-4d03-b19a-63554cf5eb87', 'in', 'customer', NULL, 'wat time u close tonite', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 09:00:00+08');
INSERT INTO public.messages VALUES ('2f925186-0366-4790-9f8f-cfcc1eeae0df', 'FORNO7', '7f4cd5fc-8b5b-4d03-b19a-63554cf5eb87', 'out', 'ai', NULL, 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '[]', 'sent', NULL, '28766c30-dc66-4989-af07-b46a368dbdfc', NULL, true, '2026-10-18 09:00:01.982+08');
INSERT INTO public.messages VALUES ('fd499d88-d0f6-478e-a5bf-ba0e98403210', 'FORNO7', '627b4a9f-b447-4b98-85cd-9c0d61054349', 'in', 'customer', NULL, 'do u have gluten free base?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 15:45:00+08');
INSERT INTO public.messages VALUES ('424e4ec6-333f-483f-9140-859b6d6c6fc3', 'FORNO7', '627b4a9f-b447-4b98-85cd-9c0d61054349', 'out', 'ai', NULL, 'Good question. I''ll check with the team and get back to you here shortly.', '[]', 'sent', NULL, 'c3d4328c-db7a-43ac-8c14-96edf7b11ee0', NULL, true, '2026-10-18 15:45:01.801+08');
INSERT INTO public.messages VALUES ('6584e57b-33d8-44f2-b579-5143b8426a54', 'FORNO7', 'ec31aa22-a82c-42c3-9e8e-406220af10f9', 'in', 'customer', NULL, 'can bring own wine? corkage how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 13:37:00+08');
INSERT INTO public.messages VALUES ('ec871543-a13e-4e48-94ff-b7e1ec092ba7', 'FORNO7', 'ec31aa22-a82c-42c3-9e8e-406220af10f9', 'out', 'ai', NULL, 'Yes. Corkage is RM 40 per bottle, maximum 2 bottles per table.', '[]', 'sent', NULL, 'd3786dd6-287b-40cb-b924-791517cfbde8', NULL, true, '2026-10-18 13:37:03.163+08');
INSERT INTO public.messages VALUES ('33669dbb-1505-4650-a05d-87f6a7f58a03', 'FORNO7', 'ebd9bf69-df02-4dc6-b8f9-627de10663b8', 'in', 'customer', NULL, 'do u have gluten free base?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-18 22:23:00+08');
INSERT INTO public.messages VALUES ('31754ae7-674d-4732-8afd-8cbe904a1c8f', 'FORNO7', 'ebd9bf69-df02-4dc6-b8f9-627de10663b8', 'out', 'ai', NULL, 'Good question. I''ll check with the team and get back to you here shortly.', '[]', 'sent', NULL, 'edd2a726-43c8-4f16-ba1b-c116686ef885', NULL, true, '2026-10-18 22:23:01.926+08');
INSERT INTO public.messages VALUES ('e6e0660e-d45e-47fd-8a82-231ed2f61ae2', 'FORNO7', '6e57c75d-ee3b-4bb0-99a5-670d4b984b9d', 'in', 'customer', NULL, 'open christmas day?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-19 19:22:00+08');
INSERT INTO public.messages VALUES ('a613f212-3d0a-465c-acc5-2df84f6c5074', 'FORNO7', '6e57c75d-ee3b-4bb0-99a5-670d4b984b9d', 'out', 'ai', NULL, 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '[]', 'sent', NULL, 'b9e6a91c-9369-481b-8afe-81e24f441b9d', NULL, true, '2026-10-19 19:22:03.114+08');
INSERT INTO public.messages VALUES ('a0696bbe-8acb-4faa-8a14-3a44ceaef4a7', 'FORNO7', 'b320d77c-dd6e-4e2b-bd86-f2c461520eb0', 'in', 'customer', NULL, 'hiring? looking for part time kitchen job', '[]', 'received', NULL, NULL, NULL, true, '2026-10-19 17:21:00+08');
INSERT INTO public.messages VALUES ('8cb1cc5e-7f53-4871-8204-c851f0d789cf', 'FORNO7', 'b320d77c-dd6e-4e2b-bd86-f2c461520eb0', 'out', 'ai', NULL, 'We''re hiring pizza cooks. Send /apply to our Telegram bot to apply.', '[]', 'sent', NULL, '6b648e84-a5d5-4c41-a097-ea7435863e4d', NULL, true, '2026-10-19 17:21:02.127+08');
INSERT INTO public.messages VALUES ('4057318c-3976-4469-89c6-97e5063799b6', 'FORNO7', '57abb75b-d0de-4695-8e45-8d23ba1778bf', 'in', 'customer', NULL, 'sell frozen pizza to bring home?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-19 11:04:00+08');
INSERT INTO public.messages VALUES ('3a3ec988-2241-4c9f-900e-e3f2fd2ca52d', 'FORNO7', '57abb75b-d0de-4695-8e45-8d23ba1778bf', 'out', 'ai', NULL, 'I''ll check with the team and let you know here.', '[]', 'sent', NULL, '47dd62fb-c0c4-460c-9f2d-2444bde4bbcd', NULL, true, '2026-10-19 11:04:01.211+08');
INSERT INTO public.messages VALUES ('6538553e-a281-4084-ab33-8af021394255', 'FORNO7', 'b26ff72a-44a5-4e28-8e29-f6a867d4804a', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-19 21:04:00+08');
INSERT INTO public.messages VALUES ('eb66b9d0-6223-432c-b6b2-680b89b63fea', 'FORNO7', 'b26ff72a-44a5-4e28-8e29-f6a867d4804a', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, '039caa8f-a958-470e-878a-e8145a0cc601', NULL, true, '2026-10-19 21:04:01.897+08');
INSERT INTO public.messages VALUES ('d4164ac4-6720-449a-a3bb-d6e24c6dda42', 'FORNO7', '42c3a37f-1ea2-45f4-9288-8edb64220404', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-19 11:29:00+08');
INSERT INTO public.messages VALUES ('ce18a82f-af95-4842-895a-7fd8b7c4c1cb', 'FORNO7', '42c3a37f-1ea2-45f4-9288-8edb64220404', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, 'e2e5233c-9f2c-4894-ae9c-f162335bdf85', NULL, true, '2026-10-19 11:29:02.384+08');
INSERT INTO public.messages VALUES ('e55aa911-444c-4dcf-822a-0ad20df469ba', 'FORNO7', '4b13f10d-6b45-4cdb-a925-a530a6b0002f', 'in', 'customer', NULL, 'outdoor seating available?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-19 11:34:00+08');
INSERT INTO public.messages VALUES ('05599b84-286b-4ab1-8d1c-c13d5bd14200', 'FORNO7', '4b13f10d-6b45-4cdb-a925-a530a6b0002f', 'out', 'ai', NULL, 'Yes, 6 tables on the terrace. It''s non-smoking.', '[]', 'sent', NULL, '9fe4315b-6cec-41cf-99c0-021e37b7b2e2', NULL, true, '2026-10-19 11:34:01.652+08');
INSERT INTO public.messages VALUES ('5f80b00a-999b-4109-98ad-9cbd927bc02d', 'FORNO7', 'aa4bb260-3653-478c-b1fd-300d95d61a5d', 'in', 'customer', NULL, 'sell frozen pizza to bring home?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-19 17:05:00+08');
INSERT INTO public.messages VALUES ('4a93ad79-dd55-4718-b237-4bfaaf9c5303', 'FORNO7', 'aa4bb260-3653-478c-b1fd-300d95d61a5d', 'out', 'ai', NULL, 'I''ll check with the team and let you know here.', '[]', 'sent', NULL, '3d8140b2-4534-43e4-b1c5-8b4ff5515f93', NULL, true, '2026-10-19 17:05:01.324+08');
INSERT INTO public.messages VALUES ('2ace90a7-86bd-4a3a-afd5-fbb58650539b', 'FORNO7', 'a6431bef-300a-4c72-a158-f03d8f27bf08', 'in', 'customer', NULL, 'delivery to subang can?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-19 21:57:00+08');
INSERT INTO public.messages VALUES ('0ce2066e-ae33-476e-b37f-0395e511df0c', 'FORNO7', 'a6431bef-300a-4c72-a158-f03d8f27bf08', 'out', 'ai', NULL, 'Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.', '[]', 'sent', NULL, '909f5105-b750-4fbb-ac9a-9da1bb83204d', NULL, true, '2026-10-19 21:57:01.373+08');
INSERT INTO public.messages VALUES ('8e539dc7-4713-429a-8833-065a32d6347a', 'FORNO7', 'e20c6d7a-f362-4311-bc01-73dd1b620488', 'in', 'customer', NULL, 'msg free?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-19 14:22:00+08');
INSERT INTO public.messages VALUES ('23edc97b-5806-476f-9724-cea12e94888a', 'FORNO7', 'e20c6d7a-f362-4311-bc01-73dd1b620488', 'out', 'ai', NULL, 'Yes, no added MSG.', '[]', 'sent', NULL, '9c0e5a51-68b7-4f59-8328-a47ee1bee252', NULL, true, '2026-10-19 14:22:02.611+08');
INSERT INTO public.messages VALUES ('4b27b827-a9ad-4064-823f-419a715f24c0', 'FORNO7', 'f31b8025-4686-4489-ad60-df8d2d44cd6b', 'in', 'customer', NULL, 'cauliflower crust can?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 16:22:00+08');
INSERT INTO public.messages VALUES ('0cbee0aa-11bc-49bd-a33c-ab92e7890445', 'FORNO7', 'f31b8025-4686-4489-ad60-df8d2d44cd6b', 'out', 'ai', NULL, 'Let me check with the team and get back to you.', '[]', 'sent', NULL, '0bbecc19-eec9-4fbc-ba8b-a90480d28bb5', NULL, true, '2026-10-20 16:22:03.406+08');
INSERT INTO public.messages VALUES ('55ab7668-bfec-467e-842d-d33c62c42df5', 'FORNO7', '8d687a57-8f88-48b7-9b08-aa60ae471566', 'in', 'customer', NULL, 'how long wait for walk in fri night', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 13:22:00+08');
INSERT INTO public.messages VALUES ('b9b5355f-af9c-43a1-8b22-67de5d0070f3', 'FORNO7', '8d687a57-8f88-48b7-9b08-aa60ae471566', 'out', 'ai', NULL, 'Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.', '[]', 'sent', NULL, '263e469f-0ee8-4988-bce6-c082561ce9b2', NULL, true, '2026-10-20 13:22:03.485+08');
INSERT INTO public.messages VALUES ('0370f3df-e497-4174-bc1c-ea424a8275be', 'FORNO7', '2c4c99f5-3823-44a0-a769-eaec27910743', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 17:33:00+08');
INSERT INTO public.messages VALUES ('4b46d387-f919-4ef4-acad-5e8feb82e70b', 'FORNO7', '2c4c99f5-3823-44a0-a769-eaec27910743', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, '544cfca9-bcfd-49f2-9944-527cd4b8d048', NULL, true, '2026-10-20 17:33:03.419+08');
INSERT INTO public.messages VALUES ('5b9e4a0d-d1ff-49a9-a5ff-763ff46f201b', 'FORNO7', '2d4d54fa-8d62-4ce3-b749-d29712602910', 'in', 'customer', NULL, 'how to cancel my booking', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 17:58:00+08');
INSERT INTO public.messages VALUES ('219e26bf-9eaa-43b1-9187-2e7b30d24e62', 'FORNO7', '2d4d54fa-8d62-4ce3-b749-d29712602910', 'out', 'ai', NULL, 'Send us your booking reference here. Cancellation is free up to 2 hours before.', '[]', 'sent', NULL, '6aaf627f-5741-4703-b3f3-95874bb862b8', NULL, true, '2026-10-20 17:58:02.471+08');
INSERT INTO public.messages VALUES ('e37e1b0f-d333-4f90-be75-3f4e0005e0e3', 'FORNO7', '48cd5efa-fc08-43dd-92ad-c7293c8aab34', 'in', 'customer', NULL, 'can i reserve for 12 ppl', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 10:33:00+08');
INSERT INTO public.messages VALUES ('e77d962a-519e-4a3c-a24c-ef94d4fda0b3', 'FORNO7', '48cd5efa-fc08-43dd-92ad-c7293c8aab34', 'out', 'ai', NULL, 'Up to 10 can be booked here. For 11 or more, our events team arranges the table personally.', '[]', 'sent', NULL, 'f22e2a66-1c90-4f8e-888c-2c4536e4577d', NULL, true, '2026-10-20 10:33:03.359+08');
INSERT INTO public.messages VALUES ('f069bb2d-e914-45eb-b8e6-0da8ddc11eee', 'FORNO7', '9746ba32-df9f-40c3-8db5-8bb5547ce0fa', 'in', 'customer', NULL, 'can bring birthday cake? any charge', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 13:30:00+08');
INSERT INTO public.messages VALUES ('d73cb344-aeb6-4259-ac98-b1304be7351e', 'FORNO7', '9746ba32-df9f-40c3-8db5-8bb5547ce0fa', 'out', 'ai', NULL, 'Of course, bring your own cake. There''s no cake-cutting fee.', '[]', 'sent', NULL, '87d18b32-0570-4fb5-8423-625034164eb9', NULL, true, '2026-10-20 13:30:02.161+08');
INSERT INTO public.messages VALUES ('8373d798-5978-4959-9597-30bd5a71a532', 'FORNO7', 'b9889ccb-58d4-4fdf-b33b-7fe4b1784d6a', 'in', 'customer', NULL, 'student discount ada?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 18:13:00+08');
INSERT INTO public.messages VALUES ('0b837150-5d9f-483a-98d2-6ba4f15e8345', 'FORNO7', 'b9889ccb-58d4-4fdf-b33b-7fe4b1784d6a', 'out', 'ai', NULL, 'I''ll check with the team and reply here soon.', '[]', 'sent', NULL, '2f51287e-f210-4f06-97c3-de9d8b695345', NULL, true, '2026-10-20 18:13:01.952+08');
INSERT INTO public.messages VALUES ('aede22d1-8dfa-4bce-b7eb-0638c5633a39', 'FORNO7', 'a7bd3bfa-fd06-4500-b014-94b793eed399', 'in', 'customer', NULL, 'the apron got in red?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 21:07:00+08');
INSERT INTO public.messages VALUES ('2f40a95f-bd90-4963-bbac-7fa073962b2b', 'FORNO7', 'a7bd3bfa-fd06-4500-b014-94b793eed399', 'out', 'ai', NULL, 'Yes, Brick Red aprons are in stock in S, M and L (RM 69). XL has just one left.', '[]', 'sent', NULL, '7c4fa882-23fb-4f36-9a1c-9b9ca46df928', NULL, true, '2026-10-20 21:07:03.274+08');
INSERT INTO public.messages VALUES ('3bc578f9-f09a-48cd-86f0-821b71d53be4', 'FORNO7', '70b851a3-07c0-41af-8ef4-00534ac5b895', 'in', 'customer', NULL, 'msg free?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 14:04:00+08');
INSERT INTO public.messages VALUES ('5c4d7bca-1b5f-4513-990a-9e7c42b3e7d9', 'FORNO7', '70b851a3-07c0-41af-8ef4-00534ac5b895', 'out', 'ai', NULL, 'Yes, no added MSG.', '[]', 'sent', NULL, '9449c421-bff4-483d-9257-941037c459a2', NULL, true, '2026-10-20 14:04:03.047+08');
INSERT INTO public.messages VALUES ('33d32dfb-9cdd-46cf-bf8b-c8de23b90cdd', 'FORNO7', 'c84870fd-a0f2-41b1-a58a-e1431d5076e8', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 13:15:00+08');
INSERT INTO public.messages VALUES ('86f25e4e-e17b-477c-99b1-fa73ceb1363f', 'FORNO7', 'c84870fd-a0f2-41b1-a58a-e1431d5076e8', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, 'edfa7a8c-5e83-4fe6-b995-f3874866823f', NULL, true, '2026-10-20 13:15:01.456+08');
INSERT INTO public.messages VALUES ('42fbd678-5b1f-45e4-aec6-83db648c11e8', 'FORNO7', 'b9000dfc-fc54-431a-9789-13b0f8c98262', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 19:30:00+08');
INSERT INTO public.messages VALUES ('7276ca61-0199-4197-a499-e861e3d88987', 'FORNO7', 'b9000dfc-fc54-431a-9789-13b0f8c98262', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, '58a25a81-b143-4180-9335-a31fbcac42e9', NULL, true, '2026-10-20 19:30:02.271+08');
INSERT INTO public.messages VALUES ('178064ed-a219-4efa-8a87-fe24d48f070f', 'FORNO7', '95f5824c-ba03-4ed3-93b2-ebcc51eeb0ba', 'in', 'customer', NULL, 'large margherita how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 18:32:00+08');
INSERT INTO public.messages VALUES ('16f09d8e-5ddf-4cdc-b86e-c8706f401ab0', 'FORNO7', '95f5824c-ba03-4ed3-93b2-ebcc51eeb0ba', 'out', 'ai', NULL, 'Large Margherita (15") is RM 52. Medium RM 38, Small RM 28.', '[]', 'sent', NULL, '759f0cda-9687-4b46-b2d0-9a0ccf73ae43', NULL, true, '2026-10-20 18:32:01.869+08');
INSERT INTO public.messages VALUES ('41a7d02d-ac7a-4737-929a-5e475f1b6d3f', 'FORNO7', 'c905f347-6112-404e-9559-e9457d810612', 'in', 'customer', NULL, 'hi um do you guys have like a table for two tomorrow around seven thanks', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 17:48:00+08');
INSERT INTO public.messages VALUES ('82796313-096b-45cc-8091-f10556a5b574', 'FORNO7', 'c905f347-6112-404e-9559-e9457d810612', 'out', 'ai', NULL, 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '[]', 'sent', NULL, '8f468885-6a0e-4ec5-a227-32844b6f2c72', NULL, true, '2026-10-20 17:48:03.476+08');
INSERT INTO public.messages VALUES ('85625858-23af-4bd4-9321-73e04d74b9c7', 'FORNO7', '381f111e-12e3-451c-a99d-afa22cc2c292', 'in', 'customer', NULL, 'wat time u close tonite', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 12:56:00+08');
INSERT INTO public.messages VALUES ('7d692034-299b-4a05-811e-08c7733731fa', 'FORNO7', '381f111e-12e3-451c-a99d-afa22cc2c292', 'out', 'ai', NULL, 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '[]', 'sent', NULL, 'a7ce336f-91e7-4640-a5fd-4522efe62e40', NULL, true, '2026-10-20 12:56:02.49+08');
INSERT INTO public.messages VALUES ('01d97acf-bab6-4047-8199-910dab2789df', 'FORNO7', '5dfafd98-98cc-4958-9346-85779806070f', 'in', 'customer', NULL, 'open on monday?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 15:09:00+08');
INSERT INTO public.messages VALUES ('90e41c4c-7beb-4e24-88d8-0b8b8c36f4ea', 'FORNO7', '5dfafd98-98cc-4958-9346-85779806070f', 'out', 'ai', NULL, 'We''re closed on Mondays. Tuesday to Sunday we''re open from midday (11am on Sundays).', '[]', 'sent', NULL, '47df9446-34e8-4f4d-a9e0-d4cd07442ffe', NULL, true, '2026-10-20 15:09:02.852+08');
INSERT INTO public.messages VALUES ('30bd67e5-249f-42b0-b3f1-876540e4c1f0', 'FORNO7', '56405e62-0ca0-44ad-abfe-0e67780c9980', 'in', 'customer', NULL, 'how long wait for walk in fri night', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 17:51:00+08');
INSERT INTO public.messages VALUES ('90142210-e94a-47d1-9747-7f2fe234fc90', 'FORNO7', '56405e62-0ca0-44ad-abfe-0e67780c9980', 'out', 'ai', NULL, 'Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.', '[]', 'sent', NULL, '1b52f5ad-80d8-4e3a-a8f4-c4577268c80b', NULL, true, '2026-10-20 17:51:02.945+08');
INSERT INTO public.messages VALUES ('902737a7-b5c1-437e-a587-0b003e1cc1a0', 'FORNO7', '038e5bf9-2340-4be6-b20d-fafeea128381', 'in', 'customer', NULL, 'can do half half pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 12:06:00+08');
INSERT INTO public.messages VALUES ('9a8ae677-2f62-45c1-912b-042a251d0621', 'FORNO7', '038e5bf9-2340-4be6-b20d-fafeea128381', 'out', 'ai', NULL, 'Yes, on Medium and Large, priced at the more expensive half.', '[]', 'sent', NULL, '974f6fc0-78e0-4740-802d-db8eeb615c85', NULL, true, '2026-10-20 12:06:03.576+08');
INSERT INTO public.messages VALUES ('66571f6d-0654-4036-a5d2-202699ab3d15', 'FORNO7', '1c37665a-97eb-4f06-9ebb-96fac353588c', 'in', 'customer', NULL, 'how to cancel my booking', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 15:22:00+08');
INSERT INTO public.messages VALUES ('82e682e3-29c9-4c81-88b1-f8ce188f2098', 'FORNO7', '1c37665a-97eb-4f06-9ebb-96fac353588c', 'out', 'ai', NULL, 'Send us your booking reference here. Cancellation is free up to 2 hours before.', '[]', 'sent', NULL, '47c2c62d-4d74-4e26-bbb0-45ec3337fb71', NULL, true, '2026-10-20 15:22:02.434+08');
INSERT INTO public.messages VALUES ('b44b7b9f-3d9a-405b-bb2f-6b5506ca4399', 'FORNO7', '8ea48af2-8fe6-47d4-be51-5a6f3abf980a', 'in', 'customer', NULL, 'can i reserve for 12 ppl', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 10:20:00+08');
INSERT INTO public.messages VALUES ('160f5f70-1249-43d1-ba5b-a579b840c9de', 'FORNO7', '8ea48af2-8fe6-47d4-be51-5a6f3abf980a', 'out', 'ai', NULL, 'Up to 10 can be booked here. For 11 or more, our events team arranges the table personally.', '[]', 'sent', NULL, '263cfeb0-2c48-4bf9-b8db-596cfc99dfac', NULL, true, '2026-10-20 10:20:02.341+08');
INSERT INTO public.messages VALUES ('b9db9967-34d5-4e3c-85f1-ecb30b079288', 'FORNO7', '560a013a-de13-4c1a-a167-a11da9407734', 'in', 'customer', NULL, 'the truffle one available today?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 18:17:00+08');
INSERT INTO public.messages VALUES ('1e4be9c3-1d0a-4b89-a2a3-39d626f861b4', 'FORNO7', '560a013a-de13-4c1a-a167-a11da9407734', 'out', 'ai', NULL, 'Sorry, the Funghi e Tartufo is sold out today. Our truffle delivery is late, it''s back tomorrow. The Quattro Formaggi is the closest rich, cheesy pick.', '[]', 'sent', NULL, 'cb9f6623-6e5b-44c9-9948-607eee1c4e3c', NULL, true, '2026-10-20 18:17:02.791+08');
INSERT INTO public.messages VALUES ('98f4985e-855f-4679-99bb-6bd2dc4b163d', 'FORNO7', 'ab5e6df1-7060-49a8-9c1e-24751da7bec9', 'in', 'customer', NULL, 'extra cheese how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 18:07:00+08');
INSERT INTO public.messages VALUES ('7975532f-e85e-49b9-8440-93018b0568d7', 'FORNO7', 'ab5e6df1-7060-49a8-9c1e-24751da7bec9', 'out', 'ai', NULL, 'Extra mozzarella RM 4, a whole burrata RM 12.', '[]', 'sent', NULL, 'ac2095f2-df8f-419e-bf91-a9834b0661a1', NULL, true, '2026-10-20 18:07:01.618+08');
INSERT INTO public.messages VALUES ('24155980-a0a2-478a-9925-43ef20db439e', 'FORNO7', '4462de1e-d561-4dea-ba17-bb0312c71f35', 'in', 'customer', NULL, 'non alcoholic drinks got what', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 22:17:00+08');
INSERT INTO public.messages VALUES ('75e5d8b1-f84d-467e-8568-d7553805ace5', 'FORNO7', '4462de1e-d561-4dea-ba17-bb0312c71f35', 'out', 'ai', NULL, 'House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.', '[]', 'sent', NULL, 'e8ccdd0f-ec76-4f74-8779-292552baab67', NULL, true, '2026-10-20 22:17:02.156+08');
INSERT INTO public.messages VALUES ('c13333e5-41e5-4e3f-8823-401feaaceda9', 'FORNO7', 'ea5b3a32-210c-48a4-a934-0e8192dd117d', 'in', 'customer', NULL, 'can book for 2 sat 730pm', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 17:30:00+08');
INSERT INTO public.messages VALUES ('a2512269-b49a-44ca-b380-01bd8c1a1540', 'FORNO7', 'ea5b3a32-210c-48a4-a934-0e8192dd117d', 'out', 'ai', NULL, 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '[]', 'sent', NULL, 'a346cf66-a1d0-4404-8e4d-c87d0846d800', NULL, true, '2026-10-20 17:30:02.404+08');
INSERT INTO public.messages VALUES ('67d6f4a2-fe19-4f61-8c3d-b58bf7a7078a', 'FORNO7', '6281acda-00f2-46af-b896-59710afd3390', 'in', 'customer', NULL, 'wat time u close tonite', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 15:03:00+08');
INSERT INTO public.messages VALUES ('f960f020-5fce-47e7-86d3-aa42a9e0bcbb', 'FORNO7', '6281acda-00f2-46af-b896-59710afd3390', 'out', 'ai', NULL, 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '[]', 'sent', NULL, '64c021d6-a282-4bfa-ab00-51ed21809eb4', NULL, true, '2026-10-20 15:03:02.92+08');
INSERT INTO public.messages VALUES ('7ee3fbc0-12a8-4b35-a2a6-83e684832647', 'FORNO7', '83cd1aea-879d-4b4d-a951-3223243bbeac', 'in', 'customer', NULL, 'cauliflower crust can?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 22:15:00+08');
INSERT INTO public.messages VALUES ('7a0696aa-e56b-414f-842d-64d719fa482c', 'FORNO7', '83cd1aea-879d-4b4d-a951-3223243bbeac', 'out', 'ai', NULL, 'Let me check with the team and get back to you.', '[]', 'sent', NULL, 'd7b72c7f-0f3b-40ae-830b-e88c9502286c', NULL, true, '2026-10-20 22:15:02.701+08');
INSERT INTO public.messages VALUES ('1f80168b-9a21-4d14-8a65-af0bec5398d1', 'FORNO7', '2d516a79-9363-4238-a2a0-6641c586d20b', 'in', 'customer', NULL, 'wat time u close tonite', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 19:00:00+08');
INSERT INTO public.messages VALUES ('b13baf00-02e1-4d29-9a28-48dc1a0a3cb2', 'FORNO7', '2d516a79-9363-4238-a2a0-6641c586d20b', 'out', 'ai', NULL, 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '[]', 'sent', NULL, '4ae6b740-29dc-4b22-8775-79e6b5cca9d8', NULL, true, '2026-10-20 19:00:02.161+08');
INSERT INTO public.messages VALUES ('cbff62f0-a49d-4e61-ab19-14bd619e1be5', 'FORNO7', 'f52ea72e-cefd-4b92-92e2-f815478f6dc5', 'in', 'customer', NULL, 'large margherita how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 09:17:00+08');
INSERT INTO public.messages VALUES ('aba102f8-435f-480c-9d16-6ab9ccc1796a', 'FORNO7', 'f52ea72e-cefd-4b92-92e2-f815478f6dc5', 'out', 'ai', NULL, 'Large Margherita (15") is RM 52. Medium RM 38, Small RM 28.', '[]', 'sent', NULL, '1d1855b8-87bd-46e5-b7be-e096938d11dd', NULL, true, '2026-10-20 09:17:03.482+08');
INSERT INTO public.messages VALUES ('4606967c-a8d4-47e5-a857-62a159c23cc9', 'FORNO7', 'a3aa3536-6ce5-4d5e-80f9-8f1daa385d3f', 'in', 'customer', NULL, 'wat time u close tonite', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 16:03:00+08');
INSERT INTO public.messages VALUES ('a08ab23f-3074-4f06-a586-be69d83a9cc0', 'FORNO7', 'a3aa3536-6ce5-4d5e-80f9-8f1daa385d3f', 'out', 'ai', NULL, 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '[]', 'sent', NULL, '057f5d85-3087-47fe-8d66-12f6c4e84130', NULL, true, '2026-10-20 16:03:02.787+08');
INSERT INTO public.messages VALUES ('2eaf6a5c-3bd1-43a4-824a-e233363c59d4', 'FORNO7', '6bf60aab-5f5f-4783-9d2a-f458842d6d6e', 'in', 'customer', NULL, 'wheelchair accessible?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 15:44:00+08');
INSERT INTO public.messages VALUES ('6c8a4913-0859-41f1-99c2-b1e962f384f9', 'FORNO7', '6bf60aab-5f5f-4783-9d2a-f458842d6d6e', 'out', 'ai', NULL, 'Yes. The ground floor is step-free and we have an accessible restroom.', '[]', 'sent', NULL, '676386af-fbca-4420-9822-9209dbf054a6', NULL, true, '2026-10-20 15:44:01.38+08');
INSERT INTO public.messages VALUES ('8130cd5e-9f1c-458c-8ba7-7cf71b741454', 'FORNO7', '01993c7b-5118-4886-a9c9-8f1f7ee46746', 'in', 'customer', NULL, 'got spicy pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 18:25:00+08');
INSERT INTO public.messages VALUES ('316592d4-d32f-4862-8334-d266011b80f0', 'FORNO7', '01993c7b-5118-4886-a9c9-8f1f7ee46746', 'out', 'ai', NULL, 'Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.', '[]', 'sent', NULL, 'e1e7b87f-7bb2-4998-92ca-c6e35a591827', NULL, true, '2026-10-20 18:25:02.643+08');
INSERT INTO public.messages VALUES ('061261a5-2c48-4f6c-8bdc-5bdbfa912d7f', 'FORNO7', '23be8580-dccb-45aa-b4a9-5baf881b6b05', 'in', 'customer', NULL, 'wat time u close tonite', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 12:28:00+08');
INSERT INTO public.messages VALUES ('c90363ed-cdda-4104-8f8f-23f87d024946', 'FORNO7', '23be8580-dccb-45aa-b4a9-5baf881b6b05', 'out', 'ai', NULL, 'Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.', '[]', 'sent', NULL, '6afda4d7-64ec-45d5-9aa5-ea4413cdcccd', NULL, true, '2026-10-20 12:28:02.427+08');
INSERT INTO public.messages VALUES ('70675fdb-9510-4484-809d-4badb6bf5dba', 'FORNO7', 'bd0e9938-9ccd-49f5-a6d0-08cbbed3b2de', 'in', 'customer', NULL, 'sunday lunch 6 pax 1pm got table?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 16:46:00+08');
INSERT INTO public.messages VALUES ('b230fa84-afbd-4335-85e3-e6d6bf1c06ae', 'FORNO7', 'bd0e9938-9ccd-49f5-a6d0-08cbbed3b2de', 'out', 'ai', NULL, 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '[]', 'sent', NULL, '05ceab28-1409-4f97-b6ee-9b7464025e37', NULL, true, '2026-10-20 16:46:01.778+08');
INSERT INTO public.messages VALUES ('3f5197fe-1afd-4289-838f-0a9c92e87645', 'FORNO7', '1865fa8c-fe32-41cd-81d8-aaddd240102c', 'in', 'customer', NULL, 'extra cheese how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 22:29:00+08');
INSERT INTO public.messages VALUES ('01a64d2f-e007-494d-a2b3-95ec70455de4', 'FORNO7', '1865fa8c-fe32-41cd-81d8-aaddd240102c', 'out', 'ai', NULL, 'Extra mozzarella RM 4, a whole burrata RM 12.', '[]', 'sent', NULL, 'ee0de9aa-d313-4b7d-9c85-a5e258586591', NULL, true, '2026-10-20 22:29:02.853+08');
INSERT INTO public.messages VALUES ('50631fb2-5d4a-4b2f-88d1-61aaccb55380', 'FORNO7', 'c28f0616-5bfc-420d-8cc3-fb18684bafcd', 'in', 'customer', NULL, 'wifi pw?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-20 10:39:00+08');
INSERT INTO public.messages VALUES ('0497051b-9f45-40de-b888-d4674613f962', 'FORNO7', 'c28f0616-5bfc-420d-8cc3-fb18684bafcd', 'out', 'ai', NULL, 'We have free Wi-Fi; staff will share the password at your table.', '[]', 'sent', NULL, '314019b9-4072-44da-aa44-bbd0e598f209', NULL, true, '2026-10-20 10:39:03.584+08');
INSERT INTO public.messages VALUES ('53425251-b8ab-4a58-a30f-b1cfcd51804d', 'FORNO7', '67690ceb-77ef-4354-9c89-8f2f6b204b72', 'in', 'customer', NULL, 'gluten free pizza available?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 18:03:00+08');
INSERT INTO public.messages VALUES ('b27cae00-cac8-41cc-b80d-49b4ba0dd08a', 'FORNO7', '67690ceb-77ef-4354-9c89-8f2f6b204b72', 'out', 'ai', NULL, 'Let me check with the team and come back to you here.', '[]', 'sent', NULL, 'a7c4a5f6-a202-4c5f-9085-4556ac4f8b7f', NULL, true, '2026-10-21 18:03:03.386+08');
INSERT INTO public.messages VALUES ('3dcccbd7-238e-4247-930f-f4ab1876c3c1', 'FORNO7', '2b14345c-af55-4793-8fe7-136b26ce114a', 'in', 'customer', NULL, 'sunday lunch 6 pax 1pm got table?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 15:57:00+08');
INSERT INTO public.messages VALUES ('59fc907f-24be-4b29-ac9b-eb33882c3e49', 'FORNO7', '2b14345c-af55-4793-8fe7-136b26ce114a', 'out', 'ai', NULL, 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '[]', 'sent', NULL, '1cc667af-c6fc-46b7-a605-c7460574c130', NULL, true, '2026-10-21 15:57:01.282+08');
INSERT INTO public.messages VALUES ('2b45577a-4020-41f2-8cd6-f132ad09942f', 'FORNO7', '042429ba-3593-4484-9f44-37f7668e83d7', 'in', 'customer', NULL, 'can book for 2 sat 730pm', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 15:24:00+08');
INSERT INTO public.messages VALUES ('ae009b7d-1519-4b40-8510-619cf9e95bfa', 'FORNO7', '042429ba-3593-4484-9f44-37f7668e83d7', 'out', 'ai', NULL, 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '[]', 'sent', NULL, '2a3d1e42-e20b-4655-86c4-3eec0243e47f', NULL, true, '2026-10-21 15:24:02.595+08');
INSERT INTO public.messages VALUES ('03e79bba-6b2c-47c4-a66d-b964e4673833', 'FORNO7', 'ea752b88-87fa-48d6-81aa-95dba14f8c1a', 'in', 'customer', NULL, 'dog friendly??', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 15:41:00+08');
INSERT INTO public.messages VALUES ('ffb99a00-7129-407e-a165-71ef42123028', 'FORNO7', 'ea752b88-87fa-48d6-81aa-95dba14f8c1a', 'out', 'ai', NULL, 'Dogs are welcome on our terrace and we''ll bring a water bowl.', '[]', 'sent', NULL, 'de8867d8-9a1f-4916-9c78-64e60e55c925', NULL, true, '2026-10-21 15:41:02.839+08');
INSERT INTO public.messages VALUES ('964368a2-cd8b-4cb6-aa0a-1fe52285f655', 'FORNO7', '4c397e1a-bc61-49ec-8751-20b18596b24e', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 13:14:00+08');
INSERT INTO public.messages VALUES ('a8860897-8c9f-4868-8b15-0fe6143ef0e2', 'FORNO7', '4c397e1a-bc61-49ec-8751-20b18596b24e', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, '0d3e24ea-3cfd-4469-841d-64943e9ca04d', NULL, true, '2026-10-21 13:14:01.823+08');
INSERT INTO public.messages VALUES ('39f423f8-6535-40c3-a6c9-e63041d6f132', 'FORNO7', '2ae0bfce-0800-439e-ada2-4537c0e13eda', 'in', 'customer', NULL, 'where exactly r u', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 18:32:00+08');
INSERT INTO public.messages VALUES ('e76cec98-ea4a-43d7-bae7-340c5f292662', 'FORNO7', '2ae0bfce-0800-439e-ada2-4537c0e13eda', 'out', 'ai', NULL, '27 Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur, two minutes from Bangsar Village II.', '[]', 'sent', NULL, '5f0d22bd-f42f-44c5-98e2-77b573275fb0', NULL, true, '2026-10-21 18:32:02.292+08');
INSERT INTO public.messages VALUES ('93694bc2-0cfd-4661-8d4e-e5200872ed25', 'FORNO7', '38911f8c-f99e-4267-90c0-dc09b77bb253', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 16:17:00+08');
INSERT INTO public.messages VALUES ('3a4a0124-9c67-4102-9de2-12f14b67d1f1', 'FORNO7', '38911f8c-f99e-4267-90c0-dc09b77bb253', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, '237671d5-5ac3-4f63-9be2-c2b239a3959f', NULL, true, '2026-10-21 16:17:01.695+08');
INSERT INTO public.messages VALUES ('c0cc1188-6b44-40e9-928b-f7e716dbbf5a', 'FORNO7', 'fac9385d-cc52-4744-90c3-53379496fc5e', 'in', 'customer', NULL, 'hi um do you guys have like a table for two tomorrow around seven thanks', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 15:50:00+08');
INSERT INTO public.messages VALUES ('f88d975c-b6ca-42dc-9f1d-e3cc4069d43c', 'FORNO7', 'fac9385d-cc52-4744-90c3-53379496fc5e', 'out', 'ai', NULL, 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '[]', 'sent', NULL, 'f783cdcc-281e-49c6-8c3f-681943fc04cf', NULL, true, '2026-10-21 15:50:02.713+08');
INSERT INTO public.messages VALUES ('5ddb5982-2c19-4af7-beb8-7bfa7979863b', 'FORNO7', '20e66e7a-37ae-408f-a764-9d95594afa62', 'in', 'customer', NULL, 'do u have beer', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 11:23:00+08');
INSERT INTO public.messages VALUES ('021a5b21-12fe-4fea-9c67-b209dc59e204', 'FORNO7', '20e66e7a-37ae-408f-a764-9d95594afa62', 'out', 'ai', NULL, 'Peroni, two local craft beers, and Italian wines. 18+ only.', '[]', 'sent', NULL, '8101bac1-5514-43ef-bbe9-5f20f9655573', NULL, true, '2026-10-21 11:23:01.791+08');
INSERT INTO public.messages VALUES ('829fe987-4fc3-41ea-8191-7c821c893040', 'FORNO7', 'fb4f2675-613d-4b34-9cd3-5de1a4aa7625', 'in', 'customer', NULL, 'sunday lunch 6 pax 1pm got table?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 16:41:00+08');
INSERT INTO public.messages VALUES ('b491ac32-7b12-4f1d-9151-061140889a53', 'FORNO7', 'fb4f2675-613d-4b34-9cd3-5de1a4aa7625', 'out', 'ai', NULL, 'Yes! Sunday 1:00pm for 6 is booked. Reference F7-R4WN.', '[]', 'sent', NULL, '00f3a446-6e53-4a36-89fe-351012141fdd', NULL, true, '2026-10-21 16:41:01.518+08');
INSERT INTO public.messages VALUES ('c3b01f33-e6d0-44a1-8b3c-f6ac37f88ee2', 'FORNO7', '4d4b5c85-6bf0-419f-ac45-975384dbffbd', 'in', 'customer', NULL, 'do u have beer', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 09:20:00+08');
INSERT INTO public.messages VALUES ('3c4fa2d6-1bbf-4bd7-b2b0-51a78c84a1eb', 'FORNO7', '4d4b5c85-6bf0-419f-ac45-975384dbffbd', 'out', 'ai', NULL, 'Peroni, two local craft beers, and Italian wines. 18+ only.', '[]', 'sent', NULL, '58d1b1eb-0e7f-4f83-9f79-c95b8a854d10', NULL, true, '2026-10-21 09:20:01.487+08');
INSERT INTO public.messages VALUES ('2d9084b1-879c-48b1-9896-6bbe0c684f3a', 'FORNO7', '57d4db16-9a36-41c4-87ff-a8f30d8b05cc', 'in', 'customer', NULL, 'extra cheese how much', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 11:03:00+08');
INSERT INTO public.messages VALUES ('57ac41e6-1880-4b82-bdc7-54d26752e60a', 'FORNO7', '57d4db16-9a36-41c4-87ff-a8f30d8b05cc', 'out', 'ai', NULL, 'Extra mozzarella RM 4, a whole burrata RM 12.', '[]', 'sent', NULL, '952994ca-d2a9-440b-bc92-9bf17fe8f5fe', NULL, true, '2026-10-21 11:03:03.472+08');
INSERT INTO public.messages VALUES ('7dd3343a-3343-4d81-ac6c-02957c4e2bcd', 'FORNO7', '35174849-68e0-4994-a782-44b856871b1b', 'in', 'customer', NULL, 'can book for 2 sat 730pm', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 16:55:00+08');
INSERT INTO public.messages VALUES ('1f4e478e-5460-4017-883b-bcb8feb0de3c', 'FORNO7', '35174849-68e0-4994-a782-44b856871b1b', 'out', 'ai', NULL, 'Booked: Saturday 7:30pm for 2. Reference F7-M8TX. See you then!', '[]', 'sent', NULL, '4feee6bb-f28b-41ce-b5f5-835d476fa539', NULL, true, '2026-10-21 16:55:02.516+08');
INSERT INTO public.messages VALUES ('7de830b7-f314-4d28-bc10-6c410e709a8e', 'FORNO7', '6a3a3404-36c8-4da3-8341-8636a9c921fe', 'in', 'customer', NULL, 'is there vegan option', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 12:58:00+08');
INSERT INTO public.messages VALUES ('78f8e353-0b40-47c8-9777-76d0011f4eea', 'FORNO7', '6a3a3404-36c8-4da3-8341-8636a9c921fe', 'out', 'ai', NULL, 'The Marinara is fully vegan, and the Ortolana can be made without cheese.', '[]', 'sent', NULL, '72cc2dea-dd45-41ff-a260-753c6c13f0b1', NULL, true, '2026-10-21 12:58:03.45+08');
INSERT INTO public.messages VALUES ('2a9c2c45-7434-4f1d-b3dc-7d7efcfa16ef', 'FORNO7', 'bba8281c-5e7a-41f6-9683-78b32be5d4d4', 'in', 'customer', NULL, 'best pizza in bangsar fr', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 10:14:00+08');
INSERT INTO public.messages VALUES ('8f8e6cd0-74bd-4165-948d-dab6acec5340', 'FORNO7', 'bba8281c-5e7a-41f6-9683-78b32be5d4d4', 'out', 'ai', NULL, 'Thank you! The oven crew will be very happy to hear it.', '[]', 'sent', NULL, '9fa15311-2348-4f87-abc1-ff2c6700e26c', NULL, true, '2026-10-21 10:14:01.708+08');
INSERT INTO public.messages VALUES ('3c431f41-b72b-41d6-8d88-51b6fbf20919', 'FORNO7', '1ceb7a09-4599-4071-8399-30b9b1411e36', 'in', 'customer', NULL, 'sell frozen pizza to bring home?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 14:51:00+08');
INSERT INTO public.messages VALUES ('1339dbbf-c482-47b4-91f3-2bf55c0793a4', 'FORNO7', '1ceb7a09-4599-4071-8399-30b9b1411e36', 'out', 'ai', NULL, 'I''ll check with the team and let you know here.', '[]', 'sent', NULL, '9629255d-687b-4d9c-b04d-e065e2f8847e', NULL, true, '2026-10-21 14:51:03.335+08');
INSERT INTO public.messages VALUES ('1f596aef-9356-4a04-bffd-9e92a854526c', 'FORNO7', 'c0965d2c-517a-45f1-87e7-8a16a851a385', 'in', 'customer', NULL, 'pizza came cold n soggy wat la', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 14:02:00+08');
INSERT INTO public.messages VALUES ('df32affb-fedf-4c20-940e-214893fae829', 'FORNO7', 'c0965d2c-517a-45f1-87e7-8a16a851a385', 'out', 'ai', NULL, 'So sorry. Please send a photo; our duty manager reviews it personally and will make it right.', '[]', 'sent', NULL, '72a03e53-3776-4618-8758-0975fce5add1', NULL, true, '2026-10-21 14:02:01.86+08');
INSERT INTO public.messages VALUES ('8c7cddf7-130c-489a-874a-bff7fc3fe163', 'FORNO7', '4fa57ba0-986e-4a8e-a632-639dac03923d', 'in', 'customer', NULL, 'where exactly r u', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 16:59:00+08');
INSERT INTO public.messages VALUES ('1a05ab20-3777-4caf-9da2-4443f1be8ea1', 'FORNO7', '4fa57ba0-986e-4a8e-a632-639dac03923d', 'out', 'ai', NULL, '27 Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur, two minutes from Bangsar Village II.', '[]', 'sent', NULL, 'b31bbe91-109d-4ee3-9359-43e72e40888b', NULL, true, '2026-10-21 16:59:02.412+08');
INSERT INTO public.messages VALUES ('ac4bdd15-5e53-4558-a547-3d5061393a9b', 'FORNO7', '0d42a830-ca7f-48a5-a19a-ab6bdbc353d5', 'in', 'customer', NULL, 'open christmas day?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 18:24:00+08');
INSERT INTO public.messages VALUES ('8321b1fd-603d-4bf5-ba00-179d547452ad', 'FORNO7', '0d42a830-ca7f-48a5-a19a-ab6bdbc353d5', 'out', 'ai', NULL, 'Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.', '[]', 'sent', NULL, '114d8fc6-0ab2-42a8-ac8b-2f16543a1368', NULL, true, '2026-10-21 18:24:01.412+08');
INSERT INTO public.messages VALUES ('1d7b75e8-2d56-44d4-8a53-803e55f00ee7', 'FORNO7', 'f3d6c311-489d-4af9-9ee0-efc7640cc0ce', 'in', 'customer', NULL, 'gluten free pizza available?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 16:28:00+08');
INSERT INTO public.messages VALUES ('6924952c-29ef-48d3-8fbe-1cc7f6e07a46', 'FORNO7', 'f3d6c311-489d-4af9-9ee0-efc7640cc0ce', 'out', 'ai', NULL, 'Let me check with the team and come back to you here.', '[]', 'sent', NULL, '80dd9a1c-9f73-4bbb-9557-93349ca89b51', NULL, true, '2026-10-21 16:28:01.666+08');
INSERT INTO public.messages VALUES ('43773d8a-a7df-4b81-835a-d7a5447f6119', 'FORNO7', 'eba0fe7b-e7e2-48ef-b7d0-55544daa53f7', 'in', 'customer', NULL, 'rendang pizza spicy or not', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 19:13:00+08');
INSERT INTO public.messages VALUES ('c6ce1db5-eff7-4bf5-95a8-60bc84e5f2ef', 'FORNO7', 'eba0fe7b-e7e2-48ef-b7d0-55544daa53f7', 'out', 'ai', NULL, 'The Rendang Rossa has a gentle, warm heat. It''s our signature. Medium is RM 52.', '[]', 'sent', NULL, '5c0326c3-bbfb-4cdb-86cd-d06c46b81ffc', NULL, true, '2026-10-21 19:13:02.805+08');
INSERT INTO public.messages VALUES ('a4b74748-c38e-4213-85db-917565b7b49a', 'FORNO7', '1ad9b09b-d713-4b45-98f2-f4a7098216f0', 'in', 'customer', NULL, 'table for 4 this fri 8pm?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 19:31:00+08');
INSERT INTO public.messages VALUES ('99c6b027-a801-439b-8f2d-aed434adea82', 'FORNO7', '1ad9b09b-d713-4b45-98f2-f4a7098216f0', 'out', 'ai', NULL, 'Done! Friday 8:00pm, table for 4. Your reference is F7-K2QD. We hold tables 15 minutes.', '[]', 'sent', NULL, 'c8311464-4081-44cb-bd63-c048123d8528', NULL, true, '2026-10-21 19:31:02.986+08');
INSERT INTO public.messages VALUES ('3cca4bec-9341-483b-a68e-c0d5584e9c5a', 'FORNO7', '08cfa963-273b-44d7-8dd2-d5038ebc2fa0', 'in', 'customer', NULL, 'hi um do you guys have like a table for two tomorrow around seven thanks', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 12:39:00+08');
INSERT INTO public.messages VALUES ('6767a788-b1d4-4172-a81b-b299f4fd8215', 'FORNO7', '08cfa963-273b-44d7-8dd2-d5038ebc2fa0', 'out', 'ai', NULL, 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '[]', 'sent', NULL, 'd0ffdc0c-85f7-4089-86e0-e401cae05950', NULL, true, '2026-10-21 12:39:01.821+08');
INSERT INTO public.messages VALUES ('a6366e14-ed71-4dfe-8e43-1e2c2bba797c', 'FORNO7', 'b3b96970-562b-438c-82e7-25dbfe20ab16', 'in', 'customer', NULL, 'hi um do you guys have like a table for two tomorrow around seven thanks', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 11:38:00+08');
INSERT INTO public.messages VALUES ('e465fffe-d4dd-4504-9007-93a5ffe56184', 'FORNO7', 'b3b96970-562b-438c-82e7-25dbfe20ab16', 'out', 'ai', NULL, 'Yes, tomorrow at 7:00pm for 2 is open. Shall I book it under your name?', '[]', 'sent', NULL, 'bcc3fd0b-a7bb-448b-9635-40eb79428268', NULL, true, '2026-10-21 11:38:03.542+08');
INSERT INTO public.messages VALUES ('c0071de4-8e71-4dda-8938-1eaafe221aa1', 'FORNO7', '8750e4f7-2984-4035-b7ef-68a9fe8c192f', 'in', 'customer', NULL, 'my son has nut allergy can he eat the pizza', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 17:14:00+08');
INSERT INTO public.messages VALUES ('02d56053-9d7b-457e-ac79-21e92d991d02', 'FORNO7', '8750e4f7-2984-4035-b7ef-68a9fe8c192f', 'out', 'ai', NULL, 'The Pollo Pesto contains pine nuts, and our kitchen handles tree nuts, so cross-contact is possible. Our manager will talk you through it before you order.', '[]', 'sent', NULL, 'ecb55c15-9ed8-4ffa-a3ea-20a367d9fb88', NULL, true, '2026-10-21 17:14:01.601+08');
INSERT INTO public.messages VALUES ('2c1e1200-5d6b-4a13-8e4b-433aece7190c', 'FORNO7', '14f0241f-f4bb-47fa-8882-430ce1968f49', 'in', 'customer', NULL, 'kids menu?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 18:09:00+08');
INSERT INTO public.messages VALUES ('82113be7-6459-47c7-a9ff-0510510324a5', 'FORNO7', '14f0241f-f4bb-47fa-8882-430ce1968f49', 'out', 'ai', NULL, 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '[]', 'sent', NULL, '95ee114c-ec09-47c4-87a6-8e06a9593ccd', NULL, true, '2026-10-21 18:09:03.103+08');
INSERT INTO public.messages VALUES ('1278cc1e-8723-46bd-8cf8-c2c7c89e70d9', 'FORNO7', 'c03fc05a-1978-43c1-a79a-d8ee32e25f10', 'in', 'customer', NULL, 'gluten free pizza available?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 10:49:00+08');
INSERT INTO public.messages VALUES ('4f8be627-7d45-4745-b915-5950cd6863e7', 'FORNO7', 'c03fc05a-1978-43c1-a79a-d8ee32e25f10', 'out', 'ai', NULL, 'Let me check with the team and come back to you here.', '[]', 'sent', NULL, 'c6f60f5a-66ec-459f-b584-47ee547b2cfc', NULL, true, '2026-10-21 10:49:02.933+08');
INSERT INTO public.messages VALUES ('20d67a89-549f-4edc-a25d-420353ec99b9', 'FORNO7', 'a8b5eb4a-39ce-4305-a7f6-a6fe32f49e7f', 'in', 'customer', NULL, 'got spicy pizza?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 11:30:00+08');
INSERT INTO public.messages VALUES ('2c8ac968-99aa-4db4-81eb-d5f6df782cd9', 'FORNO7', 'a8b5eb4a-39ce-4305-a7f6-a6fe32f49e7f', 'out', 'ai', NULL, 'Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.', '[]', 'sent', NULL, 'a9a03e62-e97b-4a29-9291-6c838710fe57', NULL, true, '2026-10-21 11:30:01.774+08');
INSERT INTO public.messages VALUES ('bb4f0836-9514-4c53-8255-af24af0ddfc5', 'FORNO7', '075496a8-529d-46f7-a4c5-c1e2dd8fa210', 'in', 'customer', NULL, 'kids menu?', '[]', 'received', NULL, NULL, NULL, true, '2026-10-21 15:48:00+08');
INSERT INTO public.messages VALUES ('c92741a2-0a4f-4cb5-abfc-b65f0e655adf', 'FORNO7', '075496a8-529d-46f7-a4c5-c1e2dd8fa210', 'out', 'ai', NULL, 'No separate kids menu, but a Small 9" pizza is perfect for kids, and we have high chairs.', '[]', 'sent', NULL, '1f36a504-0a01-48d5-8f09-49b34c83557c', NULL, true, '2026-10-21 15:48:02.685+08');


--
--



--
-- Data for Name: setup_sources; Type: TABLE DATA; Schema: public; Owner: jawab
--



--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jawab
--

SELECT pg_catalog.setval('public.events_id_seq', 2626, true);


--
-- PostgreSQL database dump complete
--


