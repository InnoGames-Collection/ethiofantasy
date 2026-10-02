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

export function getCompetitionCycleInfoEAT(dateStr?: string): {
  dayNumber: number; // 1..7 (Monday=1, Sunday=7)
  cycleStartDate: string;
  daysRemaining: number;
} {
  const currentStr = dateStr || getEatDateString();
  const date = parseEatDate(currentStr);
  const dayOfWeek = date.getUTCDay(); // 0 is Sun, 1 is Mon...
  const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
  const daysRemaining = 7 - dayNumber;

  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - (dayNumber - 1));
  const yyyy = monday.getUTCFullYear();
  const mm = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(monday.getUTCDate()).padStart(2, '0');

  return {
    dayNumber,
    cycleStartDate: `${yyyy}-${mm}-${dd}`,
    daysRemaining,
  };
}

export function isDailyChallengeReviewLockedEAT(challengeDate?: string): boolean {
  if (!challengeDate) return true;
  const todayEAT = getEatDateString();
  return challengeDate >= todayEAT;
}
