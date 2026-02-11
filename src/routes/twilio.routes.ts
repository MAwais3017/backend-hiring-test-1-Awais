import type { FastifyInstance } from 'fastify';
import {
  handleDialAction,
  handleVoice,
  handleVoiceInput,
  handleVoicemail,
} from '../controllers/twilio.controller';
import {
  twilioDialActionSchema,
  twilioVoiceHandleSchema,
  twilioVoiceSchema,
  twilioVoicemailSchema,
} from '../schema/twilio.schema';

export async function registerTwilioRoutes(app: FastifyInstance) {
  app.post(
    '/twilio/voice',
    {
      schema: twilioVoiceSchema,
    },
    handleVoice
  );

  app.post(
    '/twilio/voice/handle',
    {
      schema: twilioVoiceHandleSchema,
    },
    handleVoiceInput
  );

  app.post(
    '/twilio/voice/dial-action',
    {
      schema: twilioDialActionSchema,
    },
    handleDialAction
  );

  app.post(
    '/twilio/voice/voicemail',
    {
      schema: twilioVoicemailSchema,
    },
    handleVoicemail
  );
}
