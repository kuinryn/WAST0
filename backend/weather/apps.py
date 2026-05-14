# weather/apps.py
from django.apps import AppConfig
from django.conf import settings

class WeatherConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'weather'

    def ready(self):
        credentials_path = settings.FIREBASE_CREDENTIALS_PATH
        if not credentials_path or credentials_path == 'path/to/serviceAccountKey.json':
            return

        try:
            import firebase_admin
            from firebase_admin import credentials
        except ImportError:
            return

        if not firebase_admin._apps:
            try:
                cred = credentials.Certificate(credentials_path)
                firebase_admin.initialize_app(cred)
            except Exception:
                return
