import pandas as pd
import numpy as np

def calculate_payment_schedule(principal, annual_rate, term_months):
    """
    Calculate the payment schedule for a loan
    """
    monthly_rate = annual_rate / 12 / 100
    
    if monthly_rate == 0:
        monthly_payment = principal / term_months
    else:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate)**term_months) / ((1 + monthly_rate)**term_months - 1)
    
    schedule = []
    remaining_balance = principal
    
    for month in range(1, term_months + 1):
        if monthly_rate == 0:
            interest_payment = 0
            principal_payment = monthly_payment
        else:
            interest_payment = remaining_balance * monthly_rate
            principal_payment = monthly_payment - interest_payment
        
        remaining_balance -= principal_payment
        
        schedule.append({
            'Payment': monthly_payment,
            'Principal': principal_payment,
            'Interest': interest_payment,
            'Remaining': max(0, remaining_balance)
        })
    
    return pd.DataFrame(schedule)

def calculate_interest(principal, annual_rate, days):
    """
    Calculate the interest accrued over a number of days
    """
    daily_rate = annual_rate / 365 / 100
    interest = principal * daily_rate * days
    return interest

