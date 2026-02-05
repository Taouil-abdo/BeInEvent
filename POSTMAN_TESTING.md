# BeInEvent API - Postman Testing Guide

## Prerequisites

1. **Start MongoDB** – The backend needs MongoDB running.
   - Local: `mongod` or your MongoDB service
   - Docker: `docker-compose up -d` (if using Docker)

2. **Configure environment** – Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
   Set at least:
   - `MONGODB_URI` (e.g. `mongodb://localhost:27017/beinevent`)
   - `JWT_SECRET` (any strong secret string)

3. **Start the backend**:
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```
   API base URL: `http://localhost:3001`

---

## Import the Postman Collection

1. Open Postman.
2. Click **Import**.
3. Select `BeInEvent-Postman-Collection.json` from the project root.
4. The collection **BeInEvent API** will appear in the sidebar.

---

## Testing Flow

### 1. Register a user

- Request: **Auth → Register**
- Method: `POST http://localhost:3001/auth/register`
- Body (JSON):
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- Expected: `201` with `access_token`, `refresh_token`, and `user`.

---

### 2. Login

- Request: **Auth → Login**
- Method: `POST http://localhost:3001/auth/login`
- Body (JSON):
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- Expected: `201` with tokens and user.
- The collection scripts will store `access_token` and `refresh_token` in collection variables for later requests.

---

### 3. Create an event (protected)

- Request: **Events → Create Event (Protected)**
- Method: `POST http://localhost:3001/events`
- Headers: `Authorization: Bearer {{accessToken}}` (set automatically if you ran Login)
- Body (JSON):
  ```json
  {
    "title": "Tech Conference 2025",
    "description": "Annual tech conference",
    "date": "2025-06-15T09:00:00.000Z",
    "location": "New York"
  }
  ```
- Expected: `201` with the created event.

---

### 4. Get all events (public)

- Request: **Events → Get All Events (Public)**
- Method: `GET http://localhost:3001/events`
- No auth required.
- Expected: `200` with an array of events.

---

### 5. Get event by ID

- Request: **Events → Get Event by ID**
- Method: `GET http://localhost:3001/events/:id`
- Replace `:id` with an event ID from the create/list response.
- Expected: `200` with the event.

---

### 6. Update event (protected)

- Request: **Events → Update Event (Protected)**
- Method: `PATCH http://localhost:3001/events/:id`
- Headers: `Authorization: Bearer {{accessToken}}`
- Body (JSON):
  ```json
  {
    "title": "Tech Conference 2025 - Updated",
    "location": "Los Angeles"
  }
  ```
- Expected: `200` with the updated event.

---

### 7. Delete event (protected)

- Request: **Events → Delete Event (Protected)**
- Method: `DELETE http://localhost:3001/events/:id`
- Headers: `Authorization: Bearer {{accessToken}}`
- Expected: `200` with a success message.

---

### 8. Refresh token

- Request: **Auth → Refresh Token**
- Method: `POST http://localhost:3001/auth/refresh`
- Body (JSON):
  ```json
  {
    "refreshToken": "{{refreshToken}}"
  }
  ```
- Expected: `201` with new `access_token` and `refresh_token`.
- Collection scripts update the stored tokens.

---

### 9. Logout

- Request: **Auth → Logout**
- Method: `POST http://localhost:3001/auth/logout`
- Body (JSON):
  ```json
  {
    "refreshToken": "{{refreshToken}}"
  }
  ```
- Expected: `201` with `{ "message": "Logged out successfully" }`.

---

## Quick Test Order

1. **Register** → create user and get tokens  
2. **Login** → get tokens (or use Register tokens)  
3. **Create Event** → create an event  
4. **Get All Events** → list events  
5. **Update Event** → update the event (use ID from step 3)  
6. **Delete Event** → delete the event  
7. **Refresh Token** → get new tokens  
8. **Logout** → revoke refresh token  

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `401 Unauthorized` on protected routes | Run **Login** first so `accessToken` is set. |
| `Connection refused` | Ensure backend is running on port 3001. |
| `MongoDB connection error` | Start MongoDB and check `MONGODB_URI`. |
| `400 Bad Request` | Check JSON body and required fields. |
| `403 Forbidden` on update/delete | You can only update/delete events you created. |

---

## Manual token setup

If collection variables are not set:

1. Open the collection → **Variables**.
2. Set `accessToken` to the value from Login/Register.
3. Set `refreshToken` to the refresh token value.
4. Save the collection.
