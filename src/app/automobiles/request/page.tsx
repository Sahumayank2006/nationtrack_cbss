'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type BookingPurpose = 'ELECTION' | 'EMERGENCY' | 'MAINTENANCE' | 'TRANSFER' | 'OTHER';

interface AvailabilityResponse {
  success: boolean;
  data?: {
    stationId: string;
    totalVehicles: number;
    availableVehicles: number;
    hasAvailability: boolean;
  };
  message?: string;
}

interface BookingCreateResponse {
  success: boolean;
  message?: string;
  data?: {
    bookingId: string;
    vehicleId: string;
    status: string;
  };
}

export default function AutomobileRequestPage() {
  const params = useSearchParams();
  const preselectedStation = params.get('station') ?? '';

  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [requestorName, setRequestorName] = useState('');
  const [stationId, setStationId] = useState(preselectedStation);
  const [purpose, setPurpose] = useState<BookingPurpose>('OTHER');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState('');
  const [comments, setComments] = useState('');
  const [supportingLetter, setSupportingLetter] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');

  const canSubmit = useMemo(() => {
    return (
      department.trim() &&
      designation.trim() &&
      contactNumber.trim() &&
      requestorName.trim() &&
      stationId.trim() &&
      startDateTime &&
      endDateTime
    );
  }, [
    contactNumber,
    department,
    designation,
    endDateTime,
    requestorName,
    startDateTime,
    stationId,
  ]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setStatusType('error');
      setStatusMessage('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    setStatusType('info');
    setStatusMessage('Checking availability...');

    const startDateIso = new Date(startDateTime).toISOString();
    const endDateIso = new Date(endDateTime).toISOString();

    try {
      const availabilityRes = await fetch(
        `/api/automobiles/bookings/availability?stationId=${encodeURIComponent(stationId)}&startDate=${encodeURIComponent(startDateIso)}&endDate=${encodeURIComponent(endDateIso)}`,
        { cache: 'no-store' }
      );
      const availability = (await availabilityRes.json()) as AvailabilityResponse;

      if (!availability.success || !availability.data?.hasAvailability) {
        setStatusType('error');
        setStatusMessage(
          availability.message ??
            'No vehicles are available in the selected slot. Please adjust date/time.'
        );
        return;
      }

      const createRes = await fetch('/api/automobiles/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          requesterName: requestorName,
          requesterDepartment: `${department}${designation ? ` (${designation})` : ''}`,
          requesterPhone: contactNumber,
          purpose,
          startDate: startDateIso,
          endDate: endDateIso,
          estimatedDistance: estimatedDistance ? Number(estimatedDistance) : undefined,
          vehicleType,
          quantity: Number(quantity),
          driverDetails: {
            name: driverName,
            phone: driverPhone,
          },
          comments,
          supportingLetterName: supportingLetter?.name,
        }),
      });

      const created = (await createRes.json()) as BookingCreateResponse;
      if (!createRes.ok || !created.success) {
        setStatusType('error');
        setStatusMessage(created.message ?? 'Unable to submit booking request.');
        return;
      }

      setStatusType('success');
      setStatusMessage(
        `Booking submitted successfully. Request ID: ${created.data?.bookingId ?? 'generated'}`
      );
    } catch {
      setStatusType('error');
      setStatusMessage('Network error while submitting booking. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Automobile Booking Request</h1>
        <p className="text-sm text-muted-foreground">
          Submit official vehicle requirement with scheduling and supporting details.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="card-elevated space-y-5 rounded-xl p-5" noValidate>
        <section className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">Department *</span>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} required />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">Designation *</span>
            <Input value={designation} onChange={(e) => setDesignation(e.target.value)} required />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">Contact Number *</span>
            <Input
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              inputMode="numeric"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">Requester Name *</span>
            <Input
              value={requestorName}
              onChange={(e) => setRequestorName(e.target.value)}
              required
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Police Station *</span>
            <Input value={stationId} onChange={(e) => setStationId(e.target.value)} required />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">Purpose *</span>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as BookingPurpose)}
              aria-label="Purpose"
            >
              <option value="OTHER">Other</option>
              <option value="ELECTION">Election Duty</option>
              <option value="EMERGENCY">Emergency Response</option>
              <option value="MAINTENANCE">Maintenance Transfer</option>
              <option value="TRANSFER">Department Transfer</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">Vehicle Type</span>
            <Input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">Start Date & Time *</span>
            <Input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">End Date & Time *</span>
            <Input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">Quantity</span>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">Estimated Distance (km)</span>
            <Input
              type="number"
              min={0}
              value={estimatedDistance}
              onChange={(e) => setEstimatedDistance(e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">Driver Name</span>
            <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-foreground">Driver Contact</span>
            <Input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Upload Letter (PDF)</span>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setSupportingLetter(e.target.files?.[0] ?? null)}
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Comments</span>
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={4} />
          </label>
        </section>

        {statusMessage ? (
          <p
            role="status"
            aria-live="polite"
            className={
              statusType === 'error'
                ? 'text-sm font-medium text-destructive'
                : statusType === 'success'
                  ? 'text-sm font-medium text-status-live'
                  : 'text-sm font-medium text-accent-foreground'
            }
          >
            {statusMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting || !canSubmit}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
          <Link href="/automobiles/bookings">
            <Button type="button" variant="outline">
              View My Bookings
            </Button>
          </Link>
        </div>
      </form>
    </main>
  );
}
