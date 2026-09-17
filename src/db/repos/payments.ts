import { getDb } from '../client';
import { newId, nowIso } from '../id';
import type { Payment } from '../types';

interface PaymentRow {
  id: string; project_id: string; amount: number; date: string; note: string | null; created_at: string;
}

const map = (r: PaymentRow): Payment => ({
  id: r.id, projectId: r.project_id, amount: r.amount, date: r.date, note: r.note, createdAt: r.created_at,
});

export function listPayments(projectId: string): Payment[] {
  return getDb()
    .getAllSync<PaymentRow>('SELECT * FROM payments WHERE project_id = ? ORDER BY date DESC', [projectId])
    .map(map);
}

export function addPayment(input: { projectId: string; amount: number; date: string; note: string | null }): Payment {
  const id = newId();
  const now = nowIso();
  getDb().runSync(
    'INSERT INTO payments (id, project_id, amount, date, note, created_at) VALUES (?,?,?,?,?,?)',
    [id, input.projectId, input.amount, input.date, input.note, now],
  );
  return { id, projectId: input.projectId, amount: input.amount, date: input.date, note: input.note, createdAt: now };
}

export function deletePayment(id: string): void {
  getDb().runSync('DELETE FROM payments WHERE id = ?', [id]);
}

export function paymentTotals(projectId: string): { total: number; count: number } {
  const r = getDb().getFirstSync<{ total: number; count: number }>(
    'SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count FROM payments WHERE project_id = ?',
    [projectId],
  );
  return { total: r?.total ?? 0, count: r?.count ?? 0 };
}
