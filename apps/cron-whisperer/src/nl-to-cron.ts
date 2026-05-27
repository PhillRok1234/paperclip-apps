export type ParseResult =
  | { ok: true; cron: string; usedRule: string }
  | { ok: false; error: string };

const DAY_NAMES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  sixty: 60,
};

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[.,;]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s*(am|pm)/g, '$1$2')
    .trim();
}

function parseNumber(token: string): number | null {
  if (/^\d+$/.test(token)) return Number(token);
  if (token in WORD_NUMBERS) return WORD_NUMBERS[token];
  return null;
}

type Time = { h: number; m: number };

function parseTime(input: string): Time | null {
  if (input === 'noon') return { h: 12, m: 0 };
  if (input === 'midnight') return { h: 0, m: 0 };

  let m = input.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
  if (m) {
    let h = Number(m[1]);
    const min = Number(m[2]);
    const mer = m[3];
    if (min > 59) return null;
    if (mer === 'am') {
      if (h < 1 || h > 12) return null;
      if (h === 12) h = 0;
    } else if (mer === 'pm') {
      if (h < 1 || h > 12) return null;
      if (h !== 12) h += 12;
    } else {
      if (h > 23) return null;
    }
    return { h, m: min };
  }

  m = input.match(/^(\d{1,2})(am|pm)$/);
  if (m) {
    let h = Number(m[1]);
    const mer = m[2];
    if (h < 1 || h > 12) return null;
    if (mer === 'am' && h === 12) h = 0;
    if (mer === 'pm' && h !== 12) h += 12;
    return { h, m: 0 };
  }

  return null;
}

function extractTime(text: string): { time: Time; rest: string } | null {
  const tokens = text.split(' ');
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === 'at' && i + 1 < tokens.length) {
      const t = parseTime(tokens[i + 1]);
      if (t) {
        const rest = [...tokens.slice(0, i), ...tokens.slice(i + 2)].join(' ').trim();
        return { time: t, rest };
      }
    }
  }
  for (let i = 0; i < tokens.length; i++) {
    const t = parseTime(tokens[i]);
    if (t) {
      const rest = [...tokens.slice(0, i), ...tokens.slice(i + 1)].join(' ').trim();
      return { time: t, rest };
    }
  }
  return null;
}

function extractDaysOfWeek(text: string): { days: number[]; rest: string } | null {
  if (/\b(weekday|weekdays|every weekday)\b/.test(text)) {
    return { days: [1, 2, 3, 4, 5], rest: text.replace(/\b(every )?weekdays?\b/g, '').trim() };
  }
  if (/\b(weekend|weekends|every weekend)\b/.test(text)) {
    return { days: [0, 6], rest: text.replace(/\b(every )?weekends?\b/g, '').trim() };
  }

  const tokens = text.split(/[\s,/&]+|\band\b/).filter(Boolean);
  const found: number[] = [];
  const consumed = new Set<string>();
  for (const tok of tokens) {
    if (tok in DAY_NAMES) {
      found.push(DAY_NAMES[tok]);
      consumed.add(tok);
    }
  }
  if (found.length === 0) return null;
  const rest = text
    .split(' ')
    .filter((t) => !consumed.has(t))
    .join(' ')
    .replace(/\b(every|on|and)\b/g, '')
    .replace(/[,/&]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { days: Array.from(new Set(found)).sort((a, b) => a - b), rest };
}

function fmtDays(days: number[]): string {
  if (days.length === 0) return '*';
  if (days.length === 7) return '*';
  return days.join(',');
}

export function nlToCron(raw: string): ParseResult {
  if (!raw || !raw.trim()) {
    return { ok: false, error: 'Type something like "every weekday at 9am".' };
  }
  const input = normalize(raw);

  if (input === 'every minute') {
    return { ok: true, cron: '* * * * *', usedRule: 'every minute' };
  }
  if (input === 'every hour' || input === 'hourly') {
    return { ok: true, cron: '0 * * * *', usedRule: 'every hour' };
  }
  if (input === 'every day' || input === 'daily') {
    return { ok: true, cron: '0 0 * * *', usedRule: 'every day (at midnight)' };
  }
  if (input === 'every week' || input === 'weekly') {
    return { ok: true, cron: '0 0 * * 0', usedRule: 'every week (Sunday midnight)' };
  }
  if (input === 'every month' || input === 'monthly') {
    return { ok: true, cron: '0 0 1 * *', usedRule: 'every month (1st at midnight)' };
  }

  let m = input.match(/^every (\d+|\w+) (minute|minutes|min|mins)$/);
  if (m) {
    const n = parseNumber(m[1]);
    if (n === null || n < 1 || n > 59) {
      return { ok: false, error: 'Interval must be between 1 and 59 minutes.' };
    }
    return { ok: true, cron: `*/${n} * * * *`, usedRule: `every ${n} minutes` };
  }

  m = input.match(/^every (\d+|\w+) (hour|hours|hr|hrs)$/);
  if (m) {
    const n = parseNumber(m[1]);
    if (n === null || n < 1 || n > 23) {
      return { ok: false, error: 'Hour interval must be between 1 and 23.' };
    }
    return { ok: true, cron: `0 */${n} * * *`, usedRule: `every ${n} hours` };
  }

  m = input.match(/^every (\d+|\w+) (day|days)$/);
  if (m) {
    const n = parseNumber(m[1]);
    if (n === null || n < 1 || n > 31) {
      return { ok: false, error: 'Day interval must be between 1 and 31.' };
    }
    return { ok: true, cron: `0 0 */${n} * *`, usedRule: `every ${n} days at midnight` };
  }

  const timeMatch = extractTime(input);
  const remainingAfterTime = timeMatch ? timeMatch.rest : input;
  const dayMatch = extractDaysOfWeek(remainingAfterTime);

  if (timeMatch) {
    const { h, m: mn } = timeMatch.time;
    const days = dayMatch ? dayMatch.days : [];
    const leftover = (dayMatch ? dayMatch.rest : timeMatch.rest)
      .replace(/\b(every|day|daily|each)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (leftover && leftover !== '') {
      return {
        ok: false,
        error: `I don't understand "${leftover}". Try one of the examples below.`,
      };
    }
    return {
      ok: true,
      cron: `${mn} ${h} * * ${fmtDays(days)}`,
      usedRule: dayMatch
        ? `at ${pad(h)}:${pad(mn)} on ${formatDayList(days)}`
        : `every day at ${pad(h)}:${pad(mn)}`,
    };
  }

  return {
    ok: false,
    error: "I don't understand that yet. Try one of the examples below.",
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatDayList(days: number[]): string {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.map((d) => names[d]).join(', ');
}
