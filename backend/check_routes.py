#!/usr/bin/env python3
from main import app

print(f'Total app routes: {len(app.routes)}')
for r in app.routes:
    if hasattr(r, 'path'):
        methods = getattr(r, 'methods', 'N/A')
        print(f'{r.path} - {methods}')
