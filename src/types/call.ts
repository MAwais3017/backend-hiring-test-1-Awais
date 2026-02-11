export type CallWorkflowType = 'ivr' | 'forward' | 'voicemail';

export interface CallRecord {
  _id?: string;
  callSid: string;
  from: string;
  to: string;
  direction?: string;
  digits?: string;
  workflowType: CallWorkflowType;
  status: string;
  durationSeconds?: number;
  recordingUrl?: string;
  recordingDurationSeconds?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CallListItem extends CallRecord {
  createdAt: Date;
  updatedAt: Date;
}
