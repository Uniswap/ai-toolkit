# Datadog Cost Tracker — Known Gotchas

Read this file before trusting any empty or anomalous result from a cost-tracker query.

---

## Gotcha 1: `env:prod` filter returns empty for Lambda/serverless services

**Symptom:** Querying `datadog.estimated_usage.logs.ingested_bytes` with `env:prod` returns zero
bytes for a service that is clearly running in production.

**Root cause:** Lambda and serverless services (e.g. `unirpc-v2`, `notification-service`) do not
emit the `env` tag on their log ingestion metrics. Filtering on `env:prod` silently drops all their
data rather than returning an error.

**Correct pattern:**

1. Omit the `env` filter entirely when querying ingestion metrics for serverless services.
2. Before trusting an empty result, call `get_datadog_metric_context` for the metric filtered to
   the service and check whether an `env` tag is present on that metric at all. If the tag is
   absent from the metric context, the `env:prod` filter is the cause of the empty result.
3. Re-run the query without the `env` filter to get the true ingestion volume.

**Note:** The general investigation instructions say "resolve the service tag before trusting an
empty result." This gotcha extends that guidance: also verify the `env` tag exists on the metric
before applying an env filter.

---

## Gotcha 2: Uniroute APM baseline is invalid before 2026-05-14

**Symptom:** Comparing `service:uniroute,env:prod` ingested-spans volume before and after
mid-May 2026 shows a ~22× jump, which looks like a severe regression.

**Root cause:** PRs #7996, #7510, and #7998 (deployed together on 2026-05-14) changed uniroute to
prefer `DD_ENV` over the legacy `ENV`/`ENVIRONMENT` environment variables. This tag normalization
caused the `service:uniroute,env:prod` series to consolidate traffic that was previously split
across multiple tag values. The 22× jump reflects data that was already being ingested but was
previously attributed to differently-tagged series — it is **not** a traffic increase.

**Correct pattern:**

- Any comparison that spans the 2026-05-14 deploy boundary for `service:uniroute` APM data must be
  marked **INCONCLUSIVE** in the report, not REGRESSION.
- Use a post-May-14 window as the new baseline for all uniroute APM cost analysis.
- If historical (pre-May-14) uniroute APM data is needed, query without the `env:prod` filter and
  sum across all env tag values, acknowledging that the series are not directly comparable.
