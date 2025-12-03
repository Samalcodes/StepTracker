import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  initialize,
  getGrantedPermissions,
  readRecords,
} from 'react-native-health-connect';

import type { Permission } from 'react-native-health-connect';

// Custom fallback type (works for all versions)
type MyTimeRangeFilter = {
  operator: 'between';
  startTime: string;
  endTime: string;
};

const useHealthData = (date: Date) => {
  const [steps, setSteps] = useState(0);
  const [flights, setFlights] = useState(0);
  const [distance, setDistance] = useState(0);

  const [androidPermissions, setAndroidPermissions] = useState<any[]>([]);

  const hasAndroidPermission = (recordType: string) => {
    return androidPermissions.some((perm) => perm.recordType === recordType);
  };

  // Build time range filter for selected date
  const selectedDateFilter: MyTimeRangeFilter = {
    operator: 'between',
    startTime: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
    endTime: new Date(date.setHours(23, 59, 59, 999)).toISOString(),
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const init = async () => {
      const isInitialized = await initialize();
      if (!isInitialized) return;

        // Avoid calling `requestPermission` directly: the native permission
        // launcher may not be initialized in some runtimes and can crash
        // the app with a Kotlin UninitializedPropertyAccessException.
        // Instead, read already-granted permissions and proceed safely.
        try {
          const grantedPermissions = await getGrantedPermissions();
          setAndroidPermissions(Array.isArray(grantedPermissions) ? grantedPermissions : []);
        } catch (err) {
          console.warn('Could not read granted permissions:', err);
          setAndroidPermissions([]);
        }
    };

    init();
  }, []);

  // Fetch health data
  useEffect(() => {
    if (androidPermissions.length === 0) return;

    const fetchData = async () => {
      // Steps
      if (hasAndroidPermission('Steps')) {
        const result = await readRecords('Steps', { timeRangeFilter: selectedDateFilter });
        const total = result.records.reduce((sum: number, rec: any) => sum + rec.count, 0);
        setSteps(total);
      }

      // Distance
      if (hasAndroidPermission('Distance')) {
        const result = await readRecords('Distance', { timeRangeFilter: selectedDateFilter });
        const total = result.records.reduce((sum: number, rec: any) => sum + rec.distance.inMeters, 0);
        setDistance(total);
      }

      // Floors Climbed
      if (hasAndroidPermission('FloorsClimbed')) {
        const result = await readRecords('FloorsClimbed', { timeRangeFilter: selectedDateFilter });
        const total = result.records.reduce((sum: number, rec: any) => sum + rec.floors, 0);
        setFlights(total);
      }
    };

    fetchData();
  }, [androidPermissions, date]);

  return { steps, flights, distance };
};

export default useHealthData;
