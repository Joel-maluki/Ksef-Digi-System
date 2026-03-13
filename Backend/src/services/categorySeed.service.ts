import { CategoryModel } from '../models/Category';
import { defaultCategories } from '../data/defaultCategories';

export const ensureDefaultCategories = async () => {
  const existingCategories = await CategoryModel.find({}, { code: 1, _id: 0 }).lean();
  const existingCodes = new Set(existingCategories.map((category) => category.code));

  const missingCategories = defaultCategories.filter(([, code]) => !existingCodes.has(code));

  if (missingCategories.length === 0) {
    return;
  }

  for (const [name, code] of missingCategories) {
    await CategoryModel.updateOne(
      { code },
      {
        $setOnInsert: {
          name,
          code,
          active: true,
        },
      },
      { upsert: true }
    );
  }

  console.log(`Seeded ${missingCategories.length} default categories`);
};
