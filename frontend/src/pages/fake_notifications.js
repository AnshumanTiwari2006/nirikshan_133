export const FAKE_NOTIFICATION_CASES = [
  {
    "work_id": "MPLADS/24-25/RAJ/000184",
    "mp_name": "Shri Rajendra Singh",
    "constituency": "Alwar",
    "district": "Alwar",
    "state": "Rajasthan",
    "vendor": "Shree Infrastructure Works",
    "sanction_amount": 1850000,
    "days_pending": 163,
    "risk_score": 87.4,
    "risk_band": "Very High",
    "latest_stage": "MP_ESCALATION_2",
    "latest_message": "Second escalation: work remains incomplete after 150+ days.",
    "logs": [
      {
        "id": "MPLADS/24-25/RAJ/000184-0",
        "sent_date": "2024-04-02",
        "stage": "VENDOR_INITIAL",
        "recipient_type": "VENDOR",
        "recipient_name": "Shree Infrastructure Works",
        "message": "Initial execution notice generated. Please commence the sanctioned work as per the approved scope.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/RAJ/000184-1",
        "sent_date": "2024-05-22",
        "stage": "VENDOR_REMINDER",
        "recipient_type": "VENDOR",
        "recipient_name": "Shree Infrastructure Works",
        "message": "Reminder: work remains pending for 50+ days. Please provide the current execution status.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/RAJ/000184-2",
        "sent_date": "2024-05-29",
        "stage": "MANUAL",
        "recipient_type": "VENDOR",
        "recipient_name": "Shree Infrastructure Works",
        "message": "Demo follow-up call logged by the District Audit Desk. Vendor response requested.",
        "is_manual": 1,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/RAJ/000184-3",
        "sent_date": "2024-07-11",
        "stage": "MP_ESCALATION_1",
        "recipient_type": "MP",
        "recipient_name": "Shri Rajendra Singh",
        "message": "Escalation notice: work has remained unresolved beyond 100 days. Constituency-level review is requested.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/RAJ/000184-4",
        "sent_date": "2024-07-14",
        "stage": "MANUAL",
        "recipient_type": "MP",
        "recipient_name": "Shri Rajendra Singh",
        "message": "Demo acknowledgement recorded from the constituency office. Matter forwarded for administrative review.",
        "is_manual": 1,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/RAJ/000184-5",
        "sent_date": "2024-07-17",
        "stage": "MANUAL",
        "recipient_type": "OTHER",
        "recipient_name": "District Audit Desk",
        "message": "Auditor review initiated. Risk score 87.4 — Very High. Supporting expenditure records requested.",
        "is_manual": 1,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/RAJ/000184-6",
        "sent_date": "2024-08-23",
        "stage": "MP_ESCALATION_2",
        "recipient_type": "MP",
        "recipient_name": "Shri Rajendra Singh",
        "message": "Second escalation: work remains incomplete after 150+ days. Immediate administrative attention requested.",
        "is_manual": 0,
        "flag_rate": null
      }
    ]
  },
  {
    "work_id": "MPLADS/24-25/UP/000731",
    "mp_name": "Smt. Kavita Sharma",
    "constituency": "Lucknow",
    "district": "Lucknow",
    "state": "Uttar Pradesh",
    "vendor": "Apex Civil Contractors",
    "sanction_amount": 3200000,
    "days_pending": 118,
    "risk_score": 72.8,
    "risk_band": "Very High",
    "latest_stage": "MP_ESCALATION_1",
    "latest_message": "Escalation notice sent to MP office after 100+ days pending.",
    "logs": [
      {
        "id": "MPLADS/24-25/UP/000731-0",
        "sent_date": "2024-04-18",
        "stage": "VENDOR_INITIAL",
        "recipient_type": "VENDOR",
        "recipient_name": "Apex Civil Contractors",
        "message": "Initial execution notice generated for the sanctioned work.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/UP/000731-1",
        "sent_date": "2024-06-07",
        "stage": "VENDOR_REMINDER",
        "recipient_type": "VENDOR",
        "recipient_name": "Apex Civil Contractors",
        "message": "Reminder: work remains pending for 50+ days. Status update requested.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/UP/000731-2",
        "sent_date": "2024-06-14",
        "stage": "MANUAL",
        "recipient_type": "VENDOR",
        "recipient_name": "Apex Civil Contractors",
        "message": "Demo follow-up recorded. Vendor asked to submit revised completion schedule.",
        "is_manual": 1,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/UP/000731-3",
        "sent_date": "2024-07-27",
        "stage": "MP_ESCALATION_1",
        "recipient_type": "MP",
        "recipient_name": "Smt. Kavita Sharma",
        "message": "Escalation notice: work has remained unresolved beyond 100 days. Review requested.",
        "is_manual": 0,
        "flag_rate": null
      }
    ]
  },
  {
    "work_id": "MPLADS/24-25/MP/001092",
    "mp_name": "Shri Arun Verma",
    "constituency": "Bhopal",
    "district": "Bhopal",
    "state": "Madhya Pradesh",
    "vendor": "National Buildtech Services",
    "sanction_amount": 4750000,
    "days_pending": 171,
    "risk_score": 91.2,
    "risk_band": "Very High",
    "latest_stage": "FUND_REQUEST_MP",
    "latest_message": "Fund alert: expenditure pattern indicates a possible budget pressure.",
    "logs": [
      {
        "id": "MPLADS/24-25/MP/001092-0",
        "sent_date": "2024-03-25",
        "stage": "VENDOR_INITIAL",
        "recipient_type": "VENDOR",
        "recipient_name": "National Buildtech Services",
        "message": "Initial execution notice generated. Please commence execution.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/MP/001092-1",
        "sent_date": "2024-05-14",
        "stage": "VENDOR_REMINDER",
        "recipient_type": "VENDOR",
        "recipient_name": "National Buildtech Services",
        "message": "Reminder: work remains pending for 50+ days. Current status requested.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/MP/001092-2",
        "sent_date": "2024-07-03",
        "stage": "MP_ESCALATION_1",
        "recipient_type": "MP",
        "recipient_name": "Shri Arun Verma",
        "message": "Escalation notice sent to constituency office after 100+ days.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/MP/001092-3",
        "sent_date": "2024-07-06",
        "stage": "MANUAL",
        "recipient_type": "MP",
        "recipient_name": "Shri Arun Verma",
        "message": "Demo acknowledgement recorded. Administrative review initiated.",
        "is_manual": 1,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/MP/001092-4",
        "sent_date": "2024-08-22",
        "stage": "MP_ESCALATION_2",
        "recipient_type": "MP",
        "recipient_name": "Shri Arun Verma",
        "message": "Second escalation after 150+ days. Immediate review requested.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/MP/001092-5",
        "sent_date": "2024-09-12",
        "stage": "FUND_REQUEST_MP",
        "recipient_type": "MP",
        "recipient_name": "Shri Arun Verma",
        "message": "Fund alert: recorded expenditure is trending above the sanctioned amount. Review requested before further disbursement.",
        "is_manual": 0,
        "flag_rate": null
      }
    ]
  },
  {
    "work_id": "MPLADS/24-25/BR/000417",
    "mp_name": "Shri Vivek Kumar",
    "constituency": "Patna Sahib",
    "district": "Patna",
    "state": "Bihar",
    "vendor": "Eastern Development Agency",
    "sanction_amount": 1280000,
    "days_pending": 64,
    "risk_score": 58.6,
    "risk_band": "High",
    "latest_stage": "VENDOR_REMINDER",
    "latest_message": "Vendor reminder issued after 50+ days without recorded completion.",
    "logs": [
      {
        "id": "MPLADS/24-25/BR/000417-0",
        "sent_date": "2024-06-01",
        "stage": "VENDOR_INITIAL",
        "recipient_type": "VENDOR",
        "recipient_name": "Eastern Development Agency",
        "message": "Initial execution notice generated for the sanctioned work.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/BR/000417-1",
        "sent_date": "2024-07-21",
        "stage": "VENDOR_REMINDER",
        "recipient_type": "VENDOR",
        "recipient_name": "Eastern Development Agency",
        "message": "Reminder: work remains pending for 50+ days. Please provide an updated execution status.",
        "is_manual": 0,
        "flag_rate": null
      }
    ]
  },
  {
    "work_id": "MPLADS/24-25/KA/000256",
    "mp_name": "Smt. Meera Rao",
    "constituency": "Mysuru",
    "district": "Mysuru",
    "state": "Karnataka",
    "vendor": "Southline Projects Pvt. Ltd.",
    "sanction_amount": 2600000,
    "days_pending": 156,
    "risk_score": 79.3,
    "risk_band": "Very High",
    "latest_stage": "MP_ESCALATION_2",
    "latest_message": "Second escalation issued after 150+ days pending.",
    "logs": [
      {
        "id": "MPLADS/24-25/KA/000256-0",
        "sent_date": "2024-04-09",
        "stage": "VENDOR_INITIAL",
        "recipient_type": "VENDOR",
        "recipient_name": "Southline Projects Pvt. Ltd.",
        "message": "Initial execution notice generated. Approved scope and timeline communicated.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/KA/000256-1",
        "sent_date": "2024-05-29",
        "stage": "VENDOR_REMINDER",
        "recipient_type": "VENDOR",
        "recipient_name": "Southline Projects Pvt. Ltd.",
        "message": "Reminder issued after 50+ days pending.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/KA/000256-2",
        "sent_date": "2024-07-18",
        "stage": "MP_ESCALATION_1",
        "recipient_type": "MP",
        "recipient_name": "Smt. Meera Rao",
        "message": "Escalation notice sent to MP office after 100+ days pending.",
        "is_manual": 0,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/KA/000256-3",
        "sent_date": "2024-07-21",
        "stage": "MANUAL",
        "recipient_type": "OTHER",
        "recipient_name": "District Audit Desk",
        "message": "Demo acknowledgement and auditor review logged.",
        "is_manual": 1,
        "flag_rate": null
      },
      {
        "id": "MPLADS/24-25/KA/000256-4",
        "sent_date": "2024-09-12",
        "stage": "MP_ESCALATION_2",
        "recipient_type": "MP",
        "recipient_name": "Smt. Meera Rao",
        "message": "Second escalation issued after 150+ days. Immediate administrative attention requested.",
        "is_manual": 0,
        "flag_rate": null
      }
    ]
  }
];
