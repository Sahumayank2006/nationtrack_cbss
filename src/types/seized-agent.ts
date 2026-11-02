export type LegalStatus = 'Legally Locked' | 'Conditionally Usable' | 'Fully Usable (Rajyasaat)';

export type SpecialLawType = 'None' | 'MP Excise Act' | 'NDPS';

export type CourtOrderType = 'interim custody' | 'sale' | 'confiscation' | 'delivery' | 'none';

export interface SyntheticVehicleRecord {
  vehicle_no: string;
  type: string;
  make_model: string;
  fir_no: string;
  police_station: string;
  district: string;
  state: string;
  seizure_date: string;
  bns_section: string;
  case_type: string;
  special_law: SpecialLawType;
  reported_to_magistrate_date: string;
  production_in_court_date: string;
  statement_497_date: string | null;
  court_order_type: CourtOrderType;
  court_order_date: string | null;
  proclamation_date: string | null;
  appeal_period_expired: boolean;
  owner_known: 'yes' | 'no';
  est_value: number;
  current_location: 'yard' | 'police station';
  released: 'yes' | 'no';
}

export interface LegalMappingResult {
  bns_section: string;
  offence_brief: string;
  seizure_disposal_law: string;
  plain_explanation: string;
  complete_flow: string;
  government_use_rule: string;
  master_table_row: number;
}

export interface CustodyCalculationResult {
  days_since_seizure: number;
  months_since_seizure: number;
  days_since_production: number;
  months_since_production: number;
  reference_date: string;
}

export interface DeadlineCheckItem {
  id: 'BNSS_497_2' | 'BNSS_497_5' | 'SUNDERBHAI_6M' | 'BNSS_503_504';
  label: string;
  rule_description: string;
  target_deadline: string;
  actual_date: string | null;
  status: 'on-time' | 'overdue' | 'pending' | 'not-applicable';
  days_overdue: number;
  notes: string;
}

export interface DeadlineCheckerResult {
  items: DeadlineCheckItem[];
  has_overdue: boolean;
  critical_alert_count: number;
}

export interface DisposalRouteResult {
  applicable_route:
    | 'Unclaimed Property (BNSS 504)'
    | 'Court Confiscation on Conviction (BNSS 498)'
    | 'Statutory Confiscation (MP Excise 47-A)'
    | 'Statutory Confiscation (NDPS 60(3)/63)'
    | 'Early Court Sale (BNSS 497(1) / 505 - Expedient/Low Value)'
    | 'Release to Lawful Owner / Insurer (BNSS 497 / 503(2))';
  statutory_basis: string;
  reasoning: string;
  auction_eligible: boolean;
  auction_stage: string;
  time_left_for_auction: string;
}

export interface StatusClassifierResult {
  status: LegalStatus;
  badge_color: 'amber' | 'blue' | 'emerald';
  reasoning: string;
  can_reuse_by_department: boolean;
  can_auction: boolean;
  elapsed_time_disclaimer: string;
}

export interface LocationStatusResult {
  state: string;
  district: string;
  police_station: string;
  current_location: 'yard' | 'police station';
  released: 'yes' | 'no';
  physical_custody_summary: string;
}

export interface AgentAlert {
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  statutory_ref: string;
}

export interface AgentReasoningResult {
  alerts: AgentAlert[];
  next_action: string;
  action_authority: string;
  action_steps: string[];
  risk_summary: string;
  executive_summary: string;
}

export interface AgentStepTrace {
  step: number;
  tool_name: string;
  thinking: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  summary_result?: string;
  data?: unknown;
}

export interface FullInvestigationResult {
  vehicle_no: string;
  record: SyntheticVehicleRecord;
  trace: AgentStepTrace[];
  legal_map: LegalMappingResult;
  custody: CustodyCalculationResult;
  deadlines: DeadlineCheckerResult;
  disposal_route: DisposalRouteResult;
  status: StatusClassifierResult;
  location: LocationStatusResult;
  reasoning: AgentReasoningResult;
  generated_at: string;
}
