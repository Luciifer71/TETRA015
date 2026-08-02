import asyncio
from app.services.duplicate_detector import check_duplicate_invoice

async def test_fingerprint_detection():
    # Simulated original invoice stored in Database
    original_invoice_in_db = {
        "id": "INV-2026-001",
        "vendor_name": "ABC Supplies Limited",
        "vendor_gst": "29ABCDE1234F1ZS",
        "total_amount": 11800.00,
        "tax_amount": 1800.00,
        "line_items": [
            {"description": "Industrial Steel Rods", "quantity": 10, "amount": 10000.00}
        ]
    }

    # Fraudulent invoice: Fraudster changed invoice number & date, but keep business core identical
    fraudulent_modified_invoice = {
        "invoice_number": "INV-MODIFIED-999",  # Changed!
        "invoice_date": "2026-08-01",          # Changed!
        "vendor_name": "ABC Supplies Ltd",      # Slight name variation
        "vendor_gst": "29ABCDE1234F1ZS",        # Identical GST
        "total_amount": 11800.00,               # Identical Amount
        "tax_amount": 1800.00,                  # Identical Tax
        "line_items": [
            {"description": "Industrial Steel Rods", "quantity": 10, "amount": 10000.00}
        ]
    }

    print("🔍 Testing AI Invoice Fingerprint Engine...\n")
    
    result = await check_duplicate_invoice(
        current_invoice=fraudulent_modified_invoice,
        existing_invoices=[original_invoice_in_db],
        threshold=75.0
    )

    print(f"Is Duplicate Detected?: {result['is_duplicate']}")
    print(f"Fingerprint Match Score: {result['fingerprint_score']}%")
    print(f"Matched Record ID: {result['matched_invoice_id']}")
    print("Match Reasons:")
    for reason in result['match_reasons']:
        print(f"  - {reason}")

if __name__ == "__main__":
    asyncio.run(test_fingerprint_detection())