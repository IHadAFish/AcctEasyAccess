beat: celery -A app.celery beat --loglevel=info
worker: celery -A app.celery worker --loglevel=info
server: gunicorn -c gunicorn_config.py app:app
