import asyncio
import httpx
from app.main import app

async def main():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health check
        res = await client.get("/api/v1/health")
        print("Health Check:", res.status_code, res.json())
        assert res.status_code == 200

        # 2. Login as Super Admin
        login_res = await client.post("/api/v1/auth/login", json={
            "email": "superadmin@workhub.io",
            "password": "WorkHub@2026"
        })
        print("Super Admin Login:", login_res.status_code, login_res.json()["name"])
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Analytics overview
        analytics_res = await client.get("/api/v1/analytics/overview", headers=headers)
        print("Analytics Overview:", analytics_res.status_code, "Total Tickets:", analytics_res.json()["total_tickets"])
        assert analytics_res.status_code == 200

        # 4. List Tickets
        tickets_res = await client.get("/api/v1/tickets", headers=headers)
        print("List Tickets:", tickets_res.status_code, "Count:", len(tickets_res.json()))
        assert tickets_res.status_code == 200
        ticket_number = tickets_res.json()[0]["ticket_number"]

        # 5. Track Ticket
        track_res = await client.get(f"/api/v1/tickets/track/{ticket_number}", headers=headers)
        print(f"Track Ticket ({ticket_number}):", track_res.status_code, "Title:", track_res.json()["title"])
        assert track_res.status_code == 200

        print("\n🎉 ALL BACKEND API CHECKS PASSED PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(main())
