"""
REAL EXTRACTION & VALIDATION TEST
Extracts actual data from invoice files (PDF/Image) and validates against Purchase Ledger
"""

import sys
import json
from pathlib import Path
from datetime import datetime, date
import asyncio

sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal, init_db
from app.models import PurchaseLedger, VendorMaster, Invoice
from app.services.ai_extractor import extract_invoice_data
from app.services.ocr_fusion import get_ocr_fusion
from app.config import settings
from groq import Groq


async def setup_ledger(db):
    """Create real purchase ledger entries"""
    print("\n⏳ Setting up Purchase Ledger...")
    
    # Clear existing
    db.query(PurchaseLedger).delete()
    db.commit()
    
    # Create PO entries
    pos = [
        PurchaseLedger(
            po_number='PO-2026-001',
            vendor_name='ABC Supplies Limited',
            vendor_gst='29ABCDE1234F1ZS',
            po_date=date(2026, 7, 1),
            expected_amount=440000.00,
            description='Office Supplies',
            status='OPEN'
        ),
        PurchaseLedger(
            po_number='PO-2026-002',
            vendor_name='XYZ Pvt Ltd',
            vendor_gst='24XYZAA1234A1Z2',
            po_date=date(2026, 7, 5),
            expected_amount=125000.00,
            description='Toner Cartridges',
            status='OPEN'
        ),
        PurchaseLedger(
            po_number='PO-2026-003',
            vendor_name='Tech Solutions',
            vendor_gst='29ABCDE1234F1Z5',
            po_date=date(2026, 7, 10),
            expected_amount=300000.00,
            description='Software License',
            status='OPEN'
        )
    ]
    
    for po in pos:
        db.add(po)
    db.commit()
    
    print(f"✅ Created {len(pos)} Purchase Orders:")
    for po in pos:
        print(f"   • {po.po_number}: {po.vendor_name} - ₹{po.expected_amount:,.2f}")


async def setup_vendor_master(db):
    """Create vendor master data"""
    print("\n⏳ Setting up Vendor Master...")
    
    # Clear existing
    db.query(VendorMaster).delete()
    db.commit()
    
    vendors = [
        VendorMaster(
            vendor_name='ABC Supplies Limited',
            gst_number='29ABCDE1234F1ZS',
            status='ACTIVE',
            is_suspicious=False
        ),
        VendorMaster(
            vendor_name='XYZ Pvt Ltd',
            gst_number='24XYZAA1234A1Z2',
            status='ACTIVE',
            is_suspicious=False
        ),
        VendorMaster(
            vendor_name='Tech Solutions',
            gst_number='29ABCDE1234F1Z5',
            status='ACTIVE',
            is_suspicious=False
        ),
        VendorMaster(
            vendor_name='Acme Corporation Ltd',
            gst_number='29ACMCO123441Z0',
            status='ACTIVE',
            is_suspicious=False
        )
    ]
    
    for vendor in vendors:
        db.add(vendor)
    db.commit()
    
    print(f"✅ Created {len(vendors)} Vendors:")
    for vendor in vendors:
        print(f"   • {vendor.vendor_name} (GST: {vendor.gst_number})")


async def extract_from_image(file_path: Path):
    """Extract invoice data from real image or PDF using Groq"""
    print(f"\n⏳ Extracting invoice data from {file_path.name}...")
    
    try:
        # Pass the file_path directly into get_ocr_fusion
        fusion_data = await get_ocr_fusion(str(file_path))
        
        # If get_ocr_fusion returns a dict or text directly:
        if isinstance(fusion_data, dict):
            ocr_text = json.dumps(fusion_data)
        else:
            ocr_text = str(fusion_data or "")
            
        print(f"   OCR extracted {len(ocr_text)} characters from file")
        
        # Parse with Groq
        print(f"   Parsing with Groq...")
        client = Groq(api_key=settings.groq_api_key)
        
        prompt = f"""Analyze this invoice text and extract ONLY valid JSON (no markdown):

Invoice Text:
{ocr_text}

Return ONLY this JSON structure (fill missing fields with null):
{{
    "invoice_number": "string",
    "invoice_date": "YYYY-MM-DD",
    "vendor_name": "string",
    "vendor_gst": "string",
    "bill_to_name": "string",
    "bill_to_gst": "string",
    "subtotal": number,
    "tax_amount": number,
    "total_amount": number,
    "currency": "INR"
}}"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=1000
        )
        
        response_text = response.choices[0].message.content.strip()
        if response_text.startswith("```"):
            response_text = response_text.replace("```json", "").replace("```", "").strip()
        
        extracted = json.loads(response_text)
        print(f"✅ Extracted invoice: {extracted.get('invoice_number', 'N/A')}")
        return extracted
    
    except Exception as e:
        print(f"❌ Extraction failed: {e}")
        return None


async def validate_against_ledger(db, invoice_data):
    """Validate extracted invoice against purchase ledger"""
    print(f"\n⏳ Validating against Purchase Ledger...")
    
    validation_result = {
        "invoice_number": invoice_data.get('invoice_number'),
        "vendor_name": invoice_data.get('vendor_name'),
        "total_amount": invoice_data.get('total_amount'),
        "checks": []
    }
    
    # Check 1: Vendor exists in master
    vendor_name = invoice_data.get('vendor_name') or ""
    vendor = db.query(VendorMaster).filter(
        VendorMaster.vendor_name.ilike(f"%{vendor_name}%")
    ).first() if vendor_name else None
    
    if vendor:
        validation_result["checks"].append({
            "type": "VENDOR_FOUND",
            "status": "PASS ✅",
            "message": f"Vendor found in master: {vendor.vendor_name}",
            "gst_match": vendor.gst_number == invoice_data.get('vendor_gst')
        })
    else:
        validation_result["checks"].append({
            "type": "VENDOR_NOT_FOUND",
            "status": "FAIL ⚠️",
            "message": f"Vendor '{vendor_name}' not in master database",
            "risk": "HIGH"
        })
    
    # Check 2: GSTIN format validation
    gst = invoice_data.get('vendor_gst', '')
    gst_valid = len(gst) == 15 if gst else False
    
    validation_result["checks"].append({
        "type": "GSTIN_FORMAT",
        "status": "PASS ✅" if gst_valid else "FAIL ⚠️",
        "message": f"GSTIN length: {len(gst or '')}/15",
        "gstin": gst
    })
    
    # Check 3: Amount range check
    po = db.query(PurchaseLedger).filter(
        PurchaseLedger.vendor_name.ilike(f"%{vendor_name}%")
    ).first() if vendor_name else None
    
    if po:
        po_amt = float(po.expected_amount)
        inv_amt = float(invoice_data.get('total_amount') or 0.0)
        amount_match = abs(po_amt - inv_amt) < 1000
        
        validation_result["checks"].append({
            "type": "AMOUNT_VERIFICATION",
            "status": "PASS ✅" if amount_match else "WARN ⚠️",
            "po_amount": po_amt,
            "invoice_amount": inv_amt,
            "difference": po_amt - inv_amt
        })
    
    # Check 4: Invoice number check
    validation_result["checks"].append({
        "type": "INVOICE_NUMBER",
        "status": "OK",
        "invoice_number": invoice_data.get('invoice_number')
    })
    
    # Risk Score
    issues = sum(1 for c in validation_result["checks"] if "FAIL" in c["status"])
    warnings = sum(1 for c in validation_result["checks"] if "WARN" in c["status"])
    risk_score = (issues * 40) + (warnings * 20)
    
    validation_result["risk_score"] = min(100, risk_score)
    validation_result["status"] = "CRITICAL" if risk_score > 60 else "HIGH" if risk_score > 40 else "MEDIUM" if risk_score > 20 else "LOW"
    
    return validation_result


def locate_test_file() -> Path | None:
    """Finds demo PDF or image across standard project paths"""
    possible_paths = [
        Path(__file__).parent / "demo-invoice-20tax-2.pdf",
        Path(__file__).parent.parent / "demo-invoice-20tax-2.pdf",
        Path(__file__).parent.parent / "image.png",
        Path(__file__).parent / "image.png"
    ]
    
    for p in possible_paths:
        if p.exists():
            return p
    return None


async def main():
    print("\n" + "="*90)
    print("REAL EXTRACTION & VALIDATION TEST")
    print("Extracts from invoice file → Validates against Purchase Ledger")
    print("="*90)
    
    db = SessionLocal()
    init_db()
    
    try:
        # Setup
        await setup_ledger(db)
        await setup_vendor_master(db)
        
        # Locate sample file dynamically
        test_file_path = locate_test_file()
        if not test_file_path:
            print("❌ No test invoice file found! Please place 'demo-invoice-20tax-2.pdf' or 'image.png' in the root or backend folder.")
            return

        extracted_invoice = await extract_from_image(test_file_path)
        if not extracted_invoice:
            return
        
        # Validate
        validation = await validate_against_ledger(db, extracted_invoice)
        
        # Display results
        print("\n" + "="*90)
        print("VALIDATION RESULTS")
        print("="*90)
        
        print(f"\n📄 Invoice: {validation['invoice_number']}")
        print(f"🏢 Vendor: {validation['vendor_name']}")
        tot_amt = validation['total_amount'] or 0.0
        print(f"💰 Amount: ₹{float(tot_amt):,.2f}")
        
        print(f"\n📋 Checks:")
        for check in validation['checks']:
            print(f"   {check['status']}")
            if 'message' in check:
                print(f"      {check['message']}")
            else:
                for key, val in check.items():
                    if key not in ['status']:
                        print(f"      {key}: {val}")
        
        print(f"\n🎯 Risk Score: {validation['risk_score']}/100 ({validation['status']})")
        
        # Save results
        output_file = Path(__file__).parent / "docs" / "REAL_EXTRACTION_VALIDATION_RESULTS.json"
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, "w") as f:
            json.dump(validation, f, indent=2, default=str)
        
        print(f"\n✅ Results saved: {output_file}")
        
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())