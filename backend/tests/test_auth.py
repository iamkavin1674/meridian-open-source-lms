import auth.service as auth_service


def register(client, email="new@example.com", password="password123", name="New User", **kw):
    return client.post(
        "/auth/register", json={"email": email, "password": password, "full_name": name, **kw}
    )


def capture_otps(monkeypatch):
    sent: list[tuple[str, str]] = []
    monkeypatch.setattr(auth_service, "send_otp_email", lambda e, o: sent.append((e, o)))
    return sent


def test_register_login_and_me(client):
    r = register(client)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["email"] == "new@example.com" and body["role"] == "trainee"
    assert "hashed_password" not in body and "password" not in body
    # Duplicate email -> 409
    assert register(client).status_code == 409
    # Wrong password -> 401
    bad = client.post("/auth/login", json={"email": "new@example.com", "password": "wrong-pass"})
    assert bad.status_code == 401
    ok = client.post("/auth/login", json={"email": "new@example.com", "password": "password123"})
    assert ok.status_code == 200, ok.text
    token = ok.json()["access_token"]
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200 and me.json()["email"] == "new@example.com"
    # No / tampered token -> 401
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {token}x"}).status_code == 401


def test_forgot_password_no_enumeration_and_reset_flow(client, monkeypatch):
    register(client, email="reset@example.com")
    sent = capture_otps(monkeypatch)

    # Unknown email: same generic 200, no OTP sent.
    unknown = client.post("/auth/forgot-password", json={"email": "ghost@example.com"})
    assert unknown.status_code == 200
    assert sent == []

    r = client.post("/auth/forgot-password", json={"email": "reset@example.com"})
    assert r.status_code == 200 and r.json() == unknown.json()
    assert len(sent) == 1 and sent[0][0] == "reset@example.com"
    otp = sent[0][1]
    assert len(otp) == 6 and otp.isdigit()

    # Wrong OTP -> 400; correct OTP -> 200 and new password works.
    wrong = "000000" if otp != "000000" else "111111"
    bad = client.post(
        "/auth/reset-password",
        json={"email": "reset@example.com", "otp": wrong, "new_password": "newpassword1"},
    )
    assert bad.status_code == 400
    ok = client.post(
        "/auth/reset-password",
        json={"email": "reset@example.com", "otp": otp, "new_password": "newpassword1"},
    )
    assert ok.status_code == 200, ok.text
    # OTP is single-use.
    again = client.post(
        "/auth/reset-password",
        json={"email": "reset@example.com", "otp": otp, "new_password": "anotherpass1"},
    )
    assert again.status_code == 400
    assert client.post(
        "/auth/login", json={"email": "reset@example.com", "password": "newpassword1"}
    ).status_code == 200
    assert client.post(
        "/auth/login", json={"email": "reset@example.com", "password": "password123"}
    ).status_code == 401


def test_new_otp_invalidates_previous(client, monkeypatch):
    register(client, email="twice@example.com")
    sent = capture_otps(monkeypatch)
    client.post("/auth/forgot-password", json={"email": "twice@example.com"})
    client.post("/auth/forgot-password", json={"email": "twice@example.com"})
    assert len(sent) == 2
    first, second = sent[0][1], sent[1][1]
    stale = client.post(
        "/auth/reset-password",
        json={"email": "twice@example.com", "otp": first, "new_password": "newpassword1"},
    )
    assert stale.status_code == 400
    # Second OTP may equal first by chance (1/1e6); only assert success when different.
    if second != first:
        assert client.post(
            "/auth/reset-password",
            json={"email": "twice@example.com", "otp": second, "new_password": "newpassword1"},
        ).status_code == 200


def test_otp_attempt_cap(client, monkeypatch):
    register(client, email="cap@example.com")
    sent = capture_otps(monkeypatch)
    client.post("/auth/forgot-password", json={"email": "cap@example.com"})
    otp = sent[0][1]
    wrong = "000000" if otp != "000000" else "111111"
    for _ in range(5):
        assert client.post(
            "/auth/reset-password",
            json={"email": "cap@example.com", "otp": wrong, "new_password": "newpassword1"},
        ).status_code == 400
    # Even the correct code is now rejected.
    assert client.post(
        "/auth/reset-password",
        json={"email": "cap@example.com", "otp": otp, "new_password": "newpassword1"},
    ).status_code == 400


def test_google_upsert_and_google_only_password_login(client, monkeypatch):
    monkeypatch.setattr(
        auth_service,
        "verify_google_id_token",
        lambda tok: {
            "sub": "google-sub-1",
            "email": "google@example.com",
            "name": "Google User",
            "iss": "https://accounts.google.com",
        },
    )
    r = client.post("/auth/google", json={"id_token": "fake-token"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["has_google"] is True and me.json()["has_password"] is False
    # Google-only account attempting password login fails gracefully.
    pw = client.post("/auth/login", json={"email": "google@example.com", "password": "whatever123"})
    assert pw.status_code == 401
    assert "Google" in pw.json()["detail"]
    # Second Google login returns the same user (upsert, no duplicate).
    again = client.post("/auth/google", json={"id_token": "fake-token"})
    me2 = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {again.json()['access_token']}"}
    )
    assert me2.json()["id"] == me.json()["id"]
