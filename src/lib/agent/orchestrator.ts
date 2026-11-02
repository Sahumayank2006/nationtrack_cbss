import type {
  AgentStepTrace,
  FullInvestigationResult,
  SyntheticVehicleRecord,
} from '@/types/seized-agent';

import {
  agent_reasoning,
  cctns_fetch,
  custody_calculator,
  deadline_checker,
  disposal_route_checker,
  getAllSyntheticVehicles,
  legal_mapper,
  location_status,
  status_classifier,
} from './tools';

export type StepUpdateCallback = (stepTrace: AgentStepTrace[]) => void;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Plans and runs the 7-step investigation automatically, logging every step live.
 */
export async function runAgentInvestigation(
  vehicle_no: string,
  onStepUpdate?: StepUpdateCallback,
  simulateDelay: boolean = true
): Promise<FullInvestigationResult> {
  const traces: AgentStepTrace[] = [
    {
      step: 1,
      tool_name: 'cctns_fetch',
      thinking:
        'Connecting to national CCTNS repository to pull seizure docket and FIR registry...',
      status: 'pending',
    },
    {
      step: 2,
      tool_name: 'legal_mapper',
      thinking: 'Mapping case facts to BNS 2023 offences and governing BNSS procedural sections...',
      status: 'pending',
    },
    {
      step: 3,
      tool_name: 'custody_calculator',
      thinking:
        'Calculating exact custody duration and detention milestones since seizure and court production...',
      status: 'pending',
    },
    {
      step: 4,
      tool_name: 'deadline_checker',
      thinking:
        'Evaluating statutory compliance against BNSS 497(2), 497(5), and SC Sunderbhai 6-month ceiling...',
      status: 'pending',
    },
    {
      step: 5,
      tool_name: 'disposal_route_checker',
      thinking: 'Determining applicable statutory disposal mechanism per Legal Report Section 6...',
      status: 'pending',
    },
    {
      step: 6,
      tool_name: 'status_classifier',
      thinking:
        'Classifying legal status (Locked / Conditionally Usable / Rajyasaat) strictly under Section 8 rules...',
      status: 'pending',
    },
    {
      step: 7,
      tool_name: 'location_status',
      thinking:
        'Verifying station jurisdiction, malkhana yard location, and physical custody state...',
      status: 'pending',
    },
    {
      step: 8,
      tool_name: 'reasoning_engine',
      thinking:
        'Synthesizing compliance flags, statutory bars, depreciation risks, and prescribing next legal action...',
      status: 'pending',
    },
  ];

  const update = () => {
    if (onStepUpdate) {
      onStepUpdate([...traces]);
    }
  };

  update();

  // STEP 1: cctns_fetch
  traces[0].status = 'running';
  update();
  if (simulateDelay) await delay(450);

  let record: SyntheticVehicleRecord;
  try {
    record = await cctns_fetch(vehicle_no);
    traces[0].status = 'completed';
    traces[0].summary_result = `Fetched FIR ${record.fir_no} (${record.make_model}) at ${record.police_station}, ${record.district}.`;
    traces[0].data = record;
    update();
  } catch (err: unknown) {
    traces[0].status = 'error';
    const message = err instanceof Error ? err.message : 'Unknown CCTNS error';
    traces[0].summary_result = message;
    update();
    throw err;
  }

  // STEP 2: legal_mapper
  traces[1].status = 'running';
  update();
  if (simulateDelay) await delay(400);

  const legalMap = legal_mapper(record);
  traces[1].status = 'completed';
  traces[1].summary_result = `Mapped to ${legalMap.bns_section} | Governed by ${legalMap.seizure_disposal_law} (Master Table Row ${legalMap.master_table_row}).`;
  traces[1].data = legalMap;
  update();

  // STEP 3: custody_calculator
  traces[2].status = 'running';
  update();
  if (simulateDelay) await delay(350);

  const custody = custody_calculator(record);
  traces[2].status = 'completed';
  traces[2].summary_result = `In custody: ${custody.days_since_seizure} days (${custody.months_since_seizure} months) | Since court production: ${custody.days_since_production} days.`;
  traces[2].data = custody;
  update();

  // STEP 4: deadline_checker
  traces[3].status = 'running';
  update();
  if (simulateDelay) await delay(450);

  const deadlines = deadline_checker(record);
  const overdueCount = deadlines.critical_alert_count;
  traces[3].status = 'completed';
  traces[3].summary_result =
    overdueCount > 0
      ? `Detected ${overdueCount} statutory deadline default(s)!`
      : 'All procedural deadlines within statutory limits.';
  traces[3].data = deadlines;
  update();

  // STEP 5: disposal_route_checker
  traces[4].status = 'running';
  update();
  if (simulateDelay) await delay(400);

  const disposal = disposal_route_checker(record);
  traces[4].status = 'completed';
  traces[4].summary_result = `Route: ${disposal.applicable_route} | Auction: ${disposal.auction_eligible ? 'Eligible' : 'Not Eligible'}.`;
  traces[4].data = disposal;
  update();

  // STEP 6: status_classifier
  traces[5].status = 'running';
  update();
  if (simulateDelay) await delay(400);

  const status = status_classifier(record);
  traces[5].status = 'completed';
  traces[5].summary_result = `Classification: ${status.status} (Department Reuse: ${status.can_reuse_by_department ? 'Yes' : 'No'}).`;
  traces[5].data = status;
  update();

  // STEP 7: location_status
  traces[6].status = 'running';
  update();
  if (simulateDelay) await delay(300);

  const location = location_status(record);
  traces[6].status = 'completed';
  traces[6].summary_result = `Location: ${location.police_station} (${location.current_location.toUpperCase()}) | Released: ${location.released.toUpperCase()}.`;
  traces[6].data = location;
  update();

  // STEP 8: reasoning_engine
  traces[7].status = 'running';
  update();
  if (simulateDelay) await delay(500);

  const reasoning = agent_reasoning(record, legalMap, custody, deadlines, disposal, status);
  traces[7].status = 'completed';
  traces[7].summary_result = `Prescribed: "${reasoning.next_action}" directed to ${reasoning.action_authority}.`;
  traces[7].data = reasoning;
  update();

  return {
    vehicle_no: record.vehicle_no,
    record,
    trace: traces,
    legal_map: legalMap,
    custody,
    deadlines,
    disposal_route: disposal,
    status,
    location,
    reasoning,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Batch Investigation Mode:
 * Runs multiple vehicles and sorts into a priority list (most overdue / highest critical count first).
 */
export async function runBatchInvestigation(
  vehicle_numbers: string[],
  onProgress?: (completed: number, total: number, currentVehicle: string) => void
): Promise<FullInvestigationResult[]> {
  const results: FullInvestigationResult[] = [];
  const total = vehicle_numbers.length;

  for (let i = 0; i < total; i++) {
    const vNo = vehicle_numbers[i].trim();
    if (!vNo) continue;
    if (onProgress) {
      onProgress(i, total, vNo);
    }
    try {
      const res = await runAgentInvestigation(vNo, undefined, false);
      results.push(res);
    } catch {
      // Skip or record not found
    }
  }

  if (onProgress) {
    onProgress(total, total, 'Complete');
  }

  // Priority sorting:
  // 1. Highest number of critical alerts first
  // 2. Longest custody duration first
  return results.sort((a, b) => {
    const aCrit = a.reasoning.alerts.filter((x) => x.level === 'critical').length;
    const bCrit = b.reasoning.alerts.filter((x) => x.level === 'critical').length;
    if (bCrit !== aCrit) return bCrit - aCrit;
    return b.custody.days_since_seizure - a.custody.days_since_seizure;
  });
}

/**
 * Intelligent Natural Language Chat Follow-ups
 * Allows users to ask natural questions like:
 * - "Which Gwalior vehicles are overdue under BNSS 497?"
 * - "Which vehicles are eligible for auction?"
 * - "Show all NDPS cases"
 * - "Show vehicles under MP Excise Act"
 * - "Which vehicles are rusted or under 10k?"
 */
export interface ChatAnswer {
  reply: string;
  matchedVehicles?: SyntheticVehicleRecord[];
  category?: string;
  recommendedFilters?: string[];
}

export function queryAgentKnowledge(queryText: string): ChatAnswer {
  const q = queryText.toLowerCase().trim();
  const all = getAllSyntheticVehicles();

  // 1. BNSS 497 Overdue / Gwalior overdue
  if (q.includes('497') || q.includes('overdue') || q.includes('deadline')) {
    const overdue = all.filter((v) => {
      const res = deadline_checker(v);
      const isGwalior = !q.includes('gwalior') || v.district.toLowerCase() === 'gwalior';
      return res.has_overdue && isGwalior;
    });

    return {
      reply: `Found ${overdue.length} vehicles with overdue statutory deadlines under BNSS 497 or SC Sunderbhai directives in the CCTNS dataset. The most critical include ${overdue
        .slice(0, 3)
        .map((v) => v.vehicle_no)
        .join(', ')}.`,
      matchedVehicles: overdue,
      category: 'Statutory Deadlines Overdue',
      recommendedFilters: [
        'BNSS 497(2) 14-Day Overdue',
        'BNSS 497(5) 45-Day Overdue',
        'SC 6-Month Ceiling',
      ],
    };
  }

  // 2. Eligible for auction
  if (q.includes('auction') || q.includes('bid') || q.includes('sell')) {
    const auctionable = all.filter((v) => {
      const res = disposal_route_checker(v);
      return res.auction_eligible;
    });

    return {
      reply: `Identified ${auctionable.length} vehicles currently eligible for auction or scrap sale. These include Rajyasaat confiscated vehicles with expired appeal periods, low-value vehicles (< ₹10,000) under BNSS 505, and unclaimed vehicles post-proclamation.`,
      matchedVehicles: auctionable,
      category: 'Auction Eligible Fleet',
      recommendedFilters: [
        'BNSS 505 Early Sale (< ₹10k)',
        'BNSS 504 Unclaimed',
        'Rajyasaat Confiscated',
      ],
    };
  }

  // 3. NDPS cases
  if (q.includes('ndps') || q.includes('narcotics') || q.includes('drug')) {
    const ndps = all.filter((v) => v.special_law === 'NDPS');
    return {
      reply: `Found ${ndps.length} conveyances seized under the NDPS Act (Sections 60(3) and 63). These vehicles are subject to Special NDPS Court confiscation procedures, and general BNSS supurdagi is strictly restricted.`,
      matchedVehicles: ndps,
      category: 'NDPS Act Special Law',
      recommendedFilters: ['NDPS 60(3) Seizure', 'Special Court Confiscation'],
    };
  }

  // 4. MP Excise Act / Liquor
  if (q.includes('excise') || q.includes('liquor') || q.includes('sharab')) {
    const excise = all.filter((v) => v.special_law === 'MP Excise Act');
    return {
      reply: `Found ${excise.length} vehicles seized under the Madhya Pradesh Excise Act, 1915 (Sections 34, 47-A, 47-D). Note that once the Collector's intimation reaches the Magistrate, criminal courts have zero jurisdiction to grant interim custody.`,
      matchedVehicles: excise,
      category: 'MP Excise Act (Sec 47-A/47-D)',
      recommendedFilters: ['Collector Confiscation (47-A)', 'Section 47-D Bar'],
    };
  }

  // 5. Rusted or low value (< 10,000)
  if (
    q.includes('rust') ||
    q.includes('10000') ||
    q.includes('10,000') ||
    q.includes('10k') ||
    q.includes('scrap')
  ) {
    const lowValue = all.filter((v) => v.est_value < 10000 || v.case_type.includes('Old, rusted'));
    return {
      reply: `Found ${lowValue.length} low-value / severely rusted vehicles valued below ₹10,000. Under BNSS Section 505, the Judicial Magistrate can order immediate scrap sale at any time without waiting for full trial completion.`,
      matchedVehicles: lowValue,
      category: 'Expedited Early Sale (BNSS 505)',
      recommendedFilters: ['Value < ₹10,000', 'Yard Scrap Sale'],
    };
  }

  // 6. Abandoned vehicles
  if (q.includes('abandoned') || q.includes('unknown owner')) {
    const abandoned = all.filter(
      (v) => v.case_type.toLowerCase().includes('abandoned') || v.owner_known === 'no'
    );
    return {
      reply: `Found ${abandoned.length} vehicles seized under suspicious circumstances / abandoned without identified owners. These require mandatory 6-month public proclamation under BNSS 503(2) before State disposal under BNSS 504.`,
      matchedVehicles: abandoned,
      category: 'Abandoned & Unclaimed Vehicles',
      recommendedFilters: ['BNSS 106(1) Seizure', 'BNSS 503(2) Proclamation Active'],
    };
  }

  // 7. General vehicle lookup or district
  const districtMatches = all.filter((v) => q.includes(v.district.toLowerCase()));
  if (districtMatches.length > 0) {
    return {
      reply: `Found ${districtMatches.length} seized vehicle records registered in ${districtMatches[0].district}.`,
      matchedVehicles: districtMatches,
      category: `${districtMatches[0].district} Police District Records`,
    };
  }

  // Default response
  return {
    reply: `You can query the CCTNS seized vehicle dataset using natural queries. Try asking:\n• "Which Gwalior vehicles are overdue under BNSS 497?"\n• "Which vehicles are eligible for auction?"\n• "Show all vehicles under MP Excise Act"\n• "Show NDPS seized vehicles"\n• "Which vehicles are rusted or valued under 10k?"\n• "List abandoned vehicles without known owners"`,
    matchedVehicles: all.slice(0, 5),
    category: 'CCTNS National Seizure Registry',
    recommendedFilters: [
      'BNSS 497 Overdue',
      'Auction Ready',
      'MP Excise',
      'NDPS Act',
      'Low Value (< ₹10k)',
    ],
  };
}
