# Product assumptions

These decisions are part of the Playbook Iterator rebuild. They are documented so the analytics and UI stay interviewable.

## Product

- The working product name is Playbook Iterator. It is a decision-support tool for Sales Engineering leaders, not a CRM dashboard.
- The application is single-tenant and has no authentication in this version. Admin is a navigation area, not a permissioned role.
- Opportunity and activity data would come from a CRM or activity platform in a real deployment. This version uses a replaceable demo source plus CSV import. There is no live third-party integration.
- The UI identifies demo data when the workspace was seeded from the development dataset.

## Playbook

- A sales play is a defined type of SE activity. Prerequisites are treated equally; there is no required versus recommended classification.
- There is no exception-reason library. An exception is simply an activity where at least one prerequisite was marked Not Met.
- Editing a play or its prerequisites writes a new immutable version. Historical activities keep the version and prerequisite snapshot captured at the time.
- Plays with historical activity are retired, never permanently deleted.
- An undefined play is an activity that does not map to a formal definition. Mapping or formalizing it later does not invent prerequisite results.

## Analytics

- Activity volume counts sales activities.
- Play-level outcome analysis uses unique opportunity × play pairs. Repeated executions count in volume once each, but the opportunity is counted once. The pair is an exception if any execution of that play on that opportunity had an unmet prerequisite.
- Prerequisite-level comparisons use unique opportunity × play × prerequisite key observations, with the same any-unmet rule.
- Win rate is won ÷ (won + lost). Open opportunities are excluded.
- Exception rate is activities with at least one unmet snapshot ÷ analyzable (defined) activities. Undefined activities are excluded from that denominator.
- Sales cycle is opportunity created date to close date. Cycle comparisons use won opportunities and medians.
- Remaining cycle after a play is the first activity of that play on the opportunity to the won close date.
- Stage is a filter and a visible caveat. Plays are not ranked across typical stages.
- Confidence: insufficient if either comparison group has fewer than 15 unique observations; directional if both have 15–39; supported if both have at least 40 and the comparison clears the statistical threshold.
- Action classes (Enforce, Revisit, Investigate, Define, Monitor) are produced by deterministic analysis. AI may prioritize and explain them. It must not invent them or calculate metrics.

## Persistence

- Local development uses file SQLite under `data/`.
- Vercel uses Turso through `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` over HTTP.
- Schema changes are additive forward migrations. Existing predecessor tables, if present, are left untouched.
- Demo seed runs only when the new schema has no plays or activities.
