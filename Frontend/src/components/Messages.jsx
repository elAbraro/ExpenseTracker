import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Button,
  Snackbar,
  Alert,
  Slide,
  Tooltip,
  useMediaQuery,
  Drawer,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  ListItemIcon,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  Forum as ForumIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  Videocam as VideoIcon,
  Photo as PhotoIcon,
  Mood as MoodIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  FileOpen as FileOpenIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import Picker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const colors = {
  primary: '#FF3B30',
  primaryDark: '#C0392B',
  background: '#F2F2F2',
  sidebar: '#FFFFFF',
  chatBg: '#FAFAFA',
  incomingMsg: '#FFFFFF',
  outgoingMsg: '#FFEFEC',
  textPrimary: '#2E2E2E',
  textSecondary: '#8E8E8E',
  divider: '#DDDDDD',
  onlineDot: '#4CD964',
  accent: '#FF9500',
};

const timeAgo = (lastActive) => {
  if (!lastActive) return 'Offline';
  const now = new Date();
  const active = new Date(lastActive);
  const diffMs = now - active;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 5) return 'Online';
  else if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const Messages = () => {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAvatar, setRegAvatar] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Chat states
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // UI states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [profileSettings, setProfileSettings] = useState({
    fullName: '',
    email: '',
    password: '',
    newPassword: '',
    avatar: null,
    notifications: true,
  });
  const [anchorEl, setAnchorEl] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Responsiveness
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (token && userData) {
      setIsLoggedIn(true);
      setCurrentUser(userData);
      fetchUsers();
      fetchGroups();
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch users and groups
  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/users/');
      setRegisteredUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchGroups = async () => {
    const groups = [
      { id: 101, name: 'Income and Expense Manager', isGroup: true },
      { id: 102, name: 'Investment Advisor', isGroup: true },
      { id: 103, name: 'Debt Manager', isGroup: true },
      { id: 104, name: 'Budget and Savings Manager', isGroup: true },
    ];
    setConversations(groups);
  };

  // Auth handlers
  const handleRegister = async () => {
    if (!regFullName.trim() || !regEmail.trim() || !regPassword.trim()) {
      showSnackbar('Please fill all required fields!', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('full_name', regFullName);
      formData.append('email', regEmail);
      formData.append('password', regPassword);
      if (regAvatar) formData.append('avatar', regAvatar);

      const res = await axios.post('http://localhost:8000/api/user/register/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showSnackbar('Registration successful! Please login.', 'success');
        setShowRegister(false);
        setRegFullName('');
        setRegEmail('');
        setRegPassword('');
        setRegAvatar(null);
      } else {
        showSnackbar(res.data.message || 'Registration failed', 'error');
      }
    } catch (err) {
      console.error('Registration error:', err);
      showSnackbar(err.response?.data?.message || 'Registration failed. Please try again.', 'error');
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showSnackbar('Please enter email and password.', 'error');
      return;
    }

    try {
      const res = await axios.post('http://localhost:8000/api/user/login/', {
        email: loginEmail,
        password: loginPassword,
      });

      if (res.data.message === "Login successful") {
        localStorage.setItem('authToken', res.data.token || 'dummy-token');
        localStorage.setItem('userData', JSON.stringify(res.data.user));
        setIsLoggedIn(true);
        setCurrentUser(res.data.user);
        setLoginEmail('');
        setLoginPassword('');
        showSnackbar('Login successful!', 'success');
        fetchUsers();
        fetchGroups();
      } else {
        showSnackbar(res.data.error || 'Invalid credentials.', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      showSnackbar(err.response?.data?.error || 'Invalid credentials. Please try again.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedChat(null);
    setMessages([]);
    setConversations([]);
    showSnackbar('Logged out successfully!', 'success');
  };

  // Chat functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    if (isMobile) setSidebarOpen(false);

    if (chat.isGroup) {
      try {
        const res = await axios.get(`http://localhost:8000/api/messages/${chat.id}/`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Error loading group messages:', err);
      }
    }
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const getFilteredList = () => {
    if (searchQuery.trim()) {
      return registeredUsers.filter((u) =>
        (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return conversations;
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;
    const newMsg = {
      sender: currentUser.full_name || 'You',
      content: input,
      timestamp: new Date().toISOString(),
      message_type: 'text',
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setShowEmojiPicker(false);
    scrollToBottom();

    try {
      await axios.post(`http://localhost:8000/api/messages/${selectedChat.id}/`, {
        sender: currentUser.full_name,
        content: newMsg.content,
        message_type: newMsg.message_type,
      });
    } catch (err) {
      console.error('Error sending text message:', err);
      showSnackbar('Failed to send message.', 'error');
    }
  };

  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file || !selectedChat) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sender', currentUser.full_name || 'You');
    formData.append('type', fileType);

    try {
      const res = await axios.post(
        `http://localhost:8000/api/messages/${selectedChat.id}/upload`,
        formData
      );
      const fileUrl = res.data.fileUrl;

      const newMsg = {
        sender: currentUser.full_name || 'You',
        content: fileUrl,
        file_url: fileUrl,
        timestamp: new Date().toISOString(),
        message_type: fileType === 'file' ? 'file' : fileType,
      };
      setMessages((prev) => [...prev, newMsg]);
      showSnackbar(`${fileType} sent!`);
      scrollToBottom();
    } catch (err) {
      console.error(`Error sending ${fileType}:`, err);
      showSnackbar('Failed to send file.', 'error');
    }
    e.target.value = '';
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  // Profile settings functions
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const openProfileSettings = () => {
    setProfileSettings({
      fullName: currentUser?.full_name || '',
      email: currentUser?.email || '',
      password: '',
      newPassword: '',
      avatar: null,
      notifications: true,
    });
    setProfileSettingsOpen(true);
    handleProfileMenuClose();
  };

  const handleProfileUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append('full_name', profileSettings.fullName);
      formData.append('email', profileSettings.email);
      if (profileSettings.newPassword) {
        formData.append('password', profileSettings.newPassword);
      }
      if (profileSettings.avatar) {
        formData.append('avatar', profileSettings.avatar);
      }

      const res = await axios.put('http://localhost:8000/api/user/profile/', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setCurrentUser((prev) => ({
          ...prev,
          full_name: profileSettings.fullName,
          email: profileSettings.email,
          avatarUrl: profileSettings.avatar ? URL.createObjectURL(profileSettings.avatar) : prev.avatarUrl,
        }));
        localStorage.setItem('userData', JSON.stringify({
          ...currentUser,
          full_name: profileSettings.fullName,
          email: profileSettings.email,
        }));
        showSnackbar('Profile updated successfully!', 'success');
        setProfileSettingsOpen(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      showSnackbar('Failed to update profile.', 'error');
    }
  };

  const renderMessageContent = (msg) => {
    switch (msg.message_type) {
      case 'text':
        return <Typography variant="body1">{msg.content}</Typography>;
      case 'image':
        return (
          <img
            src={msg.content}
            alt="img"
            style={{ maxWidth: '200px', borderRadius: 8, cursor: 'pointer' }}
          />
        );
      case 'video':
        return (
          <video
            src={msg.content}
            controls
            style={{ maxWidth: '200px', borderRadius: 8 }}
          />
        );
      case 'file':
      default:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2, bgcolor: '#FFEEDB' }}>
            <FileOpenIcon sx={{ mr: 1 }} />
            <Typography
              component="a"
              href={msg.content}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: colors.textPrimary, textDecoration: 'none' }}
            >
              {msg.content.split('/').pop() || 'File'}
            </Typography>
          </Box>
        );
    }
  };

  const formatTime = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Login/Register UI
  if (!isLoggedIn) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          bgcolor: colors.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Paper sx={{ width: 400, maxWidth: '90%', p: 3, borderRadius: 2 }} elevation={4}>
          {!showRegister ? (
            <>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Login
              </Typography>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleLogin}
                sx={{ textTransform: 'none', mb: 2, bgcolor: '#1976d2' }}
              >
                Login
              </Button>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" textAlign="center">
                Don't have an account?{' '}
                <Box
                  component="span"
                  sx={{ color: colors.primary, cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => setShowRegister(true)}
                >
                  Register
                </Box>
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Register
              </Typography>
              <TextField
                label="Full Name"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                component="label"
                fullWidth
                sx={{ textTransform: 'none', mb: 2 }}
              >
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setRegAvatar(e.target.files[0])}
                />
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleRegister}
                sx={{ textTransform: 'none', bgcolor: '#1976d2' }}
              >
                Register
              </Button>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" textAlign="center">
                Already have an account?{' '}
                <Box
                  component="span"
                  sx={{ color: colors.primary, cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => setShowRegister(false)}
                >
                  Login
                </Box>
              </Typography>
            </>
          )}
        </Paper>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbarSeverity} 
            sx={{ 
              width: '100%',
              backgroundColor: snackbarSeverity === 'success' ? '#4CAF50' : null 
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  // Main Chat UI
  const filteredList = getFilteredList();

  return (
    <Box sx={{ 
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: colors.primary,
          color: '#FFF',
          p: 2,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            sx={{ color: '#FFF', mr: 1 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" sx={{ 
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold'
          }}>
            <ForumIcon sx={{ mr: 1, fontSize: { xs: 20, sm: 28 } }} />
            FinChat
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Profile Settings">
            <IconButton sx={{ color: '#FFF' }} onClick={handleProfileMenuOpen}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileMenuClose}>
            <MenuItem onClick={openProfileSettings}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Profile Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <CloseIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar Drawer */}
        <Drawer
          variant={isMobile ? 'temporary' : 'temporary'}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: { xs: '80%', sm: 300 },
              boxSizing: 'border-box',
              bgcolor: colors.sidebar,
              boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
            },
          }}
          ModalProps={{ keepMounted: true }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${colors.divider}` }}>
            <TextField
              fullWidth
              placeholder="Search people..."
              value={searchQuery}
              onChange={handleSearchChange}
              size="small"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: colors.textSecondary }} />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}
            />
          </Box>

          <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {filteredList.length === 0 && (
              <Typography
                variant="body2"
                sx={{ textAlign: 'center', color: colors.textSecondary, mt: 2 }}
              >
                No results found
              </Typography>
            )}
            {filteredList.map((item) => (
              <ListItem
                key={item.id}
                button
                selected={selectedChat?.id === item.id}
                onClick={() => selectChat(item)}
                sx={{
                  borderBottom: `1px solid ${colors.divider}`,
                  '&:hover': { bgcolor: '#f5f5f5' },
                  py: 1.5,
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: item.isGroup ? '#FFC0B5' : 'inherit',
                      color: item.isGroup ? '#000' : 'inherit',
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      fontSize: { xs: '1rem', sm: '1.2rem' }
                    }}
                    src={item.avatarUrl || ''}
                  >
                    {item.name ? item.name.charAt(0) : ''}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>
                      {item.name || item.full_name}
                    </Typography>
                  }
                  secondary={
                    <Typography sx={{ color: colors.textSecondary, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {item.isGroup ? 'Group Chat' : timeAgo(item.lastActive)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Drawer>

        {/* Main Chat Area */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: colors.chatBg,
            width: '100%',
          }}
        >
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <Box
                sx={{
                  p: { xs: 1, sm: 1.5 },
                  borderBottom: `1px solid ${colors.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: '#FFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {isMobile && (
                    <IconButton onClick={() => setSelectedChat(null)} sx={{ mr: 1 }}>
                      <CloseIcon />
                    </IconButton>
                  )}
                  <Avatar
                    sx={{
                      bgcolor: '#FFC0B5',
                      color: colors.textPrimary,
                      width: { xs: 36, sm: 40 },
                      height: { xs: 36, sm: 40 },
                      mr: { xs: 1, sm: 1.5 },
                    }}
                    src={selectedChat.isGroup ? '' : selectedChat.avatarUrl || ''}
                  >
                    {selectedChat.name ? selectedChat.name.charAt(0) : ''}
                  </Avatar>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1.1rem' } }}
                  >
                    {selectedChat.name || selectedChat.full_name}
                  </Typography>
                </Box>
              </Box>

              {/* Messages */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  p: { xs: 1, sm: 2 },
                  position: 'relative',
                }}
              >
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: 'flex',
                        justifyContent: msg.sender === currentUser.full_name ? 'flex-end' : 'flex-start',
                        marginBottom: '16px',
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: { xs: '85%', sm: '70%' },
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: msg.sender === currentUser.full_name ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {msg.sender !== currentUser.full_name && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: colors.textSecondary,
                              mb: 0.5,
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
                            {msg.sender}
                          </Typography>
                        )}

                        <Paper
                          elevation={1}
                          sx={{
                            p: { xs: 1, sm: 1.5 },
                            maxWidth: '90%',
                            borderRadius: msg.sender === currentUser.full_name
                              ? { xs: '12px 12px 0 12px', sm: '12px 12px 0px 12px' }
                              : { xs: '12px 12px 12px 0', sm: '12px 12px 12px 0px' },
                            bgcolor: msg.sender === currentUser.full_name ? colors.outgoingMsg : colors.incomingMsg,
                            wordBreak: 'break-word',
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          {renderMessageContent(msg)}
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                ml: 1,
                                color: colors.textSecondary,
                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                              }}
                            >
                              {formatTime(msg.timestamp)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Box>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </AnimatePresence>
              </Box>

              {/* Emoji Picker */}
              <Slide direction="up" in={showEmojiPicker} mountOnEnter unmountOnExit>
                <Box
                  sx={{
                    position: 'fixed',
                    bottom: { xs: 56, sm: 80 },
                    left: 0,
                    right: 0,
                    width: '100%',
                    height: { xs: '40vh', sm: 300 },
                    zIndex: 10,
                    bgcolor: '#FFF',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
                    borderTop: `1px solid ${colors.divider}`,
                    overflowY: 'auto'
                  }}
                >
                  <Picker
                    width="100%"
                    height="100%"
                    previewConfig={{ showPreview: false }}
                  />
                </Box>
              </Slide>

              {/* Input Area */}
              <Box
                sx={{
                  p: { xs: 1, sm: 2 },
                  bgcolor: '#FFF',
                  borderTop: `1px solid ${colors.divider}`,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 0.5, sm: 1 },
                    bgcolor: 'rgba(255,59,48, 0.05)',
                    borderRadius: '25px',
                    px: { xs: 1, sm: 2 },
                    py: 0.5,
                    flexWrap: 'wrap'
                  }}
                >
                  <Box sx={{ 
                    display: 'flex',
                    order: { xs: 2, sm: 1 },
                    gap: { xs: 0.5, sm: 1 }
                  }}>
                    <IconButton
                      onClick={() => fileInputRef.current.click()}
                      sx={{ color: colors.textSecondary, p: { xs: 0.5, sm: 1 } }}
                    >
                      <AttachFileIcon fontSize="small" />
                    </IconButton>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'file')}
                    />

                    <IconButton
                      onClick={() => photoInputRef.current.click()}
                      sx={{ color: colors.textSecondary, p: { xs: 0.5, sm: 1 } }}
                    >
                      <PhotoIcon fontSize="small" />
                    </IconButton>
                    <input
                      type="file"
                      accept="image/*"
                      ref={photoInputRef}
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'image')}
                    />

                    <IconButton
                      onClick={() => videoInputRef.current.click()}
                      sx={{ color: colors.textSecondary, p: { xs: 0.5, sm: 1 } }}
                    >
                      <VideoIcon fontSize="small" />
                    </IconButton>
                    <input
                      type="file"
                      accept="video/*"
                      ref={videoInputRef}
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'video')}
                    />
                  </Box>

                  <TextField
                    variant="standard"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    InputProps={{ disableUnderline: true }}
                    multiline
                    maxRows={3}
                    sx={{
                      flexGrow: 1,
                      minWidth: { xs: '60%', sm: 'auto' },
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}
                  />

                  <Box sx={{ 
                    display: 'flex',
                    order: { xs: 3, sm: 2 },
                    gap: { xs: 0.5, sm: 1 }
                  }}>
                    <IconButton
                      onClick={toggleEmojiPicker}
                      sx={{
                        color: showEmojiPicker ? colors.primary : colors.textSecondary,
                        p: { xs: 0.5, sm: 1 },
                      }}
                    >
                      <MoodIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      onClick={handleSend}
                      sx={{ color: colors.primary, p: { xs: 0.5, sm: 1 } }}
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                bgcolor: '#FFF',
                p: 3,
              }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    color: colors.primary,
                    mb: 2,
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    textAlign: 'center',
                  }}
                >
                  Welcome to FinChat!
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: colors.textSecondary,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    textAlign: 'center',
                  }}
                >
                  Select a user or group to start chatting.
                </Typography>
              </motion.div>
            </Box>
          )}
        </Box>
      </Box>

      {/* Profile Settings Dialog */}
      <Dialog open={profileSettingsOpen} onClose={() => setProfileSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Profile Settings</Typography>
          <IconButton onClick={() => setProfileSettingsOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Avatar
                src={
                  profileSettings.avatar
                    ? URL.createObjectURL(profileSettings.avatar)
                    : currentUser?.avatarUrl || ''
                }
                sx={{ width: 100, height: 100 }}
              />
            </Box>
            <Button variant="outlined" component="label" fullWidth startIcon={<EditIcon />}>
              Change Avatar
              <input
                type="file"
                accept="image/*"
                hidden
                ref={avatarInputRef}
                onChange={(e) => {
                  if (e.target.files[0]) {
                    setProfileSettings((prev) => ({ ...prev, avatar: e.target.files[0] }));
                  }
                }}
              />
            </Button>

            <TextField
              label="Full Name"
              fullWidth
              value={profileSettings.fullName}
              onChange={(e) => setProfileSettings((prev) => ({ ...prev, fullName: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Email"
              fullWidth
              value={profileSettings.email}
              onChange={(e) => setProfileSettings((prev) => ({ ...prev, email: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="New Password"
              type="password"
              fullWidth
              value={profileSettings.newPassword}
              onChange={(e) => setProfileSettings((prev) => ({ ...prev, newPassword: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={profileSettings.notifications}
                  onChange={(e) =>
                    setProfileSettings((prev) => ({ ...prev, notifications: e.target.checked }))
                  }
                  color="primary"
                />
              }
              label="Enable Notifications"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setProfileSettingsOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleProfileUpdate}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ 
            width: '100%',
            backgroundColor: snackbarSeverity === 'success' ? '#4CAF50' : null 
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Messages;