import { PageIntro } from "@/components/page-intro"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MethodologyPage() {
  return (
    <div className="space-y-6">
      <PageIntro kicker="Methodology" title="How this product judges evidence">
        Playbook Health applies these rules deterministically. It does not infer causes, and it
        does not ask a model to invent findings.
      </PageIntro>
      <Card>
        <CardHeader>
          <CardTitle>Units and formulas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>Activity volume counts sales activities. Outcome analysis uses unique opportunity × play pairs.</p>
          <p>Win rate is won ÷ (won + lost). Open opportunities are excluded.</p>
          <p>
            Exception rate is activities with at least one unmet snapshot ÷ analyzable defined
            activities.
          </p>
          <p>Cycle comparisons use medians on won opportunities only.</p>
          <p>
            Confidence is insufficient below 15 observations in either group, directional from 15
            to 39, and supported at 40 or more when the comparison also clears the statistical bar.
          </p>
          <p>
            Language stays associative: a prerequisite can be associated with a lower win rate. It
            does not cause the outcome.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
