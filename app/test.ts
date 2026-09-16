import { parseISO, isSameMonth, addMonths } from 'date-fns';

const date = '2026-05-15';
const d1 = parseISO(new Date(date + 'T12:00:00').toISOString());

// Test processRecurringBills loop logic
const now = new Date(); // April 30
const startD = d1;
const endD = addMonths(now, 12);
const maxD = addMonths(now, 12);

let currentMonth = startD;

while (!currentMonth.getTime || currentMonth.getTime() <= maxD.getTime()) {
  const targetMonth = currentMonth;
  const dueDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 15, 12, 0, 0);
  console.log('generated for:', dueDate.toISOString(), 'from target:', targetMonth.toISOString());
  currentMonth = addMonths(currentMonth, 1);
  if (currentMonth.getTime() > maxD.getTime()) break;
}
