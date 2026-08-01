import csv
import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal, Base
from app.models import PurchaseLedger, VendorMaster


def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database schema created")


def import_ledger_csv(csv_path: str = "data/purchase_ledger.csv"):
    """Import purchase ledger from CSV"""
    db = SessionLocal()
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                ledger = PurchaseLedger(
                    id=row.get('id', str(uuid.uuid4())),
                    po_number=row['po_number'],
                    invoice_number=row.get('invoice_number'),
                    vendor_name=row['vendor_name'],
                    vendor_gst=row.get('vendor_gst'),
                    po_date=datetime.strptime(row['po_date'], '%Y-%m-%d').date() if row.get('po_date') else date.today(),
                    expected_amount=Decimal(row['expected_amount']),
                    description=row.get('description'),
                    status=row.get('status', 'OPEN'),
                )
                db.add(ledger)
                count += 1
            db.commit()
            print(f"✅ Imported {count} ledger entries")
    except FileNotFoundError:
        print(f"⚠️  CSV not found: {csv_path}. Creating sample data...")
        create_sample_ledger(db)
    except Exception as e:
        print(f"❌ Error importing ledger: {e}")
        db.rollback()
    finally:
        db.close()


def import_vendor_csv(csv_path: str = "data/vendor_master.csv"):
    """Import vendor master from CSV"""
    db = SessionLocal()
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                vendor = VendorMaster(
                    id=row.get('id', str(uuid.uuid4())),
                    vendor_name=row['vendor_name'],
                    vendor_code=row.get('vendor_code'),
                    gst_number=row.get('gst_number'),
                    pan_number=row.get('pan_number'),
                    email=row.get('email'),
                    phone=row.get('phone'),
                    address=row.get('address'),
                    city=row.get('city'),
                    state=row.get('state'),
                    country=row.get('country', 'India'),
                    status=row.get('status', 'ACTIVE'),
                    is_suspicious=row.get('is_suspicious', 'false').lower() == 'true',
                )
                db.add(vendor)
                count += 1
            db.commit()
            print(f"✅ Imported {count} vendor records")
    except FileNotFoundError:
        print(f"⚠️  CSV not found: {csv_path}. Creating sample data...")
        create_sample_vendors(db)
    except Exception as e:
        print(f"❌ Error importing vendors: {e}")
        db.rollback()
    finally:
        db.close()


def create_sample_ledger(db: Session):
    """Create sample purchase ledger data"""
    sample_ledgers = [
        {"po_number": "PO-2024-001", "invoice_number": "INV-2024-001", "vendor_name": "ABC Supplies Ltd", "vendor_gst": "29ABCDE1234F1Z5", "po_date": "2024-07-10", "expected_amount": "59000.00", "description": "10 Laptops for IT department"},
        {"po_number": "PO-2024-002", "invoice_number": "INV-2024-002", "vendor_name": "XYZ Technologies", "vendor_gst": "27XYZTE5678G2Z6", "po_date": "2024-07-12", "expected_amount": "125000.00", "description": "Annual software licenses"},
        {"po_number": "PO-2024-003", "invoice_number": "INV-2024-003", "vendor_name": "Mega Corp Solutions", "vendor_gst": "09MEGAC9012H3Z7", "po_date": "2024-07-15", "expected_amount": "45000.00", "description": "Office furniture"},
        {"po_number": "PO-2024-004", "invoice_number": "INV-2024-004", "vendor_name": "Global Traders Inc", "vendor_gst": "33GLOBA3456I4Z8", "po_date": "2024-07-18", "expected_amount": "78000.00", "description": "Raw materials - steel"},
        {"po_number": "PO-2024-005", "invoice_number": "INV-2024-005", "vendor_name": "Prime Vendors Co", "vendor_gst": "07PRIME7890J5Z9", "po_date": "2024-07-20", "expected_amount": "210000.00", "description": "Machinery equipment"},
    ]
    
    for i in range(20):
        idx = i % len(sample_ledgers)
        base = sample_ledgers[idx].copy()
        base["po_number"] = f"{base['po_number']}-{i//len(sample_ledgers)+1:03d}"
        base["invoice_number"] = f"{base['invoice_number']}-{i//len(sample_ledgers)+1:03d}"
        
        ledger = PurchaseLedger(
            id=str(uuid.uuid4()),
            po_number=base["po_number"],
            invoice_number=base["invoice_number"],
            vendor_name=base["vendor_name"],
            vendor_gst=base["vendor_gst"],
            po_date=datetime.strptime(base["po_date"], '%Y-%m-%d').date(),
            expected_amount=Decimal(base["expected_amount"]),
            description=base["description"],
            status="OPEN",
        )
        db.add(ledger)
    
    db.commit()
    print(f"✅ Created {len(sample_ledgers) * 4} sample ledger entries")


def create_sample_vendors(db: Session):
    """Create sample vendor master data"""
    sample_vendors = [
        {"vendor_name": "ABC Supplies Ltd", "vendor_code": "VENDOR-ABC-001", "gst_number": "29ABCDE1234F1Z5", "pan_number": "ABCDE1234F", "email": "contact@abcsupplies.com", "phone": "+91-9876543210", "address": "123 Industrial Area, Phase 2", "city": "Bangalore", "state": "Karnataka", "is_suspicious": False},
        {"vendor_name": "XYZ Technologies", "vendor_code": "VENDOR-XYZ-002", "gst_number": "27XYZTE5678G2Z6", "pan_number": "XYZTE5678G", "email": "sales@xyztech.com", "phone": "+91-8765432109", "address": "456 Tech Park, Whitefield", "city": "Bangalore", "state": "Karnataka", "is_suspicious": False},
        {"vendor_name": "Mega Corp Solutions", "vendor_code": "VENDOR-MEG-003", "gst_number": "09MEGAC9012H3Z7", "pan_number": "MEGAC9012H", "email": "info@megacorp.com", "phone": "+91-7654321098", "address": "789 Business District", "city": "Lucknow", "state": "Uttar Pradesh", "is_suspicious": False},
        {"vendor_name": "Global Traders Inc", "vendor_code": "VENDOR-GLB-004", "gst_number": "33GLOBA3456I4Z8", "pan_number": "GLOBA3456I", "email": "trade@globaltraders.com", "phone": "+91-6543210987", "address": "321 Export Zone", "city": "Chennai", "state": "Tamil Nadu", "is_suspicious": False},
        {"vendor_name": "Prime Vendors Co", "vendor_code": "VENDOR-PRM-005", "gst_number": "07PRIME7890J5Z9", "pan_number": "PRIME7890J", "email": "orders@primevendors.com", "phone": "+91-5432109876", "address": "555 Industrial Estate", "city": "Delhi", "state": "Delhi", "is_suspicious": True},
        {"vendor_name": "Suspect Vendor Ltd", "vendor_code": "VENDOR-SUS-006", "gst_number": "29SUSPE1111K1Z1", "pan_number": "SUSPE1111K", "email": "fake@suspect.com", "phone": "+91-9999999999", "address": "Unknown Location", "city": "Unknown", "state": "Unknown", "is_suspicious": True},
    ]
    
    for i in range(30):
        idx = i % len(sample_vendors)
        base = sample_vendors[idx].copy()
        if i >= len(sample_vendors):
            base["vendor_name"] = f"{base['vendor_name']} {i//len(sample_vendors)+1}"
            base["vendor_code"] = f"{base['vendor_code']}-{i//len(sample_vendors)+1}"
        
        vendor = VendorMaster(
            id=str(uuid.uuid4()),
            vendor_name=base["vendor_name"],
            vendor_code=base["vendor_code"],
            gst_number=base["gst_number"],
            pan_number=base["pan_number"],
            email=base["email"],
            phone=base["phone"],
            address=base["address"],
            city=base["city"],
            state=base["state"],
            country="India",
            status="ACTIVE",
            is_suspicious=base["is_suspicious"],
        )
        db.add(vendor)
    
    db.commit()
    print(f"✅ Created {len(sample_vendors) * 5} sample vendor records")


if __name__ == "__main__":
    print("🔄 Initializing database...")
    init_db()
    import_ledger_csv()
    import_vendor_csv()
    print("✅ Database initialization complete!")