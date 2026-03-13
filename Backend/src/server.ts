import app from './app';
import { connectDb } from './config/db';
import { env } from './config/env';

const start = async () => {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`KSEF backend listening on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
