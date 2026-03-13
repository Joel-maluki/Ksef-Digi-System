import { ProjectModel } from '../models/Project';

export const generateProjectCode = async (categoryCode: string) => {
  const prefix = categoryCode.toUpperCase();
  const count = await ProjectModel.countDocuments({ projectCode: { $regex: `^${prefix}-` } });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};
