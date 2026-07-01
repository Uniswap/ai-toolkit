---
description: Track and analyze Datadog ingestion costs using estimated_usage metrics. Use when the user asks "what is our Datadog spend", "how much are we ingesting in Datadog", "find the top log ingesters", "break down Datadog costs by service", "why is our Datadog bill high", or "compare APM span ingestion before and after a deploy". Always consult the gotchas reference before trusting empty query results.
allowed-tools: Task(mcp__datadog__*), Read, Glob
model: sonnet
---

# Datadog Cost Tracker

Analyze Datadog ingestion costs across logs, APM spans, and other estimated-usage metrics, broken down by service. Flags services with anomalous growth and surfaces actionable reduction opportunities.

## When to Activate

- User wants to understand current Datadog spend or ingestion volume
- User wants to identify top log or APM ingesters
- User is comparing ingestion before and after a deploy
- User sees an unexpected spike in Datadog costs and needs root cause

## Steps

1. **Clarify scope** — confirm the time window (default: last 7 days) and which signal types to include (logs, APM spans, custom metrics, or all).

2. **Read the gotchas reference first** — before issuing any queries, read `references/gotchas.md` in this skill directory. Empty results are often caused by known pitfalls (missing env tag, post-deploy baseline shifts) rather than zero actual ingestion.

3. **Query estimated-usage metrics** — via the Datadog MCP server, query the estimated-usage metrics grouped by the `service` tag: `datadog.estimated_usage.logs.ingested_bytes` for log ingestion and `datadog.estimated_usage.apm.ingested_spans` for APM span ingestion. Confirm the exact metric names in your account's Metrics Explorer first — estimated-usage metric names vary by integration setup, and querying a name that does not exist returns empty rather than erroring.

4. **Validate service tags** — before concluding a service has zero ingestion, retrieve the metric's tag context (via the Datadog MCP server) filtered to that service. Confirm the service tag actually exists on the metric. If the tag is absent, the service may emit data under a different tagging scheme.

5. **Identify top contributors** — rank services by volume. Flag any service where volume increased >2× week-over-week.

6. **Check for baseline invalidity** — if comparing across a known tag-normalization deploy (see gotchas), mark affected comparisons as INCONCLUSIVE rather than REGRESSION or IMPROVEMENT.

7. **Report findings** — produce a ranked table of services with volume, cost estimate (if available), and week-over-week delta. Note any INCONCLUSIVE comparisons with the reason.

## Output Format

**Cost Summary** — total estimated ingestion for the period by signal type.

**Top Ingesters** — ranked table: service | volume | WoW delta | notes.

**Anomalies** — services with unusual growth, with evidence and likely cause.

**Inconclusive Comparisons** — queries that returned empty or whose baseline is invalid, with the reason (e.g., missing tag, post-normalization deploy).

**Recommendations** — actionable steps to reduce ingestion (sampling, exclusion filters, log-level tuning).

## Notes

- Requires Datadog MCP server configured in the uniswap-integrations plugin.
- See `references/gotchas.md` for known pitfalls that produce misleading empty results.
