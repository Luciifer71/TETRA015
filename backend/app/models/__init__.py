import uuid
from datetime import datetime
from sqlalchemy import Column, String, Date, DateTime, Numeric, Boolean, Text, JSON, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_number = Column(String(100), nullable=False, index=True)
    vendor_name = Column(String(255), nullable=False, index=True)
    vendor_gst = Column(String(15))
    invoice_date = Column(Date, nullable=False, index=True)
    due_date = Column(Date)
    subtotal = Column(Numeric(15, 2), nullable=False)
    tax_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), nullable=False, index=True)
    currency = Column(String(3), default="INR")
    line_items = Column(JSON)
    extracted_data = Column(JSON)
    confidence_scores = Column(JSON)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="PENDING", index=True)
    ledger_match_id = Column(String(36), ForeignKey("purchase_ledger.id"), nullable=True)
    vendor_match_id = Column(String(36), ForeignKey("vendor_master.id"), nullable=True)
    is_duplicate = Column(Boolean, default=False, index=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, index=True)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ledger_match = relationship("PurchaseLedger", back_populates="matched_invoices")
    vendor_match = relationship("VendorMaster", back_populates="invoices")
    risk_report = relationship("RiskReport", back_populates="invoice", uselist=False)
    exceptions = relationship("Exception", back_populates="invoice", cascade="all, delete-orphan")
    audit_trail = relationship("AuditTrail", back_populates="invoice", cascade="all, delete-orphan")
    upload = relationship("Upload", back_populates="invoice", uselist=False)

    __table_args__ = (
        CheckConstraint("status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FLAGGED', 'APPROVED', 'REJECTED')"),
        Index("idx_invoice_vendor_date", "vendor_name", "invoice_date"),
        Index("idx_invoice_status_date", "status", "uploaded_at"),
    )


class PurchaseLedger(Base):
    __tablename__ = "purchase_ledger"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_number = Column(String(100), nullable=False, unique=True, index=True)
    invoice_number = Column(String(100), index=True)
    vendor_name = Column(String(255), nullable=False, index=True)
    vendor_gst = Column(String(15))
    po_date = Column(Date, nullable=False, index=True)
    expected_amount = Column(Numeric(15, 2), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="OPEN", index=True)
    matched_invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    matched_invoices = relationship("Invoice", back_populates="ledger_match")

    __table_args__ = (
        CheckConstraint("status IN ('OPEN', 'MATCHED', 'CLOSED', 'CANCELLED')"),
    )


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


class Exception(Base):
    __tablename__ = "exceptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    exception_type = Column(String(50), nullable=False, index=True)
    exception_category = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, index=True)
    field_name = Column(String(100))
    expected_value = Column(String(255))
    actual_value = Column(String(255))
    auto_detected = Column(Boolean, default=True)
    resolved = Column(Boolean, default=False, index=True)
    resolved_by = Column(String(100))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="exceptions")

    __table_args__ = (
        CheckConstraint("exception_category IN ('VALIDATION', 'MATCHING', 'COMPLIANCE', 'DUPLICATE')"),
        CheckConstraint("severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')"),
    )


class RiskReport(Base):
    __tablename__ = "risk_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    risk_score = Column(Integer, nullable=False, index=True)
    risk_level = Column(String(20), nullable=False, index=True)
    risk_factors = Column(JSON, nullable=False)
    rule_results = Column(JSON)
    confidence_score = Column(Numeric(5, 2))
    explanation = Column(Text)
    recommendations = Column(Text)
    duplicate_of = Column(String(36))
    similarity_score = Column(Numeric(5, 2))
    requires_review = Column(Boolean, default=False, index=True)
    reviewed = Column(Boolean, default=False)
    reviewed_by = Column(String(100))
    reviewed_at = Column(DateTime)
    review_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="risk_report")

    __table_args__ = (
        CheckConstraint("risk_score >= 0 AND risk_score <= 100"),
        CheckConstraint("risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')"),
        Index("idx_risk_level_score", "risk_level", "risk_score"),
    )


class AuditTrail(Base):
    __tablename__ = "audit_trail"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    action_category = Column(String(20), nullable=False)
    actor = Column(String(100))
    details = Column(Text)
    metadata = Column(JSON)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    invoice = relationship("Invoice", back_populates="audit_trail")

    __table_args__ = (
        CheckConstraint("action_category IN ('SYSTEM', 'USER', 'AI', 'BATCH')"),
    )


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False, unique=True)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(100), nullable=False)
    file_extension = Column(String(10), nullable=False)
    upload_status = Column(String(20), default="PENDING", index=True)
    processing_time_ms = Column(Integer)
    error_message = Column(Text)
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=True, index=True)
    uploaded_by = Column(String(100))
    uploaded_at = Column(DateTime, default=datetime.utcnow, index=True)
    processed_at = Column(DateTime)

    invoice = relationship("Invoice", back_populates="upload")

    __table_args__ = (
        CheckConstraint("upload_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')"),
    )