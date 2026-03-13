import { SystemSettingModel } from '../models/SystemSetting';

export const getSystemSettings = async () =>
  SystemSettingModel.findOneAndUpdate(
    { key: 'system' },
    { $setOnInsert: { key: 'system' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
