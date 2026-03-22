import express from 'express';
import { protect } from './middleware/auth';
import authRoutes from './resources/auth/routes';
import chatRoutes from './resources/chat/routes';
import symptomsRoutes from './resources/symptoms/routes';
import medicationsRoutes from './resources/medications/routes';
import appointmentsRoutes from './resources/appointments/routes';
import moodRoutes from './resources/mood/routes';
import historyRoutes, { allergyRoutes } from './resources/history/routes';

export const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);

apiRouter.use('/chat', protect, chatRoutes);
apiRouter.use('/symptoms', protect, symptomsRoutes);
apiRouter.use('/medications', protect, medicationsRoutes);
apiRouter.use('/appointments', protect, appointmentsRoutes);
apiRouter.use('/mood', protect, moodRoutes);
apiRouter.use('/history', protect, historyRoutes);
apiRouter.use('/allergies', protect, allergyRoutes);
