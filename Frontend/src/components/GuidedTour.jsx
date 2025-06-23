import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';

const GuidedTour = () => {
  const [run, setRun] = useState(true);
  const [steps] = useState([
    {
      target: '.dashboard-item',
      content: 'Welcome to your financial dashboard! Here you can get a quick overview of your total balance, expenses, savings, and investments.',
      disableBeacon: true,
    },
    {
      target: '.expenses-item',
      content: 'Track all your expenses in one place. Add, categorize, and analyze your spending patterns to make better financial decisions.',
    },
    {
      target: '.income-item',
      content: 'Monitor your income sources, including salary, investments, and other earnings. Keep track of your monthly revenue.',
    },
    {
      target: '.savings-item',
      content: 'Set and track your savings goals. Monitor your progress and stay motivated to achieve your financial objectives.',
    },
    {
      target: '.investment-item',
      content: 'Manage your investments portfolio. Track performance, analyze trends, and make informed investment decisions.',
    },
    {
      target: '.bills-item',
      content: 'Never miss a bill payment again. Set up reminders and track all your upcoming and past bills in one place.',
    },
    {
      target: '.budgeting-item',
      content: 'Create and manage your budget. Set spending limits, track categories, and stay within your financial goals.',
    },
  ]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      hideBackButton={false}
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          primaryColor: '#4f46e5',
          textColor: '#333',
          zIndex: 1000,
        },
        tooltip: {
          borderRadius: 8,
          fontSize: '14px',
        },
        buttonNext: {
          backgroundColor: '#4f46e5',
          fontSize: '13px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#4f46e5',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#666',
          fontSize: '13px',
        },
      }}
    />
  );
};

export default GuidedTour; 