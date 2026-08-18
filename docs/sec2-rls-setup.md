# SEC2 — Supabase Row Level Security Setup

**Date:** June 18, 2026  
**Priority:** Critical (SEC2 from Technical Audit)

---

## Problem

The Supabase client is initialized with the anon key. No Row Level Security (RLS) policies exist on any table. This means:
- Any authenticated user can read ANY patient's data
- Any authenticated user can modify ANY patient's medical records
- Any user can delete appointments or reports that don't belong to them

---

## Solution

Apply the following SQL migration via **Supabase Dashboard → SQL Editor** or `supabase db push`.

### Step 1: Enable RLS on All Tables

```sql
-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
```

### Step 2: Add Patient Policies

```sql
-- Patients: users can only read/update their own profile
CREATE POLICY "Users can view own patient profile"
  ON patients FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own patient profile"
  ON patients FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own patient profile"
  ON patients FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to read all patients (for hospital/doctor matching)
-- WARNING: Remove this if patient data should be fully private
CREATE POLICY "Authenticated users can view all patients"
  ON patients FOR SELECT
  USING (auth.role() = 'authenticated');
```

### Step 3: Add Appointment Policies

```sql
-- Appointments: users can only manage their own appointments
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can create own appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = patient_id);
```

### Step 4: Add Medical Report Policies

```sql
-- Medical Reports: users can only view their own reports
CREATE POLICY "Users can view own reports"
  ON medical_reports FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can insert own reports"
  ON medical_reports FOR INSERT
  WITH CHECK (auth.uid() = patient_id);
```

### Step 5: Add Hospital Policies (Public Read)

```sql
-- Hospitals: public read access (cache data), authenticated write
CREATE POLICY "Anyone can view hospitals"
  ON hospitals FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage hospitals"
  ON hospitals FOR ALL
  USING (auth.role() = 'authenticated');
```

---

## Supabase Migration SQL (Complete)

```sql
-- Phase 1: Row Level Security Migration
-- Run this in Supabase Dashboard → SQL Editor

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- Patients policies
CREATE POLICY "Users can view own patient profile" ON patients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own patient profile" ON patients FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own patient profile" ON patients FOR UPDATE USING (auth.uid() = id);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can create own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (auth.uid() = patient_id);

-- Medical reports policies
CREATE POLICY "Users can view own reports" ON medical_reports FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own reports" ON medical_reports FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Hospitals policies (public read)
CREATE POLICY "Anyone can view hospitals" ON hospitals FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage hospitals" ON hospitals FOR ALL USING (auth.role() = 'authenticated');
```

---

## Aadhaar Schema Migration

After SEC3 encryption is applied, the patients table needs updated columns:

```sql
-- Add encrypted Aadhaar columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS aadhaar_encrypted TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS aadhaar_hash TEXT;

-- Optional: Create index for hash-based lookups
CREATE INDEX IF NOT EXISTS idx_patients_aadhaar_hash ON patients (aadhaar_hash);
```

---

## Verification

After applying the migration:

1. **Test as User A:** Create a patient profile. Query `patients` table — should see only your own record.
2. **Test cross-user isolation:** Query another user's patient ID — should return empty.
3. **Test hospital read:** Anyone can read hospitals table.
4. **Test appointment isolation:** User A cannot see User B's appointments.

---

## Impact on Other Phases

- **Phase 2 (A1):** With RLS in place, removing Firebase Firestore is safe because Supabase RLS provides the access control boundary.
- **Phase 3 (Q2):** When fixing `any` types, the Supabase types should reflect the new `aadhaar_encrypted` and `aadhaar_hash` columns.
- **Phase 5 (Production):** RLS is mandatory before any production deployment.
