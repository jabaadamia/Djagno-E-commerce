# Generated by Django 5.0.11 on 2025-02-20 13:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='available_quantity',
            field=models.PositiveIntegerField(default=1),
        ),
    ]
