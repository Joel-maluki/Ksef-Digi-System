import app from './app';
import { connectDb } from './config/db';
import { env } from './config/env';
import { ensureDefaultCategories } from './services/categorySeed.service';

const start = async () => {
  await connectDb();
  await ensureDefaultCategories();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`KSEF backend listening on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
