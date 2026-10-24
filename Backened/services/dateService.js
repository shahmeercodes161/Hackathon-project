import Holiday from '../models/Holiday.js';
import OrgSettings from '../models/OrgSettings.js';

export const getOrgSettingsCached = async () => {
  let settings = await OrgSettings.findOne();
  if (!settings) {
    settings = await OrgSettings.create({
      companyName: 'Saylani HCM Inc.',
      officeHours: { start: '09:00', end: '18:00', graceMinutes: 15, halfDayHours: 5 },
      weekendDays: ['Saturday', 'Sunday'],
      location: { latitude: 24.8607, longitude: 67.0011, radiusMeters: 150 },
      isSetupComplete: false,
    });
  }
  return settings;
};

export const getDayName = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

export const getHolidaysSet = async () => {
  const holidays = await Holiday.find().lean();
  return new Set(holidays.map((h) => h.date));
};

/**
 * Calculates number of working days between two YYYY-MM-DD dates inclusive.
 * Skips weekends (Sat-Sun) and registered public holidays.
 */
export const calculateWorkingDays = async (startDateStr, endDateStr) => {
  const settings = await getOrgSettingsCached();
  const weekendDays = new Set(settings.weekendDays || ['Saturday', 'Sunday']);
  const holidaySet = await getHolidaysSet();

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (start > end) return 0;

  let count = 0;
  let cur = new Date(start);

  while (cur <= end) {
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const dayName = getDayName(cur);

    if (!weekendDays.has(dayName) && !holidaySet.has(dateKey)) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return count;
};

/**
 * Returns all working days in a given month (YYYY-MM)
 */
export const getWorkingDaysInMonth = async (yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);
  const settings = await getOrgSettingsCached();
  const weekendDays = new Set(settings.weekendDays || ['Saturday', 'Sunday']);
  const holidaySet = await getHolidaysSet();

  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  const workingDates = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const cur = new Date(year, month - 1, d);
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const dayName = getDayName(cur);

    if (!weekendDays.has(dayName) && !holidaySet.has(dateKey)) {
      workingDays++;
      workingDates.push(dateKey);
    }
  }

  return { totalWorkingDays: workingDays, workingDates, totalCalendarDays: daysInMonth };
};
