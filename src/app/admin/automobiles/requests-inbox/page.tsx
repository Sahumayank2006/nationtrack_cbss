'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAdminContext } from '@/app/admin/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { VehicleBookingRequest } from '@/types/admin-automobiles';

export default function RequestsInboxPage() {
  const { activeSubType } = useAdminContext();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<VehicleBookingRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [showBatchApprove, setShowBatchApprove] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    data: requests,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'automobiles', 'booking-requests', activeSubType],
    queryFn: async () => {
      const res = await fetch(`/api/automobiles/bookings?status=PENDING&subtype=${activeSubType}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const json = (await res.json()) as {
        success: boolean;
        data: VehicleBookingRequest[];
      };
      return json.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/automobiles/bookings/${bookingId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverName: 'Admin',
          approvalComments: comments,
        }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'automobiles', 'booking-requests'],
      });
      toast.success('Booking approved');
      setSelectedRequest(null);
      setComments('');
    },
    onError: () => {
      toast.error('Failed to approve booking');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/automobiles/bookings/${bookingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectionReason: comments,
        }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'automobiles', 'booking-requests'],
      });
      toast.success('Booking rejected');
      setSelectedRequest(null);
      setComments('');
    },
    onError: () => {
      toast.error('Failed to reject booking');
    },
  });

  const batchApproveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/automobiles/bookings/batch-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingIds: Array.from(selectedIds),
          approverName: 'Admin',
          approvalComments: comments,
        }),
      });
      if (!res.ok) throw new Error('Failed to batch approve');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'automobiles', 'booking-requests'],
      });
      toast.success(`${selectedIds.size} bookings approved`);
      setSelectedIds(new Set());
      setShowBatchApprove(false);
      setComments('');
    },
    onError: () => {
      toast.error('Failed to batch approve bookings');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-status-dev-bg text-status-dev';
      case 'APPROVED':
        return 'bg-status-live-bg text-status-live';
      case 'REJECTED':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getPurposeIcon = (purpose: string) => {
    switch (purpose) {
      case 'ELECTION':
        return 'ðŸ—³ï¸';
      case 'EMERGENCY':
        return 'ðŸš¨';
      case 'MAINTENANCE':
        return 'ðŸ”§';
      case 'TRANSFER':
        return 'ðŸšš';
      default:
        return 'ðŸ“‹';
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requests Inbox</h1>
          <p className="mt-2 text-muted-foreground">
            Manage booking requests from other departments
          </p>
        </div>
        {selectedIds.size > 0 && (
          <Button onClick={() => setShowBatchApprove(true)} className="gap-2" variant="default">
            <CheckCircle2 className="h-4 w-4" />
            Approve {selectedIds.size}
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: 'Pending',
            count: requests?.filter((r) => r.status === 'PENDING').length || 0,
            icon: Clock,
          },
          {
            label: 'Approved',
            count: requests?.filter((r) => r.status === 'APPROVED').length || 0,
            icon: CheckCircle2,
          },
          {
            label: 'Rejected',
            count: requests?.filter((r) => r.status === 'REJECTED').length || 0,
            icon: XCircle,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold">{stat.count}</p>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Requests</CardTitle>
          <CardDescription>Review and approve/reject vehicle booking requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2 rounded border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>Failed to load booking requests</p>
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size ===
                            requests.filter((r) => r.status === 'PENDING').length &&
                          selectedIds.size > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              new Set(
                                requests.filter((r) => r.status === 'PENDING').map((r) => r.id)
                              )
                            );
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {request.status === 'PENDING' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(request.id)}
                            onChange={() => handleToggleSelect(request.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{request.requesterName}</TableCell>
                      <TableCell className="text-sm">{request.requesterDepartment}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          {getPurposeIcon(request.purpose)} {request.purpose}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(request.startDate).toLocaleDateString()} â†’{' '}
                        {new Date(request.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            getStatusColor(request.status)
                          )}
                        >
                          {request.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === 'PENDING' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('approve');
                            }}
                          >
                            Review
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No pending requests</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      {selectedRequest && actionType && (
        <Dialog open onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Approve' : 'Reject'} Booking Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2 rounded bg-muted p-4">
                <p className="text-sm">
                  <strong>Requester:</strong> {selectedRequest.requesterName}
                </p>
                <p className="text-sm">
                  <strong>Purpose:</strong> {selectedRequest.purpose}
                </p>
                <p className="text-sm">
                  <strong>Duration:</strong>{' '}
                  {new Date(selectedRequest.startDate).toLocaleDateString()} â†’{' '}
                  {new Date(selectedRequest.endDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Comments</label>
                <Textarea
                  placeholder={
                    actionType === 'approve'
                      ? 'Add approval comments...'
                      : 'Explain why you are rejecting this request...'
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (actionType === 'approve') {
                      approveMutation.mutate(selectedRequest.id);
                    } else {
                      rejectMutation.mutate(selectedRequest.id);
                    }
                  }}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  variant={actionType === 'approve' ? 'default' : 'destructive'}
                >
                  {approveMutation.isPending || rejectMutation.isPending
                    ? 'Saving...'
                    : actionType === 'approve'
                      ? 'Approve'
                      : 'Reject'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Batch Approve Dialog */}
      {showBatchApprove && (
        <Dialog open onOpenChange={setShowBatchApprove}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Batch Approve ({selectedIds.size} requests)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to approve {selectedIds.size} booking requests. Add any comments if
                needed.
              </p>
              <div>
                <label className="mb-2 block text-sm font-medium">Comments</label>
                <Textarea
                  placeholder="Add approval comments for all requests..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowBatchApprove(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => batchApproveMutation.mutate()}
                  disabled={batchApproveMutation.isPending}
                >
                  {batchApproveMutation.isPending ? 'Approving...' : 'Approve All'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
