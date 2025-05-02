import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recordRoutes from './routes/record.routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

app.use('/api', recordRoutes);

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
