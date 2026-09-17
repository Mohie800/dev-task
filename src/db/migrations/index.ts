import type { Migration } from './0001_initial';
import { migrations as m0001 } from './0001_initial';

export const migrations: Migration[] = [...m0001];
