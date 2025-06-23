import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as PsychologyIcon,
  Person as PersonIcon,
  Assistant as AssistantIcon,
  TrendingUp,
  School,
  AccountBalance,
} from '@mui/icons-material';
import axios from 'axios';

const categories = [
  { name: 'Budgeting', icon: <TrendingUp /> },
  { name: 'Student Loans', icon: <School /> },
  { name: 'Investments', icon: <AccountBalance /> },
];

const Advisor = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/advisor/chat/', {
        message: input,
        category: selectedCategory,
      });
      const aiResponse = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: ' + error.message,
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSampleQuestions = () => {
    switch (selectedCategory) {
      case 'Budgeting':
        return [
          'How can I create a student budget?',
          'Ways to reduce daily expenses?',
          'How to track spending effectively?',
        ];
      case 'Student Loans':
        return [
          'Should I refinance my student loans?',
          'Best repayment strategies?',
          'How to minimize student loan debt?',
        ];
      case 'Investments':
        return [
          'How to start investing as a student?',
          'Low-risk investment options?',
          'Invest vs pay down loans?',
        ];
      default:
        return [
          'How to improve my financial health?',
          'Money-saving tips for students?',
          'How can I build good credit?',
        ];
    }
  };

  // The rest is the same styling code
  // ...
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PsychologyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Typography variant="h4">Financial Advisor</Typography>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {categories.map((cat) => (
              <Card
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: selectedCategory === cat.name ? 'primary.main' : 'background.paper',
                  color: selectedCategory === cat.name ? 'white' : 'text.primary',
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {cat.icon}
                  <Typography>{cat.name}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {messages.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <AssistantIcon sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="h6">Hello! I'm your AI Financial Advisor</Typography>
                  <Typography variant="body2">Ask about personal finance, budgeting, or investments</Typography>
                </Box>
              ) : (
                <List>
                  {messages.map((m, i) => (
                    <React.Fragment key={i}>
                      <ListItem
                        sx={{
                          flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: m.role === 'user' ? 'primary.main' : 'secondary.main' }}>
                            {m.role === 'user' ? <PersonIcon /> : <AssistantIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              sx={{
                                bgcolor: m.role === 'user' ? 'primary.light' : 'background.paper',
                                color: m.role === 'user' ? 'white' : 'text.primary',
                                p: 2,
                                borderRadius: 2,
                                maxWidth: '80%',
                              }}
                            >
                              {m.content}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                              {formatTimestamp(m.timestamp)}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {i < messages.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                  {loading && (
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <CircularProgress size={24} color="inherit" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary="Thinking..." />
                    </ListItem>
                  )}
                  <div ref={messagesEndRef} />
                </List>
              )}
            </Box>
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Ask me about your finances..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                  >
                    Send
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '60vh', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Sample Questions
            </Typography>
            <List>
              {getSampleQuestions().map((q, idx) => (
                <ListItem
                  key={idx}
                  button
                  onClick={() => setInput(q)}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemText primary={q} />
                </ListItem>
              ))}
            </List>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Tips
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip icon={<TrendingUp />} label="Be specific with your questions" variant="outlined" />
              <Chip icon={<School />} label="Ask about student-specific advice" variant="outlined" />
              <Chip icon={<AccountBalance />} label="Personalized recommendations" variant="outlined" />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Advisor;
