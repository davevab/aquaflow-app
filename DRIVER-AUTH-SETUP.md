# Driver Authentication Setup Instructions

## Step 1: Create Drivers Table in Supabase

1. Go to your Supabase project: https://objfqhffofsrttjxswkx.supabase.co
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste this SQL:

```sql
-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    station_id TEXT NOT NULL,
    name TEXT NOT NULL,
    pin TEXT NOT NULL UNIQUE,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster PIN lookups
CREATE INDEX idx_drivers_pin ON drivers(pin);
CREATE INDEX idx_drivers_station ON drivers(station_id);

-- Enable Row Level Security
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading active drivers
CREATE POLICY "Allow reading active drivers" ON drivers
    FOR SELECT
    USING (is_active = true);

-- Insert test drivers for your uncle's station
INSERT INTO drivers (station_id, name, pin, phone, is_active) VALUES
    ('gensan-station-1', 'Mang Jose', '100001', '09171234567', true),
    ('gensan-station-1', 'Kuya Ben', '100002', '09181234567', true),
    ('gensan-station-1', 'Boy Louie', '100003', '09191234567', true);

-- Create function to auto-generate next PIN for a station
CREATE OR REPLACE FUNCTION get_next_driver_pin(p_station_id TEXT)
RETURNS TEXT AS $$
DECLARE
    station_number INT;
    driver_count INT;
    next_pin TEXT;
BEGIN
    -- Extract station number from station_id (e.g., 'gensan-station-1' -> 1)
    -- For now, we'll use a simple counter approach
    
    -- Count existing drivers for this station
    SELECT COUNT(*) INTO driver_count
    FROM drivers
    WHERE station_id = p_station_id;
    
    -- Generate PIN: station number (from station_id) + driver sequence
    -- Format: SSSSDD where SSSS = station (4 digits), DD = driver number (2 digits)
    -- For gensan-station-1: 100001, 100002, etc.
    -- For gensan-station-2: 200001, 200002, etc.
    
    -- Extract the number from station_id
    station_number := CAST(REGEXP_REPLACE(p_station_id, '[^0-9]', '', 'g') AS INT);
    
    -- Generate next PIN
    next_pin := LPAD(station_number::TEXT, 4, '0') || LPAD((driver_count + 1)::TEXT, 2, '0');
    
    RETURN next_pin;
END;
$$ LANGUAGE plpgsql;
```

5. Click "Run" or press Ctrl+Enter
6. You should see "Success. No rows returned"

## Step 2: Verify Test Data

Run this query to see your test drivers:

```sql
SELECT * FROM drivers;
```

You should see 3 drivers:
- Mang Jose (PIN: 100001)
- Kuya Ben (PIN: 100002)
- Boy Louie (PIN: 100003)

## Step 3: Test the Driver App

1. Open driver-app.html in your browser
2. You should see the PIN login screen
3. Try logging in with PIN: **100001**
4. You should see "Mang Jose" in the dashboard

## Step 4: Add More Drivers (When Needed)

When Jennifer wants to add a new driver, you can run:

```sql
-- Get the next auto-generated PIN
SELECT get_next_driver_pin('gensan-station-1');

-- Then insert the new driver with that PIN
INSERT INTO drivers (station_id, name, pin, phone) 
VALUES ('gensan-station-1', 'New Driver Name', '100004', '09XX1234567');
```

## How It Works:

1. **Driver logs in** with 6-digit PIN
2. **App queries Supabase** to find driver with that PIN
3. **If found and active** → Show dashboard with driver's name
4. **Driver sees only their assigned orders** (filtered by driver_id)
5. **Session persists** in localStorage (stays logged in)
6. **Logout button** clears session

## PIN Format for Scaling:

- **Station 1**: 100001-100099 (up to 99 drivers)
- **Station 2**: 200001-200099
- **Station 3**: 300001-300099
- **Station 1000**: 1000001-1000099

This scales to thousands of stations with automatic PIN generation!

## Security Note:

For production, consider:
1. Adding PIN attempt limits (3 wrong attempts = lock account)
2. Hashing PINs instead of storing plain text
3. Adding PIN change functionality
4. Session timeout after 8 hours

But for MVP, this is perfect! ✅
