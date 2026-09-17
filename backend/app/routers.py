from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .database import get_db
from .models import AppointmentStatus
from .schemas import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentUpdate,
    MessageOut,
)
from . import services

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


@router.get("", response_model=list[AppointmentOut])
def get_appointments(
    appointment_date: Optional[date] = Query(None, alias="date"),
    status: Optional[AppointmentStatus] = Query(None),
    db: Session = Depends(get_db),
):
    return services.list_appointments(db, appointment_date, status)


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    return services.get_appointment_or_404(db, appointment_id)


@router.post("", response_model=MessageOut, status_code=201)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)):
    appointment = services.create_appointment(db, payload.model_dump())
    return MessageOut(
        message="Appointment added successfully",
        appointment=appointment,
    )


@router.put("/{appointment_id}", response_model=MessageOut)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
):
    appointment = services.get_appointment_or_404(db, appointment_id)
    data = payload.model_dump(exclude_unset=True)
    if not data:
        return MessageOut(message="No changes provided", appointment=appointment)
    updated = services.update_appointment(db, appointment, data)
    return MessageOut(message="Appointment updated successfully", appointment=updated)


@router.post("/{appointment_id}/complete", response_model=MessageOut)
def complete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = services.get_appointment_or_404(db, appointment_id)
    if appointment.status == AppointmentStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled appointments cannot be marked as completed",
        )
    if appointment.status == AppointmentStatus.completed:
        return MessageOut(
            message="Appointment is already completed",
            appointment=appointment,
        )
    updated = services.update_appointment(
        db, appointment, {"status": AppointmentStatus.completed}
    )
    return MessageOut(message="Appointment marked as completed", appointment=updated)


@router.post("/{appointment_id}/cancel", response_model=MessageOut)
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = services.get_appointment_or_404(db, appointment_id)
    if appointment.status == AppointmentStatus.cancelled:
        return MessageOut(
            message="Appointment is already cancelled",
            appointment=appointment,
        )
    updated = services.update_appointment(
        db, appointment, {"status": AppointmentStatus.cancelled}
    )
    return MessageOut(message="Appointment cancelled", appointment=updated)
