import syntheticDataRaw from '@/data/synthetic_data.json';
import type {
  AgentAlert,
  AgentReasoningResult,
  CustodyCalculationResult,
  DeadlineCheckerResult,
  DeadlineCheckItem,
  DisposalRouteResult,
  LegalMappingResult,
  LocationStatusResult,
  StatusClassifierResult,
  SyntheticVehicleRecord,
} from '@/types/seized-agent';

const syntheticData = syntheticDataRaw as SyntheticVehicleRecord[];

const REFERENCE_DATE = new Date('2026-11-02T00:00:00Z');

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function daysDiff(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateIso(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * TOOL 1: cctns_fetch(vehicle_no)
 * Queries CCTNS database for the given vehicle number.
 * Note: Modular function designed to be swapped for live CCTNS REST/SOAP API.
 */
export async function cctns_fetch(vehicle_no: string): Promise<SyntheticVehicleRecord> {
  const normalizedInput = vehicle_no.trim().toUpperCase().replace(/[\s-]/g, '');

  const match = syntheticData.find((record) => {
    const recordNorm = record.vehicle_no.toUpperCase().replace(/[\s-]/g, '');
    return recordNorm === normalizedInput;
  });

  if (!match) {
    throw new Error(
      `Vehicle "${vehicle_no}" not found in CCTNS repository. Please check registration or try demo numbers (e.g. MP07-CA-1024, MP07-EX-2010, MP07-ND-3011, MP07-RU-5009).`
    );
  }

  return JSON.parse(JSON.stringify(match));
}

/**
 * Returns all synthetic vehicles for search suggestions, batching, and chat queries.
 */
export function getAllSyntheticVehicles(): SyntheticVehicleRecord[] {
  return [...syntheticData];
}

/**
 * TOOL 2: legal_mapper(caseData)
 * Maps case_type to BNS offence section + governing BNSS sections (106, 497, 498, 503, 504, 505)
 * or special law, exactly as in PDF's Master Table, with a one-line plain explanation.
 */
export function legal_mapper(caseData: SyntheticVehicleRecord): LegalMappingResult {
  const t = caseData.case_type.toLowerCase();

  // Row 1: Vehicle stolen from owner; police recover it
  if (t.includes('stolen from owner') && t.includes('recover')) {
    return {
      master_table_row: 1,
      bns_section: 'BNS 303(2)',
      offence_brief:
        'Theft. Dishonest taking of movable property out of possession without consent.',
      seizure_disposal_law: 'BNSS 106, 497, 503',
      plain_explanation:
        'Stolen vehicle recovered belongs exclusively to true owner; magistrate must return on bond (503(2)) within ~45 days (497), or proclaim if owner unknown.',
      complete_flow:
        'FIR & Seizure (106) → Reported to Magistrate forthwith → Day 14: Statement of property (497(2)) → Day 45: Court order on bond (503(2)) → If unknown: proclamation (6 months) → State auction (504)',
      government_use_rule:
        'Legally Locked. No government reuse while owner is known; government role is strictly to track and notify owner. Auction/reuse permitted only after 504 unclaimed order.',
    };
  }

  // Row 2: Another person is found using or holding the stolen vehicle
  if (t.includes('another person') || t.includes('found using') || t.includes('receiving stolen')) {
    return {
      master_table_row: 2,
      bns_section: 'BNS 317(2), 317(4)',
      offence_brief:
        'Receiving stolen property (up to 3 years; habitual dealing up to 10 years/life).',
      seizure_disposal_law: 'BNSS 106, 497, 503',
      plain_explanation:
        'Stolen property ceases to be stolen once returned to lawful owner; possessor is prosecuted separately while vehicle is returned on bond to true owner.',
      complete_flow:
        'Vehicle seized from possessor (106) → Produced in court with photos → Day 14 statement → Day 45 court order → True owner proves title & takes vehicle on bond → If untraceable: 6-month proclamation → 504 disposal',
      government_use_rule:
        'Legally Locked. Belongs to true owner upon title verification. Only if nobody proves title and 504 order is passed can State reuse or auction.',
    };
  }

  // Row 3: Vehicle used to commit or carry out another offence
  if (t.includes('used to commit') || t.includes('instrument of crime')) {
    return {
      master_table_row: 3,
      bns_section: caseData.bns_section || 'BNS 303, 317',
      offence_brief: 'Instrument of crime / movable property used in commission of an offence.',
      seizure_disposal_law: 'BNSS 497, then 498, 500',
      plain_explanation:
        'Vehicle serves as evidentiary instrument; held or released on supurdagi pending trial; court decides final confiscation (498) only at judgment.',
      complete_flow:
        'Seized as case property (106) → Produced in court → Day 14 statement → Day 45 interim custody (supurdagi) or yard custody → Trial concludes → 498 Judgment (confiscation/delivery) → Appeal period (500) → State reuse/auction',
      government_use_rule:
        'Locked, then Conditionally Usable. During trial: no government use unless court grants interim custody to a department on bond. After 498 confiscation & appeal expiry: vests in State (Rajyasaat).',
    };
  }

  // Row 4: Road accident: rash or negligent driving, no death
  if (t.includes('rash or negligent') && !t.includes('death')) {
    return {
      master_table_row: 4,
      bns_section: 'BNS 281',
      offence_brief: 'Rash driving on a public way endangering human life or safety.',
      seizure_disposal_law: 'BNSS 497, Motor Vehicles Act detention rules',
      plain_explanation:
        'Vehicle needed solely for mechanical inspection and panchnama, then promptly released on supurdagi to owner/insurer; court orders sale within 6 months if unclaimed.',
      complete_flow:
        'Seized after accident → Mechanical inspection → Produced in court with panchnama → Day 14 statement → Day 45 order → Released on supurdagi to owner/insurer → Unclaimed after 6 months: court-ordered auction',
      government_use_rule:
        'Legally Locked. Must be released to registered owner or insurer. Government use permitted only under specific court interim custody order.',
    };
  }

  // Row 5: Accident causing death
  if (t.includes('accident causing death') || (t.includes('death') && !t.includes('flees'))) {
    return {
      master_table_row: 5,
      bns_section: 'BNS 106(1)',
      offence_brief: 'Causing death by negligence (not culpable homicide; up to 5 years).',
      seizure_disposal_law: 'BNSS 497, Motor Vehicles Act rules',
      plain_explanation:
        'Requires mechanical fitness testing and photogrammetry; insurer is primary claimant; subject to 45-day interim custody order and 6-month disposal rule.',
      complete_flow:
        'Vehicle seized & FIR registered → Mechanical inspection → Produced in court → Day 14/45 statement & order → Release on bond to owner or insurer → Unclaimed: court orders sale within 6 months',
      government_use_rule:
        'Legally Locked. Belongs to registered owner/insurance claimant. No administrative repurposing without explicit judicial decree.',
    };
  }

  // Row 6: Driver flees after fatal accident without reporting (Hit and run)
  if (t.includes('flees') || t.includes('hit and run')) {
    return {
      master_table_row: 6,
      bns_section: 'BNS 106(2)',
      offence_brief:
        'Hit and run: causing death by rash/negligent driving and fleeing without reporting to police/magistrate.',
      seizure_disposal_law: 'BNSS 497',
      plain_explanation:
        'Vehicle is primary case physical evidence; interim release possible on heavy bond; court orders sale within 6 months under Sunderbhai guidelines if unclaimed.',
      complete_flow:
        'Vehicle seized or found abandoned → Produced before court with forensic photos → Day 14 statement → Day 45 order → Interim release on bond possible → Unclaimed within 6 months: court-ordered sale & auction',
      government_use_rule:
        'Legally Locked. Case property. Departmental custody permitted only on court-ordered interim requisition.',
    };
  }

  // Row 7: Fake registration number, tampered chassis/engine number, forged papers
  if (t.includes('fake') || t.includes('tampered') || t.includes('forged')) {
    return {
      master_table_row: 7,
      bns_section: 'BNS 318 (Cheating), 336 (Forgery)',
      offence_brief:
        'Deception to obtain property and making false documents / altered vehicle identifiers.',
      seizure_disposal_law: 'BNSS 106, 497, 503–504',
      plain_explanation:
        'Chassis/engine verification required; held as evidentiary case property; if no lawful title proved, 6-month proclamation precedes 504 State disposal.',
      complete_flow:
        'Seizure & chassis verification → Produced in court → Day 14 statement → Day 45 held as case property → Genuine owner proves title: delivery → Otherwise: 6-month proclamation → 504 State disposal & auction',
      government_use_rule:
        'Legally Locked during trial and proclamation. After BNSS 504 final order: reusable by department or auction, subject to fresh RTO registration clearances.',
    };
  }

  // Row 8: Abandoned vehicle found; owner unknown; no accused
  if (t.includes('abandoned') || (t.includes('owner unknown') && !t.includes('stolen'))) {
    return {
      master_table_row: 8,
      bns_section: 'BNSS 106(1) (Suspicious Circumstances)',
      offence_brief:
        'No BNS offence section; seized under BNSS 106(1) as property suspected to be stolen or found abandoned.',
      seizure_disposal_law: 'BNSS 503(2), 504, 505',
      plain_explanation:
        'Magistrate detains vehicle and issues public proclamation with 6-month claim window; upon expiry without claimant, State may take and sell (504); immediate sale if under Rs 10,000 (505).',
      complete_flow:
        'Found abandoned & seized (106(1)) → Reported to Magistrate → Panchnama & photos → Magistrate orders detention & proclamation (503(2)) → 6-month claim window → No claimant: 504 State disposal → Auction or fleet allocation',
      government_use_rule:
        'Locked, then Fully Usable. Locked during the statutory 6-month claim period. Immediately upon BNSS 504 order: vests in State for departmental booking or auction.',
    };
  }

  // Row 9: Old, rusted, low-value vehicle lying for years
  if (t.includes('rusted') || t.includes('low-value') || t.includes('lying for years')) {
    return {
      master_table_row: 9,
      bns_section: caseData.bns_section || 'As per original case (BNS 303)',
      offence_brief: 'Depreciating case property deteriorating in open yard conditions.',
      seizure_disposal_law: 'BNSS 497(1), 505, Supreme Court directions',
      plain_explanation:
        'Rapid physical decay and negative salvage value empower the court to order expedient early sale or scrap auction, holding proceeds in court deposit.',
      complete_flow:
        'Yard inspection & videography → Panchnama recorded → Day 14 statement → Day 45 expedited sale order (497(1)/505) → Public scrap auction → Sale proceeds held in registry for entitled party for 6 months → 504 State deposit',
      government_use_rule:
        'Not suited for operational reuse due to severe mechanical deterioration. Designated for immediate court-ordered scrap auction to prevent environmental decay.',
    };
  }

  // Row 10: Liquor transport (MP): vehicle seized under State Excise Act
  if (t.includes('liquor') || t.includes('excise') || caseData.special_law === 'MP Excise Act') {
    return {
      master_table_row: 10,
      bns_section: 'MP Excise Act, 1915 (Sec 34, 47-A, 47-D)',
      offence_brief:
        'Special Law: Illegal transport / possession of intoxicants exceeding prescribed limits.',
      seizure_disposal_law: 'MP Excise Act 1915 Sec 47-A, 47-D (Overrides general BNSS procedure)',
      plain_explanation:
        'District Collector initiates administrative confiscation under 47-A; once Collector sends intimation, criminal magistrate is statutorily barred under 47-D from granting interim custody.',
      complete_flow:
        'Seizure with illicit liquor → Seizure report to Magistrate and Collector → Collector issues 47-A confiscation notice → Intimation to Magistrate bars 497 custody (47-D) → Collector hearing & order → Confiscation vests in State → Appeal period → Auction or reuse',
      government_use_rule:
        'Locked, then Fully Usable. Absolutely locked prior to Collector confiscation order. Once 47-A order is final and appeal period lapses: vests in State (Rajyasaat) for police/excise reuse or auction.',
    };
  }

  // Row 11: Drug case: vehicle used to carry narcotics
  if (t.includes('drug') || t.includes('narcotics') || caseData.special_law === 'NDPS') {
    return {
      master_table_row: 11,
      bns_section: 'NDPS Act, 1985 (Sec 60(3), 63)',
      offence_brief:
        'Special Law: Conveyance used in commission of NDPS offence is liable to statutory confiscation.',
      seizure_disposal_law: 'NDPS Act Sec 60(3), 63 (Overrides general BNSS procedure)',
      plain_explanation:
        'Special NDPS Court conducts statutory hearing under Sec 63 at judgment; interim custody requires stringent proof that owner had zero knowledge or connivance.',
      complete_flow:
        'NDPS seizure (60(3)) → Special NDPS Court submission → Stringent interim release test → Full trial → Judgment with Sec 63 hearing → Confiscation order → Vests in State → Auction or police department allocation',
      government_use_rule:
        'Locked, then Fully Usable. Strictly locked throughout trial. After Special Court Sec 63 confiscation order and statutory appeal expiry: vests in State for departmental allocation or auction.',
    };
  }

  // Row 12: Trial ends in conviction
  if (t.includes('conviction')) {
    return {
      master_table_row: 12,
      bns_section: caseData.bns_section || 'Offence as charged',
      offence_brief: 'Criminal trial concluded with conviction of accused.',
      seizure_disposal_law: 'BNSS 498, 500',
      plain_explanation:
        'Trial court passes formal post-trial order under BNSS 498 for confiscation to State; upon lapse of statutory 60/90-day appeal period under 500, property vests fully in State (Rajyasaat).',
      complete_flow:
        'Case property held through trial → Conviction judgment → Formal 498 Confiscation Order → BNSS 500 Appeal Period observed → Title vests in State (Rajyasaat) → Booking by police/admin department or public auction',
      government_use_rule:
        'Fully Usable (Rajyasaat). Confiscation decree passed and appeal period cleared. Lawfully eligible for government department fleet absorption or e-auction.',
    };
  }

  // Row 13: Trial ends in acquittal / discharge
  if (t.includes('acquittal') || t.includes('discharge')) {
    return {
      master_table_row: 13,
      bns_section: caseData.bns_section || 'Trial concluded with acquittal/discharge',
      offence_brief: 'Accused acquitted or discharged of all criminal charges.',
      seizure_disposal_law: 'BNSS 498',
      plain_explanation:
        'Court passes 498 delivery order in favour of person lawfully entitled; if nobody collects within 6 months of proclamation (503–504), State disposal ensues.',
      complete_flow:
        'Case property held during trial → Acquittal judgment → BNSS 498 Delivery Order to lawful claimant → Bond discharged → If uncollected: proclamation (6 months) → 504 State disposal',
      government_use_rule:
        'Legally Locked. Must be restored to entitled claimant. Government reuse prohibited unless owner fails to claim post-proclamation and 504 order is made.',
    };
  }

  // Default fallback
  return {
    master_table_row: 1,
    bns_section: caseData.bns_section || 'BNS 303(2)',
    offence_brief: caseData.case_type,
    seizure_disposal_law: 'BNSS 106, 497, 503',
    plain_explanation:
      'Property seized as case exhibit; governed by standard BNSS 497 14/45-day disposal guidelines and Sunderbhai 6-month outer ceiling.',
    complete_flow:
      'Seizure (106) → Court Production → Day 14 Statement (497(2)) → Day 45 Order (497(5)) → Disposal',
    government_use_rule: 'Legally Locked pending judicial determination.',
  };
}

/**
 * TOOL 3: custody_calculator(dates)
 * Calculates days/months in custody since seizure and since production in court.
 */
export function custody_calculator(caseData: SyntheticVehicleRecord): CustodyCalculationResult {
  const seizureDate = parseDate(caseData.seizure_date) || REFERENCE_DATE;
  const productionDate = parseDate(caseData.production_in_court_date) || seizureDate;

  const daysSinceSeizure = Math.max(0, daysDiff(seizureDate, REFERENCE_DATE));
  const monthsSinceSeizure = parseFloat((daysSinceSeizure / 30.4375).toFixed(1));

  const daysSinceProduction = Math.max(0, daysDiff(productionDate, REFERENCE_DATE));
  const monthsSinceProduction = parseFloat((daysSinceProduction / 30.4375).toFixed(1));

  return {
    days_since_seizure: daysSinceSeizure,
    months_since_seizure: monthsSinceSeizure,
    days_since_production: daysSinceProduction,
    months_since_production: monthsSinceProduction,
    reference_date: formatDateIso(REFERENCE_DATE),
  };
}

/**
 * TOOL 4: deadline_checker(case)
 * Per PDF Section 4:
 * - BNSS 497(2): statement/photos within 14 days of production
 * - BNSS 497(5): court order within 30 days after that (about 45 days total)
 * - Supreme Court (Sunderbhai Ambalal Desai): outer limit 6 months from production
 * - BNSS 503(2)/504: 6-month claim period from proclamation
 * Output: on-time / overdue and by how many days.
 */
export function deadline_checker(caseData: SyntheticVehicleRecord): DeadlineCheckerResult {
  const productionDate =
    parseDate(caseData.production_in_court_date) ||
    parseDate(caseData.seizure_date) ||
    REFERENCE_DATE;
  const statementDate = parseDate(caseData.statement_497_date);
  const courtOrderDate = parseDate(caseData.court_order_date);
  const proclamationDate = parseDate(caseData.proclamation_date);

  const isSpecialLaw = caseData.special_law !== 'None';

  const items: DeadlineCheckItem[] = [];

  // 1. BNSS 497(2): Statement & Photos within 14 days of court production
  const d14Deadline = addDays(productionDate, 14);
  const d14DeadlineStr = formatDateIso(d14Deadline);

  if (isSpecialLaw) {
    items.push({
      id: 'BNSS_497_2',
      label: 'BNSS 497(2) Property Statement (14 Days)',
      rule_description:
        'Preparation of property statement, photographs, and videography within 14 days of production.',
      target_deadline: d14DeadlineStr,
      actual_date: caseData.statement_497_date,
      status: 'not-applicable',
      days_overdue: 0,
      notes: `Special Law (${caseData.special_law}) overrides standard BNSS 497 timelines per PDF Section 1 & 4.`,
    });
  } else if (statementDate) {
    const daysTaken = daysDiff(productionDate, statementDate);
    if (daysTaken <= 14) {
      items.push({
        id: 'BNSS_497_2',
        label: 'BNSS 497(2) Property Statement (14 Days)',
        rule_description:
          'Preparation of property statement, photographs, and videography within 14 days of production.',
        target_deadline: d14DeadlineStr,
        actual_date: caseData.statement_497_date,
        status: 'on-time',
        days_overdue: 0,
        notes: `Compliant: Filed in ${daysTaken} days (within statutory 14-day window).`,
      });
    } else {
      const overdueDays = daysTaken - 14;
      items.push({
        id: 'BNSS_497_2',
        label: 'BNSS 497(2) Property Statement (14 Days)',
        rule_description:
          'Preparation of property statement, photographs, and videography within 14 days of production.',
        target_deadline: d14DeadlineStr,
        actual_date: caseData.statement_497_date,
        status: 'overdue',
        days_overdue: overdueDays,
        notes: `Non-compliant: Filed ${overdueDays} days late after statutory window expired.`,
      });
    }
  } else {
    // Statement has not been filed yet
    const overdueDays = daysDiff(d14Deadline, REFERENCE_DATE);
    if (overdueDays > 0) {
      items.push({
        id: 'BNSS_497_2',
        label: 'BNSS 497(2) Property Statement (14 Days)',
        rule_description:
          'Preparation of property statement, photographs, and videography within 14 days of production.',
        target_deadline: d14DeadlineStr,
        actual_date: null,
        status: 'overdue',
        days_overdue: overdueDays,
        notes: `Critical Default: Statement NOT filed. Exceeded 14-day statutory limit by ${overdueDays} days!`,
      });
    } else {
      items.push({
        id: 'BNSS_497_2',
        label: 'BNSS 497(2) Property Statement (14 Days)',
        rule_description:
          'Preparation of property statement, photographs, and videography within 14 days of production.',
        target_deadline: d14DeadlineStr,
        actual_date: null,
        status: 'pending',
        days_overdue: 0,
        notes: `Pending: ${Math.abs(overdueDays)} days remaining before statutory deadline.`,
      });
    }
  }

  // 2. BNSS 497(5): Court Order within 30 days after statement (~45 days from production)
  const d45Deadline = addDays(productionDate, 45);
  const d45DeadlineStr = formatDateIso(d45Deadline);

  if (isSpecialLaw) {
    items.push({
      id: 'BNSS_497_5',
      label: 'BNSS 497(5) Court Order (45 Days Total)',
      rule_description:
        'Magistrate must pass disposal/interim custody order within 30 days of statement (~45 days total).',
      target_deadline: d45DeadlineStr,
      actual_date: caseData.court_order_date,
      status: 'not-applicable',
      days_overdue: 0,
      notes: `Special Law statutory confiscation proceedings follow parent Act, not BNSS 45-day rule.`,
    });
  } else if (courtOrderDate) {
    const daysTaken = daysDiff(productionDate, courtOrderDate);
    if (daysTaken <= 45) {
      items.push({
        id: 'BNSS_497_5',
        label: 'BNSS 497(5) Court Order (45 Days Total)',
        rule_description:
          'Magistrate must pass disposal/interim custody order within 30 days of statement (~45 days total).',
        target_deadline: d45DeadlineStr,
        actual_date: caseData.court_order_date,
        status: 'on-time',
        days_overdue: 0,
        notes: `Order passed on ${caseData.court_order_date} (${daysTaken} days from court production).`,
      });
    } else {
      const overdueDays = daysTaken - 45;
      items.push({
        id: 'BNSS_497_5',
        label: 'BNSS 497(5) Court Order (45 Days Total)',
        rule_description:
          'Magistrate must pass disposal/interim custody order within 30 days of statement (~45 days total).',
        target_deadline: d45DeadlineStr,
        actual_date: caseData.court_order_date,
        status: 'overdue',
        days_overdue: overdueDays,
        notes: `Order passed ${overdueDays} days late beyond statutory 45-day target.`,
      });
    }
  } else {
    // Court order not yet passed
    const overdueDays = daysDiff(d45Deadline, REFERENCE_DATE);
    if (overdueDays > 0) {
      items.push({
        id: 'BNSS_497_5',
        label: 'BNSS 497(5) Court Order (45 Days Total)',
        rule_description:
          'Magistrate must pass disposal/interim custody order within 30 days of statement (~45 days total).',
        target_deadline: d45DeadlineStr,
        actual_date: null,
        status: 'overdue',
        days_overdue: overdueDays,
        notes: `Critical Default: Court order NOT passed. Overdue by ${overdueDays} days past 45-day target!`,
      });
    } else {
      items.push({
        id: 'BNSS_497_5',
        label: 'BNSS 497(5) Court Order (45 Days Total)',
        rule_description:
          'Magistrate must pass disposal/interim custody order within 30 days of statement (~45 days total).',
        target_deadline: d45DeadlineStr,
        actual_date: null,
        status: 'pending',
        days_overdue: 0,
        notes: `Pending: ${Math.abs(overdueDays)} days remaining before 45-day target window.`,
      });
    }
  }

  // 3. Supreme Court (Sunderbhai Ambalal Desai v. State of Gujarat): 6 months outer limit
  const m6Deadline = addDays(productionDate, 182); // approx 6 months
  const m6DeadlineStr = formatDateIso(m6Deadline);
  const m6Overdue = daysDiff(m6Deadline, REFERENCE_DATE);

  if (
    caseData.released === 'yes' ||
    caseData.court_order_type === 'sale' ||
    caseData.court_order_type === 'confiscation'
  ) {
    items.push({
      id: 'SUNDERBHAI_6M',
      label: 'SC Sunderbhai Mandate (6-Month Outer Limit)',
      rule_description:
        'Supreme Court binding guideline: seized vehicles must NOT sit idle beyond 6 months.',
      target_deadline: m6DeadlineStr,
      actual_date: caseData.court_order_date,
      status: 'on-time',
      days_overdue: 0,
      notes: `Disposal order issued within constitutional guideline ceiling.`,
    });
  } else if (m6Overdue > 0) {
    items.push({
      id: 'SUNDERBHAI_6M',
      label: 'SC Sunderbhai Mandate (6-Month Outer Limit)',
      rule_description:
        'Supreme Court binding guideline: seized vehicles must NOT sit idle beyond 6 months.',
      target_deadline: m6DeadlineStr,
      actual_date: null,
      status: 'overdue',
      days_overdue: m6Overdue,
      notes: `Breach of Supreme Court directions: Vehicle has been detained ${m6Overdue} days past the 6-month threshold!`,
    });
  } else {
    items.push({
      id: 'SUNDERBHAI_6M',
      label: 'SC Sunderbhai Mandate (6-Month Outer Limit)',
      rule_description:
        'Supreme Court binding guideline: seized vehicles must NOT sit idle beyond 6 months.',
      target_deadline: m6DeadlineStr,
      actual_date: null,
      status: 'pending',
      days_overdue: 0,
      notes: `Within 6-month window: ${Math.abs(m6Overdue)} days remaining.`,
    });
  }

  // 4. BNSS 503(2)/504: 6-month claim period from proclamation
  if (proclamationDate) {
    const claimDeadline = addDays(proclamationDate, 182);
    const claimDeadlineStr = formatDateIso(claimDeadline);
    const claimOverdue = daysDiff(claimDeadline, REFERENCE_DATE);

    if (claimOverdue > 0) {
      items.push({
        id: 'BNSS_503_504',
        label: 'BNSS 503(2)/504 Claim Window (6 Months from Proclamation)',
        rule_description:
          'Public notice window for lawful owner to establish title under BNSS 503(2).',
        target_deadline: claimDeadlineStr,
        actual_date: caseData.proclamation_date,
        status: 'on-time', // window has completed, vehicle can now be disposed
        days_overdue: claimOverdue,
        notes: `6-month claim window expired ${claimOverdue} days ago. Vehicle is now ripe for BNSS 504 State disposal order.`,
      });
    } else {
      items.push({
        id: 'BNSS_503_504',
        label: 'BNSS 503(2)/504 Claim Window (6 Months from Proclamation)',
        rule_description:
          'Public notice window for lawful owner to establish title under BNSS 503(2).',
        target_deadline: claimDeadlineStr,
        actual_date: caseData.proclamation_date,
        status: 'pending',
        days_overdue: 0,
        notes: `Claim window active: ${Math.abs(claimOverdue)} days remaining for owner to claim before State can dispose.`,
      });
    }
  } else if (caseData.owner_known === 'no') {
    items.push({
      id: 'BNSS_503_504',
      label: 'BNSS 503(2)/504 Proclamation Requirement',
      rule_description:
        'Mandatory proclamation for unknown owners before State disposal can be initiated.',
      target_deadline: 'Immediate',
      actual_date: null,
      status: 'overdue',
      days_overdue: daysDiff(productionDate, REFERENCE_DATE),
      notes:
        'Critical omission: Owner is unknown, but NO proclamation has been issued by Magistrate under BNSS 503(2)!',
    });
  } else {
    items.push({
      id: 'BNSS_503_504',
      label: 'BNSS 503(2)/504 Proclamation Requirement',
      rule_description: 'Applicable when registered owner is unknown or untraceable.',
      target_deadline: 'N/A',
      actual_date: null,
      status: 'not-applicable',
      days_overdue: 0,
      notes: 'Not applicable: Owner identity is established in police records.',
    });
  }

  const criticalCount = items.filter((i) => i.status === 'overdue').length;

  return {
    items,
    has_overdue: criticalCount > 0,
    critical_alert_count: criticalCount,
  };
}

/**
 * TOOL 5: disposal_route_checker(case)
 * Per PDF Section 6: which route applies:
 * - Unclaimed BNSS 504
 * - Court confiscation BNSS 498
 * - Statutory confiscation Excise / NDPS
 * - Early sale BNSS 497(1)/505 if value below Rs. 10,000 or perishable/expedient.
 */
export function disposal_route_checker(caseData: SyntheticVehicleRecord): DisposalRouteResult {
  const isPerishableOrLowValue = caseData.est_value < 10000;
  const isExcise = caseData.special_law === 'MP Excise Act';
  const isNdps = caseData.special_law === 'NDPS';
  const isConviction = caseData.case_type.toLowerCase().includes('conviction');
  const isAcquittal = caseData.case_type.toLowerCase().includes('acquittal');
  const isAbandoned = caseData.case_type.toLowerCase().includes('abandoned');
  const isFakeDocs = caseData.case_type.toLowerCase().includes('fake');

  // Route 4: Early Court Sale if value < Rs. 10,000 or expedient
  if (isPerishableOrLowValue) {
    const hasSaleOrder = caseData.court_order_type === 'sale';
    return {
      applicable_route: 'Early Court Sale (BNSS 497(1) / 505 - Expedient/Low Value)',
      statutory_basis: 'BNSS Sec 505 / 497(1)',
      reasoning: `Vehicle value is ₹${caseData.est_value.toLocaleString('en-IN')}, below statutory threshold of ₹10,000. Magistrate is empowered to order immediate sale at any time without awaiting full trial or standard proclamation.`,
      auction_eligible: true,
      auction_stage: hasSaleOrder
        ? 'Sale Order Passed - Ready for Auction'
        : 'Requires Magistrate 505 Sale Application',
      time_left_for_auction: hasSaleOrder
        ? 'Immediate (Order in force)'
        : '3–7 days upon filing application',
    };
  }

  // Route 3: Statutory administrative confiscation (Excise)
  if (isExcise) {
    const hasOrder = caseData.court_order_type === 'confiscation';
    const appealOver = caseData.appeal_period_expired;
    return {
      applicable_route: 'Statutory Confiscation (MP Excise 47-A)',
      statutory_basis: 'MP Excise Act 1915, Section 47-A & 47-D',
      reasoning:
        'Special law statutory confiscation by District Magistrate/Collector. Criminal court cannot grant interim custody after intimation (47-D).',
      auction_eligible: hasOrder && appealOver,
      auction_stage:
        hasOrder && appealOver
          ? 'Confiscation Complete & Appeal Expired - Ready for State Auction'
          : hasOrder
            ? 'Appeal Period Pending (30 days)'
            : 'Collector Confiscation Proceedings Underway (47-A)',
      time_left_for_auction:
        hasOrder && appealOver ? 'Immediate' : 'Estimated 30–60 days pending Collector order',
    };
  }

  // Route 3b: Statutory confiscation (NDPS)
  if (isNdps) {
    const hasOrder = caseData.court_order_type === 'confiscation';
    const appealOver = caseData.appeal_period_expired;
    return {
      applicable_route: 'Statutory Confiscation (NDPS 60(3)/63)',
      statutory_basis: 'NDPS Act 1985, Section 60(3) & 63',
      reasoning:
        'Conveyance used to transport narcotic contraband is liable to statutory confiscation decided by Special NDPS Court at judgment.',
      auction_eligible: hasOrder && appealOver,
      auction_stage:
        hasOrder && appealOver
          ? 'Special Court Confiscation Final - Ready for State Auction'
          : hasOrder
            ? 'Appeal Period Underway'
            : 'Awaiting Special Court Trial Conclusion',
      time_left_for_auction: hasOrder && appealOver ? 'Immediate' : 'Subject to trial conclusion',
    };
  }

  // Route 2: Court confiscation on conviction
  if (isConviction) {
    const hasOrder = caseData.court_order_type === 'confiscation';
    const appealOver = caseData.appeal_period_expired;
    return {
      applicable_route: 'Court Confiscation on Conviction (BNSS 498)',
      statutory_basis: 'BNSS Section 498 & 500',
      reasoning:
        'Trial concluded in conviction. Trial Court issued confiscation order under Section 498. Once appeal period (Sec 500) expires, property vests in the State.',
      auction_eligible: hasOrder && appealOver,
      auction_stage:
        hasOrder && appealOver
          ? 'Rajyasaat Confirmed - Eligible for Auction or Department Fleet'
          : 'Appeal Window Active (BNSS 500)',
      time_left_for_auction:
        hasOrder && appealOver ? 'Immediate' : 'Awaiting 60/90-day appeal expiration',
    };
  }

  // Route 1: Unclaimed property (BNSS 504)
  if (isAbandoned || (isFakeDocs && caseData.owner_known === 'no')) {
    const proclamationDate = parseDate(caseData.proclamation_date);
    const m6Passed = proclamationDate
      ? daysDiff(addDays(proclamationDate, 182), REFERENCE_DATE) > 0
      : false;
    return {
      applicable_route: 'Unclaimed Property (BNSS 504)',
      statutory_basis: 'BNSS Section 503(2) & 504',
      reasoning:
        'Owner unknown / untraceable. Governed by 6-month proclamation under Section 503(2). Upon expiry with no lawful claimant, Magistrate orders State disposal and auction under 504.',
      auction_eligible: m6Passed,
      auction_stage: m6Passed
        ? '6-Month Claim Window Closed - Ripe for BNSS 504 Auction Order'
        : proclamationDate
          ? 'Active Proclamation Period (6 Months)'
          : 'Proclamation Pending Issuance',
      time_left_for_auction: m6Passed
        ? 'Immediate upon formal 504 order'
        : proclamationDate
          ? `${Math.max(0, 182 - daysDiff(proclamationDate, REFERENCE_DATE))} days remaining in claim window`
          : '6 months from date proclamation is published',
    };
  }

  // Acquittal or Normal recovery -> Release to owner
  if (isAcquittal || caseData.owner_known === 'yes') {
    return {
      applicable_route: 'Release to Lawful Owner / Insurer (BNSS 497 / 503(2))',
      statutory_basis: isAcquittal ? 'BNSS Section 498 (Delivery)' : 'BNSS Section 497 / 503(2)',
      reasoning:
        'Vehicle belongs to identifiable lawful owner or insurer. Indian law requires restoration to owner on supurdagi bond, not state auction.',
      auction_eligible: false,
      auction_stage: 'Ineligible for State Auction (Private Title)',
      time_left_for_auction: 'Not applicable (Must be released to owner)',
    };
  }

  return {
    applicable_route: 'Unclaimed Property (BNSS 504)',
    statutory_basis: 'BNSS Section 504',
    reasoning: 'Unclaimed vehicle subject to proclamation and magistrate disposal.',
    auction_eligible: false,
    auction_stage: 'Under Investigation',
    time_left_for_auction: 'Pending judicial orders',
  };
}

/**
 * TOOL 6: status_classifier(case)
 * Per PDF Section 8:
 * - Legally Locked / Conditionally Usable / Fully Usable (Rajyasaat).
 * - Mark Fully Usable ONLY if a confiscation or BNSS 504 order exists and the appeal period is over!
 * - Never mark any vehicle as government property just because of elapsed time (the PDF says no such rule exists).
 */
export function status_classifier(caseData: SyntheticVehicleRecord): StatusClassifierResult {
  const isSpecialConfiscation =
    (caseData.special_law === 'MP Excise Act' || caseData.special_law === 'NDPS') &&
    caseData.court_order_type === 'confiscation' &&
    caseData.appeal_period_expired;

  const isConvictionConfiscation =
    caseData.court_order_type === 'confiscation' && caseData.appeal_period_expired;

  const isUnclaimed504Final =
    caseData.owner_known === 'no' &&
    caseData.court_order_type === 'sale' &&
    caseData.appeal_period_expired;

  // RULE 1: Fully Usable (Rajyasaat) ONLY IF formal confiscation or 504 order exists AND appeal period expired!
  if (isSpecialConfiscation || isConvictionConfiscation || isUnclaimed504Final) {
    return {
      status: 'Fully Usable (Rajyasaat)',
      badge_color: 'emerald',
      reasoning:
        'A formal judicial or statutory confiscation order has been entered, and the statutory appeal period has legally lapsed. Title has fully vested in the State under Rajyasaat doctrine.',
      can_reuse_by_department: true,
      can_auction: true,
      elapsed_time_disclaimer:
        'Vesting is based strictly on judicial order and appeal expiry, NOT elapsed detention time.',
    };
  }

  // RULE 2: Conditionally Usable (Interim court order granted for department custody on bond)
  const isInterimCustody =
    caseData.court_order_type === 'interim custody' && caseData.released === 'no';
  const isAccidentInstrumentWithOrder =
    caseData.case_type.includes('Vehicle used to commit') &&
    caseData.court_order_type === 'interim custody';

  if (isInterimCustody || isAccidentInstrumentWithOrder) {
    return {
      status: 'Conditionally Usable',
      badge_color: 'blue',
      reasoning:
        'Court has sanctioned interim custody (supurdagi) on bond. Government department may temporarily requisition or utilize the vehicle subject to strict indemnity bond and production upon court notice.',
      can_reuse_by_department: true,
      can_auction: false,
      elapsed_time_disclaimer:
        'Vehicle remains case property; ownership has NOT passed to the State. Auction is strictly prohibited.',
    };
  }

  // RULE 3: Legally Locked (Default for all active cases, pending trials, or private title)
  let lockedReason =
    'Vehicle belongs to private owner or remains essential case property awaiting trial determination.';

  if (caseData.special_law === 'MP Excise Act') {
    lockedReason =
      'Locked: Under MP Excise Act Sec 47-D, Collector intimation bars magistrate interim release, but title does not vest in State until Collector confiscation order is final.';
  } else if (caseData.owner_known === 'yes') {
    lockedReason =
      'Locked: Belongs to identifiable registered owner or insurer. State has zero proprietary claim regardless of storage time.';
  } else if (caseData.owner_known === 'no' && !caseData.proclamation_date) {
    lockedReason =
      'Locked: Unknown owner. Proclamation under BNSS 503(2) is mandatory before any State disposal can be initiated.';
  }

  return {
    status: 'Legally Locked',
    badge_color: 'amber',
    reasoning: lockedReason,
    can_reuse_by_department: false,
    can_auction: false,
    elapsed_time_disclaimer:
      'CRITICAL LEGAL RULE (PDF Section 8): No vehicle ever becomes government property purely by passage of time. Without an explicit confiscation or 504 order, title remains locked.',
  };
}

/**
 * TOOL 7: location_status(case)
 * State, police station/yard, released or not.
 */
export function location_status(caseData: SyntheticVehicleRecord): LocationStatusResult {
  return {
    state: caseData.state,
    district: caseData.district,
    police_station: caseData.police_station,
    current_location: caseData.current_location,
    released: caseData.released,
    physical_custody_summary:
      caseData.released === 'yes'
        ? `Released to claimant from ${caseData.police_station}. Not in police yard.`
        : `Currently detained at ${caseData.police_station} (${caseData.current_location === 'yard' ? 'Open Storage Yard / Malkhana' : 'Station Premises'}), ${caseData.district}, ${caseData.state}.`,
  };
}

/**
 * REASONING STEP:
 * Agent flags issues: statement not filed in 14 days, order overdue beyond 45 days,
 * crossing 3 and 6 months, special-law block on interim release, no proclamation for an unknown owner,
 * value falling in open storage. Then recommends the next action.
 */
export function agent_reasoning(
  caseData: SyntheticVehicleRecord,
  legalMap: LegalMappingResult,
  custody: CustodyCalculationResult,
  deadlines: DeadlineCheckerResult,
  disposal: DisposalRouteResult,
  status: StatusClassifierResult
): AgentReasoningResult {
  const alerts: AgentAlert[] = [];

  // Flag 1: Statement not filed within 14 days of production
  const d14Item = deadlines.items.find((i) => i.id === 'BNSS_497_2');
  if (d14Item && d14Item.status === 'overdue') {
    alerts.push({
      level: 'critical',
      title: 'BNSS 497(2) Default: Statement Overdue',
      description: `Investigating officer has failed to prepare and submit the property statement, photo inventory, and panchnama within 14 days. Overdue by ${d14Item.days_overdue} days.`,
      statutory_ref: 'BNSS Section 497(2)',
    });
  }

  // Flag 2: Court order overdue beyond 45 days
  const d45Item = deadlines.items.find((i) => i.id === 'BNSS_497_5');
  if (d45Item && d45Item.status === 'overdue') {
    alerts.push({
      level: 'critical',
      title: 'BNSS 497(5) Default: Court Order Overdue',
      description: `Judicial Magistrate has not entered disposal or interim custody order within the statutory 45-day target. Overdue by ${d45Item.days_overdue} days.`,
      statutory_ref: 'BNSS Section 497(5)',
    });
  }

  // Flag 3: Crossing 3 and 6 months
  if (custody.months_since_production >= 6) {
    alerts.push({
      level: 'critical',
      title: 'Supreme Court Guideline Breach (>6 Months Custody)',
      description: `Detention duration (${custody.days_since_production} days / ${custody.months_since_production} months) violates the Supreme Court outer limit established in Sunderbhai Ambalal Desai v. State of Gujarat. Immediate disposal required.`,
      statutory_ref: 'Supreme Court (Sunderbhai Ambalal Desai)',
    });
  } else if (custody.months_since_production >= 3) {
    alerts.push({
      level: 'warning',
      title: 'Custody Warning (>3 Months in Storage)',
      description: `Vehicle has been impounded for ${custody.months_since_production} months. Storage risk accelerating; court attention needed.`,
      statutory_ref: 'High Court Compliance Monitor',
    });
  }

  // Flag 4: Special law block on interim release (MP Excise Act 47-D)
  if (caseData.special_law === 'MP Excise Act') {
    alerts.push({
      level: 'warning',
      title: 'Statutory Bar on Magistrate Jurisdiction (MP Excise 47-D)',
      description:
        'Vehicle seized under MP Excise Act. Collector intimation has ousted the Criminal Magistrate’s power to grant interim supurdagi under general BNSS provisions.',
      statutory_ref: 'MP Excise Act 1915, Section 47-D',
    });
  }

  // Flag 5: No proclamation for an unknown owner
  if (caseData.owner_known === 'no' && !caseData.proclamation_date) {
    alerts.push({
      level: 'critical',
      title: 'Missing Statutory Proclamation (BNSS 503(2))',
      description:
        'Registered owner is unknown, but police/court have not issued a public proclamation. Without a 6-month proclamation window, no State disposal or auction under BNSS 504 is legally valid.',
      statutory_ref: 'BNSS Section 503(2) & 504',
    });
  }

  // Flag 6: Value falling in open storage / low value < 10,000
  if (caseData.est_value < 10000) {
    alerts.push({
      level: 'info',
      title: 'Expedited Early Sale Candidate (Value < ₹10,000)',
      description: `Current estimated value of ₹${caseData.est_value.toLocaleString('en-IN')} is below statutory threshold of ₹10,000. Eligible for immediate Magistrate sale order under BNSS 505.`,
      statutory_ref: 'BNSS Section 505',
    });
  } else if (caseData.current_location === 'yard' && custody.months_since_seizure > 4) {
    alerts.push({
      level: 'warning',
      title: 'Depreciation & Weather Exposure Risk',
      description: `Vehicle lying in open yard for ${custody.months_since_seizure} months. Market value and mechanical condition deteriorating rapidly.`,
      statutory_ref: 'Yard Management Protocol',
    });
  }

  // Determine Next Action and Action Authority
  let next_action = '';
  let action_authority = '';
  const action_steps: string[] = [];

  if (caseData.released === 'yes') {
    next_action = 'Case Vehicle Already Discharged / Delivered';
    action_authority = 'Station House Officer / Malkhana Incharge';
    action_steps.push('Verify bond compliance and ensure closure report is indexed in CCTNS.');
    action_steps.push('Archive physical case property file.');
  } else if (status.status === 'Fully Usable (Rajyasaat)') {
    next_action = 'Proceed with Department Requisition or Public E-Auction';
    action_authority = 'Superintendent of Police / District Auction Committee';
    action_steps.push('Record formal Rajyasaat vesting entry in District Malkhana register.');
    action_steps.push('Check for internal requisition from Police / Government Departments.');
    action_steps.push(
      'If unrequisitioned, list on MSTC / State e-auction portal for public bidding.'
    );
  } else if (caseData.est_value < 10000) {
    next_action = 'Move Court for Early Expedited Sale under BNSS 505';
    action_authority = 'Judicial Magistrate First Class (JMFC)';
    action_steps.push('Prepare videography, photographic inventory, and panchnama.');
    action_steps.push(
      'Submit urgent application to JMFC under BNSS Sec 505 citing low value (< ₹10,000).'
    );
    action_steps.push(
      'Upon order, conduct immediate scrap auction and deposit proceeds in court account.'
    );
  } else if (caseData.special_law === 'MP Excise Act') {
    next_action = 'Expedite Confiscation Proceedings before District Collector (47-A)';
    action_authority = 'Collector / District Magistrate, Gwalior';
    action_steps.push(
      'Confirm delivery of Sec 47-D intimation to the concerned Judicial Magistrate.'
    );
    action_steps.push('Issue show-cause notice to registered owner under Section 47-A(2).');
    action_steps.push('Conclude hearing within 60 days to pass formal confiscation decree.');
  } else if (caseData.special_law === 'NDPS') {
    next_action = 'Submit Status Report to Special NDPS Court for Sec 63 Determination';
    action_authority = 'Special Court (NDPS Act)';
    action_steps.push(
      'Maintain strict yard chain of custody; ensure tamper-evident seal is intact.'
    );
    action_steps.push(
      'Oppose supurdagi unless applicant satisfies Section 60(3) lack of knowledge test.'
    );
    action_steps.push(
      'Press for final confiscation order under Section 63 at culmination of trial.'
    );
  } else if (caseData.owner_known === 'no' && !caseData.proclamation_date) {
    next_action = 'File Application for Statutory Proclamation under BNSS 503(2)';
    action_authority = 'Judicial Magistrate First Class (JMFC)';
    action_steps.push(
      'File report under BNSS 503(2) requesting publication of 6-month proclamation.'
    );
    action_steps.push('Publish proclamation in local gazette and public police notice boards.');
    action_steps.push('Set automatic calendar reminder for 182-day claim expiration.');
  } else if (
    caseData.owner_known === 'no' &&
    caseData.proclamation_date &&
    disposal.auction_eligible
  ) {
    next_action = 'Apply for Final State Disposal & Auction Order under BNSS 504';
    action_authority = 'Judicial Magistrate / State Government';
    action_steps.push(
      'Submit non-claim certificate verifying no lawful claimant appeared in 6 months.'
    );
    action_steps.push('Obtain formal Section 504 disposal order from Magistrate.');
    action_steps.push('Transfer vehicle to District Auction Pool.');
  } else if (caseData.owner_known === 'yes') {
    next_action = 'Issue Notice to Lawful Owner / Insurer for Interim Custody on Bond';
    action_authority = 'Investigating Officer / Judicial Magistrate';
    action_steps.push('Send formal summons/notice to registered owner and insurance company.');
    action_steps.push('File BNSS 497 property statement and photographs before Magistrate.');
    action_steps.push('Release on supurdagi bond with conditions under BNSS 503(2).');
  } else {
    next_action = 'Submit Overdue Case File to Magistrate for Expedited Disposal';
    action_authority = 'Judicial Magistrate First Class';
    action_steps.push('Submit Section 497(2) compliance documentation.');
    action_steps.push('Request immediate hearing to prevent further yard depreciation.');
  }

  const executive_summary = `Vehicle ${caseData.vehicle_no} (${caseData.make_model}) has been detained for ${custody.days_since_seizure} days (${custody.months_since_seizure} months) at ${caseData.police_station}. Governed by ${legalMap.seizure_disposal_law}. Current legal status is classified as "${status.status}". ${alerts.length > 0 ? `Agent identified ${alerts.length} regulatory alert(s), including ${alerts.filter((a) => a.level === 'critical').length} critical deadline default(s).` : 'No compliance violations detected.'} Recommended course of action: ${next_action}.`;

  return {
    alerts,
    next_action,
    action_authority,
    action_steps,
    risk_summary:
      alerts.length > 0
        ? `High operational and legal risk: ${alerts[0].title} (${alerts[0].statutory_ref}).`
        : 'Low compliance risk. Standard statutory progression maintained.',
    executive_summary,
  };
}
