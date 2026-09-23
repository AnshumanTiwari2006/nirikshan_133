"""
common_utils.py

Shared helper functions used by multiple pipeline scripts. Import from
here instead of copy-pasting — keeping ONE definition of each function
prevents the training-time and serving-time logic from silently drifting
apart (e.g. if the subcategory keyword list is updated in one file but
not another).

Place this file in D:\\SIH\\ alongside the other scripts.
"""
import re
import pandas as pd


def extract_subcategory(desc):
    """
    Maps a free-text work_description into one of 15 physical subcategories.
    Used by: train_xgboost.py, serialize_models.py (must stay identical
    between training and inference or the encoder mapping breaks).
    """
    if pd.isna(desc):
        return 'UNKNOWN'
    desc = str(desc).upper()
    if any(k in desc for k in ['ROAD', 'PATHWAY', 'PCC', 'CC ROAD', 'STREET']):
        return 'ROAD'
    if any(k in desc for k in ['BOUNDARY WALL', 'COMPOUND WALL']):
        return 'BOUNDARY WALL'
    if any(k in desc for k in ['COMMUNITY HALL', 'COMMUNITY BHAVAN', 'CULTURAL']):
        return 'COMMUNITY HALL'
    if any(k in desc for k in ['HANDPUMP', 'TUBEWELL', 'WATER', 'BOREWELL', 'PIPELINE']):
        return 'WATER SUPPLY'
    if any(k in desc for k in ['DRAIN', 'SEWERAGE']):
        return 'DRAINAGE'
    if any(k in desc for k in ['SOLAR', 'LIGHT', 'HIGH MAST', 'MAST', 'LED']):
        return 'LIGHTING'
    if any(k in desc for k in ['SCHOOL', 'CLASSROOM', 'COLLEGE']):
        return 'SCHOOL/CLASSROOM'
    if any(k in desc for k in ['HOSPITAL', 'CLINIC', 'HEALTH', 'AMBULANCE', 'MEDICAL']):
        return 'HEALTH'
    if any(k in desc for k in ['BUS STAND', 'SHELTER', 'SHED']):
        return 'SHELTER'
    if any(k in desc for k in ['TOILET', 'SANITATION', 'LAVATORY']):
        return 'SANITATION'
    if any(k in desc for k in ['PARK', 'GARDEN', 'PLAYGROUND', 'GYM']):
        return 'PARK/RECREATION'
    if any(k in desc for k in ['CREMATORIUM', 'GRAVEYARD', 'BURIAL', 'CEMETERY']):
        return 'CREMATORIUM'
    if any(k in desc for k in ['LIBRARY']):
        return 'LIBRARY'
    if any(k in desc for k in ['PANCHAYAT', 'OFFICE']):
        return 'PUBLIC OFFICE'
    return 'OTHER'


def normalize_vendor_name(name):
    """
    Collapses near-duplicate vendor names ("DARSH BUILDCON" vs "DARSH
    BUILDCON PVT LTD") into one canonical form.
    Used by: train_model4_network.py, train_model5_ensemble.py (must stay
    identical or the same real-world vendor will be treated as two
    different nodes in one script and one node in the other).
    """
    if pd.isna(name):
        return 'UNKNOWN'
    name = str(name).upper().strip()
    suffixes = [
        r'\bPVT\b', r'\bLTD\b', r'\bPRIVATE\b', r'\bLIMITED\b',
        r'\bCONTRACTORS\b', r'\bCONTRACTOR\b', r'\bCO\b', r'\bINC\b',
        r'\bLLC\b', r'\bENTERPRISES\b', r'\bENTERPRISE\b', r'\bBUILDCON\b',
        r'\bAND\b', r'\b&\b', r'\.', r','
    ]
    for s in suffixes:
        name = re.sub(s, '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name if name else 'UNKNOWN'
