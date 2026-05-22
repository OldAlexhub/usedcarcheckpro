import { ChecklistSection, PowertrainType } from '../types';

export function getChecklistTemplate(): ChecklistSection[] {
  return [
    {
      id: 'documents',
      title: 'Documents and Seller',
      powertrainTypes: null,
      items: [
        {
          id: 'doc_title',
          label: 'Title matches vehicle',
          description:
            'Confirm title year, make, model, and VIN match the vehicle being inspected.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'doc_owner',
          label: 'Seller is listed owner',
          description: 'Seller name on title matches their ID.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'doc_owners_count',
          label: 'Previous owner count noted',
          description:
            'Note how many previous owners are listed on title or history report.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'doc_records',
          label: 'Service records available',
          description:
            'Seller has provided maintenance or service records for review.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'doc_history',
          label: 'Vehicle history discussed',
          description:
            'Any accidents, damage, or major repairs disclosed by seller.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'doc_carfax',
          label: 'History report reviewed',
          description:
            'CARFAX, AutoCheck, or equivalent report obtained and reviewed.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'doc_recalls',
          label: 'Open recalls checked',
          description:
            'Active recalls checked on NHTSA website (nhtsa.gov) or vehicle recall lookup.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'doc_warranty',
          label: 'Warranty documents reviewed',
          description:
            'Any existing factory or extended warranty documents reviewed.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'doc_lien',
          label: 'Lien or loan status confirmed',
          description:
            'Confirm if vehicle has an outstanding loan or lien and how it will be resolved.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'doc_odometer',
          label: 'Odometer consistent with records',
          description:
            'Odometer reading consistent with service records and wear patterns.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'doc_smog',
          label: 'Smog or emissions compliance',
          description:
            'Emissions or smog compliance documents available if required in your area.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'doc_bill',
          label: 'Bill of sale terms discussed',
          description:
            'Agreed price, as-is status, and sale terms discussed with seller.',
          status: 'not_checked',
          notes: '',
        },
      ],
    },
    {
      id: 'exterior',
      title: 'Exterior and Body',
      powertrainTypes: null,
      items: [
        {
          id: 'ext_paint',
          label: 'Paint consistent across panels',
          description:
            'Color and sheen consistent on hood, doors, fenders, bumpers, and roof.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_gaps',
          label: 'Panel gaps even and consistent',
          description:
            'Gaps between body panels are even and symmetrical on both sides.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_hood',
          label: 'Hood alignment and latch',
          description: 'Hood closes flush and latch operates correctly.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_trunk',
          label: 'Trunk or liftgate alignment',
          description:
            'Trunk or liftgate closes flush and weatherstripping seals properly.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_doors',
          label: 'All doors align and operate',
          description:
            'All doors open, close, and latch properly without excessive effort.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_seals',
          label: 'Door seals and weatherstripping',
          description:
            'Rubber seals around all doors in good condition with no tears or gaps.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_rust_panels',
          label: 'No rust on body panels',
          description:
            'No visible rust bubbles, surface rust, or oxidation on painted surfaces.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_rust_under',
          label: 'No rust on edges or sills',
          description:
            'Door edges, rocker panels, and wheel arches free of rust.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_filler',
          label: 'No evidence of filler or repaint',
          description:
            'Check door jambs and panel edges for paint overspray or filler signs.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_windshield',
          label: 'Windshield condition',
          description:
            'No significant cracks or chips in drivers line of sight.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_glass',
          label: 'All glass intact',
          description:
            'All windows, mirrors, and lights have no cracks or damage.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_headlights',
          label: 'Headlights condition and operation',
          description:
            'Headlights, high beams, and low beams all functional. Lenses not fogged.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_taillights',
          label: 'Taillights and turn signals',
          description: 'All rear lights and turn signals operational.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_reverse',
          label: 'Reverse lights operational',
          description:
            'Reverse lights illuminate when shift selector is in reverse.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_mirrors',
          label: 'Exterior mirrors condition',
          description:
            'Mirrors intact and adjustment mechanism works correctly.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ext_bumpers',
          label: 'Bumpers and trim condition',
          description:
            'Front and rear bumper covers intact with no major cracks or missing clips.',
          status: 'not_checked',
          notes: '',
        },
      ],
    },
    {
      id: 'tires',
      title: 'Tires and Wheels',
      powertrainTypes: null,
      items: [
        {
          id: 'tire_fl',
          label: 'Front left tread depth',
          description:
            'Front left tire tread depth acceptable - typically 4/32 inch minimum or higher.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'tire_fr',
          label: 'Front right tread depth',
          description: 'Front right tire tread depth acceptable.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'tire_rl',
          label: 'Rear left tread depth',
          description: 'Rear left tire tread depth acceptable.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'tire_rr',
          label: 'Rear right tread depth',
          description: 'Rear right tire tread depth acceptable.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'tire_wear',
          label: 'Tread wear pattern even',
          description:
            'Tread wearing evenly across each tire surface. Uneven wear may indicate alignment or suspension issues.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'tire_sidewall',
          label: 'Sidewall condition',
          description:
            'No cracks, bulges, cuts, or embedded objects in any tire sidewall.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'tire_wheels',
          label: 'Wheels and rims condition',
          description:
            'No cracks, significant bends, or heavy curb damage on any wheel.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'tire_spare',
          label: 'Spare tire and jack present',
          description:
            'Spare tire, jack, and lug wrench present and in usable condition.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'tire_age',
          label: 'Tire age acceptable',
          description:
            'Tire manufacture date (DOT code on sidewall) within acceptable range - generally under 6 years.',
          status: 'not_checked',
          notes: '',
        },
      ],
    },
    {
      id: 'interior',
      title: 'Interior and Controls',
      powertrainTypes: null,
      items: [
        {
          id: 'int_seats',
          label: 'Seat condition and adjustment',
          description:
            'All seats intact, no major tears. Adjustment mechanisms work correctly.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_belts',
          label: 'Seatbelts functional',
          description:
            'All seatbelts latch, retract, and release properly.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_airbag',
          label: 'Airbag warning light off',
          description:
            'Airbag or SRS warning light turns off after startup.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_dash',
          label: 'Dashboard lights clear',
          description:
            'All warning lights turn off after startup - no persistent warning indicators.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_climate',
          label: 'Climate control works',
          description:
            'Heating and air conditioning operate at all settings.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_infotainment',
          label: 'Infotainment system works',
          description:
            'Screen, audio, and connected controls all operational.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_lights',
          label: 'Interior lights functional',
          description:
            'Dome light, map lights, and any other interior lighting works.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_windows',
          label: 'Power windows operate',
          description: 'All powered windows go up and down smoothly.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_locks',
          label: 'Door locks operate',
          description:
            'All door lock controls work from driver and passenger positions.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_horn',
          label: 'Horn functional',
          description: 'Horn sounds promptly when pressed.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_wipers',
          label: 'Wipers and washer work',
          description:
            'All wiper speeds work. Washer fluid sprays correctly.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_sunroof',
          label: 'Sunroof operates if equipped',
          description:
            'If equipped, sunroof opens, tilts, and closes without binding.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_odor',
          label: 'No unusual interior odor',
          description:
            'No musty, smoke, mildew, or burning smell inside the vehicle.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_carpet',
          label: 'Carpet and floor condition',
          description:
            'Carpet and floor mats in acceptable condition. No significant water damage.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_headliner',
          label: 'Headliner and trim condition',
          description:
            'Headliner and interior trim panels intact with no sagging or significant damage.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'int_storage',
          label: 'Storage compartments work',
          description:
            'Glove box, center console, and other compartments open and close properly.',
          status: 'not_checked',
          notes: '',
        },
      ],
    },
    {
      id: 'startup',
      title: 'Startup and Idle',
      powertrainTypes: null,
      items: [
        {
          id: 'start_prompt',
          label: 'Engine starts promptly',
          description:
            'Engine or powertrain starts within normal time without excessive cranking.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'start_noise',
          label: 'No unusual startup noise',
          description:
            'No knocking, rattling, or grinding noises immediately at startup.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'start_cel',
          label: 'Check engine light off',
          description:
            'Check engine or malfunction indicator light turns off after startup.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'start_abs',
          label: 'ABS warning light off',
          description: 'ABS warning light turns off after startup.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'start_trac',
          label: 'Traction and stability lights off',
          description:
            'Traction control and stability control warning lights off after startup.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'start_oil',
          label: 'Oil pressure indicator normal',
          description:
            'Oil pressure warning light turns off and gauge reads normal range.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'start_idle',
          label: 'Idle smooth and stable',
          description:
            'Engine idles smoothly without misfires, surging, or roughness.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'start_exhaust',
          label: 'Exhaust color normal',
          description:
            'Exhaust is nearly invisible when engine is fully warmed up. No persistent white or blue smoke.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'start_odor',
          label: 'No unusual odors after startup',
          description:
            'No burning oil, fuel, coolant, or electrical smell during idle.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'start_alerts',
          label: 'No alert messages during idle',
          description:
            'No warning messages or alerts displayed on dashboard during idle.',
          status: 'not_checked',
          notes: '',
        },
      ],
    },
    {
      id: 'engine_gas',
      title: 'Engine - Gasoline and Hybrid ICE',
      powertrainTypes: ['gasoline', 'hybrid'],
      items: [
        {
          id: 'gas_oil',
          label: 'Engine oil level and condition',
          description:
            'Oil level within normal range on dipstick. Oil not excessively dark or milky.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_coolant',
          label: 'Coolant level and condition',
          description:
            'Coolant at appropriate level. No oily film or discoloration indicating contamination.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_ps',
          label: 'Power steering fluid level',
          description:
            'Power steering fluid at correct level if vehicle uses hydraulic steering.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_brake_fluid',
          label: 'Brake fluid level and color',
          description:
            'Brake fluid at appropriate level and not excessively dark.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_trans',
          label: 'Transmission fluid condition',
          description:
            'Transmission fluid level and condition if accessible via dipstick.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_air',
          label: 'Air filter condition',
          description: 'Air filter not excessively dirty or clogged.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_oilleak',
          label: 'No oil leaks visible',
          description:
            'No oil drips or wet stains visible under hood or beneath vehicle.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_coolantleak',
          label: 'No coolant leaks visible',
          description:
            'No coolant drips or stains visible at hoses, radiator, or engine.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_belts',
          label: 'Accessory belt condition',
          description: 'Drive belts not cracked, frayed, or glazed.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_battery',
          label: 'Battery terminals clean',
          description:
            'Battery terminals free of corrosion and connections secure.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_timing',
          label: 'Timing belt history noted',
          description:
            'Timing belt or chain service history discussed with seller for high-risk interference engines.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_radiator',
          label: 'Radiator and hoses condition',
          description:
            'Radiator not blocked or corroded. Coolant hoses not soft, cracked, or bulging.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'gas_drips',
          label: 'No drips under vehicle',
          description:
            'No fluid drips visible on ground beneath the parked vehicle.',
          status: 'not_checked',
          notes: '',
        },
      ],
    },
    {
      id: 'engine_diesel',
      title: 'Engine - Diesel',
      powertrainTypes: ['diesel'],
      items: [
        {
          id: 'diesel_oil',
          label: 'Engine oil level and condition',
          description:
            'Oil level within range. Oil not excessively dark or contaminated.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_coolant',
          label: 'Coolant level and condition',
          description:
            'Coolant at correct level and free of oil contamination.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_dpf',
          label: 'DPF service history noted',
          description:
            'Diesel particulate filter service or replacement history noted.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_egr',
          label: 'EGR system service noted',
          description:
            'EGR system cleaning or service history discussed with seller.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_turbo',
          label: 'Turbocharger for oil leaks',
          description:
            'Turbocharger and intercooler hoses free of oil residue.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_fuel',
          label: 'Fuel filter service history',
          description:
            'Fuel filter replacement history noted and not significantly overdue.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_glow',
          label: 'Glow plug preheating normal',
          description:
            'Glow plug indicator light functions properly before startup in cold conditions.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_injectors',
          label: 'Injector service history noted',
          description:
            'Injector cleaning or replacement history noted if available.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_def',
          label: 'DEF fluid level if applicable',
          description:
            'Diesel exhaust fluid level checked if vehicle uses SCR emissions system.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_oilleak',
          label: 'No oil leaks visible',
          description:
            'No oil drips or stains visible under hood or beneath vehicle.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_coolantleak',
          label: 'No coolant leaks visible',
          description:
            'No coolant leaks at hoses, radiator, or head gasket area.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_radiator',
          label: 'Radiator and hoses condition',
          description:
            'Radiator and coolant hoses in good condition without cracks or soft spots.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'diesel_smoke',
          label: 'Exhaust smoke color noted',
          description:
            'Exhaust color noted - excessive white, black, or blue smoke can indicate mechanical issues.',
          status: 'not_checked',
          notes: '',
        },
      ],
    },
    {
      id: 'hybrid',
      title: 'Hybrid System',
      powertrainTypes: ['hybrid'],
      items: [
        {
          id: 'hyb_lights',
          label: 'No hybrid system warning lights',
          description:
            'No hybrid or high-voltage system warning lights present after startup.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'hyb_battery_age',
          label: 'High-voltage battery history noted',
          description:
            'Battery age, replacement history, and condition discussed with seller.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'hyb_disclosure',
          label: 'Seller disclosed battery condition',
          description:
            'Seller has disclosed any battery-related repairs, replacements, or concerns.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'hyb_service',
          label: 'Hybrid service history noted',
          description:
            'Any hybrid-specific service or component repairs noted.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'hyb_regen',
          label: 'Regenerative braking observed',
          description:
            'Regenerative braking provides smooth deceleration during test drive.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'hyb_ev_mode',
          label: 'EV mode behavior observed',
          description: 'EV-only operation observed if applicable. Range noted.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'hyb_phev',
          label: 'PHEV charging equipment available',
          description:
            'For plug-in hybrids - charging cable and documentation included if applicable.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'hyb_ice',
          label: 'ICE startup behavior normal',
          description:
            'Gasoline engine starts and transitions smoothly during hybrid operation.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'hyb_smooth',
          label: 'Hybrid power transitions smooth',
          description:
            'No jerking or unexpected power transitions between electric and gasoline modes.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'hyb_note',
          label: 'NOTE - Battery health not assessable by this app',
          description:
            'IMPORTANT: This app cannot determine hybrid battery health, remaining capacity, or high-voltage system condition. A qualified hybrid technician inspection is strongly recommended before purchase.',
          status: 'not_checked',
          notes: '',
        },
      ],
    },
    {
      id: 'electric',
      title: 'Electric System',
      powertrainTypes: ['electric'],
      items: [
        {
          id: 'ev_lights',
          label: 'No high-voltage warning lights',
          description:
            'No powertrain, battery, or high-voltage system warning lights after startup.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ev_range',
          label: 'Estimated range displayed',
          description:
            'Estimated range shown on instrument cluster and noted.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ev_charge',
          label: 'State of charge at inspection',
          description: 'Current battery charge level noted at time of inspection.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ev_port',
          label: 'Charging port condition',
          description: 'Charging port latch and contacts in good condition.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ev_dcfc',
          label: 'DC fast charge port if equipped',
          description:
            'DC fast charge port condition checked if vehicle is equipped.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ev_obcharger',
          label: 'Onboard charger operation',
          description:
            'Onboard charger operational and confirmed by seller.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ev_equipment',
          label: 'Charging equipment included',
          description:
            'Level 1 or Level 2 charging cable and any adapters included with vehicle.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ev_disclosure',
          label: 'Seller disclosed battery history',
          description:
            'Battery service, repair, or warranty replacement history disclosed by seller.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ev_warranty',
          label: 'Battery warranty status noted',
          description:
            'Remaining battery warranty period noted if applicable.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'ev_note',
          label: 'NOTE - Battery health not assessable by this app',
          description:
            'IMPORTANT: This app cannot determine electric vehicle battery state of health, degradation, or accurate remaining range. A qualified EV technician inspection is strongly recommended before purchase.',
          status: 'not_checked',
          notes: '',
        },
      ],
    },
    {
      id: 'testdrive',
      title: 'Test Drive',
      powertrainTypes: null,
      items: [
        {
          id: 'td_accel',
          label: 'Smooth acceleration',
          description:
            'Powertrain responds smoothly under light and moderate acceleration.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_hardaccel',
          label: 'Hard acceleration response',
          description:
            'No hesitation, stumble, or unexpected behavior under full acceleration.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_trans',
          label: 'Transmission shifts smoothly',
          description:
            'Gear changes are smooth without clunking, slipping, or hesitation.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_straight',
          label: 'Vehicle tracks straight',
          description:
            'Vehicle drives straight without pulling to either side.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_steering',
          label: 'Steering feel normal',
          description:
            'Steering is responsive and has appropriate weight and feedback.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_brakes',
          label: 'Brakes engage progressively',
          description:
            'Brakes apply smoothly without pulsing, grinding, pulling, or excessive fade.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_noise',
          label: 'No unusual driving noise',
          description:
            'No clunks, rattles, or vibrations during normal driving.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_bumps',
          label: 'No noise over bumps',
          description:
            'No suspension clunks, CV joint clicks, or unusual noise over road irregularities.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_vibration',
          label: 'No vibration at speed',
          description:
            'No steering wheel or body vibration at highway speeds.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_cruise',
          label: 'Cruise control if equipped',
          description:
            'Cruise control sets, holds speed, and cancels correctly if equipped.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_lights',
          label: 'No warning lights during drive',
          description: 'No new warning lights appear during the test drive.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_ac',
          label: 'Air conditioning effective',
          description: 'AC cools interior effectively at maximum setting.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_heat',
          label: 'Heater effective',
          description: 'Heater warms interior effectively.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'td_parking',
          label: 'Parking brake holds',
          description:
            'Parking brake or electronic park brake holds vehicle on a slope.',
          status: 'not_checked',
          notes: '',
        },
      ],
    },
    {
      id: 'postdrive',
      title: 'Post-Drive Review',
      powertrainTypes: null,
      items: [
        {
          id: 'pd_hood',
          label: 'Engine compartment revisited',
          description:
            'Hood opened after drive to check for new leaks, drips, or unusual odors.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'pd_exhaust',
          label: 'Exhaust pipe checked',
          description:
            'Exhaust pipe tip checked for oily residue or heavy soot deposits.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'pd_drips',
          label: 'Under vehicle for fresh drips',
          description:
            'Ground checked beneath vehicle for any new fluid drips after the test drive.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'pd_brake_odor',
          label: 'No unusual brake odor',
          description:
            'No burning brake smell after stopping from normal driving.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'pd_lights_clear',
          label: 'All warning lights still clear',
          description:
            'All dashboard warning lights still off after the test drive.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'pd_impression',
          label: 'Overall driving impression noted',
          description:
            'Overall driving feel, comfort, and confidence in vehicle noted.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'pd_questions',
          label: 'Follow-up questions for seller',
          description:
            'Any questions arising from the inspection noted to discuss with seller.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'pd_items',
          label: 'Items to follow up on',
          description:
            'Specific concerns or unresolved items noted for further investigation.',
          status: 'not_checked',
          notes: '',
        },
        {
          id: 'pd_mechanic',
          label: 'Professional inspection planned',
          description:
            'Decision made whether to pursue a pre-purchase inspection by a qualified mechanic.',
          status: 'not_checked',
          notes: '',
        },
      ],
    },
  ];
}

export function getInspectionSections(
  powertrainType: PowertrainType,
): ChecklistSection[] {
  const template = getChecklistTemplate();
  return template.filter((section) => {
    if (section.powertrainTypes === null) return true;
    return section.powertrainTypes.includes(powertrainType);
  });
}
