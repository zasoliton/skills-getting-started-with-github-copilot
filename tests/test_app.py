from fastapi.testclient import TestClient
from urllib.parse import quote
import copy
import src.app as app_module
import pytest

client = TestClient(app_module.app)

@pytest.fixture(autouse=True)
def reset_activities():
    """Restore the in-memory `activities` after each test to avoid leakage."""
    original = copy.deepcopy(app_module.activities)
    yield
    app_module.activities = original


def test_root_redirect():
    resp = client.get("/", follow_redirects=False)
    assert resp.status_code in (302, 307)
    assert resp.headers.get("location", "").endswith("/static/index.html")


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    expected_keys = {"description", "schedule", "max_participants", "participants"}
    assert expected_keys.issubset(set(data["Chess Club"].keys()))


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "tester@example.com"
    q_activity = quote(activity, safe="")

    # signup
    assert email not in app_module.activities[activity]["participants"]
    resp = client.post(f"/activities/{q_activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in app_module.activities[activity]["participants"]

    # unregister
    resp2 = client.post(f"/activities/{q_activity}/unregister?email={email}")
    assert resp2.status_code == 200
    assert email not in app_module.activities[activity]["participants"]
