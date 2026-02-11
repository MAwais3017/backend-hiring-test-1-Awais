import { config } from 'dotenv';

config();

const parsePort = (value?: string) => {
  const port = Number(value);
  return Number.isFinite(port) && port > 0 ? port : 3000;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
  baseUrl: process.env.PUBLIC_BASE_URL,
  twilioForwardNumber: process.env.TWILIO_FORWARD_TO_NUMBER ?? '',
  twilioCallerId: process.env.TWILIO_NUMBER ?? undefined,
};

export const isForwardingConfigured = () => Boolean(env.twilioForwardNumber);
