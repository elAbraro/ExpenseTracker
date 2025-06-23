import React, { useState } from 'react';
import { useBillContext } from '../context/BillContext';
import { createBill, deleteBill } from '../api';
import BillForm from './BillForm';
import {
  Button, Card, CardContent, Typography, Stack
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BillList = () => {
  const { bills, refreshBills } = useBillContext();
  const [openForm, setOpenForm] = useState(false);

  const handleAddBill = async (data) => {
    await createBill(data);
    refreshBills();
    setOpenForm(false);
  };

  const handleDelete = async (id) => {
    await deleteBill(id);
    refreshBills();
  };

  const generatePDF = (bill) => {
    const doc = new jsPDF();
    doc.text('Bill Summary', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [['Field', 'Value']],
      body: [
        ['Name', bill.name],
        ['Amount', bill.amount],
        ['Due Date', bill.due_date],
        ['Category', bill.category],
        ['Recurring', bill.is_recurring ? 'Yes' : 'No'],
        ['Notes', bill.notes]
      ]
    });
    doc.save(`${bill.name}_bill.pdf`);
  };

  return (
    <>
      <Stack direction="row" spacing={2} justifyContent="space-between" mb={2}>
        <Button variant="contained" onClick={() => setOpenForm(true)}>➕ Add Bill</Button>
      </Stack>

      <Stack spacing={2}>
        {bills.map(bill => (
          <Card key={bill.id}>
            <CardContent>
              <Typography variant="h6">{bill.name}</Typography>
              <Typography>💰 ${bill.amount}</Typography>
              <Typography>📅 {bill.due_date}</Typography>
              <Typography>📂 {bill.category}</Typography>
              <Button onClick={() => handleDelete(bill.id)}>❌ Delete</Button>
              <Button onClick={() => generatePDF(bill)}>📄 PDF</Button>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <BillForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleAddBill}
      />
    </>
  );
};

export default BillList;
