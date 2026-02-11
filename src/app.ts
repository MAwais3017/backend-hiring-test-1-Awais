import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { registerTwilioRoutes } from './routes/twilio.routes';
import { registerCallRoutes } from './routes/calls.routes';
import { env } from './config/env';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.nodeEnv === 'development' ? 'debug' : 'info',
    },
  });

  await app.register(formbody);

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Call Forwarding API',
        description:
          'Endpoints for handling Twilio IVR call forwarding and retrieving call activity.',
        version: '1.0.0',
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  app.get(
    '/health',
    {
      schema: {
        summary: 'Health check endpoint.',
        tags: ['Utility'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
            },
          },
        },
      },
    },
    async () => ({ status: 'ok' })
  );

  await registerTwilioRoutes(app);
  await registerCallRoutes(app);

  return app;
}
