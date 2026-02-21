# Pet Vaccination System

Full-stack pet vaccination management app:
- Backend: Django + Django REST Framework
- Frontend: React
- Database: MySQL (or SQLite for quick local testing)

## Project Structure

- `backend/` Django API and business logic
- `frontend/` React client

## Prerequisites

- Python 3.12+
- Node.js 18+ and npm
- MySQL 8+

## 1. Clone and Enter Project

```bash
git clone https://github.com/developervikass/pet-vaccination-system.git
cd pet-vaccination-system
```

## 2. Backend Setup (Django)

Create and activate virtual environment (from repo root):

```bash
python3 -m venv venv
source venv/bin/activate
```

Install backend dependencies:

```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers django-crontab mysqlclient
```

Go to backend folder:

```bash
cd backend
```

Create `.env` from example and configure:

```bash
cp .env.example .env
```

Example MySQL config in `backend/.env`:

```env
DB_ENGINE=mysql
DB_NAME=pet_vaccination_db
DB_USER=user
DB_PASSWORD=password
DB_HOST=127.0.0.1
DB_PORT=3306
```

Create MySQL database/user (adjust as needed):

```bash
sudo systemctl start mysql
sudo mysql -e "CREATE DATABASE IF NOT EXISTS pet_vaccination_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'user'@'127.0.0.1' IDENTIFIED BY 'password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON pet_vaccination_db.* TO 'vikas'@'127.0.0.1'; FLUSH PRIVILEGES;"
```

Run migrations and start backend:

```bash
python manage.py migrate
python manage.py runserver
```

Backend runs at: `http://127.0.0.1:8000`

## 3. Frontend Setup (React)

Open a new terminal:

```bash
cd pet-vaccination-system/frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

## 4. Optional: Use SQLite Instead of MySQL

In `backend/.env`:

```env
DB_ENGINE=sqlite
```

Then run:

```bash
cd backend
python manage.py migrate
```

## Notes

- Do not commit `backend/.env` (already ignored).
- Keep real email/MySQL passwords only in `.env`.
