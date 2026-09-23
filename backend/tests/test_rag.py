import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

INTENTS = [
    ("greeting", "hi"),
    ("greeting", "hello"),
    ("greeting", "namaste"),
    ("greeting", "hey there"),
    ("identity", "who are you"),
    ("identity", "what model"),
    ("identity", "how does this work"),
    ("identity", "what are you"),
    ("why_flagged", "why flagged"),
    ("why_flagged", "risk reason"),
    ("why_flagged", "why high risk"),
    ("why_flagged", "anomaly detected"),
    ("vendor", "vendor analysis"),
    ("vendor", "contractor details"),
    ("vendor", "company info"),
    ("sanction_cost", "sanction amount"),
    ("sanction_cost", "budget compare"),
    ("sanction_cost", "cost overrun"),
    ("sanction_cost", "expenditure"),
    ("mp_record", "MP track record"),
    ("mp_record", "minister record"),
    ("mp_record", "constituency"),
    ("timeline", "completion delay"),
    ("timeline", "timeline"),
    ("timeline", "days overrun"),
    ("catchall", "summary"),
    ("catchall", "tell me about this work"),
    ("catchall", "random query"),
]

@pytest.mark.parametrize("intent,query", INTENTS)
def test_rag_intent_returns_reply(intent, query):
    response = client.post("/api/rag/query", json={"query": query})
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert isinstance(data["reply"], str)
    assert len(data["reply"]) > 0
    assert "local_model" in data
    assert "NIRIKSHAN" in data["local_model"]

def test_rag_with_context_work_id():
    response = client.post("/api/rag/query", json={
        "query": "why flagged",
        "context_work_id": "WS/MP005/2024-2025/145074"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "WS/MP005/2024-2025/145074" in data["reply"]

def test_rag_with_page_context():
    for ctx in ["global_sidebar", "investigation", "sanity_check"]:
        response = client.post("/api/rag/query", json={
            "query": "why flagged",
            "context_work_id": "WS/MP18198",
            "page_context": ctx
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data

def test_rag_empty_query():
    response = client.post("/api/rag/query", json={"query": ""})
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data

def test_rag_invalid_work_id():
    response = client.post("/api/rag/query", json={
        "query": "why flagged",
        "context_work_id": "INVALID_ID"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data

def test_rag_reply_contains_no_hallucination_markers():
    response = client.post("/api/rag/query", json={"query": "why flagged"})
    data = response.json()
    reply = data["reply"]
    assert "I don't know" not in reply
    assert "as an AI" not in reply.lower()
    assert "I cannot" not in reply
    assert "hallucinat" not in reply.lower()

def test_rag_greeting_includes_work_context():
    response = client.post("/api/rag/query", json={"query": "hi"})
    data = response.json()
    reply = data["reply"]
    assert "NIRIKSHAN AI" in reply
    assert "Risk Score" in reply

def test_rag_identity_includes_model_details():
    response = client.post("/api/rag/query", json={"query": "who are you"})
    data = response.json()
    reply = data["reply"]
    assert "deterministic forensic audit reasoning engine" in reply
    assert "Isolation Forest" in reply
    assert "XGBoost" in reply

def test_rag_why_flagged_contains_signals():
    response = client.post("/api/rag/query", json={"query": "why flagged"})
    data = response.json()
    reply = data["reply"]
    assert "SIGNAL" in reply
    assert "CONCLUSION" in reply

def test_rag_vendor_contains_portfolio():
    response = client.post("/api/rag/query", json={"query": "vendor analysis"})
    data = response.json()
    reply = data["reply"]
    assert "PORTFOLIO" in reply
    assert "AUDIT STEPS" in reply

def test_rag_sanction_contains_financials():
    response = client.post("/api/rag/query", json={"query": "sanction amount"})
    data = response.json()
    reply = data["reply"]
    assert "RECOMMENDED OUTLAY" in reply
    assert "SANCTIONED AMOUNT" in reply
    assert "TOTAL EXPENDITURE" in reply

def test_rag_mp_record_contains_portfolio():
    response = client.post("/api/rag/query", json={"query": "MP track record"})
    data = response.json()
    reply = data["reply"]
    assert "PORTFOLIO" in reply
    assert "RISK PROFILE" in reply

def test_rag_timeline_contains_benchmark():
    response = client.post("/api/rag/query", json={"query": "timeline"})
    data = response.json()
    reply = data["reply"]
    assert "RECORDED TIMELINE" in reply
    assert "PEER BENCHMARK" in reply

def test_rag_catchall_contains_summary():
    response = client.post("/api/rag/query", json={"query": "summary"})
    data = response.json()
    reply = data["reply"]
    assert "NIRIKSHAN Audit Summary" in reply
    assert "RISK:" in reply