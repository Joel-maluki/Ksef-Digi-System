import { connectDb } from '../config/db';
import { CategoryModel } from '../models/Category';
import { defaultCategories } from '../data/defaultCategories';

const run = async () => {
  await connectDb();
  for (const [name, code] of defaultCategories) {
    await CategoryModel.updateOne({ code }, { $set: { name, code, active: true } }, { upsert: true });
  }
  console.log('Categories seeded');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
