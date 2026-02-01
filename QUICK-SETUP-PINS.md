# 🎯 Quick Setup - Driver PIN Integration

## What We Built:
✅ Auto-generate unique PINs when adding drivers in Settings
✅ Show PINs in Personnel section (so Jennifer can share them)
✅ Sync personnel and drivers tables automatically
✅ Drivers can log in with their PIN

## 🚀 Setup Steps (Do These In Order):

### Step 1: Add Columns to Tables
Copy and run this in Supabase SQL Editor:

```sql
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS personnel_id UUID;
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS pin TEXT;
CREATE INDEX IF NOT EXISTS idx_drivers_personnel ON drivers(personnel_id);
```

### Step 2: Generate PINs for Existing Drivers
**Important**: Change the names to match your actual drivers!

```sql
-- Jun Jun
DO $$
DECLARE
    v_personnel_id UUID;
    v_pin TEXT;
BEGIN
    SELECT id INTO v_personnel_id FROM personnel WHERE name = 'Jun Jun' AND role = 'driver' LIMIT 1;
    IF v_personnel_id IS NOT NULL THEN
        v_pin := get_next_driver_pin('gensan-station-1');
        INSERT INTO drivers (station_id, name, pin, phone, personnel_id, is_active)
        SELECT 'gensan-station-1', name, v_pin, phone, id, true
        FROM personnel WHERE id = v_personnel_id;
        UPDATE personnel SET pin = v_pin WHERE id = v_personnel_id;
    END IF;
END $$;

-- Bebe Bolaloy
DO $$
DECLARE
    v_personnel_id UUID;
    v_pin TEXT;
BEGIN
    SELECT id INTO v_personnel_id FROM personnel WHERE name = 'Bebe Bolaloy' AND role = 'driver' LIMIT 1;
    IF v_personnel_id IS NOT NULL THEN
        v_pin := get_next_driver_pin('gensan-station-1');
        INSERT INTO drivers (station_id, name, pin, phone, personnel_id, is_active)
        SELECT 'gensan-station-1', name, v_pin, phone, id, true
        FROM personnel WHERE id = v_personnel_id;
        UPDATE personnel SET pin = v_pin WHERE id = v_personnel_id;
    END IF;
END $$;

-- Dodong
DO $$
DECLARE
    v_personnel_id UUID;
    v_pin TEXT;
BEGIN
    SELECT id INTO v_personnel_id FROM personnel WHERE name LIKE 'Dodong%' AND role = 'driver' LIMIT 1;
    IF v_personnel_id IS NOT NULL THEN
        v_pin := get_next_driver_pin('gensan-station-1');
        INSERT INTO drivers (station_id, name, pin, phone, personnel_id, is_active)
        SELECT 'gensan-station-1', name, v_pin, phone, id, true
        FROM personnel WHERE id = v_personnel_id;
        UPDATE personnel SET pin = v_pin WHERE id = v_personnel_id;
    END IF;
END $$;
```

### Step 3: Verify It Worked
```sql
SELECT p.name, p.pin, d.id as has_driver_account
FROM personnel p
LEFT JOIN drivers d ON d.personnel_id = p.id
WHERE p.role = 'driver';
```

You should see all 3 drivers with PINs!

## 🎉 Done! Now Test:

1. **Refresh Settings page** - you'll see PINs next to each driver
2. **Give Jun Jun his PIN** - he can log into driver-app
3. **Add a new driver** in Settings - system will:
   - Auto-generate PIN (100007, 100008, etc.)
   - Show it to Jennifer immediately
   - Create driver account automatically

## 📱 How Jennifer Uses This:

1. Click "Add Driver" in Settings
2. Enter name + phone
3. System shows: "Driver added! PIN: 100007"
4. Jennifer writes down PIN
5. Gives PIN to driver
6. Driver logs into app with PIN
7. Done!

---

**Next time you need to see a driver's PIN:**
Just go to Settings > Personnel - it's right there! 🔑
