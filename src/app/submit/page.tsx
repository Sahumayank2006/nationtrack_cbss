'use client';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, Loader2, Plus, RefreshCcw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { db, isFirebaseReady } from '@/lib/firebase';

type RequestMode = 'booking' | 'create' | 'update';

export default function SubmitPage() {
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<RequestMode>('booking');
  const [amenityInput, setAmenityInput] = useState('');
  const [form, setForm] = useState({
    spaceId: '',
    spaceName: '',
    district: '',
    address: '',
    bookedByName: '',
    bookedBy: '',
    purpose: '',
    expectedAttendees: '1',
    startTime: '',
    endTime: '',
    organizationName: '',
    capacity: '10',
    areaSqFt: '100',
    updateSummary: '',
    amenities: [] as string[],
  });

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const nextMode: RequestMode =
      modeParam === 'create' || modeParam === 'update' || modeParam === 'booking'
        ? modeParam
        : 'booking';

    setMode(nextMode);
    setForm((prev) => ({
      ...prev,
      spaceId: searchParams.get('spaceId') ?? prev.spaceId,
      spaceName: searchParams.get('spaceName') ?? prev.spaceName,
    }));
  }, [searchParams]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) return;

        const payload = (await response.json()) as {
          ok: boolean;
          session?: { openSpaceName?: string; uid?: string };
        };

        if (!payload.ok) return;

        setForm((prev) => ({
          ...prev,
          bookedByName: payload.session?.openSpaceName ?? prev.bookedByName,
          bookedBy: payload.session?.uid ?? prev.bookedBy,
        }));
      } catch {
        // Keep manual entry fallback when session is unavailable.
      }
    };

    void loadSession();
  }, []);

  const addAmenity = () => {
    const value = amenityInput.trim();
    if (!value) return;
    if (!form.amenities.includes(value)) {
      setForm((prev) => ({ ...prev, amenities: [...prev.amenities, value] }));
    }
    setAmenityInput('');
  };

  const removeAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((item) => item !== amenity),
    }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!isFirebaseReady) {
      setError('Request submission is unavailable because Firebase is not configured.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'booking') {
        if (!form.spaceId.trim()) {
          setError('Please start booking from the space dashboard so a valid space is selected.');
          setSubmitting(false);
          return;
        }

        const toBookingDateTime = (value: string) => (value.length === 16 ? `${value}:00` : value);
        const startDateTime = toBookingDateTime(form.startTime);
        const endDateTime = toBookingDateTime(form.endTime);

        await addDoc(collection(db, 'bookings'), {
          bookingId: `BK-${Date.now().toString(36).toUpperCase()}`,
          spaceId: form.spaceId.trim(),
          spaceName: form.spaceName.trim(),
          bookedByName: form.bookedByName.trim(),
          bookedBy: form.bookedBy.trim(),
          bookedByRole: 'MINISTRY',
          bookedByPhone: 'NA',
          purpose: form.purpose.trim(),
          organizationName: form.organizationName.trim() || null,
          expectedAttendees: Number(form.expectedAttendees),
          startDateTime,
          endDateTime,
          startTime: startDateTime,
          endTime: endDateTime,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          createdAtTs: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'space_requests'), {
          requestType: mode,
          spaceId: form.spaceId.trim() || null,
          spaceName: form.spaceName.trim(),
          district: form.district.trim() || null,
          address: form.address.trim() || null,
          purpose: form.purpose.trim(),
          requesterName: form.bookedByName.trim(),
          requesterId: form.bookedBy.trim(),
          organizationName: form.organizationName.trim() || null,
          expectedAttendees: Number(form.expectedAttendees) || null,
          capacity: Number(form.capacity) || null,
          areaSqFt: Number(form.areaSqFt) || null,
          amenities: form.amenities,
          updateSummary: form.updateSummary.trim() || null,
          status: 'PENDING',
          createdAt: serverTimestamp(),
        });
      }

      setSuccess(
        mode === 'booking'
          ? 'Booking request submitted. An operations officer will review it shortly.'
          : mode === 'create'
            ? 'New space proposal submitted for review.'
            : 'Space update request submitted for review.'
      );

      setForm({
        spaceId: mode === 'booking' ? form.spaceId : '',
        spaceName: '',
        district: '',
        address: '',
        bookedByName: '',
        bookedBy: '',
        purpose: '',
        expectedAttendees: '1',
        startTime: '',
        endTime: '',
        organizationName: '',
        capacity: '10',
        areaSqFt: '100',
        updateSummary: '',
        amenities: [],
      });
      setAmenityInput('');
    } catch (submitError) {
      console.error('Failed to submit request', submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not submit the request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="pb-16 pt-10 md:pb-24">
      <div className="container-wide max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">Space Request Center</h1>
          <p className="mt-2 text-muted-foreground">
            Submit booking, creation, or update requests for office spaces. Every request enters an
            auditable approval flow.
          </p>
        </header>

        <form onSubmit={onSubmit} className="card-elevated space-y-6 rounded-2xl p-6" noValidate>
          <Tabs value={mode} onValueChange={(value) => setMode(value as RequestMode)}>
            <TabsList className="grid h-auto w-full grid-cols-3 gap-2 bg-muted/40 p-1">
              <TabsTrigger value="booking" className="gap-2">
                Booking
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-2">
                <Plus className="h-4 w-4" /> Create
              </TabsTrigger>
              <TabsTrigger value="update" className="gap-2">
                <RefreshCcw className="h-4 w-4" /> Update
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
            {mode === 'booking'
              ? 'Booking flow: reserve an existing space for a specific date and duration.'
              : mode === 'create'
                ? 'Create flow: propose a new office/civic space for onboarding.'
                : 'Update flow: request data or facility changes to an existing space.'}
          </div>

          <div className="space-y-2">
            <Label htmlFor="spaceName">
              Space Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="spaceName"
              value={form.spaceName}
              onChange={(event) => setForm((prev) => ({ ...prev, spaceName: event.target.value }))}
              required
              aria-required="true"
              placeholder={mode === 'create' ? 'Proposed Space Name' : 'Existing Space Name'}
            />
          </div>

          {(mode === 'create' || mode === 'update') && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="district">
                  District <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="district"
                  value={form.district}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, district: event.target.value }))
                  }
                  required={mode === 'create'}
                  aria-required={mode === 'create' ? 'true' : 'false'}
                  placeholder="Lashkar / Morar / Thatipur / Gwalior East"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                  required={mode === 'create'}
                  aria-required={mode === 'create' ? 'true' : 'false'}
                  placeholder="Street, landmark, and city"
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bookedByName">
                Requester Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bookedByName"
                value={form.bookedByName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, bookedByName: event.target.value }))
                }
                required
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookedBy">
                Requester ID or Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bookedBy"
                value={form.bookedBy}
                onChange={(event) => setForm((prev) => ({ ...prev, bookedBy: event.target.value }))}
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">
              Purpose <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="purpose"
              value={form.purpose}
              onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value }))}
              rows={4}
              required
              aria-required="true"
              placeholder={
                mode === 'booking'
                  ? 'Meeting, training, public service camp, etc.'
                  : mode === 'create'
                    ? 'Why this new space is needed and expected usage.'
                    : 'What needs to change and why.'
              }
            />
          </div>

          {mode === 'booking' && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime">
                    Start Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, startTime: event.target.value }))
                    }
                    required
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">
                    End Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, endTime: event.target.value }))
                    }
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expectedAttendees">
                    Expected Attendees <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="expectedAttendees"
                    type="number"
                    min={1}
                    value={form.expectedAttendees}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, expectedAttendees: event.target.value }))
                    }
                    required
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    value={form.organizationName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, organizationName: event.target.value }))
                    }
                  />
                </div>
              </div>
            </>
          )}

          {(mode === 'create' || mode === 'update') && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    Capacity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, capacity: event.target.value }))
                    }
                    required={mode === 'create'}
                    aria-required={mode === 'create' ? 'true' : 'false'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="areaSqFt">
                    Area (sq ft) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="areaSqFt"
                    type="number"
                    min={1}
                    value={form.areaSqFt}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, areaSqFt: event.target.value }))
                    }
                    required={mode === 'create'}
                    aria-required={mode === 'create' ? 'true' : 'false'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amenityInput">Amenities</Label>
                <div className="flex gap-2">
                  <Input
                    id="amenityInput"
                    value={amenityInput}
                    onChange={(event) => setAmenityInput(event.target.value)}
                    placeholder="Add amenity and click Add"
                  />
                  <Button type="button" variant="outline" onClick={addAmenity}>
                    Add
                  </Button>
                </div>
                {form.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {form.amenities.map((amenity) => (
                      <Badge
                        key={amenity}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeAmenity(amenity)}
                        aria-label={`Remove ${amenity}`}
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {mode === 'update' && (
                <div className="space-y-2">
                  <Label htmlFor="updateSummary">
                    Update Summary <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="updateSummary"
                    rows={4}
                    value={form.updateSummary}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, updateSummary: event.target.value }))
                    }
                    placeholder="Describe the issue and requested correction in detail."
                    required
                    aria-required="true"
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'booking'
              ? 'Submit Booking Request'
              : mode === 'create'
                ? 'Submit New Space Proposal'
                : 'Submit Space Update Request'}
          </Button>
        </form>

        <section className="mt-6 rounded-xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Review Notes</p>
          <p className="mt-1">
            Requests are reviewed by operations officers. Accessibility and compliance checks should
            still be manually validated before production rollout.
          </p>
        </section>
      </div>
    </section>
  );
}
