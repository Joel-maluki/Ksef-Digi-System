import { Router } from 'express';
import { getKenyaAdministrativeUnitList } from '../controllers/location.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/kenya-administrative-units', asyncHandler(getKenyaAdministrativeUnitList));

export default router;
