import cronstrue from 'cronstrue'
import { CronExpressionParser } from 'cron-parser'

// Cron expression tools: a human-readable description (cronstrue) and the next
// scheduled runs (cron-parser). Both throw on an invalid expression.

export function describeCron(expr: string): string {
  return cronstrue.toString(expr, { throwExceptionOnParseError: true })
}

export function nextRuns(expr: string, count = 5): Date[] {
  const interval = CronExpressionParser.parse(expr)
  return Array.from({ length: count }, () => interval.next().toDate())
}
