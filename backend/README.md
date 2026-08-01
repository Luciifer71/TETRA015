# InvoiceGuard AI - Backend

FastAPI backend for AI-powered invoice audit platform.

## Quick Start

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy env and add your Gemini API key
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# Initialize database with sample data
python scripts/init_db.py

# Run server
uvicorn app.main:app --reload --port 8000
```

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/           # API route handlers
│   │   ├── upload.py
│   │   ├── invoices.py
│   │   ├── dashboard.py
│   │   ├── search.py
│   │   └── audit.py
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   │   ├── ai_extractor.py
│   │   ├── matching_engine.py
│   │   ├── risk_engine.py
│   │   ├── duplicate_detector.py
│   │   ├── gst_validator.py
│   │   ├── audit_logger.py
│   │   └── invoice_parser.py
│   ├── utils/         # Shared utilities
│   └── main.py        # FastAPI app
├── scripts/           # Utility scripts
├── uploads/           # Uploaded files
├── data/              # CSV imports & sample invoices
└── database.db        # SQLite database
```

## Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/upload` | Upload invoice file |
| `GET /api/v1/upload/{id}` | Get upload status |
| `GET /api/v1/invoices` | List invoices (paginated, filtered) |
| `GET /api/v1/invoices/{id}` | Get invoice detail |
| `PATCH /api/v1/invoices/{id}` | Update invoice |
| `GET /api/v1/dashboard/summary` | Dashboard stats |
| `GET /api/v1/dashboard/risk-distribution` | Risk chart data |
| `POST /api/v1/search` | Advanced search |
| `GET /api/v1/audit/trail/{id}` | Invoice audit trail |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini Vision API key |
| `DATABASE_URL` | No | SQLite path (default: ./database.db) |
| `UPLOAD_DIR` | No | Upload directory (default: ./uploads) |
| `CORS_ORIGINS` | No | Frontend URLs for CORS |

## Development

```bash
# Run tests
pytest app/tests/

# Format code
black app/

# Type check
mypy app/
```

## Docker

```bash
docker build -t invoice-backend .
docker run -p 8000:8000 -e GEMINI_API_KEY=xxx invoice-backend
```