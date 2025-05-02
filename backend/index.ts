import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recordRoutes from './routes/record.routes';

dotenv.config();

const app = express();


app.get('/', (req, res) => {
    res.send('Hello World!');
})l

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json());
app.use('/api', recordRoutes);

export default (req: VercelRequest, res: VercelResponse) => {
    return app(req as any, res as any);
};
