---
description: Before opening a PR for a data-driven change (monitor threshold, alert routing/renotify, metric query, sampling rate, perf tweak), validate it against LIVE historical data — replay old-vs-new and report whether it actually achieves its goal. Refuses to ship (or redirects) when the data disproves the premise.
argument-hint: [what you're about to change + the metric/signal it should move]
allowed-tools: Bash(*), Read(*), Grep(*), Glob(*), Task(*), AskUserQuestion(*)
---

# Backtest a change before you PR it

Validate a **data-driven change against real historical data before opening the PR** — and be willing to abandon or redirect the approach when the data says it won't work. This is the gate that stops a plausible-but-ineffective change from shipping.

Use it for any change whose success is measurable: monitor thresholds, alert routing / re-notify cadence, metric/log/trace queries, sampling rates, cache TTLs, rate limits, autoscaling params, or a perf optimization with a latency/throughput target.

## Inputs

Parse `$ARGUMENTS` for: the change you intend to make (and the file(s) if known), and the **goal** it should achieve (what metric/signal should move, in which direction, by how much). If the goal isn't stated, ask for it — a backtest is meaningless without a target.

## The discipline (why this exists)

A change that *looks* right is not the same as a change the data supports. The common failure is shipping a fix whose premise is wrong — the real driver was something else, so the metric never moves. Catch that **before** the PR, not in a post-merge validation.

## Workflow

1. **State the hypothesis precisely.** "Changing X will move metric M from ~A to ~B because C." Write it down. If you can't name the metric and the expected direction, stop and clarify.

2. **Find the authoritative data source** and respect sampling:
   - **Metrics** (Datadog `*`, `trace.*`, CloudWatch) are ~100% — use these to count rates/volumes/percentiles.
   - **Metrics** (standard Datadog metrics, `trace.*`, CloudWatch) are ~100% — use these to count rates/volumes/percentiles.
   - For alert/page/incident questions, pull the alert system's own event history (e.g. incident.io alerts), not a proxy.

3. **Pull a representative window** (typically 7–30 days; long enough to include the conditions the change targets).

4. **Replay old logic vs new logic over that same window.** Compute concrete deltas: old **N** vs new **M** — alerts fired, pages, error rate, p95, cost, rows, whatever the goal metric is. For threshold/monitor changes, evaluate both the old and the new condition against the historical series and count transitions. Identify *which groups/series* change, not just the aggregate.

5. **Classify the result:**
   - **EFFECTIVE** — data shows the change achieves the goal. Capture the old-vs-new numbers for the PR body.
   - **PARTIAL** — moves the metric but not enough / not for the cases that matter. Note the gap.
   - **INEFFECTIVE / PREMISE DISPROVED** — the data shows the real driver is elsewhere, or the change barely moves M. **Stop. Do not open the PR.** Report what the data actually shows and propose the lever that *would* work.

6. **Only if it holds up**, proceed to the change + PR, and put the backtest in the PR body: the hypothesis, the window, old-vs-new numbers, and a link to the live dashboard/query (prefer a link over stale typed numbers).

## Output

A short backtest report:
- **Hypothesis** and goal metric.
- **Window + data source** (and any sampling caveat applied).
- **Old vs new** with hard numbers and which groups changed.
- **Verdict** (EFFECTIVE / PARTIAL / INEFFECTIVE) + recommendation. If INEFFECTIVE, the alternative lever.

## Principles

- Backtest **before** acting; never claim a change works without replaying data.
- Be willing to **reverse** — a disproved premise is a successful backtest, not a failure.
- Prefer **dashboard/query links** over typed numbers that go stale.
- When the change spans owners (e.g. an external-config change + a repo change), say which half the data supports and which is out of scope.
