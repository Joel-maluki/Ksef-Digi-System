import { connectDb } from '../config/db';
import { CategoryModel } from '../models/Category';

const categories = [
  ['Computer Science', 'CSC'],
  ['Mathematics', 'MTH'],
  ['Agriculture', 'AGR'],
  ['Physics', 'PHY'],
  ['Food Technology', 'FDT'],
  ['Economics', 'ECO'],
  ['Behavioral Science', 'BHS'],
  ['Robotics', 'ROB'],
  ['Environmental Science', 'ENV'],
  ['Engineering', 'ENG'],
  ['Chemistry', 'CHE'],
  ['Biology', 'BIO'],
  ['Renewable Energy', 'RNE'],
  ['Health Science', 'HSC'],
  ['Earth & Space Science', 'ESS'],
  ['Statistics & Data Science', 'SDS'],
  ['Biotechnology', 'BTE'],
  ['Applied Technology', 'APT'],
];

const run = async () => {
  await connectDb();
  for (const [name, code] of categories) {
    await CategoryModel.updateOne({ code }, { $set: { name, code, active: true } }, { upsert: true });
  }
  console.log('Categories seeded');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
