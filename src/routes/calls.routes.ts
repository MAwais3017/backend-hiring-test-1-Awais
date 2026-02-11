import type { FastifyInstance } from 'fastify';
import { listCallsController } from '../controllers/calls.controller';
import { listCallsSchema } from '../schema/calls.schema';

export async function registerCallRoutes(app: FastifyInstance) {
  app.get(
    '/calls',
    {
      schema: listCallsSchema,
    },
    listCallsController
  );
}
