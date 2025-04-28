# gunicorn -c gunicorn_config.py app:app
workers = 3
bind = "0.0.0.0:5000"
worker_class = "sync"

def on_starting(server):
    from app import warm_cache
    warm_cache()
