from app.db.models import TraineeSurvey


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_auth_required(client):
    assert client.get("/api/v1/users/me").status_code == 401


def test_sync_and_me(client, seeded):
    r = client.get("/api/v1/users/me", headers=seeded["trainee_h"])
    assert r.status_code == 200
    assert r.json()["email"] == "trainee@example.com"
    assert r.json()["role"] == "trainee"


def test_flow_a_evaluation(client, seeded):
    payload = {
        "trainee_id": seeded["trainee"]["id"],
        "module_id": seeded["module"]["id"],
        "raw_feedback": "Good progress, needs practice on loops",
        "performance_score": 82,
    }
    r = client.post("/api/v1/evaluations/trainer-to-trainee", json=payload, headers=seeded["trainer_h"])
    assert r.status_code == 201, r.text
    assert r.json()["trainer_id"] == seeded["trainer"]["id"]
    # Trainee can read own, other trainee cannot.
    assert client.get("/api/v1/evaluations/trainer-to-trainee", headers=seeded["trainee_h"]).json()[0]["id"] == r.json()["id"]
    other = client.get(
        f"/api/v1/evaluations/trainer-to-trainee/{r.json()['id']}", headers=seeded["trainee2_h"]
    )
    assert other.status_code == 403
    # Trainee cannot create Flow A.
    assert client.post("/api/v1/evaluations/trainer-to-trainee", json=payload, headers=seeded["trainee_h"]).status_code == 403


def test_flow_b_survey_is_anonymous(client, seeded):
    payload = {
        "trainer_id": seeded["trainer"]["id"],
        "cohort_id": seeded["cohort"]["id"],
        "module_id": seeded["module"]["id"],
        "pacing_score": 4,
        "clarity_score": 5,
        "difficulty_score": 3,
        "comments": "Clear examples",
    }
    r = client.post("/api/v1/surveys/trainee-to-trainer", json=payload, headers=seeded["trainee_h"])
    assert r.status_code == 201, r.text
    body = r.json()
    assert "trainee_id" not in body and "user_id" not in body and "email" not in body
    # Schema forbids identity fields outright.
    bad = dict(payload, trainee_id=seeded["trainee"]["id"])
    assert client.post("/api/v1/surveys/trainee-to-trainer", json=bad, headers=seeded["trainee_h"]).status_code == 422
    # Table itself has no identity column.
    assert not hasattr(TraineeSurvey, "trainee_id")
    assert not hasattr(TraineeSurvey, "user_id")
    agg = client.get("/api/v1/surveys/trainee-to-trainer/aggregate", headers=seeded["trainer_h"])
    assert agg.status_code == 200
    assert agg.json()["count"] == 1
    assert agg.json()["avg_clarity"] == 5.0


def test_assignment_flow(client, seeded):
    module_id = seeded["module"]["id"]
    a = client.post(
        f"/api/v1/modules/{module_id}/assignments",
        json={"title": "HW1", "max_score": 10},
        headers=seeded["trainer_h"],
    )
    assert a.status_code == 201, a.text
    sub = client.post(
        f"/api/v1/assignments/{a.json()['id']}/submissions",
        json={"submission_text": "my answer"},
        headers=seeded["trainee_h"],
    )
    assert sub.status_code == 201, sub.text
    graded = client.patch(
        f"/api/v1/submissions/{sub.json()['id']}/grade", json={"score": 9}, headers=seeded["trainer_h"]
    )
    assert graded.status_code == 200
    assert graded.json()["status"] == "graded"
    over = client.patch(
        f"/api/v1/submissions/{sub.json()['id']}/grade", json={"score": 99}, headers=seeded["trainer_h"]
    )
    assert over.status_code == 422


def test_admin_analytics_and_vector_isolation(client, seeded):
    client.post(
        "/api/v1/evaluations/trainer-to-trainee",
        json={
            "trainee_id": seeded["trainee"]["id"],
            "module_id": seeded["module"]["id"],
            "raw_feedback": "ok",
            "performance_score": 90,
        },
        headers=seeded["trainer_h"],
    )
    r = client.get("/api/v1/admin/analytics/countries", headers=seeded["admin_h"])
    assert r.status_code == 200, r.text
    ke = [c for c in r.json() if c["country_code"] == "KE"][0]
    assert ke["trainees"] == 2 and ke["trainers"] == 1 and ke["avg_performance_score"] == 90.0
    # Non-admin blocked.
    assert client.get("/api/v1/admin/analytics/countries", headers=seeded["trainer_h"]).status_code == 403
    # Vector memories require a metadata filter.
    assert client.get("/api/v1/admin/vector-memories", headers=seeded["admin_h"]).status_code == 422
    mem = client.post(
        "/api/v1/admin/vector-memories",
        json={"content_text": "prefers visual examples", "memory_type": "learning_style"},
        headers=seeded["trainee_h"],
    )
    assert mem.status_code == 201, mem.text
    assert mem.json()["user_id"] == seeded["trainee"]["id"]
    own = client.get(
        f"/api/v1/admin/vector-memories?user_id={seeded['trainee']['id']}", headers=seeded["trainee_h"]
    )
    assert len(own.json()) == 1
    other = client.get(
        f"/api/v1/admin/vector-memories?user_id={seeded['trainee']['id']}", headers=seeded["trainee2_h"]
    )
    assert other.status_code == 403


def test_gdpr_delete_removes_user_and_memories(client, seeded):
    client.post(
        "/api/v1/admin/vector-memories",
        json={"content_text": "to be deleted", "memory_type": "learning_style"},
        headers=seeded["trainee2_h"],
    )
    r = client.delete(f"/api/v1/admin/users/{seeded['trainee2']['id']}", headers=seeded["admin_h"])
    assert r.status_code == 204
    assert client.get("/api/v1/users/me", headers=seeded["trainee2_h"]).status_code == 401
    remaining = client.get(
        f"/api/v1/admin/vector-memories?user_id={seeded['trainee2']['id']}", headers=seeded["admin_h"]
    )
    assert remaining.json() == []
