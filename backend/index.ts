import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recordRoutes from './routes/record.routes';

dotenv.config();

const app = express();


app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.use(cors({ origin: 'https://dynamic-table-tt9s-d6qd1d1ov-diyoraps-projects.vercel.app', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json());
app.use('/api', recordRoutes);

export default (req: VercelRequest, res: VercelResponse) => {
    return app(req as any, res as any);
};
