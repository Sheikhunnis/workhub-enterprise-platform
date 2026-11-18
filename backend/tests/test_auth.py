def test_client_registration_and_login(client):
    reg_payload = {
        "email": "testclient@acme.com",
        "password": "SecurePassword123!",
        "company_name": "Test Acme Inc",
        "contact_person": "Jane Doe",
        "phone": "+1-555-9876",
        "address": "123 Tech Lane"
    }
    # Register client
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "CLIENT"
    assert data["name"] == "Jane Doe"

    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "testclient@acme.com",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert token_data["email"] == "testclient@acme.com"
    token = token_data["access_token"]

    # Verify /me
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["client_profile"]["company_name"] == "Test Acme Inc"

def test_login_invalid_password(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
