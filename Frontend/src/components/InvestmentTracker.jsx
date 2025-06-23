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
  Badge,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney,
  TrendingUp,
  Notifications,
  Description,
  Close,
  PictureAsPdf,  // Add this
  CloudDownload 
} from '@mui/icons-material';
import { Bar, Line, Pie as PieChart, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import axios from 'axios';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
  );

const investmentTypes = ['STOCK', 'BOND', 'REAL_ESTATE', 'CRYPTO', 'OTHER'];
const statusTypes = ['ACTIVE', 'SOLD', 'MATURED'];

const InvestmentTracker = () => {
  const theme = useTheme();
  const [investments, setInvestments] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [reports, setReports] = useState([]);
  const [overviewData, setOverviewData] = useState({
    total_investment: 0,
    total_profit: 0,
    total_loss: 0,
    net_balance: 0,
  });

  const calculateFinancialData = () => {
    const totalInvestment = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const activeInvestments = investments.filter(inv => inv.status === 'ACTIVE');
    
    // Simple mock profit/loss - replace with real calculations
    const profit = totalInvestment * 0.12; // 12% gain
    const loss = totalInvestment * 0.03; // 3% loss
    
    return {
      netBalance: totalInvestment + profit - loss,
      profit,
      loss,
      investmentTypes: activeInvestments.reduce((acc, inv) => {
        acc[inv.type] = (acc[inv.type] || 0) + parseFloat(inv.amount || 0);
        return acc;
      }, {})
    };
  };
  
  const financialData = calculateFinancialData();

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    investment_type: '',
    description: '',
    status: 'ACTIVE',
  });

  // Fetch all data
  useEffect(() => {
    fetchInvestments();
    fetchOverview();
    fetchNotifications();
    fetchReports();
  }, []);

  // API Calls


  const fetchOverview = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/investments/overview/');
      setOverviewData(response.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const [notifications, setNotifications] = useState([]);

// Function to add new notification
const addNotification = (message) => {
  const newNotification = {
    id: Date.now(),
    message,
    timestamp: new Date().toISOString(),
    isRead: false
  };
  setNotifications(prev => [newNotification, ...prev]);
};

// Function to mark as read
const markAsRead = (id) => {
  setNotifications(prev => 
    prev.map(n => n.id === id ? {...n, isRead: true} : n)
  );
};

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/reports/');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  // Dialog handlers
  const handleOpen = () => {
    setOpen(true);
    setEditingInvestment(null);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      amount: '',
      investment_type: '',
      description: '',
      status: 'ACTIVE',
    });
  };

  // Form handling
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        type: formData.investment_type,
        status: formData.status,
        description: formData.description,
        date_invested: new Date().toISOString()
      };
  
      if (editingInvestment) {
        await axios.put(
          `http://localhost:8000/api/investments/${editingInvestment.id}/`,
          payload
        );
        addNotification(`Updated investment: ${formData.type} ($${formData.amount})`);

      } else {
        await axios.post(
          'http://localhost:8000/api/investments/',
          payload
        );
        addNotification(`New investment: ${formData.type} ($${formData.amount})`);
      }
      
      fetchInvestments();
      handleClose();
    } catch (error) {
      console.error('Error saving investment:', error);
      alert(`Failed to save: ${error.response?.data?.detail || 'Unknown error'}`);
    }
  };
  
  // Update fetchInvestments to handle proper data mapping
  const fetchInvestments = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/investments/');
      const adapted = response.data.map((item) => ({
        id: item.id,
        amount: item.amount,
        type: item.type,
        status: item.status,
        description: item.description,
        date_invested: item.date_invested
      }));
      setInvestments(adapted);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching investments:', error);
      setLoading(false);
    }
  };

  // Delete investment
  const handleDelete = async (id) => {
    if (window.confirm('Delete this investment?')) {
      await axios.delete(`http://localhost:8000/api/investments/${id}/`);
      fetchInvestments();
    }
  };

  // Mark notification as read
  const markNotificationRead = async (id) => {
    await axios.patch(`http://localhost:8000/api/notifications/${id}/`, { is_read: true });
    fetchNotifications();
  };
  const generateFinancialReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Investment Portfolio Report', 14, 20);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    // Investments
    doc.setFontSize(14);
    doc.text('Investments', 14, 40);
    let y = 50;
    investments.forEach(inv => {
      doc.text(
        `${inv.type}: $${inv.amount} (${inv.status})`, 
        16, 
        y
      );
      y += 10;
    });
    
    // Financial Summary
    doc.text('Financial Summary', 14, y + 10);
    doc.text(`Net Balance: $${financialData.netBalance.toFixed(2)}`, 16, y + 20);
    doc.text(`Profit/Loss: +$${financialData.profit.toFixed(2)}/-$${financialData.loss.toFixed(2)}`, 16, y + 30);
    
    doc.save('portfolio-report.pdf');
  };
  
  const generateQuickSnapshot = () => {
    const doc = new jsPDF();
    doc.text('Portfolio Snapshot', 10, 10);
    doc.text(`Net Balance: $${financialData.netBalance.toFixed(2)}`, 10, 20);
    doc.save('portfolio-snapshot.pdf');
  };

  // Download report
  const downloadReport = (url, filename) => {
    saveAs(url, filename);
  };

  // Chart Data
  const profitLossData = {
    labels: ['Profit', 'Loss'],
    datasets: [{
      data: [overviewData.total_profit, overviewData.total_loss],
      backgroundColor: [theme.palette.success.main, theme.palette.error.main],
    }]
  };

  const performanceTrend = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Portfolio Value',
      data: [10000, 12000, 11500, 13500, 13000, 14000],
      borderColor: theme.palette.primary.main,
      tension: 0.4,
    }]
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              <TrendingUp sx={{ mr: 1, color: theme.palette.primary.main }} />
              Investment Tracker
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
              New Investment
            </Button>
          </Box>
        </Grid>

        {/* Overview Cards */}
        <Grid item xs={12} md={3}>
        <Card>
            <CardContent>
            <Typography variant="h6">Total Invested</Typography>
            <Typography variant="h3" sx={{ color: theme.palette.success.main }}>
                ${overviewData.total_investment.toFixed(2)}
            </Typography>
            </CardContent>
        </Card>
        </Grid>

        <Grid item xs={12} md={4}>
            <Card>
            <CardContent>
                <Typography variant="h6">Net Balance</Typography>
                <Typography variant="h3" sx={{ color: theme.palette.success.main }}>
                ${financialData.netBalance.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', mt: 1 }}>
                <Chip label={`+$${financialData.profit.toFixed(2)}`} color="success" size="small"/>
                <Chip label={`-$${financialData.loss.toFixed(2)}`} color="error" size="small" sx={{ ml: 1 }}/>
                </Box>
            </CardContent>
            </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Performance</Typography>
            <Bar
                data={{
                labels: ['Total', 'Profit', 'Loss'],
                datasets: [{
                    label: 'Amount ($)',
                    data: [financialData.netBalance, financialData.profit, financialData.loss],
                    backgroundColor: [
                    theme.palette.primary.main,
                    theme.palette.success.main,
                    theme.palette.error.main
                    ]
                }]
                }}
            />
            </Paper>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12}>
            <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Investment Distribution</Typography>
            <Box sx={{ height: '300px' }}>
                <PieChart
                data={{
                    labels: Object.keys(financialData.investmentTypes),
                    datasets: [{
                    data: Object.values(financialData.investmentTypes),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0'
                    ]
                    }]
                }}
                />
            </Box>
            </Paper>
        </Grid>

        <Grid item xs={12}>
        <Paper sx={{
            p: 2,
            height: '400px', // Fixed height
            width: '100%',
            position: 'relative'
            }}>
            <Typography variant="h6" gutterBottom>Performance Trend</Typography>
            <Box sx={{
                position: 'absolute',
                top: 70,
                bottom: 20,
                left: 20,
                right: 20
            }}>
                <Line
                data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                    label: 'Portfolio Value',
                    data: [10000, 11500, 12000, 11000, 12500, 13000],
                    borderColor: theme.palette.primary.main,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: `${theme.palette.primary.main}20`
                    }]
                }}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                    legend: {
                        position: 'top'
                    }
                    },
                    scales: {
                    y: {
                        beginAtZero: false
                    }
                    }
                }}
                />
            </Box>
            </Paper>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={4}>
        <Paper sx={{ 
            p: 2, 
            mt: 3,
            maxHeight: 300,
            overflow: 'auto'
            }}>
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mb: 2,
                position: 'sticky',
                top: 0,
                bgcolor: 'background.paper',
                zIndex: 1,
                py: 1
            }}>
                <Badge 
                badgeContent={notifications.filter(n => !n.isRead).length} 
                color="error"
                sx={{ mr: 1 }}
                >
                <Notifications fontSize="medium" />
                </Badge>
                <Typography variant="h6">Investment Alerts</Typography>
            </Box>

            {notifications.length === 0 ? (
                <Typography color="text.secondary" sx={{ p: 2 }}>
                No new notifications
                </Typography>
            ) : (
                notifications.map(notification => (
                <Box 
                    key={notification.id}
                    sx={{
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: notification.isRead ? 'background.default' : 'action.selected',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        bgcolor: 'action.hover'
                    }
                    }}
                    onClick={() => markAsRead(notification.id)}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>{notification.message}</Typography>
                    {!notification.isRead && (
                        <Box sx={{ 
                        width: 8, 
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main'
                        }} />
                    )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                    {new Date(notification.timestamp).toLocaleString()}
                    </Typography>
                </Box>
                ))
            )}
            </Paper>
        </Grid>

        {/* Reports */}
        <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                <Description sx={{ mr: 1 }} />
                Financial Reports
                </Typography>
                <Button 
                variant="contained" 
                startIcon={<PictureAsPdf />}
                onClick={generateFinancialReport}
                >
                Export Full Report
                </Button>
            </Box>

            <TableContainer>
                <Table>
                <TableHead>
                    <TableRow>
                    <TableCell>Report</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                    <TableCell>Portfolio Summary</TableCell>
                    <TableCell>{new Date().toLocaleDateString()}</TableCell>
                    <TableCell>
                        <IconButton onClick={() => generateQuickSnapshot()}>
                        <CloudDownload />
                        </IconButton>
                    </TableCell>
                    </TableRow>
                </TableBody>
                </Table>
            </TableContainer>
            </Paper>
        </Grid>

        {/* Investments List */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Investments</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {investments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell>
                        <Chip label={investment.investment_type} color="primary" />
                      </TableCell>
                      <TableCell>${parseFloat(investment.amount).toFixed(2)}</TableCell>
                      <TableCell>{new Date(investment.date_invested).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={investment.status} 
                          color={
                            investment.status === 'ACTIVE' ? 'success' :
                            investment.status === 'SOLD' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleDelete(investment.id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Investment Form Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingInvestment ? 'Edit Investment' : 'New Investment'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
          <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                margin="normal"
                inputProps={{ step: "0.01" }} // Allow decimals
                required
            />
            <TextField
              fullWidth
              select
              label="Type"
              name="investment_type"
              value={formData.investment_type}
              onChange={handleChange}
              margin="normal"
            >
              {investmentTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              margin="normal"
            >
              {statusTypes.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingInvestment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvestmentTracker;