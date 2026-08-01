import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, Numeric, CheckConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class VendorMaster(Base):
    __tablename__ = "vendor_master"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_name = Column(String(255), nullable=False)
    vendor_code = Column(String(50), unique=True)
    gst_number = Column(String(15), unique=True, index=True)
    pan_number = Column(String(10))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100), default="India")
    status = Column(String(20), default="ACTIVE", index=True)
    is_suspicious = Column(Boolean, default=False, index=True)
    risk_notes = Column(Text)
    total_transactions = Column(Integer, default=0)
    total_amount = Column(Numeric(15, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoices = relationship("Invoice", back_populates="vendor_match")

    __table_args__ = (
        CheckConstraint("status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED')"),
    )