import React, { createContext, useContext, useEffect, useState } from 'react';
import { getBills } from '../api';

const BillContext = createContext();

export const BillProvider = ({ children }) => {
  const [bills, setBills] = useState([]);

  const refreshBills = async () => {
    try {
      const data = await getBills();
      setBills(data);
    } catch (err) {
      console.error("Error fetching bills:", err);
    }
  };

  useEffect(() => {
    refreshBills();
  }, []);

  return (
    <BillContext.Provider value={{ bills, refreshBills }}>
      {children}
    </BillContext.Provider>
  );
};

export const useBillContext = () => useContext(BillContext);
