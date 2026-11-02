/**
 * Admin-specific types for Automobiles Module
 * Extends base automobile types with admin operations
 */

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED';
export type BookingPurpose = 'ELECTION' | 'EMERGENCY' | 'MAINTENANCE' | 'TRANSFER' | 'OTHER';
export type MaintenanceStatus = 'REPORTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
export type AuctionStatus = 'ELIGIBLE' | 'LISTED' | 'ACTIVE' | 'SOLD' | 'WITHDRAWN';

/**
 * Vehicle Booking Request
 */
export interface VehicleBookingRequest {
  id: string;
  vehicleId: string;
  requesterName: string;
  requesterDepartment: string;
  requesterPhone: string;
  purpose: BookingPurpose;
  startDate: string;
  endDate: string;
  estimatedDistance?: number;
  status: BookingStatus;
  approverName?: string;
  approvalComments?: string;
  rejectionReason?: string;
  driverAssigned?: {
    name: string;
    phone: string;
    licenseNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Driver Assignment Record
 */
export interface DriverAssignment {
  id: string;
  bookingId: string;
  vehicleId: string;
  driverName: string;
  driverPhone: string;
  licenseNumber: string;
  licenseExpiry: string;
  assignedAt: string;
  unassignedAt?: string;
}

/**
 * Fuel Check Log
 */
export interface FuelCheckLog {
  id: string;
  vehicleId: string;
  tripId: string;
  fuelLevelAtReturn: number; // liters
  fuelLevelExpected: number; // liters
  variance: number; // liters
  checkedBy: string;
  checkedAt: string;
  notes?: string;
}

/**
 * Maintenance Ticket
 */
export interface MaintenanceTicket {
  id: string;
  vehicleId: string;
  registrationNumber: string;
  title: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: MaintenanceStatus;
  assignedTo?: string;
  estimatedCost?: number;
  resolvedAt?: string;
  resolutionNote?: string;
  partsCost?: number;
  laborCost?: number;
}

/**
 * Idle Vehicle for Redeployment
 */
export interface IdleVehicleRedeployment {
  id: string;
  vehicleId: string;
  registrationNumber: string;
  vehicleType: string;
  idleSinceDate: string;
  idleDays: number;
  lastKnownLocation: string;
  estimatedCondition: 'GOOD' | 'FAIR' | 'POOR';
  readyForReuse: boolean;
  suggestedAction: 'ACTIVATE' | 'TRANSFER' | 'AUCTION';
}

/**
 * Auction Queue Item
 */
export interface AuctionQueueItem {
  id: string;
  vehicleId: string;
  registrationNumber: string;
  vehicleType: string;
  idleSinceDate: string;
  idleDays: number;
  estimatedValue: number;
  auctionStatus: AuctionStatus;
  gemPortalLink?: string;
  gemLoadNumber?: string;
  estimatedRevenue?: number;
  addedToAuctionDate?: string;
  winningBid?: number;
}

/**
 * Booking Calendar Entry
 */
export interface BookingCalendarEntry {
  id: string;
  vehicleId: string;
  registrationNumber: string;
  startDate: string;
  endDate: string;
  requesterName: string;
  purpose: BookingPurpose;
  status: BookingStatus;
  driverName?: string;
}

/**
 * Batch Approval Request
 */
export interface BatchApprovalRequest {
  bookingIds: string[];
  approverName: string;
  approvalComments: string;
  assignedDriver?: {
    name: string;
    phone: string;
    licenseNumber: string;
  };
}

/**
 * Override Action (Emergency)
 */
export interface OverrideAction {
  id: string;
  actionType: 'CANCEL_BOOKING' | 'PRIORITY_BOOKING' | 'EXTEND_BOOKING';
  targetBookingId: string;
  vehicleId: string;
  requestedBy: string;
  reason: string;
  approvedBy?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

/**
 * Revenue Dashboard Summary
 */
export interface RevenueDashboard {
  totalRevenue: number;
  soldCount: number;
  averagePrice: number;
  yearlyBreakdown: Array<{
    month: string;
    count: number;
    revenue: number;
  }>;
  topVehicleTypes: Array<{
    type: string;
    count: number;
    revenue: number;
  }>;
}

/**
 * Compliance Alert with Admin Actions
 */
export interface AdminComplianceAlert {
  id: string;
  vehicleId: string;
  registrationNumber: string;
  alertType: 'PUC' | 'INSURANCE' | 'FITNESS' | 'EMISSION';
  expiresOn: string;
  daysRemaining: number;
  severity: 'CRITICAL' | 'WARNING' | 'OK';
  smsAlertSent: boolean;
  smsAlertSentAt?: string;
  renewalStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  renewedAt?: string;
  renewalNote?: string;
}

/**
 * Admin Dashboard Stats
 */
export interface AdminDashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  idleVehicles: number;
  bookedVehicles: number;
  maintenanceVehicles: number;
  pendingRequests: number;
  idleOver6months: number;
  idleOver12months: number;
  complianceAlerts: number;
  criticalAlerts: number;
  upcomingMaintenanceCount: number;
  auctionEligibleCount: number;
}
