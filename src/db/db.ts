import Dexie, { type Table } from 'dexie';

export type LogType = 'fasting' | 'workout' | 'weight';

export interface HealthLog {
  id?: number;
  type: LogType;
  timestamp: Date;
  data: any;
}

export class HealthDatabase extends Dexie {
  logs!: Table<HealthLog>;

  constructor() {
    super('HealthDatabase');
    this.version(1).stores({
      logs: '++id, type, timestamp'
    });
  }
}

export const db = new HealthDatabase();

// Helper to get last log of a certain type
export async function getLastLog(type: LogType) {
  return await db.logs
    .where('type')
    .equals(type)
    .reverse()
    .sortBy('timestamp')
    .then(logs => logs[0]);
}
