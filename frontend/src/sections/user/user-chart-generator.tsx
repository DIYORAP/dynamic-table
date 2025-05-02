import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Grid,
    Card,
    CardContent,
    Typography,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Button as MuiButton,
    Stack,
    Divider,
    Box,
    Paper
} from '@mui/material';

import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line,
    ResponsiveContainer
} from 'recharts';

const chartTypes = [
    { type: 'pie', label: 'Pie Chart' },
    { type: 'bar', label: 'Bar Chart' },
    { type: 'line', label: 'Line Chart' },
    { type: 'donut', label: 'Donut Chart' }
];

export function UserChartGenerator({ data, fields }: { data: any[]; fields: string[] }) {
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [chartType, setChartType] = useState<string | null>(null);
    const [chartTitle, setChartTitle] = useState('');
    const [dataType, setDataType] = useState('count');
    const [selectedField, setSelectedField] = useState('');
    const [generatedChart, setGeneratedChart] = useState<React.ReactNode>(null);

    const processData = () => {
        if (!selectedField || !data.length) return [];

        const fieldValues = data.map(row => row[selectedField]);

        if (dataType === 'count') {
            const counts: Record<string, number> = {};
            fieldValues.forEach(value => {
                counts[value] = (counts[value] || 0) + 1;
            });

            return Object.entries(counts).map(([name, value]) => ({
                name,
                value
            }));
        }

        return [];
    };

    const handleCreateChart = () => {
        const processedData = processData();

        let chartComponent;
        switch (chartType) {
            case 'pie':
                chartComponent = (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={processedData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={80}
                                fill="#8884d8"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {processedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                );
                break;

            case 'bar':
                chartComponent = (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={processedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                );
                break;

            case 'line':
                chartComponent = (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={processedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                );
                break;

            default:
                chartComponent = null;
        }

        setGeneratedChart(chartComponent);
        setIsSettingsOpen(false);
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Box sx={{ mt: 3, mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                <MuiButton
                    variant="contained"
                    onClick={() => setIsSelectionOpen(true)}
                    sx={{ backgroundColor: 'black', color: 'white', '&:hover': { backgroundColor: '#333' } }}
                >
                    Generate Chart
                </MuiButton>
            </Box>

            {generatedChart && (
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {chartTitle || 'User Data Chart'}
                    </Typography>
                    <div style={{ width: '100%', height: 400 }}>
                        {generatedChart}
                    </div>
                </Paper>
            )}

            {/* Chart Type Selection Dialog */}
            <Dialog open={isSelectionOpen} onClose={() => setIsSelectionOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Select Chart Type</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        {chartTypes.map((chart) => (
                            <Grid item xs={6} sm={4} key={chart.type}>
                                <Card
                                    onClick={() => {
                                        setChartType(chart.type);
                                        setIsSelectionOpen(false);
                                        setIsSettingsOpen(true);
                                    }}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { boxShadow: 3 }
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {chart.label}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
            </Dialog>

            {/* Chart Settings Dialog */}
            <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Chart Settings</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ py: 2 }}>
                        <TextField
                            label="Chart Title"
                            value={chartTitle}
                            onChange={(e) => setChartTitle(e.target.value)}
                            fullWidth
                        />

                        <FormControl fullWidth>
                            <InputLabel>Select Data Type</InputLabel>
                            <Select
                                value={dataType}
                                label="Select Data Type"
                                onChange={(e) => setDataType(e.target.value)}
                            >
                                <MenuItem value="count">Count</MenuItem>
                                <MenuItem value="sum">Sum</MenuItem>
                                <MenuItem value="average">Average</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Select Field</InputLabel>
                            <Select
                                value={selectedField}
                                label="Select Field"
                                onChange={(e) => setSelectedField(e.target.value)}
                            >
                                {fields.map((field) => (
                                    <MenuItem key={field} value={field}>
                                        {field}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Divider />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <MuiButton variant="outlined" onClick={() => {
                                setIsSettingsOpen(false);
                                setIsSelectionOpen(true);
                            }}>
                                Back
                            </MuiButton>
                            <MuiButton variant="contained" onClick={handleCreateChart}>
                                Create
                            </MuiButton>
                        </Box>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Box>
    );
}