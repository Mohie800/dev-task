/**
 * Relative-period engine — the heart of DevTask scheduling.
 * Rules (value + unit) are preserved alongside calculated dates;
 * units are designed to be extended (hours, years) without breaking callers.
 */
import { addDays, addMonths, addWeeks } from 'date-fns';

export type PeriodUnit = 'days' | 'weeks' | 'months';

export interface PeriodRule {
  value: number;
  unit: PeriodUnit;
}

const UNIT_ADDERS: Record<PeriodUnit, (d: Date, n: number) => Date> = {
  days: addDays,
  weeks: addWeeks,
  months: (d, n) => addMonthsClamp(d, n),
};

/** Months clamp to end-of-month: Jan 31 + 1 month = Feb 28/29, never Mar 3. */
function addMonthsClamp(date: Date, n: number): Date {
  const target = addMonths(date, n);
  if (target.getDate() < date.getDate()) {
    // clamped by month length; step back to last day of previous month
    return addDays(target, -target.getDate());
  }
  return target;
}

export function addPeriod(base: Date, rule: PeriodRule): Date {
  const add = UNIT_ADDERS[rule.unit];
  if (!add) throw new Error(`Unknown period unit: ${rule.unit}`);
  return add(base, rule.value);
}

export interface TaskDateRules {
  trigger?: PeriodRule | null;
  deadline?: PeriodRule | null;
}

export interface CalculatedTaskDates {
  triggerAt: Date | null;
  deadlineAt: Date | null;
}

/** createdAt → (+trigger) triggerAt → (+deadline) deadlineAt. */
export function calculateTaskDates(
  createdAt: Date,
  rules: TaskDateRules,
): CalculatedTaskDates {
  const start = rules.trigger ? addPeriod(createdAt, rules.trigger) : createdAt;
  return {
    triggerAt: rules.trigger ? start : null,
    deadlineAt: rules.deadline ? addPeriod(start, rules.deadline) : null,
  };
}

/** Project deadline: createdAt + period. */
export function calculateProjectDeadline(createdAt: Date, rule: PeriodRule): Date {
  return addPeriod(createdAt, rule);
}

export const PERIOD_UNIT_LABELS: Record<PeriodUnit, string> = {
  days: 'days',
  weeks: 'weeks',
  months: 'months',
};

export function formatRule(rule: PeriodRule): string {
  const { value, unit } = rule;
  const label = PERIOD_UNIT_LABELS[unit] ?? unit;
  return `${value} ${value === 1 ? label.replace(/s$/, '') : label}`;
}
