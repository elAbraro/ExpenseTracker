import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/bills-reminders/';

// -------- Bills --------

export const getBills = async () => {
  const response = await axios.get(`${API_BASE_URL}bills/`);
  return response.data;
};

export const createBill = async (billData) => {
  const response = await axios.post(`${API_BASE_URL}bills/`, billData);
  return response.data;
};

export const updateBill = async (billId, billData) => {
  const response = await axios.put(`${API_BASE_URL}bills/${billId}/`, billData);
  return response.data;
};

export const deleteBill = async (billId) => {
  await axios.delete(`${API_BASE_URL}bills/${billId}/`);
};

// -------- Reminders --------

export const getReminders = async () => {
  const response = await axios.get(`${API_BASE_URL}reminders/`);
  return response.data;
};

export const createReminder = async (reminderData) => {
  const response = await axios.post(`${API_BASE_URL}reminders/`, reminderData);
  return response.data;
};

export const deleteReminder = async (reminderId) => {
  await axios.delete(`${API_BASE_URL}reminders/${reminderId}/`);
};
