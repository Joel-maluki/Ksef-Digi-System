import { Router } from 'express';
import { createCategory, deleteCategory, getCategory, listCategories, updateCategory } from '../controllers/category.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/', asyncHandler(listCategories));
router.get('/:id', asyncHandler(getCategory));
router.post('/', requireAuth, requireRole('admin'), asyncHandler(createCategory));
router.patch('/:id', requireAuth, requireRole('admin'), asyncHandler(updateCategory));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(deleteCategory));
export default router;
