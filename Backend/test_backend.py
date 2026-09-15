"""
AgenticMarketer Backend — Automated Integration Test Suite.
Tests all microservice routers in-process via FastAPI TestClient (httpx).
"""

import sys
from pathlib import Path

# Add project root to sys.path and ensure UTF-8 encoding on Windows
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_suite():
    print("\n🔍 ========================================================")
    print("🚀 Running AgenticMarketer Microservice Test Suite")
    print("========================================================\n")

    # 1. Health check
    print("1️⃣ Testing GET /api/health...")
    resp = client.get("/api/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["active_agents"] == 5
    print(f"   ✅ Passed! Status: {data['status']} | Active Agents: {data['active_agents']}")

    # 2. Auth Login (Demo Leader User)
    print("\n2️⃣ Testing POST /api/auth/login...")
    resp = client.post("/api/auth/login", json={
        "email": "mann@company.com",
        "password": "admin123"
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    auth_data = resp.json()
    token = auth_data["access_token"]
    assert token, "Token missing in response"
    assert auth_data["user"]["role"] == "leader"
    print(f"   ✅ Passed! Authenticated user: {auth_data['user']['name']} ({auth_data['user']['role']})")

    # 3. Auth Me
    print("\n3️⃣ Testing GET /api/auth/me...")
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, f"Auth me failed: {resp.text}"
    user_me = resp.json()
    assert user_me["email"] == "mann@company.com"
    print(f"   ✅ Passed! Verified profile: {user_me['name']} ({user_me['email']})")

    # 4. RAG Document Upload
    print("\n4️⃣ Testing POST /api/rag/upload...")
    sample_doc_content = (
        "AgenticMarketer Value Proposition:\n"
        "AgenticMarketer is an autonomous AI marketing swarm that delivers 3.4x faster campaign execution. "
        "Our target audience is B2B leaders, growth marketers, and tech founders who need brand-grounded copy. "
        "Tone guidelines: Authoritative, data-backed, high-converting, concise."
    )
    files = {"file": ("brand_guidelines.txt", sample_doc_content.encode("utf-8"), "text/plain")}
    resp = client.post("/api/rag/upload", files=files)
    assert resp.status_code == 201, f"RAG upload failed: {resp.text}"
    doc_data = resp.json()
    doc_id = doc_data["id"]
    print(f"   ✅ Passed! Ingested: '{doc_data['filename']}' ({doc_data['chunk_count']} chunks)")

    # 5. RAG List Documents
    print("\n5️⃣ Testing GET /api/rag/documents...")
    resp = client.get("/api/rag/documents")
    assert resp.status_code == 200, f"List docs failed: {resp.text}"
    docs = resp.json()
    assert len(docs) > 0, "No documents returned"
    print(f"   ✅ Passed! Indexed documents count: {len(docs)}")

    # 6. RAG Query
    print("\n6️⃣ Testing POST /api/rag/query...")
    resp = client.post("/api/rag/query", json={"query": "What is the tone guideline?", "top_k": 2})
    assert resp.status_code == 200, f"RAG query failed: {resp.text}"
    query_results = resp.json()
    assert len(query_results) > 0, "Query returned no results"
    print(f"   ✅ Passed! Top chunk score: {query_results[0]['score']} from {query_results[0]['doc_name']}")

    # 7. Swarm Synchronous Execution (All 5 Agents)
    print("\n7️⃣ Testing POST /api/swarm/run-sync (Executing 5-Agent Swarm Pipeline)...")
    swarm_payload = {
        "goal": "Launch B2B AI Marketing Intelligence Platform",
        "audience": "SaaS Founders & CMOs",
        "tone": "Authoritative",
        "channels": ["linkedin", "x", "meta"]
    }
    resp = client.post("/api/swarm/run-sync", json=swarm_payload)
    assert resp.status_code == 200, f"Swarm sync failed: {resp.text}"
    swarm_res = resp.json()
    result = swarm_res["result"]
    assert result, "Swarm result is empty"
    assert "copy" in result, "Copy missing in swarm result"
    assert "seo_metrics" in result, "SEO metrics missing"
    assert "publishing_manifests" in result, "Publishing manifests missing"
    print(f"   ✅ Passed! Swarm run {swarm_res['run_id']} finished across 5 agents.")
    print(f"      - Copy length: {len(result['copy'])} chars")
    print(f"      - Readability score: {result['seo_metrics']['readability_score']}/100")
    print(f"      - Intent Match: {result['seo_metrics']['intent_match']}")
    print(f"      - Publishing channels: {len(result['publishing_manifests'])}")

    # 8. Omnichannel Publishing Platforms
    print("\n8️⃣ Testing GET /api/publish/platforms...")
    resp = client.get("/api/publish/platforms")
    assert resp.status_code == 200, f"Publish platforms failed: {resp.text}"
    platforms = resp.json()
    assert len(platforms) >= 8, f"Expected 8+ platforms, got {len(platforms)}"
    print(f"   ✅ Passed! Supported omnichannel platforms: {len(platforms)} ({', '.join(p['id'] for p in platforms)})")

    # 9. Omnichannel Publishing Broadcast
    print("\n9️⃣ Testing POST /api/publish/broadcast...")
    broadcast_payload = {
        "content": "🚀 Announcing AgenticMarketer: Autonomous Multi-Agent Marketing Intelligence.",
        "platforms": ["linkedin", "x", "threads", "webhook"],
        "media_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
    }
    resp = client.post("/api/publish/broadcast", json=broadcast_payload)
    assert resp.status_code == 200, f"Broadcast failed: {resp.text}"
    disp_res = resp.json()
    assert disp_res["total_platforms"] == 4
    print(f"   ✅ Passed! Dispatched to {disp_res['total_platforms']} platforms with Dispatch ID: {disp_res['dispatch_id']}")

    # 10. Clean up test document
    print("\n🔟 Cleaning up test document...")
    del_resp = client.delete(f"/api/rag/documents/{doc_id}")
    assert del_resp.status_code == 200
    print("   ✅ Passed! Test document cleaned up.")

    print("\n🎉 ========================================================")
    print("🏆 ALL 10 TESTS PASSED SUCCESSFULLY! BACKEND IS 100% OPERATIONAL")
    print("========================================================\n")


if __name__ == "__main__":
    test_suite()
