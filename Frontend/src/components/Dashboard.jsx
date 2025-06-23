import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, Navigate } from 'react-router-dom';
import BillList from './BillList';
import Reminders from './Reminders';
import { BillProvider } from '../context/BillContext';
import InvestmentTracker from './InvestmentTracker';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  PiggyBank,
  CreditCard,
  Calculator,
  Bell,
  User,
  Menu,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Percent,
  Moon,
  Sun,
  LogOut,
  MessageSquare,
  Bot,
  DollarSign,
  Receipt,
  PieChart,
  BarChart2,
  Target,
  BellOff,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import Debt from './Debt';  // Assuming these components exist
import Advisor from './aiAdvisor';
import Messages from './Messages';
import GuidedTour from './GuidedTour';
import { getBills, getReminders } from '../api'; // Using the API defined in api.js

// Sample static data for charts and tables remain unchanged
const data = {
  monthly: [
    { name: 'Jan', income: 4000, expenses: 2400, savings: 1600 },
    { name: 'Feb', income: 3000, expenses: 1398, savings: 1602 },
    { name: 'Mar', income: 2000, expenses: 1800, savings: 200 },
    { name: 'Apr', income: 2780, expenses: 1908, savings: 872 },
    { name: 'May', income: 1890, expenses: 1800, savings: 90 },
    { name: 'Jun', income: 2390, expenses: 1800, savings: 590 },
  ],
  futurePredictions: [
    { month: 'Jul', predicted_income: 4200, predicted_expenses: 2500 },
    { month: 'Aug', predicted_income: 4400, predicted_expenses: 2600 },
    { month: 'Sep', predicted_income: 4600, predicted_expenses: 2700 },
    { month: 'Oct', predicted_income: 4800, predicted_expenses: 2800 },
  ],
  // The static upcomingBills array has been removed from here.
  savingsGoals: [
    { name: 'Car', current: 15000, target: 30000, eta: 'Dec 2024' },
    { name: 'Tuition', current: 20000, target: 40000, eta: 'Aug 2024' },
  ],
  transactions: [
    { id: 1, type: 'expense', category: 'Grocery', amount: -85.50, date: '2024-03-10', description: 'Grocery Shopping' },
    { id: 2, type: 'income', category: 'Salary', amount: 450.00, date: '2024-03-09', description: 'Part-time Salary' },
    { id: 3, type: 'expense', category: 'Transport', amount: -60.00, date: '2024-03-07', description: 'Bus Pass' },
    { id: 4, type: 'expense', category: 'Rent', amount: -400.00, date: '2024-03-01', description: 'Monthly Rent' },
    { id: 5, type: 'income', category: 'Scholarship', amount: 1000.00, date: '2024-02-25', description: 'Scholarship Award' },
    { id: 6, type: 'expense', category: 'Books', amount: -120.00, date: '2024-02-20', description: 'Course Books' },
    { id: 7, type: 'income', category: 'Freelance', amount: 300.00, date: '2024-02-18', description: 'Freelance Web Dev' },
  ],
};

const summaryCards = [
  { title: 'Total Balance', amount: '$24,500', icon: Wallet, trend: '+14%', positive: true },
  { title: 'Total Expenses', amount: '$3,260', icon: CreditCard, trend: '-8%', positive: false },
  { title: 'Total Savings', amount: '$12,750', icon: PiggyBank, trend: '+21%', positive: true },
  { title: 'Investments', amount: '$8,490', icon: TrendingUp, trend: '+4%', positive: true },
];

function calculateTax(income) {
  let tax = 0;
  const brackets = [
    { limit: 9950, rate: 0.10 },
    { limit: 40525, rate: 0.12 },
    { limit: 86375, rate: 0.22 },
  ];
  for (let i = 0; i < brackets.length; i++) {
    const { limit, rate } = brackets[i];
    const prevLimit = i === 0 ? 0 : brackets[i - 1].limit;
    if (income > limit) {
      tax += (limit - prevLimit) * rate;
    } else {
      tax += (income - prevLimit) * rate;
      break;
    }
  }
  const lastBracket = brackets[brackets.length - 1];
  if (income > lastBracket.limit) {
    tax += (income - lastBracket.limit) * 0.24;
  }
  return tax;
}

function DashboardLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [debts, setDebts] = useState([]);
  // upcomingItems now holds items fetched from the bills and reminders API only.
  const [upcomingItems, setUpcomingItems] = useState([]);
  const navigate = useNavigate();

  const [showWelcome, setShowWelcome] = useState(true);
  const [profileComplete, setProfileComplete] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return !!savedProfile;
  });
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile
      ? JSON.parse(savedProfile)
      : {
          name: '',
          age: '',
          college: '',
          year: '',
          course: '',
          expectedIncome: '',
        };
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('All');
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxIncome, setTaxIncome] = useState('');
  const [taxResult, setTaxResult] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...userProfile });

  // Fetch debts from API
  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/debts/');
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
      } catch (error) {
        console.error('Error fetching debts:', error);
      }
    };
    fetchDebts();
  }, []);

  // Fetch upcoming bills and reminders from API and combine them.
  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const billsData = await getBills();
        const remindersData = await getReminders();

        // Transform each bill to include the fields: amount, type, date.
        const transformedBills = billsData.map((item) => ({
          date: item.due_date,      // Adjust if your API returns a different key (e.g. item.dueDate)
          type: 'Bill',
          amount: item.amount,      // Assumes your API returns an "amount" field.
        }));

        // Transform each reminder similarly.
        const transformedReminders = remindersData.map((item) => ({
          date: item.reminder_datetime,      // Adjust if your API uses a different field name.
          type: 'Reminder',
          amount: item.message,      // Adjust if necessary.
        }));

        // Combine both arrays.
        setUpcomingItems([...transformedBills, ...transformedReminders]);
      } catch (error) {
        console.error("Error fetching upcoming items:", error);
      }
    }
    fetchUpcoming();
  }, []);

  const totalDebtAmount = debts.reduce((sum, d) => sum + parseFloat(d.remainingAmount || '0'), 0);
  const totalPaidAmount = debts.reduce((sum, d) => {
    const paid = parseFloat(d.totalAmount) - parseFloat(d.remainingAmount);
    return sum + (paid > 0 ? paid : 0);
  }, 0);
  const debtProgress = (totalPaidAmount / (totalPaidAmount + totalDebtAmount)) * 100 || 0;

  // Export transactions to PDF
  const exportTransactionsToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('StudenTrack - Transaction Report', 14, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
    let y = 40;
    doc.setFillColor(220, 220, 220);
    doc.rect(14, y - 6, 182, 10, 'F');

    headers.forEach((header, i) => {
      doc.text(header, 16 + i * 35, y);
    });
    y += 10;

    const allTxns = data.transactions.filter((t) => {
      if (transactionFilter === 'All') return true;
      if (transactionFilter === 'Income') return t.type === 'income';
      if (transactionFilter === 'Expense') return t.type === 'expense';
      return true;
    });

    allTxns.forEach((txn) => {
      doc.text(txn.date, 16, y);
      doc.text(txn.description, 51, y);
      doc.text(txn.category, 86, y);
      doc.text(`$${Math.abs(txn.amount).toFixed(2)}`, 121, y);
      doc.text(txn.type.charAt(0).toUpperCase() + txn.type.slice(1), 156, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save('StudenTrack_Transaction_Report.pdf');
  };

  // Calculate credit score (mock)
  const calculateCreditScore = () => {
    let scoreBase = 600;
    if (parseFloat(userProfile.expectedIncome) > 3000) scoreBase += 50;
    const avgExpense =
      data.monthly.reduce((acc, val) => acc + val.expenses, 0) / data.monthly.length;
    if (avgExpense < 2000) scoreBase += 25;
    scoreBase += Math.floor(Math.random() * 50);
    if (scoreBase > 850) scoreBase = 850;
    return scoreBase;
  };

  // Save profile changes
  const saveProfileChanges = () => {
    setUserProfile({ ...tempProfile });
    localStorage.setItem('userProfile', JSON.stringify(tempProfile));
    setShowProfileModal(false);
  };

  // Welcome screen
  if (showWelcome) {
    return (
      <div className={`flex h-screen w-full flex-col items-center justify-center ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <motion.h1 className="mb-4 text-3xl font-bold" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          Welcome to StudenTrack!
        </motion.h1>
        <motion.button
          className="rounded bg-indigo-600 px-6 py-2 font-semibold text-white shadow hover:bg-indigo-700"
          onClick={() => setShowWelcome(false)}
          whileHover={{ scale: 1.05 }}
        >
          Continue
        </motion.button>
      </div>
    );
  }

  // Profile completion form
  if (!profileComplete) {
    return (
      <div className={`flex h-screen w-full items-center justify-center ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'}`}>
        <div className={`w-full max-w-md rounded-lg p-4 shadow-2xl ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white'}`}>
          <h2 className="mb-4 text-xl font-bold">Complete Your Profile</h2>
          <p className="mb-6 text-sm text-gray-500">
            Please provide some basic information to personalize your dashboard.
          </p>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setProfileComplete(true); }}>
            <div>
              <label className="mb-1 block text-sm font-semibold">Name</label>
              <input
                type="text"
                required
                className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300'}`}
                value={userProfile.name}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Age</label>
              <input
                type="number"
                required
                className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300'}`}
                value={userProfile.age}
                onChange={(e) => setUserProfile({ ...userProfile, age: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">College</label>
              <input
                type="text"
                required
                className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300'}`}
                value={userProfile.college}
                onChange={(e) => setUserProfile({ ...userProfile, college: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Year</label>
              <input
                type="text"
                required
                className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300'}`}
                value={userProfile.year}
                onChange={(e) => setUserProfile({ ...userProfile, year: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Course</label>
              <input
                type="text"
                required
                className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300'}`}
                value={userProfile.course}
                onChange={(e) => setUserProfile({ ...userProfile, course: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Expected Income</label>
              <input
                type="number"
                required
                className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300'}`}
                value={userProfile.expectedIncome}
                onChange={(e) => setUserProfile({ ...userProfile, expectedIncome: e.target.value })}
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                className={`w-full rounded py-2 font-semibold shadow ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
              >
                Complete Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''} flex min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
      <GuidedTour />
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed left-0 top-0 h-full w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <img src="/assets/StudenTrackLogo.jpg" alt="StudenTrack Logo" className="h-8 w-auto" style={{ borderRadius: '4px' }} />
              </div>
              <button onClick={() => setSidebarOpen(false)} className={`rounded-lg p-2 hover:bg-gray-100 ${darkMode && 'hover:bg-gray-700'}`}>
                <X className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
              </button>
            </div>
            <nav className="mt-8 px-4">
              <Link to="/dashboard">
                <motion.button whileHover={{ scale: 1.02 }} className={`mb-2 flex w-full items-center space-x-3 rounded-lg px-4 py-3 ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </motion.button>
              </Link>
              <Link to="/dashboard/expense-tracker">
                <motion.button whileHover={{ scale: 1.02 }} className={`mb-2 flex w-full items-center space-x-3 rounded-lg px-4 py-3 ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  <DollarSign className="h-5 w-5" />
                  <span>Expense Tracker</span>
                </motion.button>
              </Link>
              <Link to="/dashboard/income-tracker">
                <motion.button whileHover={{ scale: 1.02 }} className={`mb-2 flex w-full items-center space-x-3 rounded-lg px-4 py-3 ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  <Receipt className="h-5 w-5" />
                  <span>Income Tracker</span>
                </motion.button>
              </Link>
              <Link to="/dashboard/budgeting">
                <motion.button whileHover={{ scale: 1.02 }} className={`mb-2 flex w-full items-center space-x-3 rounded-lg px-4 py-3 ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  <PieChart className="h-5 w-5" />
                  <span>Budgeting</span>
                </motion.button>
              </Link>
              <Link to="/dashboard/investment">
                <motion.button whileHover={{ scale: 1.02 }} className={`mb-2 flex w-full items-center space-x-3 rounded-lg px-4 py-3 ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  <BarChart2 className="h-5 w-5" />
                  <span>Investment</span>
                </motion.button>
              </Link>
              <Link to="/dashboard/debt">
                <motion.button whileHover={{ scale: 1.02 }} className={`mb-2 flex w-full items-center space-x-3 rounded-lg px-4 py-3 ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  <CreditCard className="h-5 w-5" />
                  <span>Debt</span>
                </motion.button>
              </Link>
              <Link to="/dashboard/savings-goals">
                <motion.button whileHover={{ scale: 1.02 }} className={`mb-2 flex w-full items-center space-x-3 rounded-lg px-4 py-3 ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  <Target className="h-5 w-5" />
                  <span>Savings and Goals</span>
                </motion.button>
              </Link>
              <Link to="/dashboard/bills-reminders">
                <motion.button whileHover={{ scale: 1.02 }} className={`mb-2 flex w-full items-center space-x-3 rounded-lg px-4 py-3 ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  <BellOff className="h-5 w-5" />
                  <span>Bills and Reminders</span>
                </motion.button>
              </Link>
              <motion.button whileHover={{ scale: 1.02 }} onClick={onLogout} className={`mt-4 flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-red-600 hover:bg-red-50 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </motion.button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : ''}`}>
        <header className={`flex items-center justify-between border-b px-6 py-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center space-x-2">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className={`rounded-lg p-2 hover:bg-gray-100 ${darkMode && 'hover:bg-gray-700'}`}>
                <Menu className={`h-6 w-6 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
              </button>
            )}
            <motion.button whileTap={{ rotate: 360 }} onClick={() => setDarkMode(!darkMode)} className="mr-2 rounded-full p-2 transition">
              {darkMode ? <Sun className="h-5 w-5 text-yellow-300" /> : <Moon className="h-5 w-5 text-gray-500" />}
            </motion.button>
            <button className={`flex items-center space-x-2 rounded-lg px-4 py-2 ${darkMode ? 'bg-indigo-700 text-white hover:bg-indigo-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`} onClick={() => setShowTaxModal(true)}>
              <Calculator className="h-5 w-5" />
              <span>Tax Calculator</span>
            </button>
            <button className={`flex items-center space-x-2 rounded-lg px-4 py-2 ${darkMode ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-green-50 text-green-600 hover:bg-green-100'}`} onClick={() => setShowCreditModal(true)}>
              <Percent className="h-5 w-5" />
              <span>Credit Score</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/dashboard/advisor">
              <button className={`rounded-full p-2 hover:bg-gray-100 ${darkMode && 'hover:bg-gray-700'}`}>
                <Bot className={`h-6 w-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              </button>
            </Link>
            <Link to="/dashboard/messages">
              <button className={`rounded-full p-2 hover:bg-gray-100 ${darkMode && 'hover:bg-gray-700'}`}>
                <MessageSquare className={`h-6 w-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              </button>
            </Link>
            <div className="relative">
              <button className={`relative rounded-full p-2 hover:bg-gray-100 ${darkMode && 'hover:bg-gray-700'}`} onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className={`h-6 w-6 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute right-0 mt-2 w-64 rounded-lg p-4 shadow-lg ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}`}
                  >
                    <h4 className="mb-2 text-sm font-semibold">Notifications</h4>
                    <div className="space-y-2 text-sm">
                      <p>⚠️ Internet Bill due in 5 days</p>
                      <p>⚠️ Budget exceeded by $200 this month</p>
                      <p>✅ Rent is paid for this month</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <ProfileMenu darkMode={darkMode} userProfile={userProfile} onOpenProfile={() => { setTempProfile({ ...userProfile }); setShowProfileModal(true); }} />
          </div>
        </header>
        <main className={`p-6 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <h2 className={`mb-4 text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Financial Overview</h2>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {summaryCards.map((card, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{card.title}</p>
                            <h3 className={`mt-1 text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{card.amount}</h3>
                          </div>
                          <div className={`rounded-full p-3 ${card.positive ? 'bg-green-100' : 'bg-red-100'}`}>
                            <card.icon className={`h-6 w-6 ${card.positive ? 'text-green-600' : 'text-red-600'}`} />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center">
                          {card.positive ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                          <span className={`ml-1 text-sm ${card.positive ? 'text-green-500' : 'text-red-500'}`}>{card.trend} from last month</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mt-8 rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className="mb-6 text-lg font-semibold">Income vs Expenses</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#555' : '#ccc'} />
                        <XAxis dataKey="name" stroke={darkMode ? '#aaa' : '#555'} />
                        <YAxis stroke={darkMode ? '#aaa' : '#555'} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', color: darkMode ? '#fff' : '#000' }} />
                        <Line type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={2} name="Income" />
                        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                        <Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} name="Net Savings" />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Updated Upcoming Bills Section:
                      Displays only Amount, Type and Date based solely on API data */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mt-8 rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className="mb-6 text-lg font-semibold">Bills and Reminders</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {upcomingItems.map((item, index) => (
                        <div key={index} className="rounded-lg border p-4">
                          <p className="text-sm">Amount: ${item.amount}</p>
                          <p className="text-sm">Type: {item.type}</p>
                          <p className="text-sm">Date: {item.date}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mt-8 rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className="mb-6 text-lg font-semibold">Savings Goals</h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {data.savingsGoals.map((goal, index) => (
                        <div key={index} className={`rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-6 ${darkMode ? 'bg-gray-700 bg-none' : ''}`}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{goal.name}</h4>
                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-600">{((goal.current / goal.target) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="mt-4">
                            <div className="mb-2 flex justify-between text-sm">
                              <span>${goal.current.toLocaleString()} saved</span>
                              <span>${goal.target.toLocaleString()} goal</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200">
                              <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${(goal.current / goal.target) * 100}%` }}></div>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-between text-sm">
                            <span>Remaining: ${(goal.target - goal.current).toLocaleString()}</span>
                            <span>ETA: {goal.eta}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <h3 className="mb-6 text-lg font-semibold">Budget Overview</h3>
                      <div className="relative pt-4">
                        <div className="flex justify-center">
                          <div className="relative">
                            <svg className="h-32 w-32">
                              <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                              <circle className="text-orange-500" strokeWidth="8" strokeLinecap="round" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" strokeDasharray="364.4" strokeDashoffset="62" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold">83%</span>
                              <span className="text-sm text-orange-500">CAUTION</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6">
                          <div className="mb-2 flex justify-between">
                            <span>Budget</span>
                            <span className="font-semibold">$3,000</span>
                          </div>
                          <div className="mb-2 flex justify-between">
                            <span>Spent</span>
                            <span className="font-semibold text-orange-500">$2,500</span>
                          </div>
                          <div className="mt-4 rounded-full bg-gray-200">
                            <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-orange-500 to-pink-500" style={{ width: '83%' }}></div>
                          </div>
                          <div className="mt-2 text-center text-sm text-purple-600">Remaining: $500</div>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <h3 className="mb-6 text-lg font-semibold">Debt Progress</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span>Total Debt</span>
                          <span className="font-semibold">${totalDebtAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-green-600">Paid Off</span>
                          <span className="font-semibold text-green-600">${totalPaidAmount.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${debtProgress}%` }}></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="rounded-lg bg-green-50 p-3">
                            <span className="text-sm text-green-600">${(totalDebtAmount - totalPaidAmount).toFixed(2)}</span>
                            <p className="text-xs text-green-500">Left to Pay</p>
                          </div>
                          <div className="rounded-lg bg-purple-50 p-3">
                            <span className="text-sm text-purple-600">{debtProgress.toFixed(0)}%</span>
                            <p className="text-xs text-purple-500">Debt Paid Off</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mt-8 rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Transaction History</h3>
                      <button className={`flex items-center space-x-2 rounded-lg px-4 py-2 ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} onClick={exportTransactionsToPDF}>
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                      </button>
                    </div>
                    <div className="mb-4 flex space-x-2">
                      {['All', 'Income', 'Expense'].map((filter) => (
                        <button key={filter} onClick={() => setTransactionFilter(filter)} className={`rounded-full px-4 py-1 transition ${transactionFilter === filter ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {filter}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-4">
                      {data.transactions
                        .filter((t) => {
                          if (transactionFilter === 'All') return true;
                          if (transactionFilter === 'Income') return t.type === 'income';
                          if (transactionFilter === 'Expense') return t.type === 'expense';
                          return true;
                        })
                        .map((transaction) => (
                          <div key={transaction.id} className={`flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50 ${darkMode ? 'hover:bg-gray-700 border-gray-600' : ''}`}>
                            <div className="flex items-center space-x-4">
                              <div className={`rounded-full p-2 ${transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {transaction.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className="font-medium">{transaction.description}</p>
                                <p className="text-sm text-gray-500">{transaction.date} ({transaction.category})</p>
                              </div>
                            </div>
                            <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mt-8 rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className="mb-6 text-lg font-semibold">Future Predictions</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.futurePredictions}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#555' : '#ccc'} />
                        <XAxis dataKey="month" stroke={darkMode ? '#aaa' : '#555'} />
                        <YAxis stroke={darkMode ? '#aaa' : '#555'} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', color: darkMode ? '#fff' : '#000' }} />
                        <Bar dataKey="predicted_income" fill="#6366f1" name="Predicted Income" />
                        <Bar dataKey="predicted_expenses" fill="#ef4444" name="Predicted Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </>
              }
            />
            <Route path="expense-tracker" element={<div>Expense Tracker Component</div>} />
            <Route path="income-tracker" element={<div>Income Tracker Component</div>} />
            <Route path="budgeting" element={<div>Budgeting Component</div>} />
            <Route path="investment" element={<InvestmentTracker />} />
            <Route path="debt" element={<Debt />} />
            <Route path="savings-goals" element={<div>Savings and Goals Component</div>} />
            <Route path="advisor" element={<Advisor />} />
            <Route path="messages" element={<Messages />} />
            <Route path="bills-reminders" element={
              <BillProvider>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <h2 style={{ marginBottom: '0.5rem' }}>Bills</h2>
                    <BillList />
                  </div>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <h2 style={{ marginBottom: '0.5rem' }}>Reminders</h2>
                    <Reminders />
                  </div>
                </div>
              </BillProvider>
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      <AnimatePresence>
        {showTaxModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={`w-full max-w-md rounded-lg p-6 shadow-lg ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`} initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }}>
              <h2 className="mb-4 text-xl font-bold">Tax Calculator</h2>
              <label className="block text-sm font-semibold">Enter Monthly Income:</label>
              <input type="number" className={`mt-1 mb-4 w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300'}`} value={taxIncome} onChange={(e) => setTaxIncome(e.target.value)} />
              {taxResult !== null && (
                <div className="mb-4 text-sm">
                  Estimated Tax:
                  <span className="font-bold text-red-500"> ${taxResult.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button onClick={() => { if (taxIncome) { const incomeVal = parseFloat(taxIncome); const result = calculateTax(incomeVal); setTaxResult(result); } }} className={`rounded px-4 py-2 ${darkMode ? 'bg-indigo-700 text-white hover:bg-indigo-600' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}>
                  Calculate
                </button>
                <button onClick={() => { setShowTaxModal(false); setTaxIncome(''); setTaxResult(null); }} className="rounded bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreditModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={`w-full max-w-md rounded-lg p-6 shadow-lg ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`} initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }}>
              <h2 className="mb-4 text-xl font-bold">Credit Score</h2>
              <p className="mb-4 text-sm text-gray-500">(This is a mock score, inspired by Lloyds bank style.)</p>
              <div className="flex flex-col items-center">
                <ScoreDisplay darkMode={darkMode} calcFunction={calculateCreditScore} />
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setShowCreditModal(false)} className="rounded bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={`w-full max-w-md rounded-lg p-4 shadow-lg ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`} initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }}>
              <h2 className="mb-4 text-xl font-bold">My Profile</h2>
              <p className="mb-2 text-sm text-gray-500">View or edit your personal details below:</p>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveProfileChanges(); }}>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Name</label>
                  <input type="text" className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300'}`} value={tempProfile.name} onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Age</label>
                  <input type="number" className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300'}`} value={tempProfile.age} onChange={(e) => setTempProfile({ ...tempProfile, age: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">College</label>
                  <input type="text" className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300'}`} value={tempProfile.college} onChange={(e) => setTempProfile({ ...tempProfile, college: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Year</label>
                  <input type="text" className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300'}`} value={tempProfile.year} onChange={(e) => setTempProfile({ ...tempProfile, year: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Course</label>
                  <input type="text" className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300'}`} value={tempProfile.course} onChange={(e) => setTempProfile({ ...tempProfile, course: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Expected Income</label>
                  <input type="number" className={`w-full rounded border p-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300'}`} value={tempProfile.expectedIncome} onChange={(e) => setTempProfile({ ...tempProfile, expectedIncome: e.target.value })} />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button type="button" onClick={() => setShowProfileModal(false)} className="rounded bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400">
                    Cancel
                  </button>
                  <button type="submit" className={`rounded px-4 py-2 font-semibold shadow ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}>
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ProfileMenu = ({ darkMode, userProfile, onOpenProfile }) => {
  const [open, setOpen] = useState(false);
  const handleLogout = () => {
    window.location.reload();
  };

  return (
    <div className="relative">
      <button className={`rounded-full p-2 hover:bg-gray-100 ${darkMode && 'hover:bg-gray-700'}`} onClick={() => setOpen(!open)}>
        <User className={`h-6 w-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className={`absolute right-0 mt-2 w-48 overflow-hidden rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}`}>
            <button className="block w-full px-4 py-2 text-left hover:bg-indigo-100" onClick={() => { onOpenProfile(); setOpen(false); }}>
              My Profile
            </button>
            <button className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-100" onClick={handleLogout}>
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ScoreDisplay = ({ darkMode, calcFunction }) => {
  const [score, setScore] = useState(null);

  useEffect(() => {
    setScore(calcFunction());
  }, [calcFunction]);

  let color = 'text-green-500';
  if (score < 600) color = 'text-red-500';
  else if (score < 700) color = 'text-orange-500';
  else if (score < 750) color = 'text-yellow-500';

  return (
    <>
      {score && (
        <div>
          <div className={`text-4xl font-bold ${color}`}>{score}</div>
          <p className="mt-1 text-sm">
            {score < 600 ? 'Poor' : score < 700 ? 'Fair' : score < 750 ? 'Good' : 'Excellent'}
          </p>
          <p className="mt-4 text-xs">Credit score range: 300 (lowest) to 850 (highest).</p>
        </div>
      )}
    </>
  );
};

export default DashboardLayout;
