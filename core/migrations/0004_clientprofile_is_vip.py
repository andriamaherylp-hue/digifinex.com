# Generated manually for VIP badge management

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_alter_capitalrecord_record_type_tradeorder'),
    ]

    operations = [
        migrations.AddField(
            model_name='clientprofile',
            name='is_vip',
            field=models.BooleanField(default=False),
        ),
    ]
