

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
export const createTable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ message: 'Table name is required' });
            return;
        }

        const existing = await prisma.record.findFirst({
            where: { tableName: name }
        });

        if (existing) {
            res.status(400).json({ message: 'Table already exists' });
            return;
        }

        const newRecord = await prisma.record.create({
            data: {
                tableName: name,
                data: {},
            }
        });

        res.status(201).json({
            message: 'Table created successfully',
            record: newRecord
        });
    } catch (error) {
        console.error('Error creating table:', error);
        res.status(500).json({ message: 'Error creating table' });
    }
};

export const createRecords = async (req: Request, res: Response) => {
    try {
        const { tableName } = req.params;
        const records = req.body;

        console.log('Received records:', records);

        if (!records || (typeof records !== 'object' && !Array.isArray(records))) {
            res.status(400).json({ message: 'Invalid data format' });
        }

        const table = await prisma.tableMetadata.findUnique({
            where: { name: tableName }
        });

        if (!table) {
            res.status(404).json({ message: `Table '${tableName}' does not exist.` });
        }

        const recordsArray = Array.isArray(records) ? records : [records];

        console.log('Records array:', recordsArray);

        const saved = await prisma.record.createMany({
            data: recordsArray.map((item: any) => ({
                tableName,
                data: item
            }))
        });

        res.status(201).json({
            message: 'Records saved successfully',
            count: saved.count,
            tableName
        });
    } catch (error) {
        console.error('Error saving records:', error);
        res.status(500).json({ message: 'Error saving records' });
    }
};

export const getTables = async (req: Request, res: Response) => {
    try {
        const tableNames = await prisma.record.findMany({
            distinct: ['tableName'],
            select: { tableName: true },
        });

        const tables = await Promise.all(
            tableNames.map(async ({ tableName }) => {
                const records = await prisma.record.findMany({
                    where: { tableName },
                });

                const headers = records.length > 0
                    ? Object.keys(records[0]).filter((key) => key !== 'id' && key !== 'tableName')
                    : [];

                return {
                    name: tableName,
                };
            })
        );

        res.status(200).json(tables);
    } catch (error) {
        console.error('Error fetching tables with data:', error);
        res.status(500).json({ message: 'Error fetching tables' });
    }
};

export const getRecords = async (req: Request, res: Response) => {
    try {
        const { tableName } = req.params;

        const records = await prisma.record.findMany({
            where: { tableName }
        });

        const formatted = records.map(record => {
            const recordData = typeof record.data === 'string'
                ? JSON.parse(record.data)
                : record.data;

            return {
                id: record.id,
                ...(recordData || {})
            };
        });

        res.status(200).json(formatted);
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ message: 'Error fetching records' });
    }
};
export const addRecord = async (req: Request, res: Response) => {
    try {
        const { tableName } = req.params;
        const record = req.body;

        const saved = await prisma.record.create({
            data: {
                tableName,
                data: record
            }
        });

        res.status(201).json({
            id: saved.id,
            ...(typeof saved.data === 'object' ? saved.data : {})
        });
    } catch (error) {
        console.error('Error adding record:', error);
        res.status(500).json({ message: 'Error adding record' });
    }
};