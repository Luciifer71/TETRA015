from typing import Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models import Invoice, RiskReport, PurchaseLedger, VendorMaster, Exception as ExceptionModel
from app.schemas import BaseResponse, RiskDistributionData, RiskDistributionResponse
from app.utils import format_currency

router = APIRouter()


@router.get("/dashboard/summary", response_model=BaseResponse[dict])
async def get_summary(db: Session = Depends(get_db)):
    """Get dashboard summary statistics"""
    total_invoices = db.query(Invoice).count()
    processed = db.query(Invoice).filter(Invoice.status == "PROCESSED").count()
    pending = db.query(Invoice).filter(Invoice.status.in_(["PENDING", "PROCESSING"])).count()
    flagged = db.query(Invoice).filter(Invoice.status == "FLAGGED").count()
    
    total_amount = db.query(func.sum(Invoice.total_amount)).scalar() or 0
    avg_amount = float(total_amount) / total_invoices if total_invoices > 0 else 0
    
    high_risk = db.query(RiskReport).filter(RiskReport.risk_level.in_(["HIGH", "CRITICAL"])).count()
    exceptions_count = db.query(ExceptionModel).filter(ExceptionModel.resolved == False).count()
    pending_review = db.query(RiskReport).filter(RiskReport.requires_review == True).count()
    
    avg_processing = db.query(func.avg(
        func.extract('epoch', Invoice.processed_at - Invoice.uploaded_at) * 1000
    )).filter(Invoice.processed_at.isnot(None)).scalar() or 0
    
    top_vendors = db.query(
        Invoice.vendor_name,
        func.count(Invoice.id).label("invoice_count"),
        func.sum(Invoice.total_amount).label("total_amount")
    ).group_by(Invoice.vendor_name).order_by(desc("invoice_count")).limit(5).all()
    
    risk_dist = db.query(
        RiskReport.risk_level,
        func.count(RiskReport.id)
    ).group_by(RiskReport.risk_level).all()
    
    risk_dict = {level: count for level, count in risk_dist}
    
    return BaseResponse(
        success=True,
        data={
            "total_invoices": total_invoices,
            "total_amount": float(total_amount),
            "average_invoice_value": avg_amount,
            "invoices_processed": processed,
            "invoices_pending": pending,
            "invoices_flagged": flagged,
            "high_risk_count": high_risk,
            "exceptions_count": exceptions_count,
            "pending_review_count": pending_review,
            "average_processing_time_ms": float(avg_processing),
            "top_vendors": [
                {
                    "name": v.vendor_name,
                    "invoice_count": v.invoice_count,
                    "total_amount": float(v.total_amount),
                }
                for v in top_vendors
            ],
            "risk_distribution": {
                "LOW": risk_dict.get("LOW", 0),
                "MEDIUM": risk_dict.get("MEDIUM", 0),
                "HIGH": risk_dict.get("HIGH", 0),
                "CRITICAL": risk_dict.get("CRITICAL", 0),
            },
        },
        message="Dashboard summary retrieved",
    )


@router.get("/dashboard/risk-distribution", response_model=BaseResponse[RiskDistributionResponse])
async def get_risk_distribution(db: Session = Depends(get_db)):
    """Get risk level distribution for charts"""
    risk_dist = db.query(
        RiskReport.risk_level,
        func.count(RiskReport.id)
    ).group_by(RiskReport.risk_level).all()
    
    total = sum(count for _, count in risk_dist)
    
    colors = {
        "LOW": "#10B981",
        "MEDIUM": "#F59E0B",
        "HIGH": "#EF4444",
        "CRITICAL": "#DC2626",
    }
    
    data = []
    for level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        count = next((c for l, c in risk_dist if l == level), 0)
        data.append(RiskDistributionData(
            name=level,
            value=count,
            percentage=round((count / total * 100)) if total > 0 else 0,
            color=colors.get(level, "#6B7280"),
        ))
    
    return BaseResponse(
        success=True,
        data=RiskDistributionResponse(
            chart_type="pie",
            data=data,
            colors=[colors[level] for level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]],
        ),
        message="Risk distribution retrieved",
    )


@router.get("/dashboard/vendor-stats", response_model=BaseResponse[dict])
async def get_vendor_stats(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    """Get top vendors statistics"""
    vendors = db.query(
        Invoice.vendor_name,
        func.count(Invoice.id).label("invoice_count"),
        func.sum(Invoice.total_amount).label("total_amount"),
        func.avg(Invoice.total_amount).label("avg_amount"),
    ).group_by(Invoice.vendor_name).order_by(desc("invoice_count")).limit(limit).all()
    
    results = []
    for v in vendors:
        risk_count = db.query(RiskReport).join(Invoice).filter(
            Invoice.vendor_name == v.vendor_name,
            RiskReport.risk_level.in_(["HIGH", "CRITICAL"])
        ).count()
        
        vendor_master = db.query(VendorMaster).filter(
            VendorMaster.vendor_name == v.vendor_name
        ).first()
        
        results.append({
            "vendor_name": v.vendor_name,
            "invoice_count": v.invoice_count,
            "total_amount": float(v.total_amount),
            "average_invoice": float(v.avg_amount),
            "risk_count": risk_count,
            "status": vendor_master.status if vendor_master else "UNKNOWN",
        })
    
    return BaseResponse(
        success=True,
        data={"top_vendors": results},
        message="Vendor stats retrieved",
    )


@router.get("/dashboard/recent-uploads", response_model=BaseResponse[dict])
async def get_recent_uploads(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    """Get recently uploaded invoices"""
    invoices = db.query(Invoice).outerjoin(RiskReport).order_by(
        desc(Invoice.uploaded_at)
    ).limit(limit).all()
    
    results = []
    for inv in invoices:
        risk = db.query(RiskReport).filter(RiskReport.invoice_id == inv.id).first()
        results.append({
            "invoice_id": inv.id,
            "invoice_number": inv.invoice_number,
            "vendor_name": inv.vendor_name,
            "total_amount": float(inv.total_amount),
            "status": inv.status,
            "risk_level": risk.risk_level if risk else "UNKNOWN",
            "uploaded_at": inv.uploaded_at,
        })
    
    return BaseResponse(
        success=True,
        data={"invoices": results},
        message="Recent uploads retrieved",
    )