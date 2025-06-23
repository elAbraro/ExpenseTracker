import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

const BillForm = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    due_date: new Date(),
    category: 'Utilities',
    notes: '',
    is_recurring: false
  });

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const categories = [
    'Utilities',
    'Rent/Mortgage',
    'Insurance',
    'Credit Card',
    'Loan',
    'Subscription',
    'Medical',
    'Other'
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        amount: initialData.amount,
        due_date: new Date(initialData.due_date),
        category: initialData.category || 'Utilities',
        notes: initialData.notes || '',
        is_recurring: initialData.is_recurring || false
      });
    } else {
      setFormData({
        name: '',
        amount: '',
        due_date: new Date(),
        category: 'Utilities',
        notes: '',
        is_recurring: false
      });
    }
    setErrors({});
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, due_date: date });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Bill name is required';
    if (!formData.amount || formData.amount <= 0)
      newErrors.amount = 'Valid amount is required';
    if (!formData.due_date || isNaN(formData.due_date.getTime()))
      newErrors.due_date = 'Valid due date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const formattedData = {
      ...formData,
      due_date: format(formData.due_date, 'yyyy-MM-dd')
    };

    try {
      onSubmit(formattedData);
      setSuccessMsg(initialData ? '✅ Bill updated successfully!' : '✅ New bill added!');
      onClose(); // Optionally close on success
    } catch (err) {
      setErrorMsg("❌ Failed to add/update bill");
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{initialData ? 'Edit Bill' : 'Add New Bill'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Bill Name"
            type="text"
            fullWidth
            variant="standard"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            margin="dense"
            name="amount"
            label="Amount"
            type="number"
            fullWidth
            variant="standard"
            value={formData.amount}
            onChange={handleChange}
            error={!!errors.amount}
            helperText={errors.amount}
            inputProps={{ step: "0.01" }}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Due Date"
              value={formData.due_date}
              onChange={handleDateChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  fullWidth
                  variant="standard"
                  error={!!errors.due_date}
                  helperText={errors.due_date}
                />
              )}
            />
          </LocalizationProvider>
          <TextField
            margin="dense"
            name="category"
            label="Category"
            select
            fullWidth
            variant="standard"
            value={formData.category}
            onChange={handleChange}
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_recurring}
                onChange={handleChange}
                name="is_recurring"
                color="primary"
              />
            }
            label="Recurring Bill"
          />
          <TextField
            margin="dense"
            name="notes"
            label="Notes"
            type="text"
            fullWidth
            variant="standard"
            multiline
            rows={3}
            value={formData.notes}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {initialData ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Snackbar Confirmation */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
      >
        <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>

      {/* ❌ Snackbar Error */}
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

export default BillForm;
