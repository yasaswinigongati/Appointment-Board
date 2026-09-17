from datetime import date, time
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .models import Appointment, AppointmentStatus


def has_time_conflict(
    db: Session,
    appointment_date: date,
    start_time: time,
    end_time: time,
    exclude_id: Optional[int] = None,
) -> bool:
    """Return True if another non-cancelled appointment overlaps the slot."""
    query = db.query(Appointment).filter(
        Appointment.appointment_date == appointment_date,
        Appointment.status != AppointmentStatus.cancelled,
        Appointment.start_time < end_time,
        Appointment.end_time > start_time,
    )
    if exclude_id is not None:
        query = query.filter(Appointment.id != exclude_id)
    return query.first() is not None


def list_appointments(
    db: Session,
    appointment_date: Optional[date] = None,
    status_filter: Optional[AppointmentStatus] = None,
) -> list[Appointment]:
    query = db.query(Appointment)
    if appointment_date is not None:
        query = query.filter(Appointment.appointment_date == appointment_date)
    if status_filter is not None:
        query = query.filter(Appointment.status == status_filter)
    return query.order_by(
        Appointment.appointment_date.asc(),
        Appointment.start_time.asc(),
    ).all()


def get_appointment_or_404(db: Session, appointment_id: int) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    return appointment


def ensure_no_conflict(
    db: Session,
    appointment_date: date,
    start_time: time,
    end_time: time,
    exclude_id: Optional[int] = None,
) -> None:
    if has_time_conflict(db, appointment_date, start_time, end_time, exclude_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time slot overlaps with an existing appointment",
        )


def create_appointment(db: Session, data: dict) -> Appointment:
    ensure_no_conflict(
        db,
        data["appointment_date"],
        data["start_time"],
        data["end_time"],
    )
    appointment = Appointment(**data, status=AppointmentStatus.scheduled)
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def update_appointment(db: Session, appointment: Appointment, data: dict) -> Appointment:
    if appointment.status == AppointmentStatus.cancelled and "status" not in data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled appointments cannot be edited. Create a new appointment instead.",
        )

    merged = {
        "appointment_date": data.get("appointment_date", appointment.appointment_date),
        "start_time": data.get("start_time", appointment.start_time),
        "end_time": data.get("end_time", appointment.end_time),
    }

    if merged["end_time"] <= merged["start_time"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time",
        )

    new_status = data.get("status", appointment.status)
    if new_status != AppointmentStatus.cancelled:
        ensure_no_conflict(
            db,
            merged["appointment_date"],
            merged["start_time"],
            merged["end_time"],
            exclude_id=appointment.id,
        )

    for key, value in data.items():
        setattr(appointment, key, value)

    db.commit()
    db.refresh(appointment)
    return appointment
