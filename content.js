/* Static content: suggestion lists, emergency guides, sample data.
   Edit this file to tailor the guides to your area. */

const SKILL_SUGGESTIONS = [
  "Doctor", "Nurse", "EMT / Paramedic", "CPR / First aid", "Mental health",
  "Veterinary", "Electrician", "Plumber", "Carpenter / Handyperson",
  "Gas / HVAC", "Ham radio operator", "CERT trained", "Search & rescue",
  "Firefighter", "Law enforcement", "Childcare", "Elder care", "Cooking for groups",
  "Spanish", "Mandarin", "Cantonese", "Vietnamese", "Tagalog", "ASL",
  "Tree work / Chainsaw", "Mechanic", "IT / Networking",
];

const RESOURCE_SUGGESTIONS = [
  "Generator", "Solar charger / power bank", "Chainsaw", "Ladder",
  "Extra first-aid kit", "AED", "Stored water", "Two-way radios",
  "Truck / trailer", "Wheelchair", "Fire extinguisher", "Tent / tarps",
  "Camp stove", "Shut-off wrench", "Pool / large water source",
];

const NEEDS_HINT =
  "Optional. e.g. uses oxygen, limited mobility, lives alone, infant at home, needs medication refrigeration";

const DEFAULT_NUMBERS = [
  { label: "Emergency (police / fire / medical)", number: "911" },
  { label: "Poison Control", number: "1-800-222-1222" },
  { label: "988 Suicide & Crisis Lifeline", number: "988" },
  { label: "Police non-emergency", number: "" },
  { label: "Gas utility (leaks)", number: "" },
  { label: "Electric utility (outages)", number: "" },
  { label: "Water utility", number: "" },
];

const GO_BAG = [
  { group: "Water & food", items: [
    "Water: 1 gallon per person per day, at least 3 days",
    "3 days of non-perishable food per person",
    "Manual can opener and utensils",
  ]},
  { group: "Light, power & communication", items: [
    "Flashlight or headlamp",
    "Battery or hand-crank NOAA weather radio",
    "Extra batteries",
    "Phone charger and backup battery pack",
    "Whistle to signal for help",
    "Printed copy of this directory and your pod list",
  ]},
  { group: "Health & safety", items: [
    "First-aid kit",
    "7-day supply of prescription medications, plus a list of them",
    "Spare glasses or contacts",
    "N95 / dust masks",
    "Moist towelettes, garbage bags, plastic ties",
    "Hygiene items (toothbrush, sanitary supplies, hand sanitizer)",
  ]},
  { group: "Documents & money", items: [
    "Copies of ID, insurance policies, and medical info (paper and USB / cloud)",
    "Cash in small bills",
    "Written list of important phone numbers",
    "Local paper map with your meeting places marked",
  ]},
  { group: "Clothing & shelter", items: [
    "Change of clothes and sturdy closed-toe shoes",
    "Emergency blanket or sleeping bag",
    "Work gloves",
    "Rain gear",
  ]},
  { group: "Tools", items: [
    "Wrench or pliers (for utility shutoffs)",
    "Multi-tool or knife",
    "Duct tape and plastic sheeting",
  ]},
  { group: "Family extras", items: [
    "Baby supplies (formula, diapers, bottles)",
    "Pet food, water, leash or carrier, vet records",
    "Comfort items or games for kids",
  ]},
];

/* Each guide: id, title, summary, and sections of {heading, steps|text, warn}. */
const GUIDES = [
  {
    id: "gas",
    title: "Shutting off the gas",
    summary: "Only shut off gas if you smell it, hear it hissing, or see damage to the line.",
    sections: [
      { heading: "When to shut it off", steps: [
        "You smell gas (rotten-egg odor), hear a blowing or hissing sound, or see a broken gas line.",
        "Do NOT shut off gas just because there was an earthquake or outage. If there's no sign of a leak, leave it on.",
      ]},
      { heading: "If you suspect a leak", steps: [
        "Get everyone out of the house right away. Leave the door open behind you.",
        "Do not flip light switches, use phones, light matches, or start cars near the leak. Sparks can ignite gas.",
        "From a safe distance, call 911 and your gas utility.",
      ]},
      { heading: "How to shut it off at the meter", steps: [
        "Find your gas meter. It's usually on the side of the house or in a basement or garage. Know where it is before an emergency.",
        "Find the shutoff valve on the pipe coming out of the ground into the meter.",
        "Use a 12–15\" adjustable wrench or a gas shutoff tool. Turn the valve a quarter turn so the tab (tang) is crosswise to the pipe. Parallel = on, crosswise = off.",
        "Keep the wrench next to the meter, tied on with wire, so it's there when you need it.",
      ]},
      { heading: "Afterward", warn: true, text:
        "Never turn the gas back on yourself. Only the utility or a licensed professional should turn it back on and relight pilot lights. It can take days after a major event, so only shut it off if you need to." },
    ],
  },
  {
    id: "water",
    title: "Shutting off the water",
    summary: "Shut off the water to stop flooding from broken pipes and to keep contaminated city water out of your pipes.",
    sections: [
      { heading: "Find your main valve now", steps: [
        "Most homes have a main shutoff where the water line enters the house. Look in the garage, basement, crawl space, or by the water heater.",
        "There's often a second valve at the street meter box. Opening it may require a meter key.",
        "Turn the valve clockwise (righty-tighty) to close it. For a lever valve, turn it a quarter turn so the lever is crosswise to the pipe.",
      ]},
      { heading: "Save the water you already have", steps: [
        "Your water heater holds 30 to 80 gallons of drinkable water. If there are reports of contamination, shut off the main valve first so bad water can't get in.",
        "Turn off power or gas to the water heater before draining from the valve at the bottom.",
        "Toilet tanks (not bowls) also hold usable water if they don't contain cleaning tablets.",
      ]},
      { heading: "Boil-water notices", text:
        "If officials issue a boil-water notice, bring water to a rolling boil for 1 minute (3 minutes at high elevation) before drinking, or use stored or bottled water." },
    ],
  },
  {
    id: "power",
    title: "Electricity and generators",
    summary: "Turn off power when there's flooding, sparking, or you need to evacuate. Run generators outdoors only.",
    sections: [
      { heading: "Shutting off power at the panel", steps: [
        "Find your main electrical panel (garage, basement, utility closet, or outside wall).",
        "Switch off the individual circuit breakers first, then the main breaker.",
        "To restore power, turn on the main breaker first, then the individual breakers one at a time.",
      ]},
      { heading: "Stay safe", warn: true, steps: [
        "Never touch the panel while standing in water. If it's wet, call the utility.",
        "Stay at least 35 feet from downed power lines and assume they are live. Report them to the utility.",
      ]},
      { heading: "Generators", warn: true, steps: [
        "Only run generators outdoors, at least 20 feet from doors, windows, and vents. Carbon monoxide kills quickly and has no smell.",
        "Never plug a generator into a wall outlet (backfeeding). It can electrocute utility workers. Use heavy-duty extension cords or a professionally installed transfer switch.",
        "Install battery-powered CO alarms inside.",
      ]},
    ],
  },
  {
    id: "earthquake",
    title: "Earthquakes",
    summary: "Drop, cover, and hold on. Then check yourself, your home, and your pod.",
    sections: [
      { heading: "During the shaking", steps: [
        "DROP to your hands and knees.",
        "COVER your head and neck under a sturdy table or desk. If there's none, get next to an interior wall away from windows.",
        "HOLD ON until the shaking stops. Do not run outside during the shaking.",
      ]},
      { heading: "Right after", steps: [
        "Check yourself and others for injuries. Put on shoes, since there may be broken glass.",
        "Check for gas leaks, water leaks, and electrical damage. See the shutoff guides.",
        "Expect aftershocks.",
        "Post your OK / HELP sign and start your pod check-in.",
      ]},
    ],
  },
  {
    id: "fire",
    title: "Wildfire and evacuation",
    summary: "Ready, Set, Go! Leave early. Don't wait for an evacuation order if you feel unsafe.",
    sections: [
      { heading: "Ready (before fire season)", steps: [
        "Keep a go bag packed for every household member and pet.",
        "Clear dead vegetation and debris within 5 feet of the house.",
        "Know two ways out of the neighborhood.",
        "Sign up for your county's emergency alerts.",
      ]},
      { heading: "Set (when there's a fire nearby)", steps: [
        "Put go bags, pets, and important papers in the car. Park facing out.",
        "Close all windows and doors. Leave them unlocked for firefighters.",
        "Tell your pod your plans and check on neighbors who may need a ride.",
      ]},
      { heading: "Go", steps: [
        "Leave as soon as you're told to, or sooner if you feel threatened.",
        "Follow the routes officials give you, not shortcuts from your GPS app.",
        "Check in with your out-of-area contact once you're safe.",
      ]},
    ],
  },
  {
    id: "checkin",
    title: "Pod check-in protocol",
    summary: "After any major event, every household checks on the others in its pod.",
    sections: [
      { heading: "Within the first hour", steps: [
        "Take care of your own household first: injuries, hazards, utilities.",
        "Put a sign in your front window or on your door: OK (green) or HELP (red). Print the signs from the Print page.",
        "Go to or call every household in your pod. Start with anyone listed with special needs.",
        "Write down who you've reached, who needs help, and who isn't home.",
      ]},
      { heading: "Report", steps: [
        "Pod captains report their pod's status to the neighborhood organizer at the meeting point.",
        "Report life-threatening emergencies to 911 right away. Don't wait for the pod check.",
        "Share skills and resources. The directory lists who has a generator, medical training, tools, and more.",
      ]},
      { heading: "If phones are down", text:
        "Text messages often get through when calls fail. If nothing works, go to the neighborhood meeting point at the agreed time (see Settings). Ham radio operators in the directory may be able to relay messages." },
    ],
  },
  {
    id: "plan",
    title: "Household emergency plan",
    summary: "Talk through this with everyone in your household, then write it down.",
    sections: [
      { heading: "Decide together", steps: [
        "An out-of-area contact everyone will call or text to check in. Long-distance calls often work when local ones don't.",
        "A meeting place right outside your home, and one outside the neighborhood.",
        "Who picks up the kids if schools close, and who checks on pets.",
        "Where your utility shutoffs are, and who knows how to use them.",
      ]},
      { heading: "Write down and share", steps: [
        "Phone numbers on paper. Don't rely only on your phone's contacts.",
        "Medical needs, medications, and allergies for each person.",
        "Your pod members' names and addresses (from this directory).",
      ]},
    ],
  },
];

const SAMPLE_HOUSEHOLDS = [
  ["Maria & Tom Alvarez", "112 Oak St", "555-0101", "maria.a@example.com", "ER nurse; contractor", ["Nurse", "CPR / First aid", "Carpenter / Handyperson", "Spanish"], ["Generator", "Ladder"], ""],
  ["Dev Patel", "118 Oak St", "555-0102", "", "Software engineer", ["IT / Networking", "Ham radio operator"], ["Two-way radios", "Solar charger / power bank"], ""],
  ["The Nguyen family", "124 Oak St", "555-0103", "nguyenfam@example.com", "Restaurant owner", ["Cooking for groups", "Vietnamese"], ["Camp stove", "Stored water"], "Infant at home"],
  ["Ruth Goldberg", "130 Oak St", "555-0104", "", "Retired teacher", ["Childcare"], [], "Lives alone; uses a walker"],
  ["Sam & Jordan Lee", "136 Oak St", "555-0105", "leehouse@example.com", "Electrician; vet tech", ["Electrician", "Veterinary"], ["Truck / trailer", "Shut-off wrench"], ""],
  ["Aisha Bello", "142 Oak St", "555-0106", "", "Paramedic", ["EMT / Paramedic", "CERT trained"], ["Extra first-aid kit", "AED"], ""],
  ["Chris Ward", "15 Elm Ave", "555-0107", "", "Arborist", ["Tree work / Chainsaw"], ["Chainsaw", "Ladder"], ""],
  ["Linda & Paul Okafor", "21 Elm Ave", "555-0108", "okafors@example.com", "Physician; accountant", ["Doctor"], ["Generator"], "Paul uses oxygen (needs power)"],
  ["Hannah Kim", "27 Elm Ave", "555-0109", "", "Social worker", ["Mental health", "Elder care"], [], ""],
  ["Jamal Carter", "33 Elm Ave", "555-0110", "", "Plumber", ["Plumber", "Gas / HVAC"], ["Shut-off wrench", "Tent / tarps"], ""],
  ["The Russo family", "39 Elm Ave", "555-0111", "", "Firefighter", ["Firefighter", "Search & rescue"], ["Fire extinguisher", "Pool / large water source"], "", "2 dogs"],
  ["Mei Chen", "45 Elm Ave", "555-0112", "", "Pharmacist", ["Mandarin", "Cantonese"], [], ""],
];
