import { Request, Response } from 'express';
import { AnnouncementModel } from '../models/Announcement';
import { CategoryModel } from '../models/Category';
import { DonationModel } from '../models/Donation';
import { ProjectModel } from '../models/Project';
import { ResultPublicationModel } from '../models/ResultPublication';
import { SchoolModel } from '../models/School';
import { calculateCategoryRanking } from '../services/ranking.service';
import { ok } from '../utils/apiResponse';

export const publicRankings = async (req: Request, res: Response) => {
  const { categoryId, competitionLevel } = req.query as { categoryId?: string; competitionLevel?: string };
  if (categoryId) {
    const category = await CategoryModel.findById(categoryId).lean();
    const pub = await ResultPublicationModel.findOne({ categoryId, competitionLevel, published: true });
    if (!pub) return res.json(ok([]));
    const rankings = await calculateCategoryRanking(categoryId, competitionLevel);
    return res.json(
      ok({
        categoryId,
        categoryName: category?.name || '',
        competitionLevel: competitionLevel || pub.competitionLevel,
        rankings,
      })
    );
  }

  const [publications, categories] = await Promise.all([
    ResultPublicationModel.find({ published: true }).lean(),
    CategoryModel.find().lean(),
  ]);

  const categoryMap = new Map(categories.map((category) => [String(category._id), category.name]));

  const data = await Promise.all(
    publications.map(async (pub) => ({
      categoryId: String(pub.categoryId),
      categoryName: categoryMap.get(String(pub.categoryId)) || '',
      competitionLevel: pub.competitionLevel,
      rankings: await calculateCategoryRanking(String(pub.categoryId), pub.competitionLevel),
    }))
  );
  res.json(ok(data));
};

export const publicScores = publicRankings;

export const publicAnnouncements = async (_req: Request, res: Response) => {
  const announcements = await AnnouncementModel.find({ published: true }).sort({ createdAt: -1 });
  res.json(ok(announcements));
};

export const publicResults = publicRankings;

export const publicCategoryResults = async (req: Request, res: Response) => {
  const category = await CategoryModel.findById(req.params.id);
  if (!category) return res.json(ok([]));
  const publications = await ResultPublicationModel.find({ categoryId: category._id, published: true }).lean();
  const data = await Promise.all(publications.map(async (pub) => ({
    competitionLevel: pub.competitionLevel,
    rankings: await calculateCategoryRanking(String(category._id), pub.competitionLevel),
  })));
  res.json(ok({ category, results: data }));
};

export const publicSummary = async (_req: Request, res: Response) => {
  const [schools, projects, categories, donations] = await Promise.all([
    SchoolModel.countDocuments({ active: true }),
    ProjectModel.countDocuments(),
    CategoryModel.countDocuments({ active: true }),
    DonationModel.aggregate([
      { $match: { paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  res.json(
    ok({
      schools,
      projects,
      categories,
      donationsTotal: donations[0]?.total || 0,
    })
  );
};
