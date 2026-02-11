import fs from 'node:fs';
import path from 'node:path';
import Datastore from 'nedb-promises';

const dataDir = path.resolve(process.cwd(), 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const callsStore = Datastore.create({
  filename: path.join(dataDir, 'calls.db'),
  autoload: true,
  timestampData: true,
});

export type CallsDatastore = typeof callsStore;

void callsStore.ensureIndex({ fieldName: 'callSid', unique: true }).catch((error) => {
  console.error('Failed to ensure callSid index', error);
});
