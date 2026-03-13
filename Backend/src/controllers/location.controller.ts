import { Request, Response } from 'express';
import { getKenyaAdministrativeUnits } from '../services/kenyaAdministrativeUnits.service';
import { ok } from '../utils/apiResponse';

export const getKenyaAdministrativeUnitList = async (
  _req: Request,
  res: Response
) => {
  res.json(ok(getKenyaAdministrativeUnits()));
};
