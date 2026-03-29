Add a new gym entry to src/BjjEire.Seeder/data/gyms.json.

Gym details: $ARGUMENTS

Rules:
- Generate a valid 24-char MongoDB ObjectId (12 random bytes as hex)
- County must match one of the values in src/bjjeire-app/src/constants/counties.ts
- Coordinates are [longitude, latitude] (GeoJSON order)
- `isAvailable` in trialOffer must be `false` or `true`, never `null`
- `imageUrl` should be `null` unless explicitly provided
- Match the exact shape of existing entries in gyms.json

Read the existing gyms.json first to understand the schema, then append the new entry.
Check for duplicates by name and address before adding.
