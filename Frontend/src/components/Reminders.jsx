import React, { useEffect, useState } from 'react';
import {
  TextField, Button, Stack, Card, CardContent,
  Typography, MenuItem, Snackbar, Alert
} from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getReminders, createReminder, deleteReminder } from '../api';
import { useBillContext } from '../context/BillContext';
import emailjs from '@emailjs/browser';
import { Bold } from 'lucide-react';

const Reminders = () => {
  const { bills } = useBillContext();
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState({
    email: '',
    reminder_datetime: new Date(),
    message: '',
    bill: ''
  });

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const refreshReminders = async () => {
    try {
      const data = await getReminders();
      setReminders(data);
    } catch (err) {
      console.error("❌ Failed to fetch reminders:", err.message);
    }
  };

  useEffect(() => {
    refreshReminders();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (value) => {
    setForm((prev) => ({ ...prev, reminder_datetime: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.reminder_datetime) newErrors.reminder_datetime = "Date is required";
    if (!form.message.trim()) newErrors.message = "Message is required";
    if (!form.bill) newErrors.bill = "Please select a bill";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createReminder({ ...form, send_email: true });

      // Send via EmailJS
      emailjs.send(
        'service_nvbfsk4',
        'template_pui7gtl',
        {
          email: form.email,
          message: form.message,
          due_date: form.reminder_datetime.toLocaleString()
        },
        'Wr5tXWwUYn31GZoec'
      ).then(() => {
        setSuccessMsg("✅ Reminder created and email sent!");
      }).catch(err => {
        console.error("❌ Email failed to send:", err.text || err.message);
        setErrorMsg("⚠️ Reminder saved, but email failed.");
      });

      setForm({
        email: '',
        reminder_datetime: new Date(),
        message: '',
        bill: ''
      });
      setErrors({});
      refreshReminders();

    } catch (err) {
      console.error("❌ Failed to create reminder:", err.response?.data || err.message);
      setErrorMsg("❌ Failed to create reminder");
    }
  };

  const handleDelete = async (id) => {
    await deleteReminder(id);
    refreshReminders();
  };

  const getCalendarLink = (reminder) => {
    const start = new Date(reminder.reminder_datetime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(new Date(reminder.reminder_datetime).getTime() + 30 * 60000)
      .toISOString().replace(/-|:|\.\d\d\d/g, "");
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(reminder.message)}&dates=${start}/${end}&details=Bill Reminder`;
  };

  return (
    <>
      <div style={{ marginTop: '40px' }}>
        <Typography variant="h5">🔔 Set a Reminder</Typography>

        <Stack spacing={2} mt={2}>
          <TextField
            label="Email"
            name="email"
            fullWidth
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            InputLabelProps={{
              style: {
                color: '#00e5ff ', 
              }
            }}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Reminder Date & Time"
              value={form.reminder_datetime}
              onChange={handleDateChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={!!errors.reminder_datetime}
                  helperText={errors.reminder_datetime}
                  InputLabelProps={{
                    ...params.InputLabelProps,
                    style: {
                      backgroundColor: '#ffffff',
                      color: '#ffffff',
                      border: '1px solid #ffffff',
                      font: Bold 
                    }
                  }}
                />
              )}
            />
          </LocalizationProvider>

          <TextField
            label="Message"
            name="message"
            fullWidth
            value={form.message}
            onChange={handleChange}
            error={!!errors.message}
            helperText={errors.message}
            InputLabelProps={{
              style: {
                color: '#00e5ff', 
              }
            }}
          />

          <TextField
            select
            label="Select Bill"
            name="bill"
            value={form.bill}
            onChange={handleChange}
            fullWidth
            error={!!errors.bill}
            helperText={errors.bill}
            InputLabelProps={{
              style: {
                color: '#00e5ff',
              }
            }}
          >
            {bills.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          <Button variant="contained" onClick={handleSubmit}>
            📧 Create Reminder
          </Button>
        </Stack>

        <Stack spacing={2} mt={4}>
          {reminders.map((r) => (
            <Card key={r.id}>
              <CardContent>
                <Typography><b>Email:</b> {r.email}</Typography>
                <Typography><b>Time:</b> {new Date(r.reminder_datetime).toLocaleString()}</Typography>
                <Typography><b>Message:</b> {r.message}</Typography>
                <Button onClick={() => handleDelete(r.id)}>❌ Delete</Button>
                <Button href={getCalendarLink(r)} target="_blank" rel="noopener noreferrer">
                  📅 Google Calendar
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </div>

      {/* ✅ Snackbar success */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
      >
        <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>

      {/* ❌ Snackbar error */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={3000}
        onClose={() => setErrorMsg('')}
      >
        <Alert onClose={() => setErrorMsg('')} severity="error" sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Reminders;
