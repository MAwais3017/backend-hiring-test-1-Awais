import type { FastifyReply, FastifyRequest } from 'fastify';
import { callService } from '../services/callService';

export const listCallsController = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const calls = await callService.list();
  return reply.send(calls);
};
