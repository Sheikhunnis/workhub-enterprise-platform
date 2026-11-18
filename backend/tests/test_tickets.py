from app.models.enums import UserRole
from app.models.organization import Department, Team
from app.models.user import User, Client
from app.core.security import get_password_hash

def test_ticket_lifecycle_and_unique_id(client, db_session):
    # Setup test department and team
    dept = Department(name="IT Services", code="ITS", description="IT support")
    db_session.add(dept)
    db_session.flush()

    team = Team(department_id=dept.id, name="Cloud Ops", code="ITS-CLD")
    db_session.add(team)
    db_session.flush()

    # Register client
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "client.alpha@test.com",
        "password": "Password@123",
        "company_name": "Alpha Corp",
        "contact_person": "Alice Smith"
    })
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Ticket
    ticket_payload = {
        "department_id": dept.id,
        "team_id": team.id,
        "title": "VPN Access Gateway Timeout",
        "description": "Users are encountering connection drops when authenticating via VPN gateway.",
        "category": "Network",
        "priority": "HIGH"
    }
    create_res = client.post("/api/v1/tickets", json=ticket_payload, headers=headers)
    assert create_res.status_code == 201
    ticket_data = create_res.json()
    
    assert ticket_data["ticket_number"].startswith("WH-")
    assert ticket_data["status"] == "OPEN"
    ticket_id = ticket_data["id"]
    ticket_number = ticket_data["ticket_number"]

    # 2. Track ticket by unique number
    track_res = client.get(f"/api/v1/tickets/track/{ticket_number}", headers=headers)
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["title"] == "VPN Access Gateway Timeout"
    assert len(track_data["history"]) >= 1
    assert track_data["history"][0]["action"] == "CREATED"

    # 3. Add comment
    comment_res = client.post(f"/api/v1/tickets/{ticket_id}/comments", json={
        "content": "This is blocking our remote engineering team today."
    }, headers=headers)
    assert comment_res.status_code == 201
    assert comment_res.json()["content"] == "This is blocking our remote engineering team today."

    # 4. Create child task under this ticket
    task_res = client.post(f"/api/v1/tickets/{ticket_id}/tasks", json={
        "title": "Diagnose IPsec handshake drops",
        "description": "Inspect packet capture on firewall ingress interface.",
        "priority": "HIGH",
        "estimated_hours": 3.0
    }, headers=headers)
    assert task_res.status_code == 201
    task_data = task_res.json()
    assert task_data["task_number"].startswith(f"{ticket_number}-T")
    assert task_data["ticket_id"] == ticket_id
