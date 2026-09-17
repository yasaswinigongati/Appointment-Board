# Appointment Board

A simple and modern **team appointment management system** built with **React, FastAPI, and SQLite**.

## Features

* 📌 Create & Edit appointments with client, date, and time details
* ✅ Complete / Cancel appointments with clear status tracking
* 🔎 Filter appointments by date and status
* 🚫 Prevent Time Conflicts with automatic overlap detection
* 🌓 Light & Dark Mode with saved user preference
* ⚡ Fast REST APIs powered by FastAPI
* 🗄️ SQLite Database for simple, zero-configuration storage

## Tech Stack

Frontend: React + Vite | Backend: FastAPI | Database: SQLite

### Commands to run 
Backend:
cd backend
python -m uvicorn app.main:app --reload --port 8000

Frontend:
cd frontend
npm run dev
