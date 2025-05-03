import type { ChangeEvent } from 'react';

import axios from 'axios';
import * as XLSX from 'xlsx';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AddIcon from '@mui/icons-material/Add';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CreateIcon from '@mui/icons-material/Create';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { UserChartGenerator } from '../user-chart-generator';


const backendUrl = 'https://dynamic-table-backend.vercel.app';

// Custom components
const DashboardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ p: 3 }}>{children}</Box>
);

const Scrollbar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ maxHeight: '100%', overflow: 'auto' }}>{children}</Box>
);

const TableNoData: React.FC<{ searchQuery: string }> = ({ searchQuery }) => (
  <TableRow>
    <TableCell colSpan={100} align="center">
      No data found for query: {searchQuery}
    </TableCell>
  </TableRow>
);

const TableEmptyRows: React.FC<{ height: number; emptyRows: number }> = ({ height, emptyRows }) => (
  <>
    {emptyRows > 0 && (
      <TableRow style={{ height: height * emptyRows }}>
        <TableCell colSpan={100} />
      </TableRow>
    )}
  </>
);

interface UserTableToolbarProps {
  numSelected: number;
  filterName: string;
  onFilterName: (event: ChangeEvent<HTMLInputElement>) => void;
  tableName: string;
  onUpload: (file: File) => void;
}
const UserTableToolbar: React.FC<UserTableToolbarProps> = ({
  numSelected,
  filterName,
  onFilterName,
  tableName,
  onUpload,
}) => (
  <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
    <TextField
      value={filterName}
      onChange={onFilterName}
      placeholder={`Search ${tableName}...`}
      sx={{ flexGrow: 1, mr: 2 }}
    />
    {numSelected > 0 && (
      <Typography sx={{ mr: 2 }}>{numSelected} selected</Typography>
    )}
    <Button
      variant="outlined"
      component="label"
      startIcon={<UploadFileIcon />}
      onClick={() => document.getElementById(`upload-${tableName}`)?.click()}
    >
      Upload Excel
      <input
        id={`upload-${tableName}`}
        type="file"
        hidden
        accept=".xlsx,.xls"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </Button>
  </Box>
);

interface HeadLabel {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
}
interface UserTableHeadProps {
  order: 'asc' | 'desc';
  orderBy: string;
  rowCount: number;
  numSelected: number;
  onSort: (id: string) => void;
  onSelectAllRows: (checked: boolean) => void;
  headLabel: HeadLabel[];
}
const UserTableHead: React.FC<UserTableHeadProps> = ({
  order,
  orderBy,
  rowCount,
  numSelected,
  onSort,
  onSelectAllRows,
  headLabel,
}) => (
  <TableHead>
    <TableRow>
      <TableCell padding="checkbox">
        <Checkbox
          indeterminate={numSelected > 0 && numSelected < rowCount}
          checked={rowCount > 0 && numSelected === rowCount}
          onChange={(e) => onSelectAllRows(e.target.checked)}
        />
      </TableCell>
      {headLabel.map((headCell) => (
        <TableCell
          key={headCell.id}
          align={headCell.align || 'left'}
          sortDirection={orderBy === headCell.id ? order : false}
        >
          <TableSortLabel
            active={orderBy === headCell.id}
            direction={orderBy === headCell.id ? order : 'asc'}
            onClick={() => onSort(headCell.id)}
          >
            {headCell.label}
          </TableSortLabel>
        </TableCell>
      ))}
    </TableRow>
  </TableHead>
);

// Utility functions
const applyFilter = ({
  inputData,
  comparator,
  filterName,
}: {
  inputData: Record<string, unknown>[];
  comparator: (a: Record<string, unknown>, b: Record<string, unknown>) => number;
  filterName: string;
}): Record<string, unknown>[] => {
  if (!filterName) return inputData;
  return inputData.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(filterName.toLowerCase())
    )
  );
};

const getComparator = (order: 'asc' | 'desc', orderBy: string) => (a: Record<string, unknown>, b: Record<string, unknown>): number => {
  const valueA = a[orderBy] ?? '';
  const valueB = b[orderBy] ?? '';
  return order === 'asc'
    ? String(valueA).localeCompare(String(valueB))
    : String(valueB).localeCompare(String(valueA));
};

const emptyRows = (page: number, rowsPerPage: number, dataLength: number): number =>
  Math.max(0, (1 + page) * rowsPerPage - dataLength);

// Interfaces
interface TableData {
  name: string;
  records: Record<string, unknown>[];
  headers: string[];
}

interface AddRecordDialogProps {
  open: boolean;
  headers: string[];
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

// Table Hook
interface TableState {
  page: number;
  order: 'asc' | 'desc';
  orderBy: string;
  selected: string[];
  rowsPerPage: number;
  onSort: (id: string) => void;
  onSelectAllRows: (checked: boolean, newSelecteds: string[]) => void;
  onSelectRow: (inputValue: string) => void;
  onResetPage: () => void;
  onChangePage: (event: unknown, newPage: number) => void;
  onChangeRowsPerPage: (event: ChangeEvent<HTMLInputElement>) => void;
}
function useTable(defaultHeaders: string[]): TableState {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState(defaultHeaders[0] || '');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback((id: string) => {
    const isAsc = orderBy === id && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(id);
  }, [order, orderBy]);

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    setSelected(checked ? newSelecteds : []);
  }, []);

  const onSelectRow = useCallback((inputValue: string) => {
    setSelected((prev) =>
      prev.includes(inputValue)
        ? prev.filter((value) => value !== inputValue)
        : [...prev, inputValue]
    );
  }, []);

  const onResetPage = useCallback(() => setPage(0), []);
  const onChangePage = useCallback((event: unknown, newPage: number) => setPage(newPage), []);
  const onChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  return {
    page,
    order,
    onSort,
    orderBy,
    selected,
    rowsPerPage,
    onSelectRow,
    onResetPage,
    onChangePage,
    onSelectAllRows,
    onChangeRowsPerPage,
  };
}

// Add Record Dialog
const AddRecordDialog: React.FC<AddRecordDialogProps> = ({ open, headers, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleChange =
    (field: string) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
    setFormData({});
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Record</DialogTitle>
      <DialogContent>
        {headers.map((header) => (
          <TextField
            key={header}
            margin="dense"
            label={header}
            fullWidth
            variant="outlined"
            value={(formData[header] as string) || ''}
            onChange={handleChange(header)}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} color="primary">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Table Row
interface UserTableRowProps {
  row: Record<string, unknown>;
  selected: boolean;
  onSelectRow: () => void;
  columns: string[];
  rowId: string;
}
const UserTableRow: React.FC<UserTableRowProps> = ({ row, selected, onSelectRow, columns, rowId }) => (
  <TableRow hover selected={selected}>
    <TableCell padding="checkbox">
      <Checkbox checked={selected} onChange={onSelectRow} />
    </TableCell>
    {columns.map((col) => (
      <TableCell key={col}>{String(row[col] ?? '')}</TableCell>
    ))}
  </TableRow>
);

// Data Table
interface DataTableProps {
  tableName: string;
  data: Record<string, unknown>[];
  headers: string[];
  onUpload: (file: File) => void;
  onAddRecord: (data: Record<string, unknown>) => void;
}
const DataTable: React.FC<DataTableProps> = ({
  tableName,
  data,
  headers,
  onUpload,
  onAddRecord,
}) => {
  const table = useTable(headers);
  const [filterName, setFilterName] = useState('');
  const [addRecordOpen, setAddRecordOpen] = useState(false);

  const dataFiltered = applyFilter({
    inputData: data,
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  return (
    <Card sx={{ mb: 4 }}>
      <UserTableToolbar
        numSelected={table.selected.length}
        filterName={filterName}
        onFilterName={(event) => {
          setFilterName(event.target.value);
          table.onResetPage();
        }}
        tableName={tableName}
        onUpload={onUpload}
      />

      <Box sx={{ p: 2, display: 'flex' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddRecordOpen(true)}
        >
          Add Record
        </Button>
      </Box>

      <Scrollbar>
        <TableContainer sx={{ overflow: 'unset' }}>
          <Table sx={{ minWidth: 800 }}>
            <UserTableHead
              order={table.order}
              orderBy={table.orderBy}
              rowCount={data.length}
              numSelected={table.selected.length}
              onSort={table.onSort}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  data.map((row, idx) => (row.id as string) || (row.name as string) || `row-${idx}`)
                )
              }
              headLabel={headers.map((key) => ({ id: key, label: key }))}
            />
            <TableBody>
              {dataFiltered
                .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
                .filter((row) => row && Object.keys(row).length > 1)
                .map((row, idx) => {
                  const rowId = (row.id as string) || (row.name as string) || `row-${idx}`;
                  return (
                    <UserTableRow
                      key={rowId}
                      row={row}
                      selected={table.selected.includes(rowId)}
                      onSelectRow={() => table.onSelectRow(rowId)}
                      columns={headers}
                      rowId={rowId}
                    />
                  );
                })}
              <TableEmptyRows
                height={68}
                emptyRows={emptyRows(table.page, table.rowsPerPage, data.length)}
              />
              {notFound && <TableNoData searchQuery={filterName} />}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      <TablePagination
        component="div"
        page={table.page}
        count={data.length}
        rowsPerPage={table.rowsPerPage}
        onPageChange={table.onChangePage}
        rowsPerPageOptions={[5, 10, 25]}
        onRowsPerPageChange={table.onChangeRowsPerPage}
      />

      <AddRecordDialog
        open={addRecordOpen}
        headers={headers}
        onClose={() => setAddRecordOpen(false)}
        onSubmit={(record) => {
          onAddRecord(record);
        }}
      />

      <UserChartGenerator data={data} fields={headers} />
    </Card>
  );
};

// Main Component
export function UserView() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [createTableOpen, setCreateTableOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get<{ name: string }[]>(`${backendUrl}/api/tables`);
      const tablesData = await Promise.all(
        response.data.map(async (table) => {
          try {
            const recordsResponse = await axios.get<Record<string, unknown>[]>(
              `${backendUrl}/api/records/${table.name}`
            );
            const records = recordsResponse.data;
            const headers =
              records.length > 0
                ? Object.keys(records[1]).filter((key) => key !== 'id' && key !== '_id')
                : [];

            return { name: table.name, records, headers };
          } catch (recordError) {
            console.error(`Error fetching records for ${table.name}:`, recordError);
            return { name: table.name, records: [], headers: [] };
          }
        })
      );
      setTables(tablesData);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleAddRecord = async (tableName: string, record: Record<string, unknown>) => {
    try {
      await axios.post(`${backendUrl}/api/records/${tableName}/add`, record);
      await fetchTables();
    } catch (error) {
      console.error('Error adding record:', error);
    }
  };

  const handleCreateTable = async () => {
    if (!newTableName) {
      console.log('Table name is required');
      return;
    }
    if (tables.some((t) => t.name === newTableName)) {
      console.log('Table name already exists');
      return;
    }
    try {
      await axios.post(`${backendUrl}/api/tables`, { name: newTableName });
      setNewTableName('');
      setCreateTableOpen(false);
      await fetchTables();
    } catch (error) {
      console.error('Error creating table:', error);
      console.log('Error creating table');
    }
  };

  const handleUpload = async (tableName: string, file: File) => {
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      if (!data.length) {
        console.log('No data found in the Excel file');
        return;
      }

      const columns = Object.keys(data[0]);
      const table = tables.find((t) => t.name === tableName);

      if (!table) {
        await axios.post(`${backendUrl}/api/tables`, { name: tableName });
      } else if (table.headers.length > 0) {
        if (!columns.every((col) => table.headers.includes(col))) {
          console.log('Uploaded data headers do not match table structure');
          return;
        }
      }

      await axios.post(`${backendUrl}/api/records/${tableName}`, data);
      await fetchTables();
    } catch (error) {
      console.error('Error uploading file:', error);
      console.log('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardContent>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h4">User Tables</Typography>
        <Button
          variant="contained"
          startIcon={<CreateIcon />}
          onClick={() => setCreateTableOpen(true)}
        >
          Create Table
        </Button>
      </Box>

      {uploading && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Uploading...</Typography>
        </Box>
      )}

      {tables.map((table) => (
        <DataTable
          key={table.name}
          tableName={table.name}
          data={table.records}
          headers={table.headers}
          onUpload={(file) => handleUpload(table.name, file)}
          onAddRecord={(record) => handleAddRecord(table.name, record)}
        />
      ))}

      <Dialog open={createTableOpen} onClose={() => setCreateTableOpen(false)}>
        <DialogTitle>Create New Table</DialogTitle>
        <DialogContent>
          <TextField
            label="Table Name"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            fullWidth
            margin="dense"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTableOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTable} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}