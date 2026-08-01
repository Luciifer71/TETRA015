# REST API Documentation
## AI-Powered Invoice Audit & Risk Screening Platform

**Version**: 1.0  
**Base URL**: `http://localhost:8000/api/v1`  
**Date**: August 1, 2026

---

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Upload Endpoints](#upload-endpoints)
4. [Invoice Endpoints](#invoice-endpoints)
5. [Dashboard Endpoints](#dashboard-endpoints)
6. [Search Endpoints](#search-endpoints)
7. [Audit Endpoints](#audit-endpoints)
8. [Error Responses](#error-responses)

---

## API Overview

### Base Information
- **Protocol**: HTTP/HTTPS
- **Content-Type**: `application/json` (except file uploads)
- **Rate Limiting**: 100 requests/minute per IP
- **Pagination**: Default 25 items, max 100
- **Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

### Common Headers
```http
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid> (optional, for tracking)
```

### Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "Success message",
  "timestamp": "2024-08-01T10:30:00Z"
}
```

---

## Upload Endpoints

### POST /upload

Upload an invoice file for processing

**Request**:
```http
POST /api/v1/upload HTTP/1.1
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="invoice.pdf"
Content-Type: application/pdf

<file content>
--boundary--
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | Yes | PDF, JPEG, or PNG (max 10MB) |

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
    "file_name": "invoice.pdf",
    "file_size": 245678,
    "status": "PENDING",
    "uploaded_at": "2024-08-01T10:30:00Z"
  },
  "message": "File uploaded successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid file type or size
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE",
    "message": "File type not supported. Only PDF, JPEG, PNG allowed.",
    "details": {
      "file_type": "application/msword",
      "allowed_types": ["application/pdf", "image/jpeg", "image/png"]
    }
  }
}
```

- `413 Payload Too Large`: File exceeds 10MB
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 10MB limit",
    "details": {
      "file_size": 12582912,
      "max_size": 10485760
    }
  }
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@invoice.pdf"
```

---

### GET /upload/{upload_id}

Get upload status and details

**Request**:
```http
GET /api/v1/upload/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "upload_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_filename": "ABC_Invoice_July.pdf",
    "file_size": 245678,
    "file_type": "application/pdf",
    "status": "COMPLETED",
    "invoice_id": "inv-123",
    "processing_time_ms": 3500,
    "uploaded_at": "2024-08-01T10:30:00Z",
    "processed_at": "2024-08-01T10:30:35Z"
  }
}
```

---

## Invoice Endpoints

### GET /invoices

List all invoices with pagination and filtering

**Request**:
```http
GET /api/v1/invoices?page=1&limit=25&status=PROCESSED&risk_level=HIGH HTTP/1.1
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 25 | Items per page (max 100) |
| status | string | all | Filter by status |
| risk_level | string | all | Filter by risk level |
| vendor | string | - | Filter by vendor name |
| date_from | date | - | Filter from date (YYYY-MM-DD) |
| date_to | date | - | Filter to date |
| min_amount | float | - | Minimum amount |
| max_amount | float | - | Maximum amount |
| sort_by | string | uploaded_at | Sort field |
| sort_order | string | desc | asc or desc |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "invoice_number": "INV-2024-001",
        "vendor_name": "ABC Supplies Ltd",
        "invoice_date": "2024-07-15",
        "total_amount": 59000.00,
        "currency": "INR",
        "status": "PROCESSED",
        "risk_level": "HIGH",
        "risk_score": 75,
        "uploaded_at": "2024-07-20T10:30:00Z",
        "has_exceptions": true,
        "exception_count": 2
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 25,
      "pages": 6,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

### GET /invoices/{invoice_id}

Get detailed invoice information

**Request**:
```http
GET /api/v1/invoices/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "invoice_number": "INV-2024-001",
      "vendor_name": "ABC Supplies Ltd",
      "vendor_gst": "29ABCDE1234F1Z5",
      "invoice_date": "2024-07-15",
      "due_date": "2024-08-15",
      "subtotal": 50000.00,
      "tax_amount": 9000.00,
      "total_amount": 59000.00,
      "currency": "INR",
      "line_items": [
        {
          "item": "Laptops",
          "quantity": 10,
          "rate": 5000.00,
          "amount": 50000.00
        }
      ],
      "confidence_scores": {
        "invoice_number": 0.98,
        "vendor_name": 0.95,
        "total_amount": 0.99,
        "overall": 0.96
      },
      "file_path": "/uploads/550e8400-e29b-41d4-a716-446655440000.pdf",
      "file_type": "PDF",
      "status": "PROCESSED",
      "uploaded_at": "2024-07-20T10:30:00Z",
      "processed_at": "2024-07-20T10:35:00Z"
    },
    "matching": {
      "ledger_matched": true,
      "ledger_entry": {
        "po_number": "PO-2024-100",
        "expected_amount": 59000.00,
        "po_date": "2024-07-10"
      },
      "vendor_matched": true,
      "vendor_entry": {
        "vendor_code": "VENDOR-ABC-001",
        "status": "ACTIVE"
      }
    },
    "risk": {
      "risk_score": 25,
      "risk_level": "LOW",
      "risk_factors": [
        {
          "rule": "high_value",
          "triggered": true,
          "weight": 10,
          "description": "Invoice amount exceeds ₹50,000"
        }
      ],
      "explanation": "This invoice has low risk. It matched with purchase ledger PO-2024-100..."
    },
    "exceptions": [],
    "audit_trail": [
      {
        "action": "UPLOAD",
        "timestamp": "2024-07-20T10:30:00Z",
        "details": "File uploaded successfully"
      }
    ]
  }
}
```

---

### PATCH /invoices/{invoice_id}

Update invoice (manual corrections)

**Request**:
```http
PATCH /api/v1/invoices/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Content-Type: application/json

{
  "total_amount": 59500.00,
  "status": "APPROVED"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
    "updated_fields": ["total_amount", "status"],
    "updated_at": "2024-08-01T11:00:00Z"
  },
  "message": "Invoice updated successfully"
}
```



---

## Dashboard Endpoints

### GET /dashboard/summary

Get dashboard summary statistics

**Request**:
```http
GET /api/v1/dashboard/summary HTTP/1.1
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_invoices": 1250,
    "total_amount": 125000000.00,
    "average_invoice_value": 100000.00,
    "invoices_processed": 1200,
    "invoices_pending": 50,
    "high_risk_count": 45,
    "exceptions_count": 89,
    "pending_review_count": 23,
    "average_processing_time_ms": 3500,
    "top_vendors": [
      {"name": "ABC Supplies", "invoice_count": 156, "total_amount": 15600000},
      {"name": "XYZ Vendors", "invoice_count": 142, "total_amount": 14200000}
    ],
    "risk_distribution": {
      "LOW": 900,
      "MEDIUM": 250,
      "HIGH": 75,
      "CRITICAL": 25
    }
  }
}
```

---

### GET /dashboard/risk-distribution

Get risk level distribution chart data

**Request**:
```http
GET /api/v1/dashboard/risk-distribution HTTP/1.1
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "chart_type": "pie",
    "data": [
      {"name": "LOW", "value": 900, "percentage": 72},
      {"name": "MEDIUM", "value": 250, "percentage": 20},
      {"name": "HIGH", "value": 75, "percentage": 6},
      {"name": "CRITICAL", "value": 25, "percentage": 2}
    ],
    "colors": ["#10B981", "#F59E0B", "#EF4444", "#8B0000"]
  }
}
```

---

### GET /dashboard/vendor-stats

Get vendor statistics

**Request**:
```http
GET /api/v1/dashboard/vendor-stats?limit=10 HTTP/1.1
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "top_vendors": [
      {
        "vendor_name": "ABC Supplies Ltd",
        "invoice_count": 156,
        "total_amount": 15600000,
        "average_invoice": 100000,
        "risk_count": 5,
        "status": "ACTIVE"
      }
    ]
  }
}
```

---

### GET /dashboard/recent-uploads

Get recently uploaded invoices

**Request**:
```http
GET /api/v1/dashboard/recent-uploads?limit=10 HTTP/1.1
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
        "invoice_number": "INV-2024-001",
        "vendor_name": "ABC Supplies",
        "total_amount": 59000,
        "status": "PROCESSED",
        "risk_level": "LOW",
        "uploaded_at": "2024-08-01T10:30:00Z"
      }
    ]
  }
}
```

---

## Search Endpoints

### POST /search

Advanced search with filters

**Request**:
```http
POST /api/v1/search HTTP/1.1
Content-Type: application/json

{
  "query": "ABC Supplies",
  "filters": {
    "risk_level": ["HIGH", "CRITICAL"],
    "status": ["PROCESSED"],
    "date_range": {
      "from": "2024-07-01",
      "to": "2024-08-01"
    },
    "amount_range": {
      "min": 10000,
      "max": 100000
    },
    "vendors": ["ABC Supplies", "XYZ Vendors"]
  },
  "sort": {
    "field": "total_amount",
    "order": "desc"
  },
  "page": 1,
  "limit": 25
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "invoice_number": "INV-2024-001",
        "vendor_name": "ABC Supplies Ltd",
        "total_amount": 59000,
        "risk_score": 75,
        "match": "High relevance - vendor name match"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "pages": 2
    }
  }
}
```

---

## Audit Endpoints

### GET /audit/trail/{invoice_id}

Get audit trail for invoice

**Request**:
```http
GET /api/v1/audit/trail/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "audit_trail": [
      {
        "id": "audit-001",
        "action": "UPLOAD",
        "action_category": "SYSTEM",
        "actor": "user@example.com",
        "details": "Invoice file uploaded",
        "timestamp": "2024-07-20T10:30:00Z"
      },
      {
        "id": "audit-002",
        "action": "EXTRACT",
        "action_category": "AI",
        "actor": "gemini-vision-api",
        "details": "AI extraction completed",
        "metadata": {"confidence": 0.96},
        "timestamp": "2024-07-20T10:31:30Z"
      }
    ]
  }
}
```

---

## Error Responses

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_REQUEST | 400 | Request validation failed |
| INVALID_FILE | 400 | File type/format invalid |
| FILE_TOO_LARGE | 413 | File exceeds size limit |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMIT | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request validation failed",
    "details": {
      "field": "total_amount",
      "issue": "Must be positive number"
    }
  },
  "timestamp": "2024-08-01T11:00:00Z"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict |
| 413 | Payload Too Large - File too large |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

**Version**: 1.0  
**Last Updated**: August 1, 2026

---

**END OF API DOCUMENT**
