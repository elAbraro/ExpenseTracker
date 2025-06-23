import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';

const steps = [
  {
    target: '.dashboard-nav',
    content: 'Welcome to your financial dashboard! This is your main control center where you can view all your financial information at a glance.',
    disableBeacon: true,
  },
  {
    target: '.expenses-nav',
    content: 'Track your monthly expenses, categorize them, and analyze your spending patterns to make better financial decisions.',
  },
  {
    target: '.income-nav',
    content: 'Monitor your income sources, track your earnings, and view your income trends over time.',
  },
  {
    target: '.savings-nav',
    content: 'Set and track your savings goals, monitor your progress, and celebrate your financial milestones.',
  },
  {
    target: '.investment-nav',
    content: 'Manage your investments, track portfolio performance, and make informed investment decisions.',
  },
];

function GuideTour() {
  const [run, setRun] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  const handleJoyrideCallback = (data) => {
    const { status, index } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
    }

    setStepIndex(index);
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
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
        buttonNext: {
          backgroundColor: '#4f46e5',
          fontSize: '13px',
          padding: '10px 15px',
        },
        buttonBack: {
          color: '#4f46e5',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#4f46e5',
          fontSize: '13px',
        },
      }}
    />
  );
}

export default GuideTour; 