# Generated by Django 5.1.7 on 2025-04-09 21:14

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('components', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='investment',
            name='current_value',
        ),
        migrations.RemoveField(
            model_name='investment',
            name='investment_type',
        ),
        migrations.RemoveField(
            model_name='investment',
            name='maturity_date',
        ),
        migrations.RemoveField(
            model_name='investment',
            name='name',
        ),
        migrations.RemoveField(
            model_name='investment',
            name='notes',
        ),
        migrations.RemoveField(
            model_name='investment',
            name='principal',
        ),
        migrations.RemoveField(
            model_name='investment',
            name='purchase_date',
        ),
        migrations.RemoveField(
            model_name='investment',
            name='return_rate',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='date',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='user',
        ),
        migrations.RemoveField(
            model_name='report',
            name='user',
        ),
        migrations.AddField(
            model_name='investment',
            name='amount',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=15),
        ),
        migrations.AddField(
            model_name='investment',
            name='date_invested',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='investment',
            name='description',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='investment',
            name='type',
            field=models.CharField(choices=[('STOCK', 'Stock'), ('BOND', 'Bond'), ('REAL_ESTATE', 'Real Estate'), ('CRYPTO', 'Cryptocurrency'), ('OTHER', 'Other')], default='STOCK', max_length=20),
        ),
        migrations.AddField(
            model_name='notification',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='investment',
            name='status',
            field=models.CharField(default='ACTIVE', max_length=10),
        ),
        migrations.AlterField(
            model_name='notification',
            name='message',
            field=models.TextField(),
        ),
    ]
