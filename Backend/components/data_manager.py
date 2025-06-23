import pandas as pd
from .models import Debt

DATA_FILE = "data/debts.csv"  # We won't actually use it, but keep for reference

def load_data():
    """
    Load debt data from DB, return as Pandas DataFrame
    """
    qs = Debt.objects.all()
    if not qs.exists():
        return pd.DataFrame(columns=[
            'name',
            'principal',
            'interest_rate',
            'term_months',
            'date_added',
            'remaining_balance'
        ])
    df = pd.DataFrame.from_records(qs.values(
        'name',
        'principal',
        'interest_rate',
        'term_months',
        'date_added',
        'remaining_balance'
    ))
    return df

def save_data(df):
    """
    Save (overwrite) DB from the given DataFrame
    """
    Debt.objects.all().delete()
    for _, row in df.iterrows():
        Debt.objects.create(
            name=row['name'],
            principal=row['principal'],
            interest_rate=row['interest_rate'],
            term_months=row['term_months'],
            date_added=row['date_added'],
            remaining_balance=row['remaining_balance']
        )

