import { Request, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { JudgeCategoryAssignmentModel } from '../models/JudgeCategoryAssignment';
import { ProjectJudgeAssignmentModel } from '../models/ProjectJudgeAssignment';
import { ProjectModel } from '../models/Project';
import { ResultPublicationModel } from '../models/ResultPublication';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/apiResponse';

const normalizeString = (value: unknown) => String(value || '').trim();

export const listCategories = async (_req: Request, res: Response) => {
  const categories = await CategoryModel.find().sort({ name: 1 });
  res.json(ok(categories));
};

export const getCategory = async (req: Request, res: Response) => {
  const category = await CategoryModel.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json(ok(category));
};

export const createCategory = async (req: Request, res: Response) => {
  const name = normalizeString(req.body?.name);
  const code = normalizeString(req.body?.code).toUpperCase();

  if (!name || !code) {
    throw new ApiError(400, 'Category name and code are required');
  }

  const category = await CategoryModel.create({
    name,
    code,
    description: normalizeString(req.body?.description),
    active: req.body?.active !== undefined ? Boolean(req.body.active) : true,
  });

  res.status(201).json(ok(category, 'Category created'));
};

export const updateCategory = async (req: Request, res: Response) => {
  const updates: Record<string, unknown> = {};

  if (req.body?.name !== undefined) {
    const name = normalizeString(req.body.name);
    if (!name) throw new ApiError(400, 'Category name cannot be empty');
    updates.name = name;
  }

  if (req.body?.code !== undefined) {
    const code = normalizeString(req.body.code).toUpperCase();
    if (!code) throw new ApiError(400, 'Category code cannot be empty');
    updates.code = code;
  }

  if (req.body?.description !== undefined) {
    updates.description = normalizeString(req.body.description);
  }

  if (req.body?.active !== undefined) {
    updates.active = Boolean(req.body.active);
  }

  const category = await CategoryModel.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!category) throw new ApiError(404, 'Category not found');
  res.json(ok(category, 'Category updated'));
};

export const deleteCategory = async (req: Request, res: Response) => {
  const [projectCount, judgeAssignmentCount, projectAssignmentCount, publicationCount] =
    await Promise.all([
      ProjectModel.countDocuments({ categoryId: req.params.id }),
      JudgeCategoryAssignmentModel.countDocuments({ categoryId: req.params.id }),
      ProjectJudgeAssignmentModel.countDocuments({ categoryId: req.params.id }),
      ResultPublicationModel.countDocuments({ categoryId: req.params.id }),
    ]);

  if (
    projectCount > 0 ||
    judgeAssignmentCount > 0 ||
    projectAssignmentCount > 0 ||
    publicationCount > 0
  ) {
    throw new ApiError(
      409,
      'This category is already in use and cannot be deleted'
    );
  }

  const category = await CategoryModel.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json(ok(null, 'Category deleted'));
};
