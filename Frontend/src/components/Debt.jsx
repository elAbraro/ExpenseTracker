import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Card,
  CardContent,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Slide,
  Fade,
  Zoom,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney,
  Payment,
  CalendarToday,
} from '@mui/icons-material';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Our debt "types" (for the dropdown)
const debtTypes = [
  'Student Loan',
  'Credit Card',
  'Personal Loan',
  'Car Loan',
  'Other',
];

const Debt = () => {
  const theme = useTheme();

  const [debts, setDebts] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingDebt, setEditingDebt] = useState(null);

  // The form for creating/editing a debt
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    totalAmount: '',
    remainingAmount: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: '',
    notes: '',
  });

  // For the chart distribution
  const debtDistribution = {
    labels: debtTypes,
    datasets: [
      {
        data: debtTypes.map((type) =>
          debts
            .filter((d) => d.type === type)
            .reduce((sum, d) => sum + parseFloat(d.remainingAmount || 0), 0)
        ),
        backgroundColor: [
          theme.palette.error.main,
          theme.palette.primary.main,
          theme.palette.warning.main,
          theme.palette.success.main,
          theme.palette.info.main,
        ],
      },
    ],
  };

  // For the payment trend chart
  const paymentTrend = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Total Debt',
        data: [25000, 24500, 24000, 23400, 22800, 22000],
        borderColor: theme.palette.primary.main,
        tension: 0.4,
        fill: true,
        backgroundColor: `${theme.palette.primary.main}20`,
      },
    ],
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  // Fetch all debts from Django
  const fetchDebts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/debts/');
      // Each item: {id, name, principal, interest_rate, term_months, remaining_balance, date_added, debt_type, due_date}
      // Let's adapt them for the UI:
      const adapted = response.data.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.debt_type || 'Other',
        totalAmount: String(item.principal),
        remainingAmount: String(item.remaining_balance),
        interestRate: String(item.interest_rate),
        minimumPayment: (item.principal / item.term_months).toFixed(2),
        dueDate: item.due_date || '',
        dateAdded: item.date_added || '',
        notes: '',
      }));
      setDebts(adapted);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching debts:', error);
      setLoading(false);
    }
  };

  // Open the "Add Debt" dialog
  const handleOpen = () => {
    setOpen(true);
    setEditingDebt(null); // ensure we start fresh
  };

  // Close the dialog
  const handleClose = () => {
    setOpen(false);
    setEditingDebt(null);
    setFormData({
      name: '',
      type: '',
      totalAmount: '',
      remainingAmount: '',
      interestRate: '',
      minimumPayment: '',
      dueDate: '',
      notes: '',
    });
  };

  // For controlled inputs
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Submit form: create or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDebt) {
        // Update existing debt
        await axios.put(`http://localhost:8000/api/debts/${editingDebt.id}/`, {
          name: formData.name,
          principal: parseFloat(formData.totalAmount || '0'),
          interest_rate: parseFloat(formData.interestRate || '0'),
          term_months: 12,
          remaining_balance: parseFloat(formData.remainingAmount || '0'),
          debt_type: formData.type,
          due_date: formData.dueDate || null,
        });
      } else {
        // Create new debt
        await axios.post('http://localhost:8000/api/debts/', {
          name: formData.name,
          principal: parseFloat(formData.totalAmount || '0'),
          interest_rate: parseFloat(formData.interestRate || '0'),
          term_months: 12,
          remaining_balance: parseFloat(formData.remainingAmount || '0'),
          debt_type: formData.type,
          due_date: formData.dueDate || null,
        });
      }
      // Refresh the list
      fetchDebts();
      handleClose();
    } catch (error) {
      console.error('Error saving debt:', error);
    }
  };

  // Edit an existing debt
  const handleEdit = (debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      type: debt.type,
      totalAmount: debt.totalAmount,
      remainingAmount: debt.remainingAmount,
      interestRate: debt.interestRate,
      minimumPayment: debt.minimumPayment,
      dueDate: debt.dueDate,
      notes: debt.notes || '',
    });
    setOpen(true);
  };

  // Delete a debt
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        await axios.delete(`http://localhost:8000/api/debts/${id}/`);
        fetchDebts();
      } catch (error) {
        console.error('Error deleting debt:', error);
      }
    }
  };

  // Calculate the progress percentage for each debt
  const calculateProgress = (debt) => {
    const total = parseFloat(debt.totalAmount) || 0;
    const remaining = parseFloat(debt.remainingAmount) || 0;
    if (total <= 0) return 0;
    const paid = total - remaining;
    return (paid / total) * 100;
  };

  // Overall totals
  const totalDebt = debts.reduce((sum, d) => sum + parseFloat(d.remainingAmount || '0'), 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + parseFloat(d.minimumPayment || '0'), 0);
  const totalPaid = debts.reduce((sum, d) => {
    const paid = parseFloat(d.totalAmount) - parseFloat(d.remainingAmount);
    return sum + (paid > 0 ? paid : 0);
  }, 0);
  const overallProgress = (totalPaid / (totalPaid + totalDebt)) * 100 || 0;

  // If still loading, show a spinner
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography>Loading Debt Management...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* HEADER + "Add Debt" */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Slide direction="down" in timeout={800}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'transform 0.3s ease-in-out',
                },
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <AttachMoney
                  sx={{
                    color: theme.palette.primary.main,
                    animation: 'bounce 2s infinite',
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'translateY(0)' },
                      '50%': { transform: 'translateY(-5px)' },
                    },
                  }}
                />
                Debt Management
              </Typography>
              <Zoom in timeout={1000}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpen}
                  sx={{
                    borderRadius: 2,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                      boxShadow: `0 8px 24px -4px ${theme.palette.primary.main}40`,
                    },
                  }}
                >
                  Add Debt
                </Button>
              </Zoom>
            </Box>
          </Slide>
        </Grid>

        {/* SUMMARY CARDS */}
        <Grid item xs={12} md={4}>
          <Slide direction="right" in timeout={1000}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                boxShadow: `0 8px 32px -4px ${theme.palette.primary.main}20`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: `0 12px 48px -8px ${theme.palette.primary.main}40`,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney
                    sx={{
                      color: theme.palette.primary.main,
                      mr: 1,
                      animation: 'spin 3s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                  <Typography variant="h6">Total Debt</Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    mb: 2,
                  }}
                >
                  ${totalDebt.toFixed(2)}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Debt Free Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={overallProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: `${theme.palette.primary.main}20`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.success.main,
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mt: 1,
                      animation: 'fadeIn 0.5s ease-in',
                      '@keyframes fadeIn': {
                        from: { opacity: 0 },
                        to: { opacity: 1 },
                      },
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Paid: ${totalPaid.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {overallProgress.toFixed(1)}% Complete
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>

        {/* MONTHLY PAYMENT CARD */}
        <Grid item xs={12} md={4}>
          <Slide direction="up" in timeout={1200}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                boxShadow: `0 8px 32px -4px ${theme.palette.warning.main}20`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: `0 12px 48px -8px ${theme.palette.warning.main}40`,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Payment
                    sx={{
                      color: theme.palette.warning.main,
                      mr: 1,
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.2)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    }}
                  />
                  <Typography variant="h6">Monthly Payments</Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: theme.palette.warning.main,
                    fontWeight: 'bold',
                    mb: 2,
                  }}
                >
                  ${totalMinPayment.toFixed(2)}
                </Typography>
                <Chip
                  icon={<CalendarToday />}
                  label="Due Monthly"
                  color="warning"
                  variant="outlined"
                  sx={{
                    animation: 'slideIn 0.5s ease-out',
                    '@keyframes slideIn': {
                      from: { transform: 'translateX(-20px)', opacity: 0 },
                      to: { transform: 'translateX(0)', opacity: 1 },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Slide>
        </Grid>

        {/* DISTRIBUTION CHART */}
        <Grid item xs={12} md={4}>
          <Slide direction="left" in timeout={1400}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                boxShadow: `0 8px 32px -4px ${theme.palette.info.main}20`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 48px -8px ${theme.palette.info.main}40`,
                },
              }}
            >
              <Typography variant="h6" gutterBottom>
                Debt Distribution
              </Typography>
              <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                <Doughnut
                  data={debtDistribution}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Slide>
        </Grid>

        {/* PAYMENT TREND */}
        <Grid item xs={12}>
          <Slide direction="up" in timeout={1600}>
            <Paper
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                boxShadow: `0 8px 32px -4px ${theme.palette.success.main}20`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 48px -8px ${theme.palette.success.main}40`,
                },
              }}
            >
              <Typography variant="h6" gutterBottom>
                Payment Progress
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={paymentTrend}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: `${theme.palette.primary.main}10`,
                        },
                      },
                      x: {
                        grid: {
                          color: `${theme.palette.primary.main}10`,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Slide>
        </Grid>

        {/* DEBTS LIST TABLE */}
        <Grid item xs={12}>
          <Fade in timeout={1800}>
            <TableContainer
              component={Paper}
              sx={{
                mt: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                boxShadow: `0 8px 32px -4px ${theme.palette.primary.main}20`,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Added Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Remaining</TableCell>
                    <TableCell>Interest Rate</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {debts.map((debt, index) => {
                    const progress = calculateProgress(debt);
                    return (
                      <TableRow
                        key={debt.id}
                        sx={{
                          animation: `slideUp 0.5s ease-out ${index * 0.1}s`,
                          '@keyframes slideUp': {
                            from: { opacity: 0, transform: 'translateY(20px)' },
                            to: { opacity: 1, transform: 'translateY(0)' },
                          },
                          '&:hover': {
                            backgroundColor: `${theme.palette.primary.main}10`,
                          },
                        }}
                      >
                        <TableCell>{debt.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={debt.type}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{debt.dateAdded}</TableCell>
                        <TableCell>{debt.dueDate}</TableCell>
                        <TableCell>${parseFloat(debt.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>${parseFloat(debt.remainingAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>{debt.interestRate}%</TableCell>
                        <TableCell sx={{ width: '18%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{
                                flexGrow: 1,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: `${theme.palette.success.main}20`,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: theme.palette.success.main,
                                  borderRadius: 4,
                                },
                              }}
                            />
                            <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                              {progress.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              onClick={() => handleEdit(debt)}
                              sx={{
                                color: theme.palette.primary.main,
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  color: theme.palette.primary.dark,
                                },
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(debt.id)}
                              sx={{
                                color: theme.palette.error.main,
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  color: theme.palette.error.dark,
                                },
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Fade>
        </Grid>
      </Grid>

      {/* Add/Edit Debt Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up', timeout: 500 }}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
            boxShadow: `0 8px 32px -4px ${theme.palette.primary.main}40`,
          },
        }}
      >
        <DialogTitle>{editingDebt ? 'Edit Debt' : 'Add New Debt'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Debt Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              sx={{ mb: 2 }}
            >
              {debtTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Total Amount"
              name="totalAmount"
              type="number"
              value={formData.totalAmount}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Remaining Amount"
              name="remainingAmount"
              type="number"
              value={formData.remainingAmount}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Interest Rate (%)"
              name="interestRate"
              type="number"
              value={formData.interestRate}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Minimum Payment"
              name="minimumPayment"
              type="number"
              value={formData.minimumPayment}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              },
            }}
          >
            {editingDebt ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Debt;