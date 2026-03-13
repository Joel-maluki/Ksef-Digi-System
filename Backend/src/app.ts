import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import schoolRoutes from './routes/school.routes';
import categoryRoutes from './routes/category.routes';
import projectRoutes from './routes/project.routes';
import judgeRoutes from './routes/judge.routes';
import judgeCategoryAssignmentRoutes from './routes/judgeCategoryAssignment.routes';
import projectJudgeAssignmentRoutes from './routes/projectJudgeAssignment.routes';
import scoreRoutes from './routes/score.routes';
import publicationRoutes from './routes/publication.routes';
import rankingRoutes from './routes/ranking.routes';
import reportRoutes from './routes/report.routes';
import settingsRoutes from './routes/settings.routes';
import announcementRoutes from './routes/announcement.routes';
import donationRoutes from './routes/donation.routes';
import locationRoutes from './routes/location.routes';
import publicRoutes from './routes/public.routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
  })
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ success: true, message: 'KSEF backend running' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/judges', judgeRoutes);
app.use('/api/judge-category-assignments', judgeCategoryAssignmentRoutes);
app.use('/api/project-judge-assignments', projectJudgeAssignmentRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/public', publicRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
