import { callsStore, type CallsDatastore } from '../db/datastore';
import type { CallListItem, CallRecord, CallWorkflowType } from '../types/call';

const defaultStatus = 'pending-input';

const sanitizeUpdatePayload = (payload: Partial<CallRecord>) => {
  const filteredEntries = Object.entries(payload).filter(
    ([, value]) => value !== undefined && value !== null
  ) as Array<[keyof CallRecord, CallRecord[keyof CallRecord]]>;

  return Object.fromEntries(filteredEntries) as Partial<CallRecord>;
};

class CallService {
  constructor(private readonly store: CallsDatastore) {}

  async upsert(callSid: string, payload: Partial<CallRecord>) {
    const sanitizedPayload = sanitizeUpdatePayload(payload);
    const existing = await this.store.findOne({ callSid });

    if (existing) {
      await this.store.update({ callSid }, { $set: sanitizedPayload }, { multi: false });
      return this.findBySid(callSid);
    }

    const workflowType: CallWorkflowType =
      (sanitizedPayload.workflowType as CallWorkflowType | undefined) ?? 'ivr';
    const status = sanitizedPayload.status ?? defaultStatus;

    const record: CallRecord = {
      callSid,
      from: sanitizedPayload.from ?? '',
      to: sanitizedPayload.to ?? '',
      workflowType,
      status,
    };

    if (sanitizedPayload.direction !== undefined) {
      record.direction = sanitizedPayload.direction;
    }
    if (sanitizedPayload.digits !== undefined) {
      record.digits = sanitizedPayload.digits;
    }
    if (sanitizedPayload.durationSeconds !== undefined) {
      record.durationSeconds = sanitizedPayload.durationSeconds;
    }
    if (sanitizedPayload.recordingUrl !== undefined) {
      record.recordingUrl = sanitizedPayload.recordingUrl;
    }
    if (sanitizedPayload.recordingDurationSeconds !== undefined) {
      record.recordingDurationSeconds = sanitizedPayload.recordingDurationSeconds;
    }
    if (sanitizedPayload.notes !== undefined) {
      record.notes = sanitizedPayload.notes;
    }

    const created = (await this.store.insert(record)) as CallRecord;
    return created;
  }

  async findBySid(callSid: string) {
    return (await this.store.findOne({ callSid })) as CallRecord | null;
  }

  async list(limit = 50) {
    return (await this.store
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()) as CallListItem[];
  }
}

export const callService = new CallService(callsStore);
