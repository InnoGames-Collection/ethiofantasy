/**
 * EthioTelecom / East Africa Time (EAT) Utilities (UTC+3:00)
 * Ethiopia does not observe daylight saving time.
 */

export function getEatDateString(date: Date = new Date()): string {
  // Format YYYY-MM-DD in Africa/Addis_Ababa timezone
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getEatTimestampString(date: Date = new Date()): string {
  // Formats ISO string with +03:00 offset
  const eatDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const yyyy = eatDate.getUTCFullYear();
  const mm = String(eatDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(eatDate.getUTCDate()).padStart(2, '0');
  const hh = String(eatDate.getUTCHours()).padStart(2, '0');
  const min = String(eatDate.getUTCMinutes()).padStart(2, '0');
  const ss = String(eatDate.getUTCSeconds()).padStart(2, '0');
  const ms = String(eatDate.getUTCMilliseconds()).padStart(3, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+03:00`;
}

export function parseEatDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+03:00`);
}

/**
 * Calculates official ISO-8601 week information in East Africa Time (EAT).
 * Standardized across Ethio Telecom VAS and INSA audit specifications:
 * - Weekly cycle opens Monday 00:00:00 EAT
 * - Weekly cycle closes Sunday 23:59:59 EAT
 * - Cycle ID: comp_cycle_<year>_w<isoWeek>
 */
export function getEatIsoWeekInfo(dateStr?: string): {
  year: number;
  weekNumber: number;
  cycleId: string;
  startDate: string; // Monday YYYY-MM-DD
  endDate: string;   // Sunday YYYY-MM-DD
  dayNumber: number; // 1 (Mon) .. 7 (Sun)
  daysRemaining: number;
  closesAtEat: string;
  opensAtEat: string;
} {
  const currentStr = dateStr || getEatDateString();
  const date = parseEatDate(currentStr);
  const dayOfWeek = date.getUTCDay(); // 0=Sun, 1=Mon...
  const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
  const daysRemaining = 7 - dayNumber;

  // Calculate Monday of current week
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - (dayNumber - 1));
  const mondayY = monday.getUTCFullYear();
  const mondayM = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const mondayD = String(monday.getUTCDate()).padStart(2, '0');
  const startDate = `${mondayY}-${mondayM}-${mondayD}`;

  // Calculate Sunday of current week
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const sundayY = sunday.getUTCFullYear();
  const sundayM = String(sunday.getUTCMonth() + 1).padStart(2, '0');
  const sundayD = String(sunday.getUTCDate()).padStart(2, '0');
  const endDate = `${sundayY}-${sundayM}-${sundayD}`;

  // Calculate ISO-8601 Week Number based on Thursday of the week
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const isoYear = thursday.getUTCFullYear();

  const firstThursdayOfYear = new Date(Date.UTC(isoYear, 0, 4));
  const firstThursdayDay = firstThursdayOfYear.getUTCDay() || 7;
  firstThursdayOfYear.setUTCDate(firstThursdayOfYear.getUTCDate() + (4 - firstThursdayDay));

  const weekNumber = 1 + Math.round(
    ((thursday.getTime() - firstThursdayOfYear.getTime()) / 86400000) / 7
  );

  const cycleId = `comp_cycle_${isoYear}_w${String(weekNumber).padStart(2, '0')}`;

  return {
    year: isoYear,
    weekNumber,
    cycleId,
    startDate,
    endDate,
    dayNumber,
    daysRemaining,
    closesAtEat: `${endDate}T23:59:59+03:00`,
    opensAtEat: `${startDate}T00:00:00+03:00`,
  };
}

export function getCompetitionCycleInfoEAT(dateStr?: string): {
  dayNumber: number; // 1..7 (Monday=1, Sunday=7)
  cycleStartDate: string;
  cycleEndDate: string;
  cycleId: string;
  weekNumber: number;
  daysRemaining: number;
} {
  const info = getEatIsoWeekInfo(dateStr);
  return {
    dayNumber: info.dayNumber,
    cycleStartDate: info.startDate,
    cycleEndDate: info.endDate,
    cycleId: info.cycleId,
    weekNumber: info.weekNumber,
    daysRemaining: info.daysRemaining,
  };
}

export function isDailyChallengeReviewLockedEAT(challengeDate?: string): boolean {
  if (!challengeDate) return true;
  const todayEAT = getEatDateString();
  return challengeDate >= todayEAT;
}

