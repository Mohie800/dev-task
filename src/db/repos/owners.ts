import { getDb } from '../client';
import { newId, nowIso } from '../id';
import type { Owner } from '../types';

interface OwnerRow {
  id: string; name: string; company: string | null; phone: string | null;
  email: string | null; notes: string | null; created_at: string; updated_at: string;
}

const map = (r: OwnerRow): Owner => ({
  id: r.id, name: r.name, company: r.company, phone: r.phone,
  email: r.email, notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at,
});

export function listOwners(): Owner[] {
  return getDb().getAllSync<OwnerRow>('SELECT * FROM owners ORDER BY name COLLATE NOCASE').map(map);
}

export function createOwner(input: Omit<Owner, 'id' | 'createdAt' | 'updatedAt'>): Owner {
  const id = newId();
  const now = nowIso();
  getDb().runSync(
    'INSERT INTO owners (id, name, company, phone, email, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)',
    [id, input.name, input.company, input.phone, input.email, input.notes, now, now],
  );
  return { ...input, id, createdAt: now, updatedAt: now };
}

export function updateOwner(id: string, patch: Partial<Omit<Owner, 'id' | 'createdAt'>>): void {
  const cur = getDb().getFirstSync<OwnerRow>('SELECT * FROM owners WHERE id = ?', [id]);
  if (!cur) return;
  const next = { ...map(cur), ...patch, updatedAt: nowIso() };
  getDb().runSync(
    'UPDATE owners SET name=?, company=?, phone=?, email=?, notes=?, updated_at=? WHERE id=?',
    [next.name, next.company, next.phone, next.email, next.notes, next.updatedAt, id],
  );
}

export function deleteOwner(id: string): void {
  getDb().runSync('DELETE FROM owners WHERE id = ?', [id]);
}
