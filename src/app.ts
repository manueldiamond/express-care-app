import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth';
import caregiversRoutes from './routes/caregivers';
import patientsRoutes from './routes/patients';
import profileRoutes from './routes/profile';
import adminRoutes from './routes/admin';
import chatRoutes from './routes/chat';
import patientCaregiverMatchingRoutes from './routes/patientCaregiverMatching';
import { requireAdmin } from './middleware/requireRole';
import requireAuth from './middleware/requireAuth';
import notificationRoutes from './routes/notifications';
import bulkSetupRoutes from './routes/bulkSetup';
dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins in development
  credentials: false, // Disable credentials for '*' origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use('/api', authRoutes);
app.use('/api/caregivers', requireAuth, caregiversRoutes);

app.use('/api/patients', requireAuth, patientsRoutes);
app.use('/api/profile', requireAuth, profileRoutes);
app.use('/api/admin',requireAuth, requireAdmin, adminRoutes);
app.use('/api/notifications', requireAuth, notificationRoutes);
app.use('/api/chat', requireAuth, chatRoutes);
app.use('/api/matches', patientCaregiverMatchingRoutes);
app.use('/api/bulk-setup', bulkSetupRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Server up!' });
});

export default app; 