# Complete Invoice Audit Pipeline - Explained

**Date**: 2026-08-01  
**Question**: How does the system go from text extraction to detecting anomalies?  
**Answer**: Multi-layered pipeline with 10+ stages of analysis  

---

## The Complete Pipeline (Simple Explanation)

```
Invoice Image
    ↓
[1] IMAGE PREPROCESSING
    ↓
[2] TEXT EXTRACTION (OCR)
    ↓
[3] FIELD PARSING (Extract GST, Amount, Vendor, etc)
    ↓
[4] STRING MATCHING (Fix typos, normalize names)
    ↓
[5] VENDOR MATCHING (Who is this vendor?)
    ↓
[6] LEDGER MATCHING (Is it in our records?)
    ↓
[7] FRAUD DETECTION (XGBoost - Is it fake?)
    ↓
[8] OUTLIER DETECTION (Is amount unusual?)
    ↓
[9] RISK SCORING (12+ fraud detection rules)
    ↓
[10] NETWORK ANALYSIS (Vendor collusion detection)
    ↓
[11] EXPLAINABILITY (Why is it flagged?)
    ↓
RISK REPORT + AUDIT TRAIL
```

---

## Breaking It Down: Stage by Stage

### STAGE 1-3: DATA EXTRACTION
**What**: Convert image → text → structured fields  
**How**: OCR (EasyOCR or Gemini) → Groq/LLM parsing  
**Output**: 
```json
{
  "invoice_number": "INV-2024-001",
  "vendor_gst": "29ABCDE1234F1Z5",
  "total_amount": 696200.00,
  "invoice_date": "2024-08-01"
}
```

### STAGE 4: STRING MATCHING (Normalization)
**What**: Fix typos and variations in vendor names  
**How**: Fuzzy matching (Levenshtein distance)  
**Examples**:
- "ABC Supplies Ltd" = "ABC Supplies Limited" ✅ 89% match
- "INV-2024-001" = "INV2024001" ✅ 100% match
**Output**: Normalized vendor name with confidence

### STAGE 5: VENDOR MATCHING
**What**: Identify if vendor exists in our database  
**How**: TF-IDF similarity + Fuzzy matching  
**Example**:
```
Extracted: "ABC Supplies Ltd"
Database has: "ABC Supplies Limited"
Match: 92% confidence
→ Map to vendor ID: V-12345
```

### STAGE 6: LEDGER MATCHING
**What**: Check if invoice already in purchase ledger  
**How**: Match (invoice_number + vendor_id + amount + date)  
**Checks**:
- Is this invoice already processed?
- Is it a duplicate?
- Does amount match our purchase order?

**Output**:
```json
{
  "ledger_matched": true,
  "ledger_id": "PO-2024-001",
  "purchase_amount": 696200.00,
  "difference": 0,
  "status": "EXACT MATCH"
}
```

---

## STAGE 7-11: ANOMALY & FRAUD DETECTION

### STAGE 7: FRAUD DETECTION (XGBoost ML Model)

**What**: Machine learning model that predicts if invoice is fraudulent  
**Features analyzed**:
- Amount (is it reasonable?)
- Vendor (known good/bad?)
- Date (is it consistent?)
- Invoice number format (valid?)
- GST number format (valid?)
- Payment terms (suspicious?)
- Frequency (invoice 10x in one day?)

**How it works**:
```
Input Features:
  • vendor_history_count = 50 (vendor has 50 invoices)
  • amount_zscore = 2.1 (unusual, 2+ std dev above mean)
  • invoice_date_to_today = 5 (5 days old - normal)
  • gst_valid = 1 (GST format is valid)
  • first_time_vendor = 0 (known vendor)
  • same_amount_count = 0 (unique amount)
  ↓
  XGBoost Model Prediction
  ↓
  Fraud Score: 0.15 (15% chance of fraud)
  Risk: LOW ✅
```

**Output**:
```json
{
  "fraud_probability": 0.15,
  "fraud_risk_level": "LOW",
  "top_fraud_indicators": [
    {"feature": "amount_zscore", "contribution": 0.08},
    {"feature": "vendor_new", "contribution": 0.04},
    {"feature": "payment_terms_unusual", "contribution": 0.03}
  ]
}
```

### STAGE 8: OUTLIER DETECTION

**What**: Detects if invoice is unusual compared to history  
**Methods**:
1. **IsolationForest**: Finds isolated data points
2. **LOF (Local Outlier Factor)**: Checks against peer group
3. **Z-Score**: Statistical deviation
4. **IQR (Interquartile Range)**: Box plot method

**Example**:
```
Vendor Average Invoice: ₹50,000
Historical Range: ₹40,000 - ₹60,000
This Invoice: ₹696,200

Z-Score: 18.5 (way above normal!)
LOF: 0.92 (outlier)
IQR: Beyond upper whisker
Isolation Score: 0.89 (outlier)

Conclusion: ⚠️ OUTLIER DETECTED
```

**Output**:
```json
{
  "outlier_score": 0.89,
  "is_outlier": true,
  "anomaly_type": "high_amount",
  "compared_to_vendor_average": 13.9,
  "z_score": 18.5
}
```

### STAGE 9: RISK SCORING (12+ Rules)

**What**: Apply business rules for fraud detection  
**Rules**:

| Rule | Check | Example | Action |
|------|-------|---------|--------|
| Duplicate | Same invoice # + vendor | INV-001 from ABC twice | 🚩 Flag |
| Duplicate Amount | Same amount + vendor + date | ₹696,200 from ABC on 2024-08-01 | 🚩 Flag |
| Missing Ledger | Invoice not in PO | No matching purchase order | ⚠️ Review |
| GST Mismatch | Tax calc wrong | Should be ₹100K, is ₹200K | 🚩 Flag |
| Invalid GST | GST format wrong | "ABC123" (invalid format) | ❌ Error |
| Vendor Not Found | Vendor doesn't exist | Unknown vendor | ⚠️ Review |
| Amount Mismatch | Differs from PO | PO: ₹500K, Invoice: ₹700K | 🚩 Flag |
| Date Mismatch | Dates don't align | Invoice date > Due date | 🚩 Flag |
| Suspicious Vendor | Known bad vendor | Vendor flagged previously | 🚩 Flag |
| High Value | Above threshold | ₹1M+ (company limit: ₹500K) | ⚠️ Review |
| Repeated Transactions | Same pattern | 3 invoices same amount/vendor | ⚠️ Review |
| Low Confidence | Extraction uncertain | OCR confidence < 60% | ⚠️ Review |

**Example Output**:
```json
{
  "risk_score": 28,
  "risk_level": "MEDIUM",
  "triggered_rules": [
    {
      "rule": "high_value",
      "triggered": true,
      "message": "Invoice amount ₹696,200 > threshold ₹500,000"
    },
    {
      "rule": "outlier_detected",
      "triggered": true,
      "message": "Amount is 13.9x vendor average"
    }
  ],
  "total_rules_checked": 12,
  "rules_triggered": 2
}
```

### STAGE 10: NETWORK ANALYSIS (Vendor Collusion Detection)

**What**: Detects if vendors are colluding or connected  
**How**: Build graph of vendor relationships

**Graph Example**:
```
         Vendor A ←→ Vendor B
         ↓    ↑
         ↓    └── Vendor C
         ↓
      Owner X

Analysis:
- Cycle detected: A→B→C→A (possible collusion ring)
- Common owner: Vendor A & B share owner
- Same address: Vendor A & B at same address
```

**Output**:
```json
{
  "vendor_network": {
    "nodes": 5,
    "edges": 8,
    "cycles_detected": 2,
    "cliques_detected": 3
  },
  "suspicious_patterns": [
    {
      "type": "cycle",
      "vendors": ["Vendor A", "Vendor B", "Vendor C"],
      "risk": "HIGH - Possible collusion ring"
    }
  ]
}
```

### STAGE 11: EXPLAINABILITY (Why is it flagged?)

**What**: Shows exactly WHY an invoice got a certain risk score  
**How**: SHAP values (machine learning explainability)

**Example**:
```
Risk Score: 65/100 (HIGH)

Factors Contributing to HIGH Risk:
┌─────────────────────────────────────┐
│ Amount is 13.9x average (+0.25)      │
│ Vendor seen for first time (+0.15)   │
│ GST format suspicious pattern (+0.10)│
│ High invoice frequency this week     │
│   (+0.08)                            │
│ Not in any PO match (+0.07)          │
└─────────────────────────────────────┘

What reduced the risk:
✅ Vendor GST is valid (-0.05)
✅ Invoice date is today (-0.02)
```

---

## Real Example: Complete Pipeline Run

### Input Invoice
```
Image: invoice.png
Contains:
- Invoice #: INV-2024-001
- Vendor: ABC Supplies Ltd
- Vendor GST: 29ABCDE1234F1Z5
- Amount: ₹696,200
- Date: 2024-08-01
```

### Pipeline Execution

**Stage 1-3: Extraction** ✅
```
Extracted Fields:
- invoice_number: INV-2024-001
- vendor_name: ABC Supplies Ltd
- vendor_gst: 29ABCDE1234F1Z5
- total_amount: 696200
- confidence: 92%
```

**Stage 4: Normalization** ✅
```
Vendor names matched:
"ABC Supplies Ltd" = "ABC Supplies Limited" (89% match)
Normalized to: "ABC Supplies Limited"
```

**Stage 5: Vendor Lookup** ✅
```
Found in database:
- Vendor ID: V-12345
- Previous invoices: 50
- Average amount: ₹50,000
- Reliability score: 0.95
```

**Stage 6: Ledger Check** ✅
```
Ledger match found:
- PO ID: PO-2024-001
- PO Amount: ₹700,000
- Invoice Amount: ₹696,200
- Difference: ₹3,800 (0.5% variance - acceptable)
```

**Stage 7: Fraud Detection** ✅
```
XGBoost Analysis:
- Features: 20
- Fraud Score: 0.15 (15%)
- Risk Level: LOW
- Top indicator: Amount within normal range
```

**Stage 8: Outlier Detection** ✅
```
Statistical Analysis:
- Amount: ₹696,200
- Vendor average: ₹50,000
- Z-score: 18.5 (outlier!)
- Outlier confidence: 89%
Status: ⚠️ HIGH AMOUNT (but valid PO exists)
```

**Stage 9: Risk Scoring** ✅
```
Rules checked: 12
Rules triggered: 1
- high_value: True (amount exceeds threshold)

Risk Score: 28/100
Risk Level: LOW-MEDIUM
```

**Stage 10: Network Analysis** ✅
```
Vendor graph:
- In network: YES
- Connected to: 5 other vendors
- Cycles: 0
- Cliques: 0
- Collusion risk: LOW
```

**Stage 11: Explainability** ✅
```
Risk drivers:
1. High amount compared to average (+25%)
2. Valid PO found (-15%)
3. Known vendor (-10%)
4. Valid GST format (-5%)

Explanation:
"Invoice is higher than typical, but matches PO and 
vendor is reliable. Recommend approval with review."
```

### Final Output
```json
{
  "invoice_id": "INV-2024-001",
  "status": "REVIEW_RECOMMENDED",
  "risk_score": 28,
  "risk_level": "LOW_MEDIUM",
  "confidence": 0.92,
  "actions": [
    "Approve (amount matches PO)",
    "Verify vendor identity",
    "Check for duplicate within 30 days"
  ],
  "audit_trail": {
    "extraction": "92% confidence",
    "vendor_matched": "V-12345",
    "ledger_matched": "PO-2024-001",
    "fraud_risk": "15%",
    "anomaly_score": 0.89,
    "rules_triggered": ["high_value"],
    "network_risk": "LOW"
  }
}
```

---

## How Anomalies Are Detected

### Method 1: Statistical (Rule-Based)
```
If amount > vendor_average × 5:
  → Flag as HIGH_VALUE anomaly
```

### Method 2: Machine Learning (XGBoost)
```
Train on historical data:
  • 1000 legitimate invoices
  • 50 fraudulent invoices
  
Learn patterns that indicate fraud
  
For new invoice:
  Predict: Fraud probability 0-1
```

### Method 3: Isolation Forest (Unsupervised)
```
Build tree of random features
Invoices that isolate quickly = outliers
```

### Method 4: Network Analysis (Graph-Based)
```
Build vendor relationship graph
Find cycles/cliques = collusion
```

### Method 5: Business Rules (Domain Expert)
```
If GST invalid:
  → INVALID_GST anomaly

If duplicate found:
  → DUPLICATE_INVOICE anomaly
```

---

## Why Multiple Methods?

Each method catches different types of anomalies:

| Anomaly Type | Detection Method |
|---|---|
| High amount | Statistical + XGBoost |
| Fraudulent vendor | ML model |
| Duplicate invoice | Rule-based match |
| Invalid GST | Regex pattern |
| Vendor collusion | Network analysis |
| Typos in names | Fuzzy matching |
| Unusual patterns | Isolation Forest |

---

## Summary: Text Extraction → Anomaly Detection

```
EXTRACTION PHASE (Stages 1-6):
  ├─ Image → Text (OCR)
  ├─ Text → Fields (LLM)
  ├─ Fields → Normalized (String matching)
  ├─ Normalized → Vendor ID (Database)
  └─ Vendor ID → Purchase Order (Database)

DETECTION PHASE (Stages 7-11):
  ├─ Fraud Likelihood (XGBoost ML)
  ├─ Statistical Anomalies (Z-score, LOF, etc)
  ├─ Business Rules (12+ checks)
  ├─ Relationship Patterns (Network analysis)
  └─ Risk Explanation (SHAP)

OUTPUT:
  Risk Score (0-100)
  Risk Level (LOW/MEDIUM/HIGH)
  Triggered Rules/Anomalies
  Audit Trail
  Recommendation (APPROVE/REVIEW/REJECT)
```

---

## Complete Pipeline Flow

```
┌─────────────────────┐
│  Invoice Image      │
└──────────┬──────────┘
           ↓
    ┌──────────────┐
    │ 1. Preprocess│
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ 2. OCR/Text  │
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ 3. Extract   │
    │   Fields     │ ← GST, Invoice#, Amount
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ 4. Normalize │
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ 5. Vendor    │ ← Find vendor ID
    │   Match      │
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ 6. Ledger    │ ← Find PO
    │   Match      │
    └──────┬───────┘
           ↓
    ┌──────────────────────────────────┐
    │   ANOMALY DETECTION ENGINES       │
    ├──────────────────────────────────┤
    │ 7. XGBoost (Fraud ML)             │
    │ 8. Isolation Forest (Outliers)    │
    │ 9. Risk Rules (12+ checks)        │
    │10. Network Graph (Collusion)      │
    │11. SHAP (Explainability)          │
    └──────┬───────────────────────────┘
           ↓
    ┌──────────────────────┐
    │ RISK REPORT          │
    ├──────────────────────┤
    │ Risk Score: 28/100   │
    │ Risk Level: MEDIUM   │
    │ Status: REVIEW       │
    │ Anomalies: 2         │
    │ Rules Triggered: 1   │
    │ Recommendation: ✅   │
    └──────────────────────┘
```

---

## Bottom Line

✅ **Text Extraction** = Get the data from image  
✅ **Field Parsing** = Understand what the data means  
✅ **Normalization** = Fix variations and typos  
✅ **Database Matching** = Connect to known records  
✅ **ML Models** = Detect statistical anomalies  
✅ **Business Rules** = Apply domain expert knowledge  
✅ **Network Analysis** = Find collusion patterns  
✅ **Explainability** = Show why it's flagged  

**Result**: Comprehensive fraud detection + audit trail ✅

