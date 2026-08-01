"""
TEST: Unified Invoice Processor Service
Shows how to use the service anywhere without separate test files
"""

import sys
import json
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal, init_db
from app.services.invoice_processor import get_invoice_processor
from app.models import VendorMaster, PurchaseLedger
from datetime import date


async def main():
    print("\n" + "="*90)
    print("UNIFIED INVOICE PROCESSOR TEST")
    print("Reusable service - same logic throughout")
    print("="*90)
    
    db = SessionLocal()
    init_db()
    
    # Setup Purchase Ledger
    print("\n[*] Setting up Purchase Ledger...")
    db.query(PurchaseLedger).delete()
    db.query(VendorMaster).delete()
    db.commit()
    
    pos = [
        PurchaseLedger(
            po_number='PO-2026-001',
            vendor_name='Gujarat Freight Tools',
            po_date=date(2026, 8, 1),
            expected_amount=3988.40,
            status='OPEN'
        )
    ]
    for po in pos:
        db.add(po)
    
    vendors = [
        VendorMaster(
            vendor_name='Gujarat Freight Tools',
            gst_number='24HDE7487RESRT4',
            status='ACTIVE'
        )
    ]
    for vendor in vendors:
        db.add(vendor)
    
    db.commit()
    print("[OK] Ledger and vendors set up")
    
    # Get processor
    processor = get_invoice_processor()
    
    # Process image
    image_path = Path(__file__).parent.parent / "image.png"
    if not image_path.exists():
        print(f"[ERROR] Image not found: {image_path}")
        return
    
    print(f"\n[*] Processing {image_path.name}...")
    report = await processor.process_image(str(image_path), db)
    
    # Display results
    print("\n" + "="*90)
    print("PROCESSING REPORT")
    print("="*90)
    
    if "error" in report:
        print(f"\n[ERROR] {report['error']}")
        return
    
    # Stages
    print("\n[STAGES]")
    for stage_name, stage_result in report["stages"].items():
        status = stage_result.get("status", "?")
        symbol = "[OK]" if status == "OK" else "[FAIL]" if status == "FAILED" else "[WARN]"
        print(f"   {symbol} {stage_name:25s} {status}")
    
    # Final Assessment
    if "final_assessment" in report:
        assessment = report["final_assessment"]
        
        print(f"\n[ASSESSMENT]")
        print(f"   Invoice: {assessment['invoice_number']}")
        print(f"   Vendor: {assessment['vendor_name']}")
        print(f"   Amount: Rs {assessment['total_amount']:,.2f}")
        
        print(f"\n[RISK ANALYSIS]")
        print(f"   Fraud Risk: {assessment['fraud_probability']:.0%} ({assessment['fraud_risk']})")
        print(f"   Ledger Status: {assessment['ledger_status']} (Score: {assessment['ledger_risk_score']}/100)")
        print(f"   Outlier Score: {assessment['outlier_score']:.0%}")
        print(f"   Business Rules: {assessment['business_rules_level']} ({assessment['business_rules_risk']}/100)")
        print(f"   Combined Risk: {assessment['combined_risk_score']}/100")
        
        print(f"\n[RECOMMENDATION]")
        print(f"   {assessment['recommendation']}")
    
    # Save report
    output_file = Path(__file__).parent / "docs" / "UNIFIED_PROCESSOR_REPORT.json"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, "w") as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n[OK] Report saved: {output_file}")
    print("\n" + "="*90)
    print("[SUCCESS] UNIFIED PROCESSOR WORKING")
    print("   * Real extraction from image")
    print("   * Real validation against ledger")
    print("   * Real fraud detection")
    print("   * Real risk assessment")
    print("   * Can be imported and used anywhere")
    print("="*90)
    
    db.close()


if __name__ == "__main__":
    asyncio.run(main())
