import type { FastifySchema } from 'fastify';

export const listCallsSchema: FastifySchema = {
  summary: 'List stored call activity records.',
  description: 'Returns the most recent call activity, including forwarding status and voicemail details.',
  tags: ['Activity'],
  response: {
    200: {
      description: 'Call activity feed.',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Datastore identifier.' },
                callSid: {
                  type: 'string',
                  description: 'Twilio call SID that uniquely identifies the call.',
                },
                from: { type: 'string', description: 'Caller number (E.164).' },
                to: { type: 'string', description: 'Inbound Twilio number (E.164).' },
                direction: { type: 'string', description: 'Call direction reported by Twilio.' },
                digits: { type: 'string', description: 'Digit pressed in the IVR, when available.' },
                workflowType: {
                  type: 'string',
                  description: 'Path taken by the caller: ivr, forward, or voicemail.',
                  enum: ['ivr', 'forward', 'voicemail'],
                },
                status: { type: 'string', description: 'Latest call status captured.' },
                durationSeconds: {
                  type: 'number',
                  description: 'Duration in seconds for completed forwarded calls.',
                },
                recordingUrl: {
                  type: 'string',
                  format: 'uri',
                  description: 'Twilio URL pointing to the voicemail recording, if one was left.',
                },
                recordingDurationSeconds: {
                  type: 'number',
                  description: 'Length of the voicemail recording in seconds.',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Timestamp when we first logged the call.',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Timestamp of the last update to the call log entry.',
                },
              },
            },
          },
          examples: {
            sample: {
              summary: 'Voicemail call record',
              value: [
                {
                  callSid: 'CA1234567890abcdef1234567890abcdef',
                  from: '+14155550123',
                  to: '+14155559876',
                  workflowType: 'voicemail',
                  status: 'voicemail-recorded',
                  recordingUrl: 'https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE123',
                  recordingDurationSeconds: 42,
                  createdAt: '2026-02-11T08:45:21.000Z',
                  updatedAt: '2026-02-11T08:47:10.000Z',
                },
              ],
            },
          },
        },
      },
    },
    500: {
      description: 'Unexpected failure while reading call activity.',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
            required: ['error'],
          },
          examples: {
            default: {
              summary: 'Database offline',
              value: {
                error: 'Unable to load call activity. Please retry later.',
              },
            },
          },
        },
      },
    },
  },
};
