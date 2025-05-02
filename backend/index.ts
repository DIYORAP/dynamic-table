import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import recordRoutes from '../backend/routes/record.routes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json());
app.use('/api', recordRoutes);

export default function handler(req: VercelRequest, res: VercelResponse) {
    app(req as any, res as any);
}
