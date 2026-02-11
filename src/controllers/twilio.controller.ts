import type { FastifyReply, FastifyRequest } from 'fastify';
import { twiml } from 'twilio';
import { callService } from '../services/callService';
import { env, isForwardingConfigured } from '../config/env';

export type TwilioPayload = Record<string, string | undefined>;

type TwilioRequest = FastifyRequest<{ Body: TwilioPayload }>;

const gatherMessage =
  'Welcome to Turing Technologies. Press 1 to reach our team. Press 2 to leave a voicemail.';
const invalidInputMessage = 'We did not understand your selection.';
const XML_CONTENT_TYPE = 'text/xml';

const buildVoiceResponse = () => new twiml.VoiceResponse();

const sendXml = (reply: FastifyReply, response: twiml.VoiceResponse) =>
  reply.type(XML_CONTENT_TYPE).send(response.toString());

const toNumberOrUndefined = (value?: string) => {
  if (!value) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export const handleVoice = async (request: TwilioRequest, reply: FastifyReply) => {
  const payload = request.body;
  const callSid = payload.CallSid;

  if (callSid) {
    await callService.upsert(callSid, {
      callSid,
      from: payload.From ?? '',
      to: payload.To ?? '',
      direction: payload.Direction,
      status: 'waiting-selection',
      workflowType: 'ivr',
    });
  }

  const response = buildVoiceResponse();
  const gather = response.gather({
    action: '/twilio/voice/handle',
    method: 'POST',
    numDigits: 1,
    timeout: 5,
  });

  gather.say({ voice: 'alice', language: 'en-US' }, gatherMessage);

  response.say('We did not receive any input.');
  response.redirect('/twilio/voice');

  return sendXml(reply, response);
};

export const handleVoiceInput = async (request: TwilioRequest, reply: FastifyReply) => {
  const payload = request.body;
  const callSid = payload.CallSid;
  const digits = payload.Digits;

  const baseUpdates = {
    callSid: callSid ?? '',
    from: payload.From ?? '',
    to: payload.To ?? '',
    direction: payload.Direction,
    digits,
  };

  const response = buildVoiceResponse();

  if (!callSid || !digits) {
    if (callSid) {
      await callService.upsert(callSid, {
        ...baseUpdates,
        status: digits ? 'invalid-selection' : 'no-input',
        workflowType: 'ivr',
      });
    }

    response.say(invalidInputMessage);
    response.redirect('/twilio/voice');
    return sendXml(reply, response);
  }

  if (digits === '1') {
    if (!isForwardingConfigured()) {
      await callService.upsert(callSid, {
        ...baseUpdates,
        workflowType: 'ivr',
        status: 'forwarding-unavailable',
      });

      response.say(
        'We are unable to transfer your call at the moment. Please try again later or leave a voicemail.'
      );
      response.redirect('/twilio/voice');
      return sendXml(reply, response);
    }

    await callService.upsert(callSid, {
      ...baseUpdates,
      workflowType: 'forward',
      status: 'connecting-agent',
    });

    response.say('Connecting you to the next available team member. Please hold.');

    const dial = response.dial({
      action: '/twilio/voice/dial-action',
      method: 'POST',
      timeout: 20,
      ...(env.twilioCallerId ? { callerId: env.twilioCallerId } : {}),
    } as unknown as Parameters<twiml.VoiceResponse['dial']>[0]);

    dial.number({}, env.twilioForwardNumber);

    return sendXml(reply, response);
  }

  if (digits === '2') {
    await callService.upsert(callSid, {
      ...baseUpdates,
      workflowType: 'voicemail',
      status: 'recording-voicemail',
    });

    response.say('Please leave a message after the tone. Press the pound key when you are done.');
    response.record({
      action: '/twilio/voice/voicemail',
      method: 'POST',
      maxLength: 120,
      playBeep: true,
      finishOnKey: '#',
    });
    response.say('We did not receive a recording. Goodbye.');
    response.hangup();

    return sendXml(reply, response);
  }

  response.say(invalidInputMessage);
  await callService.upsert(callSid, {
    ...baseUpdates,
    status: 'invalid-selection',
    workflowType: 'ivr',
  });
  response.redirect('/twilio/voice');
  return sendXml(reply, response);
};

export const handleDialAction = async (request: TwilioRequest, reply: FastifyReply) => {
  const payload = request.body;
  const callSid = payload.CallSid;
  const dialStatus = payload.DialCallStatus ?? payload.CallStatus ?? 'completed';
  const normalizedStatus = dialStatus.toLowerCase();

  if (callSid) {
    await callService.upsert(callSid, {
      status: dialStatus,
      durationSeconds: toNumberOrUndefined(payload.DialCallDuration),
      workflowType: normalizedStatus === 'completed' ? 'forward' : 'voicemail',
    });
  }

  const response = buildVoiceResponse();

  if (normalizedStatus === 'completed') {
    response.say('Thank you for calling. Goodbye.');
    response.hangup();
  } else {
    response.say('We could not connect your call. Please leave a voicemail after the tone.');
    response.record({
      action: '/twilio/voice/voicemail',
      method: 'POST',
      maxLength: 120,
      playBeep: true,
      finishOnKey: '#',
    });
    response.say('We did not receive a recording. Goodbye.');
    response.hangup();
  }

  return sendXml(reply, response);
};

export const handleVoicemail = async (request: TwilioRequest, reply: FastifyReply) => {
  const payload = request.body;
  const callSid = payload.CallSid;

  if (callSid) {
    await callService.upsert(callSid, {
      status: 'voicemail-recorded',
      workflowType: 'voicemail',
      recordingUrl: payload.RecordingUrl,
      recordingDurationSeconds: toNumberOrUndefined(payload.RecordingDuration),
    });
  }

  const response = buildVoiceResponse();
  response.say('Thank you. Your voicemail has been recorded. Goodbye.');
  response.hangup();

  return sendXml(reply, response);
};
