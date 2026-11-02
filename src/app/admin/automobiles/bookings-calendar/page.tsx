'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { useAdminContext } from '@/app/admin/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { BookingCalendarEntry } from '@/types/admin-automobiles';

export default function BookingsCalendarPage() {
  const { activeSubType } = useAdminContext();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 2)); // March 2025

  const {
    data: bookings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      'admin',
      'automobiles',
      'bookings-calendar',
      activeSubType,
      currentDate.toISOString(),
    ],
    queryFn: async () => {
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
      const yearStr = currentDate.getFullYear();
      const res = await fetch(
        `/api/automobiles/bookings/calendar?month=${monthStr}&year=${yearStr}&subtype=${activeSubType}`
      );
      if (!res.ok) throw new Error('Failed to fetch calendar');
      const json = (await res.json()) as {
        success: boolean;
        data: BookingCalendarEntry[];
      };
      return json.data;
    },
  });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getBookingsForDay = (day: number) => {
    return (bookings || []).filter((b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      return date >= start && date <= end;
    });
  };

  const hasOverlaps = (day: number) => {
    const dayBookings = getBookingsForDay(day);
    const vehicleIds = dayBookings.map((b) => b.vehicleId);
    return new Set(vehicleIds).size < vehicleIds.length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-status-live-bg text-status-live';
      case 'PENDING':
        return 'bg-status-dev-bg text-status-dev';
      case 'ACTIVE':
        return 'bg-accent text-accent-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded border border-destructive/20 bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <p>Failed to load calendar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings Calendar</h1>
        <p className="mt-2 text-muted-foreground">View all vehicle bookings and detect overlaps</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 rounded bg-muted p-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="rounded bg-muted p-2 text-center text-sm font-semibold">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {emptyCells.map((i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square rounded border border-border bg-muted"
                  />
                ))}

                {daysArray.map((day) => {
                  const dayBookings = getBookingsForDay(day);
                  const hasOverlap = hasOverlaps(day);

                  return (
                    <div
                      key={day}
                      className={cn(
                        'aspect-square rounded border-2 p-1 text-xs',
                        hasOverlap
                          ? 'border-destructive/50 bg-destructive/10'
                          : 'border-border bg-card'
                      )}
                    >
                      <div className="mb-1 font-semibold">{day}</div>
                      {dayBookings.length > 0 && (
                        <div className="space-y-0.5">
                          {dayBookings.slice(0, 2).map((booking) => (
                            <div
                              key={booking.id}
                              className={cn(
                                'truncate rounded px-1 py-0.5 text-xs font-medium',
                                getStatusColor(booking.status)
                              )}
                              title={booking.registrationNumber}
                            >
                              {booking.registrationNumber.slice(0, 4)}
                            </div>
                          ))}
                          {dayBookings.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayBookings.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-status-live-bg" />
                  <span>Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-status-dev-bg" />
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-accent" />
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border-2 border-destructive/50 bg-destructive/10" />
                  <span>Overlap Conflict</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
