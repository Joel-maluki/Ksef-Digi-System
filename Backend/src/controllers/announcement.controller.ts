import { Request, Response } from 'express';
import { AnnouncementModel } from '../models/Announcement';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';

export const listAnnouncements = async (_req: Request, res: Response) => {
  const announcements = await AnnouncementModel.find().sort({ createdAt: -1 });
  res.json(ok(announcements));
};

export const createAnnouncement = async (req: Request, res: Response) => {
  const announcement = await AnnouncementModel.create({ ...req.body, createdBy: req.user?.userId });
  res.status(201).json(ok(announcement, 'Announcement created'));
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  const announcement = await AnnouncementModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!announcement) throw new ApiError(404, 'Announcement not found');
  res.json(ok(announcement, 'Announcement updated'));
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  const announcement = await AnnouncementModel.findByIdAndDelete(req.params.id);
  if (!announcement) throw new ApiError(404, 'Announcement not found');
  res.json(ok(null, 'Announcement deleted'));
};
