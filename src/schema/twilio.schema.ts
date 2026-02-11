import type { FastifySchema } from 'fastify';

const baseWebhookProperties = {
  CallSid: {
    type: 'string',
    description: 'Unique SID representing the current call leg.',
    examples: ['CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'],
  },
  AccountSid: {
    type: 'string',
    description: 'Twilio account SID associated with the webhook.',
    examples: ['<AccountSid from env or webhook>'],
  },
  From: {
    type: 'string',
    description: 'Originating phone number (E.164).',
    examples: ['+14155550123'],
  },
  To: {
    type: 'string',
    description: 'Twilio phone number that received the call (E.164).',
    examples: ['+14155559876'],
  },
  Direction: {
    type: 'string',
    description: 'Direction of the call as reported by Twilio.',
    examples: ['inbound'],
  },
  CallStatus: {
    type: 'string',
    description: 'Status of the call when the webhook was triggered.',
    examples: ['ringing'],
  },
};

const twilioXmlResponse = {
  200: {
    description: 'TwiML instructions returned to Twilio.',
    content: {
      'text/xml': {
        schema: {
          type: 'string',
        },
        examples: {
          default: {
            summary: 'Simple acknowledgement TwiML',
            value: '<Response><Say>Thank you for calling.</Say></Response>',
          },
        },
      },
    },
  },
  400: {
    description: 'Payload missing required Twilio parameters.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'string' } },
          },
          required: ['error'],
        },
        examples: {
          validation: {
            summary: 'Missing CallSid',
            value: {
              error: 'Bad Request',
              details: ['body must have required property CallSid'],
            },
          },
        },
      },
    },
  },
  500: {
    description: 'Unexpected server failure.',
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
            summary: 'Unhandled error',
            value: {
              error: 'Internal Server Error',
            },
          },
        },
      },
    },
  },
};

const commonWebhookSchema = {
  type: 'object',
  required: ['CallSid', 'From', 'To'],
  additionalProperties: true,
  properties: baseWebhookProperties,
} as const;

export const twilioVoiceSchema: FastifySchema = {
  summary: 'Initial webhook invoked by Twilio for inbound calls.',
  description:
    'Receives Twilio voice webhooks when a caller reaches the IVR entry point. The payload is form-encoded.',
  tags: ['Twilio'],
  consumes: ['application/x-www-form-urlencoded'],
  body: {
    ...commonWebhookSchema,
  },
  response: twilioXmlResponse,
};

export const twilioVoiceHandleSchema: FastifySchema = {
  summary: 'Process IVR digit input collected from the caller.',
  description: 'Executed after Twilio finishes the initial Gather step and posts the chosen digit.',
  tags: ['Twilio'],
  consumes: ['application/x-www-form-urlencoded'],
  body: {
    ...commonWebhookSchema,
    properties: {
      ...commonWebhookSchema.properties,
      Digits: {
        type: 'string',
        description: 'Digit pressed by the caller (1 for forward, 2 for voicemail).',
        examples: ['1'],
      },
    },
  },
  response: twilioXmlResponse,
};

export const twilioDialActionSchema: FastifySchema = {
  summary: 'Handle the result of a forwarded call attempt.',
  description:
    'Receives Twilio webhook callbacks after the <Dial> verb finishes, reporting the outcome of the forwarded leg.',
  tags: ['Twilio'],
  consumes: ['application/x-www-form-urlencoded'],
  body: {
    ...commonWebhookSchema,
    properties: {
      ...commonWebhookSchema.properties,
      DialCallStatus: {
        type: 'string',
        description: 'Status of the dialed leg (completed, no-answer, busy, failed, etc.).',
        examples: ['completed'],
      },
      DialCallDuration: {
        type: 'string',
        description: 'Duration in seconds of the connected call leg.',
        examples: ['85'],
      },
      DialCallSid: {
        type: 'string',
        description: 'SID of the dialed leg (different from the parent call SID).',
        examples: ['CAabcdef1234567890abcdef1234567890'],
      },
    },
  },
  response: twilioXmlResponse,
};

export const twilioVoicemailSchema: FastifySchema = {
  summary: 'Persist voicemail recordings metadata.',
  description:
    'Triggered when the caller leaves a voicemail. Contains the recording URL and duration in the payload.',
  tags: ['Twilio'],
  consumes: ['application/x-www-form-urlencoded'],
  body: {
    ...commonWebhookSchema,
    required: ['CallSid', 'From', 'To', 'RecordingUrl'],
    properties: {
      ...commonWebhookSchema.properties,
      RecordingUrl: {
        type: 'string',
        format: 'uri',
        description: 'Public Twilio URL for the recorded voicemail message.',
        examples: ['https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE123'],
      },
      RecordingDuration: {
        type: 'string',
        description: 'Length of the voicemail in seconds.',
        examples: ['45'],
      },
    },
  },
  response: twilioXmlResponse,
};
