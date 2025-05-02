import express from 'express';
import {
    createTable,
    getTables,
    createRecords,
    getRecords,
    addRecord
} from '../controllers/record.controller';

const router = express.Router();

router.post('/tables', createTable);
router.get('/tables', getTables);

router.post('/records/:tableName', createRecords);
router.get('/records/:tableName', getRecords);
router.post('/records/:tableName/add', addRecord);

export default router;
