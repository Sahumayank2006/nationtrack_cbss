'use client';

import { LocateFixed, MapPin, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type BookingPurpose = 'ELECTION' | 'EMERGENCY' | 'MAINTENANCE' | 'TRANSFER' | 'OTHER';

interface BookingCreateResponse {
  success: boolean;
  message?: string;
  data?: {
    bookingId: string;
    vehicleId: string;
    status: string;
  };
}

interface AvailableVehicle {
  id: string;
  registrationNumber: string;
  displayName: string;
  vehicleType: string;
  locationLabel: string;
  distanceKm: number | null;
}

interface AvailableVehiclesResponse {
  success: boolean;
  data?: {
    vehicles: AvailableVehicle[];
    vehicleTypes: string[];
  };
  message?: string;
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
  const [selectedVehicle, setSelectedVehicle] = useState<AvailableVehicle | null>(null);
  const [vehicleOptions, setVehicleOptions] = useState<AvailableVehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehiclePickerError, setVehiclePickerError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
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
      selectedVehicle &&
      startDateTime &&
      endDateTime
    );
  }, [
    contactNumber,
    department,
    designation,
    endDateTime,
    requestorName,
    selectedVehicle,
    startDateTime,
    stationId,
  ]);

  useEffect(() => {
    if (!vehiclePickerOpen) return;

    const controller = new AbortController();
    const loadVehicles = async () => {
      setLoadingVehicles(true);
      setVehiclePickerError(null);
      const params = new URLSearchParams();
      if (stationId.trim()) params.set('stationId', stationId.trim());
      if (vehicleType) params.set('vehicleType', vehicleType);
      if (userLocation) {
        params.set('latitude', String(userLocation.latitude));
        params.set('longitude', String(userLocation.longitude));
      }
      if (startDateTime && endDateTime) {
        params.set('startDate', new Date(startDateTime).toISOString());
        params.set('endDate', new Date(endDateTime).toISOString());
      }

      try {
        const response = await fetch(
          `/api/automobiles/bookings/available-vehicles?${params.toString()}`,
          { cache: 'no-store', signal: controller.signal }
        );
        const payload = (await response.json()) as AvailableVehiclesResponse;
        if (!response.ok || !payload.success || !payload.data) {
          setVehiclePickerError(payload.message ?? 'Unable to load available vehicles.');
          return;
        }
        setVehicleOptions(payload.data.vehicles);
        setVehicleTypes(payload.data.vehicleTypes);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setVehiclePickerError('Network error while loading available vehicles. Please retry.');
      } finally {
        if (!controller.signal.aborted) setLoadingVehicles(false);
      }
    };

    void loadVehicles();
    return () => controller.abort();
  }, [endDateTime, stationId, startDateTime, userLocation, vehiclePickerOpen, vehicleType]);

  const findNearMe = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not supported by this browser. Showing station vehicles.');
      return;
    }

    setLocationMessage('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationMessage('Showing available vehicles nearest to you.');
      },
      () => setLocationMessage('Could not access location. Showing station vehicles instead.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const chooseVehicle = (vehicle: AvailableVehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleType(vehicle.vehicleType);
    setStationId(vehicle.locationLabel);
    setVehiclePickerOpen(false);
  };

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
          vehicleId: selectedVehicle?.id,
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
        `Booking submitted successfully for ${selectedVehicle?.registrationNumber}. Request ID: ${created.data?.bookingId ?? 'generated'}`
      );
      setSelectedVehicle(null);
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

      {vehiclePickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vehicle-picker-title"
        >
          <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="vehicle-picker-title" className="text-xl font-bold text-foreground">
                  Choose a vehicle
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select the vehicle type to see idle vehicles available near you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVehiclePickerOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close vehicle picker"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="space-y-1">
                <span className="text-sm font-medium text-foreground">Vehicle type</span>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={vehicleType}
                  onChange={(event) => {
                    setVehicleType(event.target.value);
                    setSelectedVehicle(null);
                  }}
                  aria-label="Filter by vehicle type"
                >
                  <option value="">All vehicle types</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={findNearMe}>
                  <LocateFixed className="mr-2 h-4 w-4" />
                  Find near me
                </Button>
              </div>
            </div>

            {locationMessage ? (
              <p className="mb-3 text-sm text-muted-foreground" role="status">
                {locationMessage}
              </p>
            ) : null}
            {vehiclePickerError ? (
              <p className="mb-3 text-sm text-destructive" role="alert">
                {vehiclePickerError}
              </p>
            ) : null}

            {loadingVehicles ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Finding available vehicles...
              </p>
            ) : vehicleOptions.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {vehicleOptions.map((vehicle) => (
                  <article key={vehicle.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{vehicle.vehicleType}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.registrationNumber}
                        </p>
                      </div>
                      <span className="rounded-full bg-status-live/10 px-2 py-1 text-xs font-medium text-status-live">
                        Idle / Available
                      </span>
                    </div>
                    <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {vehicle.locationLabel}
                      {vehicle.distanceKm !== null ? ` · ${vehicle.distanceKm} km away` : ''}
                    </p>
                    <Button
                      type="button"
                      className="mt-4 w-full"
                      onClick={() => chooseVehicle(vehicle)}
                    >
                      Select this vehicle
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No idle vehicles match this type and location. Try another type or use “Find near
                me”.
              </p>
            )}
          </section>
        </div>
      ) : null}

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

          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">Vehicle Type</span>
            <div className="flex gap-2">
              <Input value={vehicleType} readOnly placeholder="Choose a vehicle" />
              <Button type="button" variant="outline" onClick={() => setVehiclePickerOpen(true)}>
                {selectedVehicle ? 'Change' : 'Choose'}
              </Button>
            </div>
            {selectedVehicle ? (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedVehicle.registrationNumber} · {selectedVehicle.locationLabel}
              </p>
            ) : (
              <p className="text-xs text-destructive">Select an available vehicle to continue.</p>
            )}
          </div>

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
