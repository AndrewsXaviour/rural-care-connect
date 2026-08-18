# Emergency Contacts — Supabase Migration

## Required Schema Change

The `patients` table needs a new JSONB column for emergency contacts.

```sql
-- Add emergency_contacts column to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb;
```

## Column Format

```json
[
  {
    "name": "Father",
    "phone": "9876543210",
    "relation": "Father"
  },
  {
    "name": "Mother",
    "phone": "9876543211",
    "relation": "Mother"
  }
]
```

## How to Apply

1. Go to Supabase Dashboard → SQL Editor
2. Paste the ALTER TABLE statement above
3. Run the query

## Environment Variables

Add these to your Vercel project settings (server-side only):

```
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_FROM_NUMBER=your_sender_number
```

Get Vonage credentials at: https://dashboard.nexmo.com/
