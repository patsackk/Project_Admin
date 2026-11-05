// Adds quotation Q-DC-UTO-002-26 R3 (DC HOUSE) — typed in from the company's
// PDF — as a worked example. Prices hidden as "#####" in the PDF were worked
// back from the amounts. Safe to re-run: it skips if the quotation exists.
//
//   node scripts/seed-quotation-example.mjs
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const I = (description, qty, unit, matUnit, labourUnit, note = "") => ({
  kind: "item", description, qty, unit, matUnit, labourUnit, note,
})
const G = (description, qty = 0, unit = "", matUnit = 0, labourUnit = 0, note = "") => ({
  kind: "group", description, qty, unit, matUnit, labourUnit, note,
})
const H = (description) => ({ kind: "heading", description, qty: 0, unit: "", matUnit: 0, labourUnit: 0, note: "" })

const sections = [
  {
    title: "AIR CONDITION SYSTEM",
    lines: [
      G("AIR CONDITION SPLIT TYPE SYSTEM DAIKIN + WIRELESS REMOTE"),
      I("FBEC18EV2S+RZFC18EV2S", 2, "Set", 53500, 5000),
      I("FBEC24EV2S+RZFC24EV2S", 1, "Set", 60700, 5000),
      I("FBEC30EV2S+RZFC30EY2S", 2, "Set", 69900, 5000),
      I("FBEC36EV2S+RZFC36EY2S", 1, "Set", 81300, 5000),
      I("FBEC42EV2S+RZFC42EY2S", 2, "Set", 86500, 5000),
      I("Refrigerant charge", 1, "Lot", 0, 0, "Included"),
      I("Commissioning and test", 1, "Lot", 0, 5000),
      G("REFRIGERANT PIPE"),
      H("Copper tube type L"),
      I('Dia 1/4"', 12, "M", 108, 55),
      I('Dia 3/8"', 136.8, "M", 167, 60),
      I('Dia 1/2"', 12, "M", 240, 65),
      I('Dia 5/8"', 136.8, "M", 295, 70),
      I("Fittings", 1, "Lot", 33688.8, 10106.64),
      I("Hanger & Support", 1, "Lot", 20213.28, 6063.98),
      G('Insulation for Refrigerant pipe (Closed cell foam insulation 3/4" thickness)'),
      I('Dia 1/2", 3/4" thickness', 12, "M", 100, 35),
      I('Dia 3/8", 3/4" thickness', 136.8, "M", 100, 35),
      I('Dia 1/2", 3/4" thickness', 12, "M", 115, 40),
      I('Dia 5/8", 3/4" thickness', 136.8, "M", 120, 50),
      I("Adhesive", 1, "Lot", 6730.2, 2019.06),
      G("Drain pipe PVC.class 8.5", 1, "Lot", 20000, 6000),
      G('Insulation for Drain pipe (Closed cell foam insulation 1/2" thickness)', 1, "Lot", 0, 0, "Included Item 4"),
      G("AC.Ducting work ( PID.duct ) / CHAMBER"),
      I("Pre-insulation ducting", 3410, "Sq.ft", 55, 20),
      I("Duct Accessories", 3410, "Sq.ft", 25, 10),
      I("Support & hanger", 3410, "Sq.ft", 20, 20),
      G("Ventilation system"),
      H('Exhaust fan "Panasonic"'),
      I("FV12NS3", 5, "Set", 7010, 1000),
      I("FV27CH9", 1, "Set", 7160, 2000),
      I("Support & hanger", 1, "Lot", 4800, 1440),
      H("Exhaust pipe PVC.class 5"),
      I('Dia 4"', 72, "M", 127.5, 160),
      I('Dia 6"', 8, "M", 272.5, 240),
      I("Fitting", 1, "Lot", 5680, 1704),
      I("Support & Hanger", 1, "Lot", 3408, 1022.4),
      H("Exhaust cap"),
      I('Dia 4"', 6, "Set", 1090, 200),
      I('Dia 6"', 1, "Set", 1680, 300),
      G("Air diffuser & Volume damper", 1, "Lot", 0, 0, "Not included – ceiling slot by main contractor"),
      I("Service panel", 1, "Lot", 0, 0, "Not included"),
      G("Electrical Work"),
      H("Cable & conduit"),
      I("VCT 2-1.5 sq.mm", 151, "M", 77.9, 20),
      I("Dia. 20 mm.", 151, "M", 19.42, 28),
      I("Fitting & Accessories For Cable & Conduit", 1, "Lot", 7347.66, 2204.3),
      I("Accessories", 1, "Lot", 4408.6, 1322.58),
    ],
  },
  {
    title: "PLUMBING SYSTEM",
    lines: [
      G("Cold water system"),
      I("Water storage tank 1 cu.m", 1, "Set", 0, 0, "Existing system"),
      I("Booster pump", 1, "Set", 10900, 1500),
      I("Accessories", 1, "Set", 5000, 1500),
      G("Hot water system"),
      I("Control circulator / pump", 1, "Set", 27000, 1500),
      I('Hot water storage tank "Stiebel" 150 L.', 2, "Set", 16590, 4500),
      I("Support & Hanger", 1, "Lot", 4000, 1200),
      G("Valve and Accessories"),
      H('Gate Valve "KITZ"'),
      I("Dia. 1 inch", 4, "Set", 705, 200),
      I("Dia. 3/4 inch", 18, "Set", 505, 200),
      I("Dia. 1/2 inch", 5, "Set", 405, 200),
      H('Check Valve "KITZ"'),
      I("Dia. 3/4 inch", 1, "Set", 935, 200),
      I("Dia. 1/2 inch", 5, "Set", 425, 200),
      H("Hose bibb"),
      I("Dia. 3/4 inch", 4, "Set", 295, 200),
      G("Pipe work"),
      H("Cold water pipe PPR.pn.10"),
      I("Dia. 1 inch", 48, "M", 81.32, 55),
      I("Dia. 3/4 inch", 97.2, "M", 49.22, 41),
      I("Dia. 1/2 inch", 60, "M", 37.45, 28),
      I("Fitting (AS comment 5 Mar 2026)", 1, "Lot", 15308.36, 4592.51),
      I("Support & Hanger", 1, "Lot", 3280.36, 984.11),
      H("Hot water pipe PPR.pn.20"),
      I("Dia. 3/4 inch", 73.2, "M", 88.81, 60),
      I("Dia. 1/2 inch", 60, "M", 57.78, 40),
      I("Fitting", 1, "Lot", 13954.77, 4186.43),
      I("Support & Hanger", 1, "Lot", 2990.31, 897.09),
      H("Rainleader pipe, Waste, Kwaste, Vent pipe PVC.class 8.5"),
      I("Dia. 4 inch", 36, "M", 192, 160),
      I("Dia. 3 inch", 4.8, "M", 118.5, 120),
      I("Dia. 2 inch", 154.8, "M", 54, 80),
      I("Dia. 3 inch (PERFORATED PIPE)", 33.6, "M", 127.5, 120),
      I("Fitting", 1, "Lot", 10062, 3018.6),
      I("Support & Hanger", 1, "Lot", 6037.2, 1811.16),
      G("Accessories"),
      H("Floor drain"),
      I("Dia. 3 inch", 0, "Set", 0, 300, "By other"),
      I("Dia. 2 inch", 0, "Set", 0, 300, "By other"),
      H("Roof drain"),
      I("Dia. 3 inch", 0, "Set", 0, 300, "By other"),
      H("U-trap"),
      I("Dia. 3 inch", 1, "Set", 2500, 400),
      H("Vent through roof"),
      I("Dia. 2 inch", 3, "Set", 1050, 200),
      G("Sanitary fixture"),
      I("Basin mixer + P-trap + Popup", 5, "Set", 0, 2000, "By Owner"),
      I("Flush tank + Water closet + Wall plate + Paper holder\nHand spray + Stop valve", 5, "Set", 0, 4000, "By Owner"),
      I("Rain shower + Mixer + Hand spray/Outlet elbow\nWall hand shower + Shower hose", 5, "Set", 0, 3000, "By Owner"),
      I("Bath tub w/accessories", 1, "Set", 0, 8000, "By Owner"),
      I("Accessories", 1, "Set", 5300, 1590),
      G("Other work"),
      I("Hacking floor", 1, "Lot", 0, 8000),
    ],
  },
  {
    title: "SWIMMING POOL SYSTEM",
    lines: [
      I('"Hayward" Super II Pump 2 Hp., 220 V.', 2, "Set", 40500, 3000),
      I('"Hayward" DE Filter Tank Model DE 7220 w/multiport V.', 1, "Set", 66500, 5000),
      I('"Astral" Viron salt chlorinator V45', 1, "Set", 48300, 2000),
      I("Control System", 1, "Set", 24000, 2000),
      I("Vacuum", 1, "Set", 450, 200),
      I("Inlet", 8, "Set", 450, 200),
      I("Main Drain", 1, "Set", 2000, 500),
      I('Cleaning Equipment\n- Nylon brush 18"\n- Vacuum head 14"\n- Vacuum hose 25 ft.\n- Handle 6 m.\n- SUS brush 18"\n- Leaf skimmer', 1, "Lot", 9500, 0),
      H("PVC. Pipe"),
      I('Dia. 4"', 4, "M", 290, 200),
      I('Dia. 3"', 4, "M", 180, 150),
      I('Dia. 2"', 48, "M", 78, 100),
      I('Dia. 1"', 4, "M", 30.25, 50),
      I("Fitting", 1, "Lot", 2872.5, 861.75),
      I("Support & hanger", 1, "Lot", 1723.5, 517.05),
      H("UPVC Ball Valve + Fitting"),
      I('True Union Ball Valve Size 1"', 1, "Set", 950, 200),
      I('True Union Ball Valve Size 2"', 16, "Set", 1200, 200),
      I('True Union Check Valve Size 2"', 3, "Set", 1280, 200),
      I('True Union Foot Valve Size 2"', 1, "Set", 1350, 200),
      I('Float Valve Size 1"', 1, "Set", 950, 200),
      I("PVC pipe + Fitting pump room complete work", 1, "Lot", 8000, 2400),
      I("Conduit & cable", 1, "Set", 15000, 4500),
      I("Chemical Start Up", 1, "Set", 8000, 2400),
      I("Accessories", 1, "Set", 4929, 1478.7),
    ],
  },
]

const conditions = `Construction term
- Construction period as discussed
- The price is not a fixed rate of material
Scope of works
- Supply and install as {number}
Not included in scope of works
- Electrical and water fee by Owner
Warranty
- 1 year general equipment warranty under normal operating conditions
- The company does not guarantee equipment other than in the quotation in any case`

const existing = await prisma.quotation.findFirst({ where: { number: "Q-DC-UTO-002-26", revision: 3 } })
if (existing) {
  console.log(`Already there (id ${existing.id}), nothing to do.`)
} else {
  const project = await prisma.project.findFirst({ where: { name: { equals: "DC HOUSE", mode: "insensitive" } } })
  const q = await prisma.quotation.create({
    data: {
      number: "Q-DC-UTO-002-26",
      revision: 3,
      projectId: project?.id ?? null,
      projectName: "DC HOUSE",
      clientName: "DARIA VAKULSKAIA",
      clientAddress: "Maan tawan unit 4C 81 MOO 6 Cherngtalay, Thalang Phuket 83110 Thailand",
      subject: "Plumbing and Aircondition work",
      date: new Date("2026-08-20T12:00:00"),
      validityDays: 30,
      overheadPct: 15,
      vatPct: 7,
      sections,
      paymentTerms: [
        { label: "Deposit", percent: 30 },
        { label: "Progress work", percent: 60 },
        { label: "Complete work", percent: 10 },
      ],
      conditions,
      status: "sent",
    },
  })
  console.log(`Added quotation ${q.number} R${q.revision} (id ${q.id}).`)
}
await prisma.$disconnect()
