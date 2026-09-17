from datetime import date, time, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import Appointment, AppointmentStatus
from .routers import router

app = FastAPI(
    title="Appointment Board API",
    description="Simple team appointment board with conflict checks",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


def seed_sample_appointments(db: Session) -> None:
    if db.query(Appointment).count() > 0:
        return

    today = date.today()
    samples = [
        Appointment(
            title="Team standup",
            description="Daily sync for project status and blockers.",
            appointment_date=today,
            start_time=time(9, 0),
            end_time=time(9, 30),
            status=AppointmentStatus.scheduled,
        ),
        Appointment(
            title="Client discovery call",
            description="Gather requirements for the onboarding flow.",
            appointment_date=today,
            start_time=time(11, 0),
            end_time=time(12, 0),
            status=AppointmentStatus.scheduled,
        ),
        Appointment(
            title="Design review",
            description="Review wireframes with the design team.",
            appointment_date=today + timedelta(days=1),
            start_time=time(14, 0),
            end_time=time(15, 0),
            status=AppointmentStatus.scheduled,
        ),
        Appointment(
            title="Sprint retrospective",
            description="What went well and what to improve.",
            appointment_date=today - timedelta(days=1),
            start_time=time(16, 0),
            end_time=time(17, 0),
            status=AppointmentStatus.completed,
        ),
        Appointment(
            title="Vendor demo",
            description="Product walkthrough — cancelled due to travel.",
            appointment_date=today + timedelta(days=2),
            start_time=time(10, 0),
            end_time=time(11, 0),
            status=AppointmentStatus.cancelled,
        ),
    ]
    db.add_all(samples)
    db.commit()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_sample_appointments(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}
