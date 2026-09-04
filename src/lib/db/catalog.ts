import type { PipelineStage, Team } from "@/lib/domain/types"

export type DemoPerson = {
  id: string
  name: string
  role: "se" | "ae"
  team: Team
}

export type DemoPrerequisite = {
  key: string
  text: string
}

export type DemoPlay = {
  id: string
  name: string
  description: string
  typicalStages: PipelineStage[]
  prerequisites: DemoPrerequisite[]
}

export type PlayHygiene = {
  owner: string
  nextReview: string
}

export const DEMO_PEOPLE: DemoPerson[] = [
  { id: "person-lena", name: "Lena Hart", role: "se", team: "West" },
  { id: "person-mateo", name: "Mateo Ruiz", role: "se", team: "East" },
  { id: "person-nora", name: "Nora Blake", role: "se", team: "Strategic" },
  { id: "person-quinn", name: "Quinn Adler", role: "se", team: "West" },
  { id: "person-rhea", name: "Rhea Patel", role: "ae", team: "Strategic" },
]

export const DEMO_PLAYS: DemoPlay[] = [
  {
    id: "play-discovery",
    name: "Discovery",
    description:
      "Map the current-state workflow and confirm the business problem before anyone sees the product. Used when Optimize is still a hypothesis, not a demo.",
    typicalStages: ["Qualify"],
    prerequisites: [
      {
        key: "discovery-aligned",
        text: "Current-state workflow mapped",
      },
      {
        key: "discovery-problem",
        text: "Business problem confirmed",
      },
      {
        key: "discovery-owner",
        text: "Process owner identified",
      },
    ],
  },
  {
    id: "play-product-demo",
    name: "Product Demo",
    description:
      "A working-product walkthrough tied to a named workflow and a measurable outcome — not a feature tour.",
    typicalStages: ["Evaluate"],
    prerequisites: [
      {
        key: "demo-discovery",
        text: "Use case tied to a measurable outcome",
      },
      {
        key: "demo-problem",
        text: "Business problem confirmed",
      },
      {
        key: "demo-champion",
        text: "Champion identified",
      },
    ],
  },
  {
    id: "play-architecture-review",
    name: "Architecture Review",
    description:
      "A technical design conversation with the people who will own systems of record, risk, and the path to production.",
    typicalStages: ["Validate"],
    prerequisites: [
      {
        key: "arch-risks",
        text: "Automation and integration risks identified",
      },
      {
        key: "arch-stakeholder",
        text: "Technical stakeholder engaged",
      },
      {
        key: "arch-path",
        text: "System-of-record path confirmed",
      },
    ],
  },
  {
    id: "play-workshop",
    name: "Workshop",
    description:
      "A structured working session to map a live workflow onto Optimize with the buying team in the room.",
    typicalStages: ["Evaluate", "Propose"],
    prerequisites: [
      {
        key: "workshop-agenda",
        text: "Session outcomes agreed",
      },
      {
        key: "workshop-workflow",
        text: "Target workflow selected for mapping",
      },
    ],
  },
  {
    id: "play-poc",
    name: "POC / POE",
    description:
      "A time-boxed proof of concept or proof of execution against agreed success criteria. Occurs late by design.",
    typicalStages: ["Prove"],
    prerequisites: [
      {
        key: "poc-criteria",
        text: "Success criteria agreed with customer",
      },
      {
        key: "poc-technical",
        text: "Technical stakeholder engaged",
      },
    ],
  },
]

export const PLAY_HYGIENE: Record<string, PlayHygiene> = {
  "play-discovery": { owner: "Lena Hart", nextReview: "2026-10-15" },
  "play-product-demo": { owner: "Lena Hart", nextReview: "2026-10-08" },
  "play-architecture-review": { owner: "Mateo Ruiz", nextReview: "2026-11-03" },
  "play-workshop": { owner: "Nora Blake", nextReview: "2026-11-20" },
  "play-poc": { owner: "Solutions Engineering", nextReview: "2026-12-04" },
}

export const UNDEFINED_SECURITY_LABEL = "Executive workflow audit"
export const UNDEFINED_BRIEFING_LABEL = "Process mining walkthrough"

export const DEMO_ACCOUNTS = [
  "Meridian Mutual",
  "Northline Retail",
  "Helix Industrials",
  "Carewell Health",
  "Atlas Payments Group",
  "Harborline Logistics",
  "Pinnacle Benefits",
  "Oak & Iron Manufacturing",
  "Lumen Health Partners",
  "Sterling Card Services",
  "Rivermark Stores",
  "Crestline Pharma Ops",
  "Blue Harbor Credit",
  "Vesper Components",
  "Granite Underwriters",
  "Sable Media Group",
  "Ironclad Freight Co",
  "Weston Clinics",
  "Nimbus Mutual",
  "Orchard Systems",
  "Fieldwork Retail",
  "Cobalt Outfitters",
  "Redwood Municipal",
  "Quill Learning",
  "Maple & Pine Goods",
]

export const DEMO_DEAL_SHAPES = [
  "Optimize rollout · $240K ACV",
  "workflow visibility program · $180K ACV",
  "process intelligence expansion · $95K ACV",
  "capture-to-Optimize expansion · $320K ACV",
  "automation opportunity assessment · $150K ACV",
  "enterprise playbook redesign · $275K ACV",
  "shared-services workflow map · $125K ACV",
  "claims intake visibility · $210K ACV",
  "store operations playbook · $160K ACV",
  "underwriting process intelligence · $190K ACV",
]
