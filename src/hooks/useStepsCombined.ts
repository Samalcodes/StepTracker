import { useEffect, useState } from "react";
import { Platform, AppState, AppStateStatus } from "react-native";

import {
  initialize,
  getGrantedPermissions,
  readRecords,
  Permission,
  
} from "react-native-health-connect";

// ------------------------------
// Helper for daily time range
// ------------------------------
const buildTimeRange = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    operator: "between",
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

// ✔ Correct HC record types (v3.5.0)
const STEPS = "Steps";
const DISTANCE = "Distance";
const FLOORS = "FloorsClimbed";

export default function useStepsCombined(date: Date) {
  const [liveSteps, setLiveSteps] = useState(0);
  const [liveAvailable, setLiveAvailable] = useState(false);

  const [dailySteps, setDailySteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [flights, setFlights] = useState(0);

  const [androidPermissions, setAndroidPermissions] = useState<Permission[]>([]);
  
  // Track missing permissions for UI prompt
  const [missingPermissions, setMissingPermissions] = useState<string[]>([
    STEPS,
    DISTANCE,
    FLOORS,
  ]);

  const hasPermission = (type: string) =>
    androidPermissions.some((p) => p.recordType === type);

  // --------------------------------------------------------------------
  // 1️⃣ Live Steps – Expo Pedometer
  // --------------------------------------------------------------------
  useEffect(() => {
    let sub: any = null;

    // Dynamically import expo-sensors at runtime. This avoids a hard failure
    // during bundle/initialization when the native `Pedometer` module is
    // not installed (Dev Client / Expo Go differences or missing native build).
    (async () => {
      try {
        console.log('[useStepsCombined] Attempting to load Pedometer...');
        const sensors = await import("expo-sensors");
        const Pedometer = sensors?.Pedometer;
        if (!Pedometer) {
          console.warn('[useStepsCombined] Pedometer module not available');
          return;
        }

        const avail = await Pedometer.isAvailableAsync();
        setLiveAvailable(avail);
        console.log('[useStepsCombined] Pedometer available:', avail);

        sub = Pedometer.watchStepCount((res: any) => {
          setLiveSteps(res.steps ?? 0);
          console.log('[useStepsCombined] Pedometer step update (NATIVE SOURCE):', res.steps);
        });
      } catch (err) {
        // If the native module isn't available, don't crash — fallback to Health Connect
        console.warn("[useStepsCombined] Pedometer not available (native module missing):", err);
      }
    })();

    return () => {
      try {
        sub?.remove?.();
      } catch (err) {
        console.error('[useStepsCombined] Error removing Pedometer subscription:', err);
      }
    };
  }, []);

  // --------------------------------------------------------------------
  // 2️⃣ Initialize Health Connect + Request Permissions
  // --------------------------------------------------------------------
  useEffect(() => {
    if (Platform.OS !== "android") {
      console.log('[useStepsCombined] Not Android, skipping HC init');
      return;
    }

    const init = async () => {
      try {
        console.log('[useStepsCombined] Initializing Health Connect...');
        const ok = await initialize();
        if (!ok) {
          console.warn('[useStepsCombined] Health Connect initialization returned false');
          return;
        }

        console.log('[useStepsCombined] Reading granted permissions...');
        const granted = await getGrantedPermissions();
        console.log('[useStepsCombined] Granted permissions:', granted);
        
        const permissionList = granted.filter(
          (p): p is Permission => (p as Permission).recordType !== undefined
        );
        setAndroidPermissions(permissionList);
        
        // Track which permissions are still missing
        const missing = [];
        if (!permissionList.some(p => p.recordType === STEPS)) missing.push(STEPS);
        if (!permissionList.some(p => p.recordType === DISTANCE)) missing.push(DISTANCE);
        if (!permissionList.some(p => p.recordType === FLOORS)) missing.push(FLOORS);
        setMissingPermissions(missing);
        
        console.log('[useStepsCombined] Permissions set:', permissionList);
        console.log('[useStepsCombined] Missing permissions:', missing);
      } catch (err) {
        console.error('[useStepsCombined] Error during HC init:', err);
        // Fall back to empty permissions; app will still display UI
        setAndroidPermissions([]);
      }
    };

    init();
  }, []);

  // 2.5️⃣ Refresh permissions when app comes to foreground
  // (User may have granted permissions in Health Connect while app was backgrounded)
  // --------------------------------------------------------------------
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const handleAppStateChange = async (state: AppStateStatus) => {
      if (state === 'active') {
        console.log('[useStepsCombined] App came to foreground, refreshing permissions...');
        try {
          const granted = await getGrantedPermissions();
          const permissionList = granted.filter(
            (p): p is Permission => (p as Permission).recordType !== undefined
          );
          setAndroidPermissions(permissionList);

          // Update missing permissions
          const missing = [];
          if (!permissionList.some(p => p.recordType === STEPS)) missing.push(STEPS);
          if (!permissionList.some(p => p.recordType === DISTANCE)) missing.push(DISTANCE);
          if (!permissionList.some(p => p.recordType === FLOORS)) missing.push(FLOORS);
          setMissingPermissions(missing);

          console.log('[useStepsCombined] Permissions refreshed:', permissionList);
        } catch (err) {
          console.error('[useStepsCombined] Error refreshing permissions:', err);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription.remove();
  }, []);

  // --------------------------------------------------------------------
  // 3️⃣ Read HC daily data (Steps, Distance, Floors)
  // --------------------------------------------------------------------
  useEffect(() => {
    if (androidPermissions.length === 0) {
      console.log('[useStepsCombined] No permissions, skipping data read');
      return;
    }

    const load = async () => {
      try {
        console.log('[useStepsCombined] Loading daily data for', date);
        const timeRange = buildTimeRange(date);

        // STEPS
        if (hasPermission(STEPS)) {
          try {
            const res = await readRecords(STEPS, {
              timeRangeFilter: timeRange,
            } as any);
            const total = res.records.reduce(
              (sum, r) => sum + (r.count ?? 0),
              0
            );
            setDailySteps(total);
            console.log('[useStepsCombined] Steps loaded from HEALTH CONNECT:', total, 'records:', res.records.length);
          } catch (err) {
            console.error('[useStepsCombined] Error reading steps:', err);
          }
        }

        // DISTANCE
        if (hasPermission(DISTANCE)) {
          try {
            const res = await readRecords(DISTANCE, {
              timeRangeFilter: timeRange,
            } as any);
            const total = res.records.reduce(
              (sum, r) => sum + (r.distance?.inMeters ?? 0),
              0
            );
            setDistance(total);
            console.log('[useStepsCombined] Distance loaded from HEALTH CONNECT:', total, 'meters, records:', res.records.length);
          } catch (err) {
            console.error('[useStepsCombined] Error reading distance:', err);
          }
        }

        // FLOORS
        if (hasPermission(FLOORS)) {
          try {
            const res = await readRecords(FLOORS, {
              timeRangeFilter: timeRange,
            } as any);
            const total = res.records.reduce(
              (sum, r) => sum + (r.floors ?? 0),
              0
            );
            setFlights(total);
            console.log('[useStepsCombined] Floors loaded from HEALTH CONNECT:', total, 'records:', res.records.length);
          } catch (err) {
            console.error('[useStepsCombined] Error reading floors:', err);
          }
        }
      } catch (err) {
        console.error('[useStepsCombined] Error loading daily data:', err);
      }
    };

    load();
  }, [androidPermissions, date]);

  return {
    liveAvailable,
    liveSteps,
    dailySteps,
    distance,
    flights,
    totalSteps: liveSteps + dailySteps,
    missingPermissions,
  };
}
