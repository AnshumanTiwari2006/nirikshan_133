# """
# notifications.py

# Notification Centre backend for NIRIKSHAN.

# Rule-based escalation engine (deterministic, same philosophy as the
# rule-based baseline risk score — no ML here, just transparent thresholds):

#   Stage 1  VENDOR_INITIAL     -> fires at day 0 (sanction date)
#   Stage 2  VENDOR_REMINDER    -> fires at days_pending >= 50
#   Stage 3  MP_ESCALATION_1    -> fires at days_pending >= 100
#   Stage 4  MP_ESCALATION_2    -> fires at days_pending >= 150
#   (independent) FUND_REQUEST_MP -> fires whenever cost_deviation_pct_signed > 0

# Only PENDING/ONGOING works (is_completed = False) are considered.

# This is a DEMO notification system: no real SMS/email is sent. Every
# "send" is a row written to the notification_log table, which the frontend
# polls to render the Notification Centre and the fake pop-up toast.
# """
# import sqlite3
# import uuid
# from datetime import datetime, timedelta
# from typing import Optional

# from fastapi import APIRouter, HTTPException, Query
# from pydantic import BaseModel

# router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# DB_PATH = "mplads.db"   # same DB used by the rest of main.py — adjust if yours differs


# # ---------------------------------------------------------------------
# # DB setup — creates the notification_log table if it doesn't exist yet.
# # Call ensure_notification_table() once at startup from main.py.
# # ---------------------------------------------------------------------
# def ensure_notification_table():
#     conn = sqlite3.connect(DB_PATH)
#     conn.execute("""
#         CREATE TABLE IF NOT EXISTS notification_log (
#             id TEXT PRIMARY KEY,
#             work_id TEXT NOT NULL,
#             stage TEXT NOT NULL,             -- VENDOR_INITIAL / VENDOR_REMINDER / MP_ESCALATION_1 / MP_ESCALATION_2 / FUND_REQUEST_MP / MANUAL
#             recipient_type TEXT NOT NULL,    -- VENDOR / MP / OTHER
#             recipient_name TEXT,
#             recipient_photo_url TEXT,
#             message TEXT NOT NULL,
#             days_pending_at_send INTEGER,
#             flag_rate REAL,                  -- optional escalation intensity, 0-100, used on manual resends
#             sent_date TEXT NOT NULL,
#             is_manual INTEGER DEFAULT 0,     -- 1 if triggered by a human via "Resend" / "Send to anyone"
#             status TEXT DEFAULT 'SENT'       -- SENT / READ / FAILED (demo-only, always SENT here)
#         )
#     """)
#     conn.commit()
#     conn.close()


# # ---------------------------------------------------------------------
# # Pydantic request models
# # ---------------------------------------------------------------------
# class ResendRequest(BaseModel):
#     work_id: str
#     stage: str                      # which stage to re-send (e.g. "VENDOR_REMINDER")
#     custom_message: Optional[str] = None
#     flag_rate: Optional[float] = None   # 0-100, lets the user dial escalation intensity


# class SendToAnyoneRequest(BaseModel):
#     work_id: Optional[str] = None
#     recipient_type: str              # VENDOR / MP / OTHER
#     recipient_name: str
#     recipient_photo_url: Optional[str] = None
#     message: str


# # ---------------------------------------------------------------------
# # Core escalation logic — pure function, easy to unit test / debug
# # ---------------------------------------------------------------------
# def compute_stage_events(work_id, sanction_date_str, vendor_name, mp_name,
#                           cost_deviation_pct_signed, today=None):
#     """
#     Given one pending/ongoing work, returns the list of notification
#     events that SHOULD exist by today, given the escalation formula.
#     This is what seeds the fake historical log for the demo.
#     """
#     if today is None:
#         today = datetime.now()
#     try:
#         sanction_date = datetime.strptime(sanction_date_str[:10], "%Y-%m-%d")
#     except (ValueError, TypeError):
#         return []

#     days_pending = (today - sanction_date).days
#     if days_pending < 0:
#         return []

#     events = []

#     def add(stage, days_offset, recipient_type, recipient_name, message):
#         events.append({
#             "id": str(uuid.uuid4()),
#             "work_id": work_id,
#             "stage": stage,
#             "recipient_type": recipient_type,
#             "recipient_name": recipient_name,
#             "recipient_photo_url": None,
#             "message": message,
#             "days_pending_at_send": days_offset,
#             "flag_rate": None,
#             "sent_date": (sanction_date + timedelta(days=days_offset)).strftime("%Y-%m-%d"),
#             "is_manual": 0,
#             "status": "SENT",
#         })

#     # Stage 1 — always fires at day 0
#     add("VENDOR_INITIAL", 0, "VENDOR", vendor_name or "Unknown Vendor",
#         f"Work {work_id} has been sanctioned. Please begin execution as per the "
#         f"approved scope and timeline. Sanction date: {sanction_date.strftime('%d %b %Y')}.")

#     # Stage 2 — 50+ days pending
#     if days_pending >= 50:
#         add("VENDOR_REMINDER", 50, "VENDOR", vendor_name or "Unknown Vendor",
#             f"Reminder: Work {work_id} has been pending for 50+ days since sanction "
#             f"with no completion recorded. Please provide a status update urgently.")

#     # Stage 3 — 100+ days pending, MP/MLA informed
#     if days_pending >= 100:
#         add("MP_ESCALATION_1", 100, "MP", mp_name or "Unknown MP",
#             f"Notice: Work {work_id} under your constituency has been pending for "
#             f"100+ days past sanction with no completion. Vendor has been reminded "
#             f"twice with no resolution. Your review is requested.")

#     # Stage 4 — 150+ days pending, MP informed again
#     if days_pending >= 150:
#         add("MP_ESCALATION_2", 150, "MP", mp_name or "Unknown MP",
#             f"Second Notice: Work {work_id} remains incomplete after 150+ days. "
#             f"This work requires immediate administrative attention and possible "
#             f"vendor reassignment review.")

#     # Independent trigger — fund overrun, MP notified regardless of day-stage
#     if cost_deviation_pct_signed is not None and cost_deviation_pct_signed > 0:
#         add("FUND_REQUEST_MP", days_pending, "MP", mp_name or "Unknown MP",
#             f"Fund Alert: Work {work_id} is trending {cost_deviation_pct_signed:.0f}% "
#             f"above its predicted cost. Additional fund authorization may be required. "
#             f"Please review before further disbursement.")

#     return events


# def seed_logs_if_empty():
#     """
#     One-time seeding: if notification_log is empty, generate the full
#     historical log for every pending/ongoing work using the formula above.
#     Safe to call on every startup — it's a no-op once seeded.
#     """
#     conn = sqlite3.connect(DB_PATH)
#     conn.row_factory = sqlite3.Row
#     existing = conn.execute("SELECT COUNT(*) as c FROM notification_log").fetchone()["c"]
#     if existing > 0:
#         conn.close()
#         return

#     rows = conn.execute("""
#         SELECT fw.work_id, fw.sanction_date, fw.mp_code, dm.mp_name_clean,
#                fp.vendor_name_clean, fwr.cost_deviation_score_norm,
#                cd.cost_deviation_pct_signed
#         FROM fact_work fw
#         LEFT JOIN dim_mp dm ON fw.mp_code = dm.mp_code
#         LEFT JOIN (SELECT work_id, vendor_name_clean FROM fact_payment GROUP BY work_id) fp
#                ON fw.work_id = fp.work_id
#         LEFT JOIN fact_work_risk fwr ON fw.work_id = fwr.work_id
#         LEFT JOIN cost_deviations cd ON fw.work_id = cd.work_id
#         WHERE fw.is_completed = 0 OR fw.is_completed IS NULL
#     """).fetchall()

#     all_events = []
#     for r in rows:
#         events = compute_stage_events(
#             r["work_id"], r["sanction_date"], r["vendor_name_clean"],
#             r["mp_name_clean"], r["cost_deviation_pct_signed"]
#         )
#         all_events.extend(events)

#     conn.executemany("""
#         INSERT INTO notification_log
#         (id, work_id, stage, recipient_type, recipient_name, recipient_photo_url,
#          message, days_pending_at_send, flag_rate, sent_date, is_manual, status)
#         VALUES (:id, :work_id, :stage, :recipient_type, :recipient_name,
#                 :recipient_photo_url, :message, :days_pending_at_send, :flag_rate,
#                 :sent_date, :is_manual, :status)
#     """, all_events)
#     conn.commit()
#     conn.close()


# # ---------------------------------------------------------------------
# # Endpoints
# # ---------------------------------------------------------------------
# @router.get("/pending")
# def get_pending_notifications(page: int = 1, limit: int = 25, stage: str = "",
#                                search: str = ""):
#     """
#     List pending/ongoing works with their CURRENT (latest) notification
#     stage and a short log preview. Powers the main Notification Centre table.
#     """
#     conn = sqlite3.connect(DB_PATH)
#     conn.row_factory = sqlite3.Row

#     where = "WHERE (fw.is_completed = 0 OR fw.is_completed IS NULL)"
#     params = []
#     if search:
#         where += " AND (fw.work_id LIKE ? OR dm.mp_name_clean LIKE ?)"
#         params += [f"%{search}%", f"%{search}%"]

#     base_query = f"""
#         SELECT fw.work_id, fw.district_name, fw.state, fw.sanction_amount,
#                fw.sanction_date, dm.mp_name_clean as mp_name,
#                fwr.final_risk_score, fwr.risk_band
#         FROM fact_work fw
#         LEFT JOIN dim_mp dm ON fw.mp_code = dm.mp_code
#         LEFT JOIN fact_work_risk fwr ON fw.work_id = fwr.work_id
#         {where}
#         ORDER BY fw.sanction_date ASC
#         LIMIT ? OFFSET ?
#     """
#     params_paginated = params + [limit, (page - 1) * limit]
#     works = conn.execute(base_query, params_paginated).fetchall()

#     result = []
#     for w in works:
#         logs = conn.execute(
#             "SELECT * FROM notification_log WHERE work_id = ? ORDER BY sent_date DESC LIMIT 1",
#             (w["work_id"],)
#         ).fetchone()
#         latest_stage = logs["stage"] if logs else "NONE"
#         if stage and latest_stage != stage:
#             continue
#         days_pending = (datetime.now() - datetime.strptime(w["sanction_date"][:10], "%Y-%m-%d")).days \
#             if w["sanction_date"] else None
#         result.append({
#             "work_id": w["work_id"],
#             "district": w["district_name"],
#             "state": w["state"],
#             "sanction_amount": w["sanction_amount"],
#             "mp_name": w["mp_name"],
#             "risk_score": w["final_risk_score"],
#             "risk_band": w["risk_band"],
#             "days_pending": days_pending,
#             "latest_stage": latest_stage,
#             "latest_message": logs["message"] if logs else None,
#         })

#     total = conn.execute(
#         f"SELECT COUNT(*) as c FROM fact_work fw LEFT JOIN dim_mp dm ON fw.mp_code = dm.mp_code {where}",
#         params
#     ).fetchone()["c"]
#     conn.close()

#     return {
#         "data": result,
#         "total": total,
#         "page": page,
#         "limit": limit,
#         "total_pages": max(1, -(-total // limit)),
#     }


# @router.get("/logs")
# def get_logs_for_work(work_id: str = Query(...)):
#     """Full notification timeline for one work — powers the case detail view."""
#     conn = sqlite3.connect(DB_PATH)
#     conn.row_factory = sqlite3.Row
#     logs = conn.execute(
#         "SELECT * FROM notification_log WHERE work_id = ? ORDER BY sent_date ASC",
#         (work_id,)
#     ).fetchall()
#     conn.close()
#     return {"work_id": work_id, "logs": [dict(l) for l in logs]}


# @router.post("/resend")
# def resend_notification(req: ResendRequest):
#     """
#     Re-send an existing stage's notice to the vendor/MP, optionally with a
#     custom message and a 'flag_rate' (0-100) representing escalation
#     intensity — e.g. a district officer dialing up urgency wording.
#     """
#     conn = sqlite3.connect(DB_PATH)
#     conn.row_factory = sqlite3.Row
#     original = conn.execute(
#         "SELECT * FROM notification_log WHERE work_id = ? AND stage = ? ORDER BY sent_date DESC LIMIT 1",
#         (req.work_id, req.stage)
#     ).fetchone()
#     if not original:
#         conn.close()
#         raise HTTPException(404, f"No prior '{req.stage}' notification found for {req.work_id}")

#     new_id = str(uuid.uuid4())
#     message = req.custom_message or original["message"]
#     if req.flag_rate is not None:
#         message += f"  [Escalation intensity: {req.flag_rate:.0f}%]"

#     conn.execute("""
#         INSERT INTO notification_log
#         (id, work_id, stage, recipient_type, recipient_name, recipient_photo_url,
#          message, days_pending_at_send, flag_rate, sent_date, is_manual, status)
#         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'SENT')
#     """, (new_id, req.work_id, req.stage, original["recipient_type"], original["recipient_name"],
#           original["recipient_photo_url"], message, original["days_pending_at_send"],
#           req.flag_rate, datetime.now().strftime("%Y-%m-%d")))
#     conn.commit()
#     conn.close()
#     return {"success": True, "id": new_id, "message": message}


# @router.post("/send")
# def send_to_anyone(req: SendToAnyoneRequest):
#     """
#     Free-form notification to any recipient (vendor, MP, or other), with an
#     optional photo URL — for the "send to anyone" composer in the UI.
#     """
#     new_id = str(uuid.uuid4())
#     conn = sqlite3.connect(DB_PATH)
#     conn.execute("""
#         INSERT INTO notification_log
#         (id, work_id, stage, recipient_type, recipient_name, recipient_photo_url,
#          message, days_pending_at_send, flag_rate, sent_date, is_manual, status)
#         VALUES (?, ?, 'MANUAL', ?, ?, ?, ?, NULL, NULL, ?, 1, 'SENT')
#     """, (new_id, req.work_id or "N/A", req.recipient_type, req.recipient_name,
#           req.recipient_photo_url, req.message, datetime.now().strftime("%Y-%m-%d")))
#     conn.commit()
#     conn.close()
#     return {"success": True, "id": new_id}


# @router.get("/summary")
# def get_summary():
#     """Counts per stage — powers the KPI cards at the top of the page."""
#     conn = sqlite3.connect(DB_PATH)
#     conn.row_factory = sqlite3.Row
#     rows = conn.execute("""
#         SELECT stage, COUNT(*) as c FROM notification_log GROUP BY stage
#     """).fetchall()
#     conn.close()
#     return {r["stage"]: r["c"] for r in rows}


# @router.get("/latest")
# def get_latest_for_toast(since_minutes: int = 5):
#     """
#     Powers the fake pop-up toast — returns notifications 'sent' in the
#     last N minutes (by wall-clock insert time, not sent_date, since
#     sent_date is historical/simulated). We approximate using rowid order
#     for the demo: just return the most recent 3 log rows.
#     """
#     conn = sqlite3.connect(DB_PATH)
#     conn.row_factory = sqlite3.Row
#     rows = conn.execute(
#         "SELECT * FROM notification_log ORDER BY rowid DESC LIMIT 3"
#     ).fetchall()
#     conn.close()
#     return {"data": [dict(r) for r in rows]}



































"""
NIRIKSHAN Notification Centre
--------------------------------
REAL DATA:
    Work / MP / MLA / Vendor / financial / risk information is fetched from
    the existing NIRIKSHAN SQLite data.

SYNTHETIC DATA:
    Communication history, acknowledgements, vendor responses, auditor
    actions and investigation activity are DEMO/SIMULATED events.

No real SMS/email is sent.
"""

import sqlite3
import uuid
import random
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel


router = APIRouter(
    prefix="/api/notifications",
    tags=["notifications"]
)

DB_PATH = "mplads.db"


# ============================================================
# DATABASE
# ============================================================

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_notification_table():
    conn = get_conn()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS notification_log (
            id TEXT PRIMARY KEY,
            work_id TEXT NOT NULL,

            stage TEXT NOT NULL,
            event_type TEXT DEFAULT 'NOTIFICATION',

            recipient_type TEXT NOT NULL,
            recipient_name TEXT,

            actor_type TEXT DEFAULT 'SYSTEM',
            actor_name TEXT,

            recipient_photo_url TEXT,

            message TEXT NOT NULL,

            days_pending_at_send INTEGER,
            flag_rate REAL,

            sent_date TEXT NOT NULL,

            status TEXT DEFAULT 'SENT',
            response_status TEXT,

            is_manual INTEGER DEFAULT 0,
            is_demo INTEGER DEFAULT 1,

            parent_event_id TEXT,
            case_id TEXT
        )
    """)

    # --------------------------------------------------------
    # Migration for databases created using the old schema
    # --------------------------------------------------------

    existing_columns = {
        row["name"]
        for row in conn.execute(
            "PRAGMA table_info(notification_log)"
        ).fetchall()
    }

    new_columns = {
        "event_type": "TEXT DEFAULT 'NOTIFICATION'",
        "actor_type": "TEXT DEFAULT 'SYSTEM'",
        "actor_name": "TEXT",
        "response_status": "TEXT",
        "is_demo": "INTEGER DEFAULT 1",
        "parent_event_id": "TEXT",
        "case_id": "TEXT",
    }

    for column, definition in new_columns.items():
        if column not in existing_columns:
            conn.execute(
                f"ALTER TABLE notification_log ADD COLUMN {column} {definition}"
            )

    conn.commit()
    conn.close()


# ============================================================
# REQUEST MODELS
# ============================================================

class ResendRequest(BaseModel):
    work_id: str
    stage: str
    custom_message: Optional[str] = None
    flag_rate: Optional[float] = None


class SendToAnyoneRequest(BaseModel):
    work_id: Optional[str] = None
    recipient_type: str
    recipient_name: str
    recipient_photo_url: Optional[str] = None
    message: str


class DemoEventRequest(BaseModel):
    work_id: str
    event_type: str
    message: str
    recipient_type: str = "OTHER"
    recipient_name: str = "NIRIKSHAN Audit Desk"


# ============================================================
# REAL DATA LOOKUP
# ============================================================

def get_work_context(work_id: str):
    """
    Fetch REAL work + MP + vendor information from the existing
    NIRIKSHAN SQLite database.
    """

    conn = get_conn()

    work = conn.execute("""
        SELECT
            fw.*,

            dm.mp_name_clean AS joined_mp_name,
            dm.constituency_clean AS joined_constituency,
            dm.state AS joined_mp_state,

            fp.vendor_name_clean AS joined_vendor

        FROM fact_work fw

        LEFT JOIN dim_mp dm
            ON fw.mp_code = dm.mp_code

        LEFT JOIN (
            SELECT
                work_id,
                vendor_name_clean
            FROM fact_payment
            WHERE vendor_name_clean IS NOT NULL
            GROUP BY work_id
        ) fp
            ON fw.work_id = fp.work_id

        WHERE fw.work_id = ?

        LIMIT 1
    """, (work_id,)).fetchone()

    conn.close()

    if not work:
        return None

    return dict(work)


# ============================================================
# HELPERS
# ============================================================

def safe(value, fallback="—"):
    if value is None:
        return fallback

    text = str(value).strip()

    if not text or text.lower() == "nan":
        return fallback

    return text


def money(value):
    try:
        return f"₹{float(value):,.0f}"
    except Exception:
        return "₹0"


def parse_date(value):
    if not value:
        return None

    try:
        return datetime.strptime(
            str(value)[:10],
            "%Y-%m-%d"
        )
    except Exception:
        return None


def days_pending(sanction_date):
    d = parse_date(sanction_date)

    if not d:
        return 0

    return max(
        0,
        (datetime.now() - d).days
    )


# ============================================================
# CASE ID
# ============================================================

def generate_case_id(work_id):
    short = str(abs(hash(work_id)))[:6]

    return f"NTF-{datetime.now().year}-{short}"


# ============================================================
# SYNTHETIC EVENT GENERATOR
# ============================================================

def build_demo_trail(work):
    """
    Create a realistic synthetic communication trail around REAL
    work/MP/vendor information.

    The generated events are explicitly marked DEMO.
    """

    work_id = safe(work.get("work_id"))
    mp = safe(
        work.get("joined_mp_name")
        or work.get("mp_name"),
        "Constituency MP/MLA"
    )

    vendor = safe(
        work.get("joined_vendor"),
        "Registered Vendor"
    )

    constituency = safe(
        work.get("joined_constituency")
        or work.get("constituency_clean")
    )

    district = safe(work.get("district_name"))
    state = safe(work.get("state"))

    sanction_date = parse_date(
        work.get("sanction_date")
    )

    if not sanction_date:
        sanction_date = datetime.now() - timedelta(days=180)

    risk_score = work.get(
        "risk_score",
        work.get("final_risk_score", 0)
    )

    risk_band = safe(
        work.get("risk_band"),
        "Medium"
    )

    sanction_amount = money(
        work.get("sanction_amount", 0)
    )

    expenditure = money(
        work.get("total_expenditure", 0)
    )

    case_id = generate_case_id(work_id)

    events = []

    def add_event(
        offset_days,
        event_type,
        stage,
        recipient_type,
        recipient_name,
        message,
        actor_type="SYSTEM",
        actor_name="NIRIKSHAN Automated Audit Engine",
        response_status=None,
    ):
        event_date = sanction_date + timedelta(days=offset_days)

        events.append({
            "id": str(uuid.uuid4()),
            "work_id": work_id,
            "stage": stage,
            "event_type": event_type,

            "recipient_type": recipient_type,
            "recipient_name": recipient_name,

            "actor_type": actor_type,
            "actor_name": actor_name,

            "recipient_photo_url": None,

            "message": message,

            "days_pending_at_send": offset_days,
            "flag_rate": None,

            "sent_date": event_date.strftime("%Y-%m-%d"),

            "status": "READ" if event_type in {
                "ACKNOWLEDGEMENT",
                "RESPONSE",
                "AUDITOR_ACTION"
            } else "SENT",

            "response_status": response_status,

            "is_manual": 0,
            "is_demo": 1,

            "parent_event_id": None,
            "case_id": case_id,
        })

    # --------------------------------------------------------
    # EVENT 1 — INITIAL VENDOR NOTICE
    # --------------------------------------------------------

    add_event(
        0,
        "NOTIFICATION",
        "VENDOR_INITIAL",
        "VENDOR",
        vendor,

        f"Initial execution notice generated for Work {work_id}. "
        f"The work has been sanctioned for {sanction_amount}. "
        f"Please commence execution according to the approved scope "
        f"and implementation schedule."
    )

    # --------------------------------------------------------
    # EVENT 2 — DELIVERY
    # --------------------------------------------------------

    add_event(
        1,
        "DELIVERY",
        "DELIVERY_CONFIRMED",
        "VENDOR",
        vendor,

        f"Notification delivery confirmed for Work {work_id}. "
        f"Recipient channel acknowledged by the demo notification gateway.",

        actor_type="SYSTEM",
        actor_name="NIRIKSHAN Notification Gateway"
    )

    # --------------------------------------------------------
    # EVENT 3 — REMINDER
    # --------------------------------------------------------

    add_event(
        50,
        "NOTIFICATION",
        "VENDOR_REMINDER",
        "VENDOR",
        vendor,

        f"Reminder: Work {work_id} remains pending 50+ days after "
        f"sanction. Please provide the current execution status "
        f"and expected completion date."
    )

    # --------------------------------------------------------
    # EVENT 4 — NO RESPONSE
    # --------------------------------------------------------

    add_event(
        57,
        "STATUS",
        "NO_VENDOR_RESPONSE",
        "VENDOR",
        vendor,

        f"No response has been recorded against the previous "
        f"notification for Work {work_id}. Automated escalation "
        f"threshold has been reached.",

        actor_type="SYSTEM",
        actor_name="NIRIKSHAN Escalation Engine",
        response_status="NO_RESPONSE"
    )

    # --------------------------------------------------------
    # EVENT 5 — MP ESCALATION
    # --------------------------------------------------------

    add_event(
        100,
        "ESCALATION",
        "MP_ESCALATION_1",
        "MP",
        mp,

        f"Escalation notice: Work {work_id} in {constituency}, "
        f"{district}, {state} has remained unresolved beyond "
        f"100 days. Vendor follow-up has not produced a recorded "
        f"resolution. Constituency-level review is requested."
    )

    # --------------------------------------------------------
    # EVENT 6 — MP ACKNOWLEDGEMENT
    # --------------------------------------------------------

    add_event(
        103,
        "ACKNOWLEDGEMENT",
        "MP_ACKNOWLEDGED",
        "MP",
        mp,

        f"Demo acknowledgement recorded from the constituency "
        f"office for Work {work_id}. Matter forwarded for "
        f"administrative review.",

        actor_type="MP_OFFICE",
        actor_name=mp,
        response_status="ACKNOWLEDGED"
    )

    # --------------------------------------------------------
    # EVENT 7 — AUDITOR REVIEW
    # --------------------------------------------------------

    add_event(
        106,
        "AUDITOR_ACTION",
        "AUDITOR_REVIEW",
        "OTHER",
        "District Audit Desk",

        f"Auditor review initiated for Work {work_id}. "
        f"Risk score: {safe(risk_score, 'N/A')}; "
        f"Risk band: {risk_band}. "
        f"Sanction amount: {sanction_amount}. "
        f"Recorded expenditure: {expenditure}.",

        actor_type="AUDITOR",
        actor_name="District Audit Desk"
    )

    # --------------------------------------------------------
    # EVENT 8 — VENDOR RESPONSE
    # --------------------------------------------------------

    add_event(
        112,
        "RESPONSE",
        "VENDOR_RESPONSE",
        "VENDOR",
        vendor,

        f"Demo vendor response recorded: execution has reportedly "
        f"been delayed due to site-level and administrative "
        f"constraints. Vendor has requested additional time "
        f"to complete the work.",

        actor_type="VENDOR",
        actor_name=vendor,
        response_status="RECEIVED"
    )

    # --------------------------------------------------------
    # EVENT 9 — DOCUMENT REQUEST
    # --------------------------------------------------------

    add_event(
        114,
        "DOCUMENT_REQUEST",
        "EVIDENCE_REQUESTED",
        "VENDOR",
        vendor,

        f"Supporting documentation requested for Work {work_id}: "
        f"current execution status, expenditure support, and "
        f"evidence of physical progress.",

        actor_type="AUDITOR",
        actor_name="District Audit Desk"
    )

    # --------------------------------------------------------
    # EVENT 10 — DOCUMENT PENDING
    # --------------------------------------------------------

    add_event(
        121,
        "STATUS",
        "EVIDENCE_PENDING",
        "VENDOR",
        vendor,

        f"Requested supporting documents have not yet been "
        f"recorded in the demo case workspace.",

        actor_type="SYSTEM",
        actor_name="NIRIKSHAN Case Monitor",
        response_status="PENDING"
    )

    # --------------------------------------------------------
    # EVENT 11 — SECOND MP ESCALATION
    # --------------------------------------------------------

    add_event(
        150,
        "ESCALATION",
        "MP_ESCALATION_2",
        "MP",
        mp,

        f"Second escalation: Work {work_id} remains unresolved "
        f"after 150+ days. Immediate administrative attention "
        f"and vendor performance review are recommended.",

        actor_type="SYSTEM",
        actor_name="NIRIKSHAN Escalation Engine"
    )

    # --------------------------------------------------------
    # EVENT 12 — INVESTIGATION CREATED
    # --------------------------------------------------------

    add_event(
        153,
        "INVESTIGATION_CREATED",
        "INVESTIGATION_OPENED",
        "OTHER",
        "NIRIKSHAN Investigation Desk",

        f"Investigation case {case_id} created for Work {work_id}. "
        f"Trigger combination: prolonged pending status, "
        f"elevated audit risk and unresolved notification trail.",

        actor_type="AUDIT_SYSTEM",
        actor_name="NIRIKSHAN Investigation Engine"
    )

    # --------------------------------------------------------
    # EVENT 13 — INVESTIGATOR ASSIGNED
    # --------------------------------------------------------

    add_event(
        155,
        "AUDITOR_ACTION",
        "INVESTIGATOR_ASSIGNED",
        "OTHER",
        "State Audit Officer",

        f"Demo investigation officer assigned to case {case_id}. "
        f"Initial review scope includes work records, payment "
        f"history and vendor activity.",

        actor_type="AUDITOR",
        actor_name="State Audit Officer"
    )

    # --------------------------------------------------------
    # EVENT 14 — NETWORK REVIEW
    # --------------------------------------------------------

    add_event(
        158,
        "AUDITOR_ACTION",
        "VENDOR_NETWORK_REVIEW",
        "OTHER",
        "NIRIKSHAN Risk Intelligence",

        f"Vendor relationship review initiated for {vendor}. "
        f"Cross-work and constituency activity will be examined "
        f"using the existing vendor transaction data.",

        actor_type="SYSTEM",
        actor_name="NIRIKSHAN Vendor Intelligence Engine"
    )

    return events


# ============================================================
# SEED SYNTHETIC CASE TRAILS
# ============================================================

def seed_demo_case_trails():
    """
    Seed a LIMITED number of interesting cases.

    Important:
    We intentionally do NOT generate synthetic trails for all
    77k works. That would create a huge database and make the
    demo noisy.

    Around 40 cases is enough for the Notification Centre.
    """

    conn = get_conn()

    existing = conn.execute(
        "SELECT COUNT(*) AS c FROM notification_log WHERE is_demo = 1"
    ).fetchone()["c"]

    if existing > 0:
        conn.close()
        return

    # Pick high-risk / long-running works from the existing database.
    rows = conn.execute("""
        SELECT *
        FROM fact_work
        WHERE
            (
                LOWER(COALESCE(work_status, '')) NOT LIKE '%completed%'
                OR completion_date IS NULL
            )
        ORDER BY
            COALESCE(risk_score, 0) DESC,
            sanction_date ASC
        LIMIT 40
    """).fetchall()

    conn.close()

    all_events = []

    for row in rows:

        work = dict(row)

        # Add joined real information.
        context = get_work_context(
            work["work_id"]
        )

        if context:
            work.update(context)

        try:
            events = build_demo_trail(work)
            all_events.extend(events)
        except Exception as exc:
            print(
                f"[NIRIKSHAN] Demo trail generation failed "
                f"for {work.get('work_id')}: {exc}"
            )

    if not all_events:
        return

    conn = get_conn()

    conn.executemany("""
        INSERT INTO notification_log (
            id,
            work_id,
            stage,
            event_type,

            recipient_type,
            recipient_name,

            actor_type,
            actor_name,

            recipient_photo_url,

            message,

            days_pending_at_send,
            flag_rate,

            sent_date,

            status,
            response_status,

            is_manual,
            is_demo,

            parent_event_id,
            case_id
        )
        VALUES (
            :id,
            :work_id,
            :stage,
            :event_type,

            :recipient_type,
            :recipient_name,

            :actor_type,
            :actor_name,

            :recipient_photo_url,

            :message,

            :days_pending_at_send,
            :flag_rate,

            :sent_date,

            :status,
            :response_status,

            :is_manual,
            :is_demo,

            :parent_event_id,
            :case_id
        )
    """, all_events)

    conn.commit()
    conn.close()

    print(
        f"[NIRIKSHAN] Seeded {len(all_events)} synthetic "
        f"notification/case events."
    )


# ============================================================
# PENDING NOTIFICATIONS
# ============================================================

@router.get("/pending")
def get_pending_notifications(
    page: int = 1,
    limit: int = 25,
    stage: str = "",
    search: str = ""
):

    conn = get_conn()

    where = """
        WHERE (
            LOWER(COALESCE(fw.work_status, '')) NOT LIKE '%completed%'
            OR fw.completion_date IS NULL
        )
    """

    params = []

    if search:

        where += """
            AND (
                fw.work_id LIKE ?
                OR dm.mp_name_clean LIKE ?
                OR fp.vendor_name_clean LIKE ?
            )
        """

        term = f"%{search}%"

        params.extend([
            term,
            term,
            term
        ])

    query = f"""
        SELECT
            fw.work_id,
            fw.district_name,
            fw.state,
            fw.sanction_amount,
            fw.sanction_date,

            fw.mp_code,
            fw.mp_name,

            fw.work_description,
            fw.work_status,

            fw.risk_score,
            fw.risk_band,

            dm.mp_name_clean AS joined_mp_name,
            dm.constituency_clean AS constituency,

            fp.vendor_name_clean AS vendor_name

        FROM fact_work fw

        LEFT JOIN dim_mp dm
            ON fw.mp_code = dm.mp_code

        LEFT JOIN (
            SELECT
                work_id,
                vendor_name_clean
            FROM fact_payment
            GROUP BY work_id
        ) fp
            ON fw.work_id = fp.work_id

        {where}

        ORDER BY
            COALESCE(fw.risk_score, 0) DESC,
            fw.sanction_date ASC

        LIMIT ? OFFSET ?
    """

    params.extend([
        limit,
        (page - 1) * limit
    ])

    works = conn.execute(
        query,
        params
    ).fetchall()

    result = []

    for w in works:

        work_id = w["work_id"]

        latest = conn.execute("""
            SELECT *
            FROM notification_log
            WHERE work_id = ?
            ORDER BY sent_date DESC, rowid DESC
            LIMIT 1
        """, (work_id,)).fetchone()

        latest_stage = (
            latest["stage"]
            if latest
            else "NONE"
        )

        if stage and latest_stage != stage:
            continue

        result.append({
            "work_id": work_id,

            "district": w["district_name"],
            "state": w["state"],

            "sanction_amount": w["sanction_amount"],
            "sanction_date": w["sanction_date"],

            "mp_code": w["mp_code"],
            "mp_name": (
                w["joined_mp_name"]
                or w["mp_name"]
            ),

            "constituency": w["constituency"],

            "vendor_name": w["vendor_name"],

            "description": w["work_description"],
            "work_status": w["work_status"],

            "risk_score": w["risk_score"],
            "risk_band": w["risk_band"],

            "days_pending": days_pending(
                w["sanction_date"]
            ),

            "latest_stage": latest_stage,

            "latest_event_type": (
                latest["event_type"]
                if latest
                else None
            ),

            "latest_message": (
                latest["message"]
                if latest
                else None
            ),

            "is_demo": True
        })

    total = conn.execute(
        f"""
        SELECT COUNT(*)
        FROM fact_work fw
        LEFT JOIN dim_mp dm
            ON fw.mp_code = dm.mp_code
        LEFT JOIN (
            SELECT work_id, vendor_name_clean
            FROM fact_payment
            GROUP BY work_id
        ) fp
            ON fw.work_id = fp.work_id
        {where}
        """,
        params[:-2]
    ).fetchone()[0]

    conn.close()

    return {
        "data": result,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(
            1,
            (total + limit - 1) // limit
        )
    }


# ============================================================
# FULL CASE DETAIL
# ============================================================

@router.get("/case/{work_id}")
def get_case(work_id: str):

    work = get_work_context(work_id)

    if not work:
        raise HTTPException(
            404,
            f"Work {work_id} not found"
        )

    conn = get_conn()

    logs = conn.execute("""
        SELECT *
        FROM notification_log
        WHERE work_id = ?
        ORDER BY sent_date ASC, rowid ASC
    """, (work_id,)).fetchall()

    conn.close()

    # If no demo history exists, generate it now.
    if not logs:

        events = build_demo_trail(work)

        conn = get_conn()

        conn.executemany("""
            INSERT INTO notification_log (
                id,
                work_id,
                stage,
                event_type,
                recipient_type,
                recipient_name,
                actor_type,
                actor_name,
                recipient_photo_url,
                message,
                days_pending_at_send,
                flag_rate,
                sent_date,
                status,
                response_status,
                is_manual,
                is_demo,
                parent_event_id,
                case_id
            )
            VALUES (
                :id,
                :work_id,
                :stage,
                :event_type,
                :recipient_type,
                :recipient_name,
                :actor_type,
                :actor_name,
                :recipient_photo_url,
                :message,
                :days_pending_at_send,
                :flag_rate,
                :sent_date,
                :status,
                :response_status,
                :is_manual,
                :is_demo,
                :parent_event_id,
                :case_id
            )
        """, events)

        conn.commit()

        logs = conn.execute("""
            SELECT *
            FROM notification_log
            WHERE work_id = ?
            ORDER BY sent_date ASC, rowid ASC
        """, (work_id,)).fetchall()

        conn.close()

    return {
        "case": {
            "case_id": (
                logs[0]["case_id"]
                if logs
                else generate_case_id(work_id)
            ),

            "work_id": work_id,

            "work_description": safe(
                work.get("work_description")
            ),

            "state": safe(
                work.get("state")
            ),

            "district": safe(
                work.get("district_name")
            ),

            "constituency": safe(
                work.get("joined_constituency")
                or work.get("constituency_clean")
            ),

            "mp_code": safe(
                work.get("mp_code")
            ),

            "mp_name": safe(
                work.get("joined_mp_name")
                or work.get("mp_name")
            ),

            "vendor_name": safe(
                work.get("joined_vendor")
            ),

            "sanction_amount": work.get(
                "sanction_amount",
                0
            ),

            "total_expenditure": work.get(
                "total_expenditure",
                0
            ),

            "sanction_date": work.get(
                "sanction_date"
            ),

            "work_status": safe(
                work.get("work_status")
            ),

            "risk_score": work.get(
                "risk_score",
                work.get("final_risk_score", 0)
            ),

            "risk_band": safe(
                work.get("risk_band"),
                "Medium"
            ),

            "days_pending": days_pending(
                work.get("sanction_date")
            ),

            "is_demo": True
        },

        "timeline": [
            dict(log)
            for log in logs
        ]
    }


# ============================================================
# OLD LOG ENDPOINT — KEEP COMPATIBILITY
# ============================================================

@router.get("/logs")
def get_logs_for_work(
    work_id: str = Query(...)
):

    response = get_case(work_id)

    return {
        "work_id": work_id,
        "logs": response["timeline"]
    }


# ============================================================
# DEMO EVENT ENDPOINT
# ============================================================

@router.post("/demo-event")
def add_demo_event(
    req: DemoEventRequest
):

    work = get_work_context(req.work_id)

    if not work:
        raise HTTPException(
            404,
            f"Work {req.work_id} not found"
        )

    conn = get_conn()

    latest = conn.execute("""
        SELECT *
        FROM notification_log
        WHERE work_id = ?
        ORDER BY rowid DESC
        LIMIT 1
    """, (req.work_id,)).fetchone()

    case_id = (
        latest["case_id"]
        if latest
        else generate_case_id(req.work_id)
    )

    event_id = str(uuid.uuid4())

    conn.execute("""
        INSERT INTO notification_log (
            id,
            work_id,
            stage,
            event_type,

            recipient_type,
            recipient_name,

            actor_type,
            actor_name,

            message,

            days_pending_at_send,

            sent_date,

            status,

            is_manual,
            is_demo,

            parent_event_id,
            case_id
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,

            ?,
            ?,

            'AUDITOR',
            'NIRIKSHAN Audit Officer',

            ?,

            ?,

            ?,

            'SENT',

            1,
            1,

            ?,
            ?
        )
    """, (
        event_id,
        req.work_id,

        req.event_type,
        "MANUAL",

        req.recipient_type,
        req.recipient_name,

        req.message,

        days_pending(
            work.get("sanction_date")
        ),

        datetime.now().strftime(
            "%Y-%m-%d"
        ),

        latest["id"] if latest else None,
        case_id
    ))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "id": event_id,
        "case_id": case_id,
        "is_demo": True
    }


# ============================================================
# RESEND
# ============================================================

@router.post("/resend")
def resend_notification(
    req: ResendRequest
):

    conn = get_conn()

    original = conn.execute("""
        SELECT *
        FROM notification_log
        WHERE work_id = ?
          AND stage = ?
        ORDER BY rowid DESC
        LIMIT 1
    """, (
        req.work_id,
        req.stage
    )).fetchone()

    if not original:
        conn.close()

        raise HTTPException(
            404,
            f"No previous {req.stage} notification found."
        )

    message = (
        req.custom_message
        or original["message"]
    )

    if req.flag_rate is not None:
        message += (
            f" [Demo escalation intensity: "
            f"{req.flag_rate:.0f}%]"
        )

    new_id = str(uuid.uuid4())

    conn.execute("""
        INSERT INTO notification_log (
            id,
            work_id,
            stage,
            event_type,

            recipient_type,
            recipient_name,

            actor_type,
            actor_name,

            recipient_photo_url,

            message,

            days_pending_at_send,
            flag_rate,

            sent_date,

            status,

            is_manual,
            is_demo,

            parent_event_id,
            case_id
        )
        VALUES (
            ?,
            ?,
            ?,
            'NOTIFICATION',

            ?,
            ?,

            'AUDITOR',
            'NIRIKSHAN Audit Officer',

            ?,

            ?,

            ?,
            ?,

            ?,

            'SENT',

            1,
            1,

            ?,
            ?
        )
    """, (
        new_id,

        req.work_id,
        req.stage,

        original["recipient_type"],
        original["recipient_name"],

        original["recipient_photo_url"],

        message,

        original["days_pending_at_send"],

        req.flag_rate,

        datetime.now().strftime(
            "%Y-%m-%d"
        ),

        original["id"],
        original["case_id"]
    ))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "id": new_id,
        "message": message,
        "is_demo": True
    }


# ============================================================
# SEND TO ANYONE
# ============================================================

@router.post("/send")
def send_to_anyone(
    req: SendToAnyoneRequest
):

    new_id = str(uuid.uuid4())

    conn = get_conn()

    case_id = None

    if req.work_id:

        latest = conn.execute("""
            SELECT case_id
            FROM notification_log
            WHERE work_id = ?
            ORDER BY rowid DESC
            LIMIT 1
        """, (
            req.work_id,
        )).fetchone()

        if latest:
            case_id = latest["case_id"]

    conn.execute("""
        INSERT INTO notification_log (
            id,
            work_id,
            stage,
            event_type,

            recipient_type,
            recipient_name,

            actor_type,
            actor_name,

            recipient_photo_url,

            message,

            sent_date,

            status,

            is_manual,
            is_demo,

            case_id
        )
        VALUES (
            ?,
            ?,
            'MANUAL',
            'NOTIFICATION',

            ?,
            ?,

            'AUDITOR',
            'NIRIKSHAN Audit Officer',

            ?,

            ?,

            ?,

            'SENT',

            1,
            1,

            ?
        )
    """, (
        new_id,

        req.work_id or "N/A",

        req.recipient_type,
        req.recipient_name,

        req.recipient_photo_url,

        req.message,

        datetime.now().strftime(
            "%Y-%m-%d"
        ),

        case_id
    ))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "id": new_id,
        "is_demo": True
    }


# ============================================================
# LATEST
# ============================================================

@router.get("/latest")
def get_latest_notifications(
    limit: int = 5
):

    conn = get_conn()

    rows = conn.execute("""
        SELECT *
        FROM notification_log
        ORDER BY rowid DESC
        LIMIT ?
    """, (limit,)).fetchall()

    conn.close()

    return {
        "data": [
            dict(row)
            for row in rows
        ]
    }


# ============================================================
# SUMMARY
# ============================================================

@router.get("/summary")
def notification_summary():

    conn = get_conn()

    rows = conn.execute("""
        SELECT
            stage,
            COUNT(*) AS count
        FROM notification_log
        GROUP BY stage
    """).fetchall()

    conn.close()

    result = {
        "VENDOR_INITIAL": 0,
        "VENDOR_REMINDER": 0,
        "MP_ESCALATION_1": 0,
        "MP_ESCALATION_2": 0,
        "FUND_REQUEST_MP": 0,
        "MANUAL": 0,

        "TOTAL_EVENTS": 0,
        "DEMO_EVENTS": 0,
    }

    for row in rows:

        stage = row["stage"]
        count = row["count"]

        if stage in result:
            result[stage] = count

        result["TOTAL_EVENTS"] += count

    conn = get_conn()

    result["DEMO_EVENTS"] = conn.execute("""
        SELECT COUNT(*)
        FROM notification_log
        WHERE is_demo = 1
    """).fetchone()[0]

    result["CASES"] = conn.execute("""
        SELECT COUNT(DISTINCT case_id)
        FROM notification_log
        WHERE case_id IS NOT NULL
    """).fetchone()[0]

    conn.close()

    return result