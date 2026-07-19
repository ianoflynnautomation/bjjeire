Add a new gym entry as a JSON file under seeder/data/gyms/.

Gym details: $ARGUMENTS

Rules:
- Generate a valid 24-char MongoDB ObjectId (12 random bytes as hex)
- County must match one of the values in src/bjjeire-app/src/constants/counties.ts
- Coordinates are [longitude, latitude] (GeoJSON order)
- `isAvailable` in trialOffer must be `false` or `true`, never `null`
- `imageUrl` should be `null` unless explicitly provided
- Match the exact shape of existing entries (see seeder/data/gyms/_template.json)

Read seeder/data/gyms/_template.json and an existing gym file first to understand the schema, then create a new kebab-case-named file.
Check for duplicates by name and address before adding.
