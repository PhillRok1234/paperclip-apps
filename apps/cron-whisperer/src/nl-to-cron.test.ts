import { describe, it, expect } from 'vitest';
import { nlToCron } from './nl-to-cron';

function cron(input: string): string {
  const r = nlToCron(input);
  if (!r.ok) throw new Error(`expected ok for "${input}", got: ${r.error}`);
  return r.cron;
}

describe('nlToCron', () => {
  it('handles every minute', () => {
    expect(cron('every minute')).toBe('* * * * *');
  });

  it('handles every N minutes', () => {
    expect(cron('every 5 minutes')).toBe('*/5 * * * *');
    expect(cron('every 15 mins')).toBe('*/15 * * * *');
    expect(cron('every five minutes')).toBe('*/5 * * * *');
  });

  it('rejects out-of-range minute intervals', () => {
    const r = nlToCron('every 60 minutes');
    expect(r.ok).toBe(false);
  });

  it('handles hourly', () => {
    expect(cron('every hour')).toBe('0 * * * *');
    expect(cron('hourly')).toBe('0 * * * *');
    expect(cron('every 3 hours')).toBe('0 */3 * * *');
  });

  it('handles daily defaults', () => {
    expect(cron('daily')).toBe('0 0 * * *');
    expect(cron('every day')).toBe('0 0 * * *');
  });

  it('handles every day at a time', () => {
    expect(cron('every day at 9am')).toBe('0 9 * * *');
    expect(cron('every day at 9:30am')).toBe('30 9 * * *');
    expect(cron('every day at 14:00')).toBe('0 14 * * *');
    expect(cron('at 6pm every day')).toBe('0 18 * * *');
    expect(cron('at noon')).toBe('0 12 * * *');
    expect(cron('at midnight')).toBe('0 0 * * *');
  });

  it('handles weekdays/weekends', () => {
    expect(cron('every weekday at 9am')).toBe('0 9 * * 1,2,3,4,5');
    expect(cron('weekdays at 9:15')).toBe('15 9 * * 1,2,3,4,5');
    expect(cron('every weekend at 10am')).toBe('0 10 * * 0,6');
  });

  it('handles specific days', () => {
    expect(cron('every monday at 9am')).toBe('0 9 * * 1');
    expect(cron('every mon, wed, fri at 9am')).toBe('0 9 * * 1,3,5');
    expect(cron('every tue and thu at 14:30')).toBe('30 14 * * 2,4');
  });

  it('handles every N days', () => {
    expect(cron('every 3 days')).toBe('0 0 */3 * *');
  });

  it('handles weekly and monthly', () => {
    expect(cron('weekly')).toBe('0 0 * * 0');
    expect(cron('monthly')).toBe('0 0 1 * *');
  });

  it('returns friendly error for empty input', () => {
    const r = nlToCron('');
    expect(r.ok).toBe(false);
  });

  it('returns friendly error for nonsense', () => {
    const r = nlToCron('twice in a blue moon');
    expect(r.ok).toBe(false);
  });

  it('rejects bad time values', () => {
    const r = nlToCron('every day at 25:00');
    expect(r.ok).toBe(false);
  });
});
