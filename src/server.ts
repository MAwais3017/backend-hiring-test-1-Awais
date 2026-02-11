import { buildApp } from './app';
import { env } from './config/env';

const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${env.port}`);
  } catch (error) {
    app.log.error(error, 'Failed to start server');
    process.exit(1);
  }
};

void start();
