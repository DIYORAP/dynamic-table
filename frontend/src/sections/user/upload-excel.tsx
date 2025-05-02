import * as XLSX from 'xlsx';

import { Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

type UploadExcelProps = {
    onUpload: (rows: any[]) => void;
};

export default function UploadExcel({ onUpload }: UploadExcelProps) {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        onUpload(data);
    };

    return (
        <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            sx={{ mb: 2, mr: 2 }}
        >
            Upload Excel
            <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileChange} />
        </Button>
    );
}
