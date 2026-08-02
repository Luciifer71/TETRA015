import sys
import os
import asyncio

# Resolves demo-invoice-20tax-2.pdf from the root TETRA015 folder automatically
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_PDF = os.path.join(BASE_DIR, "demo-invoice-20tax-2.pdf")


# Ensure backend folder is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.ai_extractor import extract_invoice_data
from app.services.duplicate_detector import check_duplicate_invoice

# Select your test invoice
TEST_PDF = "demo-invoice-20tax-2.pdf"  # or demo-invoice-20tax-9.pdf if present

async def main():
    print(f"==================================================")
    print(f"🚀 TESTING REAL AI INVOICE FINGERPRINT PIPELINE")
    print(f"==================================================")

    if not os.path.exists(TEST_PDF):
        print(f"❌ Error: File {TEST_PDF} not found in backend directory!")
        return

    # 1. Real Extraction from PDF
    print(f"\n1️⃣ Extracting real data from '{TEST_PDF}'...")
    extraction_result = await extract_invoice_data(TEST_PDF, "application/pdf")
    extracted_data = extraction_result.data

    print("\n✅ Extraction Successful!")
    print(f"   Vendor Name   : {extracted_data.get('vendor_name')}")
    print(f"   Invoice Number: {extracted_data.get('invoice_number')}")
    print(f"   Total Amount  : {extracted_data.get('total_amount')}")
    print(f"   GSTIN         : {extracted_data.get('vendor_gst') or extracted_data.get('gstin')}")

    # 2. Simulate Existing Database State
    db_records = [
        {
            "id": "db_rec_001",
            "invoice_number": extracted_data.get("invoice_number", "INV-ORIGINAL"),
            "vendor_name": extracted_data.get("vendor_name"),
            "vendor_gst": extracted_data.get("vendor_gst") or extracted_data.get("gstin"),
            "total_amount": extracted_data.get("total_amount"),
            "tax_amount": extracted_data.get("tax_amount"),
            "line_items": extracted_data.get("line_items", [])
        }
    ]

    # 3. Simulate Fraudulent Alteration
    # A fraudster changes the invoice number and date to bypass standard checks
    modified_fraudulent_invoice = dict(extracted_data)
    modified_fraudulent_invoice["invoice_number"] = "FRAUD-999-ALTERED"
    modified_fraudulent_invoice["invoice_date"] = "2026-12-31"

    print(f"\n2️⃣ Running Fingerprint Analysis against modified document...")
    print(f"   Modified Invoice Number: {modified_fraudulent_invoice['invoice_number']}")
    
    fingerprint_result = await check_duplicate_invoice(
        current_invoice=modified_fraudulent_invoice,
        existing_invoices=db_records,
        threshold=70.0
    )

    print("\n==================================================")
    print("📊 FINGERPRINT DETECTION RESULTS")
    print("==================================================")
    print(f"Duplicate Flagged : {fingerprint_result['is_duplicate']}")
    print(f"Fingerprint Score : {fingerprint_result['fingerprint_score']}%")
    print(f"Original Invoice  : {fingerprint_result['matched_invoice_number']}")
    print("Detection Reasons :")
    for reason in fingerprint_result['match_reasons']:
        print(f"  • {reason}")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())