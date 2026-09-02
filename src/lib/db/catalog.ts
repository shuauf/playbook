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

export const DEMO_PEOPLE: DemoPerson[] = [
  { id: "person-maya", name: "Maya Chen", role: "se", team: "West" },
  { id: "person-jordan", name: "Jordan Hale", role: "se", team: "East" },
  { id: "person-priya", name: "Priya Shah", role: "se", team: "Strategic" },
  { id: "person-alex", name: "Alex Rivera", role: "ae", team: "West" },
  { id: "person-sam", name: "Sam Ortiz", role: "ae", team: "East" },
  { id: "person-dana", name: "Dana Cho", role: "ae", team: "Strategic" },
]

export const DEMO_PLAYS: DemoPlay[] = [
  {
    id: "play-discovery",
    name: "Discovery",
    description:
      "Establish the business problem, stakeholders, and whether SE involvement is justified.",
    typicalStages: ["Qualify"],
    prerequisites: [
      {
        key: "discovery-aligned",
        text: "AE and SE have aligned on the meeting objective",
      },
    ],
  },
  {
    id: "play-product-demo",
    name: "Product Demo",
    description:
      "A working-product walkthrough for a known business problem and a named audience. Used when discovery is complete enough to show relevant capability — not a tour.",
    typicalStages: ["Evaluate"],
    prerequisites: [
      {
        key: "demo-discovery",
        text: "The SE has completed direct discovery",
      },
      {
        key: "demo-problem",
        text: "The business problem is understood",
      },
      {
        key: "demo-champion",
        text: "A champion or accountable stakeholder is involved",
      },
    ],
  },
  {
    id: "play-architecture-review",
    name: "Architecture Review",
    description:
      "A technical design conversation with the people who will own risk and integration.",
    typicalStages: ["Validate"],
    prerequisites: [
      {
        key: "arch-risks",
        text: "Technical risks have been identified",
      },
    ],
  },
  {
    id: "play-workshop",
    name: "Workshop",
    description:
      "A structured working session to map a use case onto the product with the buying team in the room.",
    typicalStages: ["Evaluate", "Propose"],
    prerequisites: [
      {
        key: "workshop-agenda",
        text: "Success criteria and attendees are confirmed",
      },
    ],
  },
  {
    id: "play-poc",
    name: "Proof of Concept",
    description:
      "A time-boxed evaluation against agreed success criteria. Occurs late by design.",
    typicalStages: ["Prove"],
    prerequisites: [
      {
        key: "poc-criteria",
        text: "The customer has agreed to success criteria",
      },
    ],
  },
]

export const UNDEFINED_SECURITY_LABEL = "Security questionnaire walkthrough"
