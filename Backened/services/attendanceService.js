import Attendance from '../models/Attendance.js';
import OrgSettings from '../models/OrgSettings.js';
import { getOrgSettingsCached } from './dateService.js';

/**
 * Standard Haversine distance formula in meters between two lat/lng coordinates
 */
export const calculateHaversineDistance = (from, to) => {
  const R = 6371e3; // Earth's mean radius in meters
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLon = ((to.longitude - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export const evaluateCheckInStatus = (checkInDate, officeStartStr = '09:00', graceMinutes = 15) => {
  const [startHour, startMin] = officeStartStr.split(':').map(Number);
  const cutoffTotalMinutes = startHour * 60 + startMin + graceMinutes; // e.g. 9*60 + 15 = 555 mins (09:15)

  const checkInHour = checkInDate.getHours();
  const checkInMin = checkInDate.getMinutes();
  const checkInTotalMinutes = checkInHour * 60 + checkInMin;

  return checkInTotalMinutes > cutoffTotalMinutes ? 'late' : 'present';
};

export const verifyGeofence = (coords, officeLocation) => {
  if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    return { isWithinOfficeRadius: false, distanceMeters: -1, error: 'Invalid coordinates' };
  }

  const officeCoords = {
    latitude: officeLocation?.latitude || 24.8607,
    longitude: officeLocation?.longitude || 67.0011,
  };

  const distanceMeters = calculateHaversineDistance(
    { latitude: coords.latitude, longitude: coords.longitude },
    officeCoords
  );

  const radius = officeLocation?.radiusMeters || 150;
  const isWithinOfficeRadius = distanceMeters <= radius;

  return {
    isWithinOfficeRadius,
    distanceMeters,
    radius,
    accuracyMeters: coords.accuracy || 10,
  };
};

export const calculateWorkHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diffMs = new Date(checkOut) - new Date(checkIn);
  return Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));
};
