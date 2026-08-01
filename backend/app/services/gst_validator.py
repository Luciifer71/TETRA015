import re
from typing import Optional


GST_PATTERN = re.compile(
    r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
)

STATE_CODES = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
    "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
    "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
    "16": "Tripura", "17": "Meghalaya", "18": "Assam",
    "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
    "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "25": "Daman & Diu", "26": "Dadra & Nagar Haveli",
    "27": "Maharashtra", "28": "Andhra Pradesh", "29": "Karnataka",
    "30": "Goa", "31": "Lakshadweep", "32": "Kerala",
    "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar",
    "36": "Telangana", "37": "Andhra Pradesh (New)",
}


def validate_gst_format(gst: str) -> bool:
    """Validate GST format (15 characters)"""
    if not gst or len(gst) != 15:
        return False
    return bool(GST_PATTERN.match(gst.upper()))


def validate_gst_checksum(gst: str) -> bool:
    """Validate GST checksum using official algorithm"""
    if not validate_gst_format(gst):
        return False
    
    gst = gst.upper()
    factor = 0
    check_digit = 0
    
    for i, char in enumerate(gst[:14]):
        code = ord(char) - 48 if char.isdigit() else ord(char) - 55
        if i % 2 == 0:
            factor = code * 2
            if factor > 35:
                factor = factor - 36
        else:
            factor = code
        check_digit += factor
    
    check_digit = (36 - (check_digit % 36)) % 36
    actual_check = ord(gst[14]) - 48 if gst[14].isdigit() else ord(gst[14]) - 55
    
    return check_digit == actual_check


def extract_state_code(gst: str) -> Optional[str]:
    """Extract state code from GST (first 2 digits)"""
    if validate_gst_format(gst):
        code = gst[:2]
        return STATE_CODES.get(code, "Unknown")
    return None


def get_state_name(state_code: str) -> Optional[str]:
    """Get state name from code"""
    return STATE_CODES.get(state_code)


def is_valid_gst(gst: str) -> tuple[bool, str]:
    """Comprehensive GST validation"""
    if not gst:
        return False, "GST number is empty"
    
    if len(gst) != 15:
        return False, "GST must be 15 characters"
    
    if not validate_gst_format(gst):
        return False, "Invalid GST format"
    
    if not validate_gst_checksum(gst):
        return False, "Invalid GST checksum"
    
    return True, "Valid GST"