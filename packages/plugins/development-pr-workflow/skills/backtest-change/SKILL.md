---
name: backtest-change
description: Validate a data-driven change against LIVE historical data before it ships — replay old-vs-new over a real window, report whether it achieves its goal, and refuse to ship when the data disproves the premise. Fires whenever someone proposes a measurable change and names a number — "add a monitor at 700MB", "set the threshold to N", "warn at X / critical at Y", "raise the timeout to 5s", "change the sampling rate", "tighten this alert", "this should reduce the noise" — and before opening any PR for a monitor threshold, alert routing or renotify cadence, metric/log/trace query, sampling rate, rate limit, autoscaling parameter, or a perf change with a latency or throughput target. Fires for a brand-new monitor, deploy gate, or alert just as it does for an edit to an existing one, including the joint replay of every condition in a composite (e.g. rate AND floor together). A proposed number is a hypothesis, not a decision — backtest it and let the data override it.
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion
model: opus
---

# Backtest a change before you ship it

Validate a **data-driven change against real historical data before opening the
PR** — and be willing to abandon or redirect the approach when the data says it
won't work. This is the gate that stops a plausible-but-ineffective change from
shipping.

Use it for any change whose success is measurable: monitor thresholds, alert
routing / re-notify cadence, metric/log/trace queries, sampling rates, cache
TTLs, rate limits, autoscaling params, or a perf optimization with a
latency/throughput target.

## When this fires without being asked

The most valuable case is the one nobody invokes deliberately: **someone hands
you a number.** "Add a monitor at 700 MB warn / 1.2 GB critical." "Set the
timeout to 5s." A named threshold arrives with an implicit claim attached — that
it separates the bad cases from the good ones. That claim is testable, and it is
often wrong, because the person proposing it has seen the incident population and
not the healthy population.

Treat a user-supplied number as a **hypothesis to test**, never as a
specification to implement. Then say plainly what the data did to it.

Worked example. A request arrived for a per-host memory monitor at "700 MB warn /
1.2 GB critical", motivated by two hosts that had OOM-wedged at a 2 GiB limit. A
30-day replay found a third host that had held **1.34–1.37 GB flat for ~21
consecutive hours with no incident** — so the proposed critical would have paged
continuously for most of a day. Shipped 1.6 GB instead. The warning was kept
exactly as proposed, because a *non-paging* tier is allowed to sit inside normal
range when its job is lead time. Both halves of that outcome came from the
backtest, not from the proposal.

## Inputs

You need: the change intended (and the file(s) if known), and the **goal** it
should achieve — which metric/signal should move, in which direction, by how
much. If the goal isn't stated, ask. A backtest is meaningless without a target.

When invoked as `/backtest-change`, parse `$ARGUMENTS` for the same two things.

## The discipline (why this exists)

A change that *looks* right is not the same as a change the data supports. The
common failure is shipping a fix whose premise is wrong — the real driver was
something else, so the metric never moves. Catch that **before** the PR, not in a
post-merge validation.

## Workflow

1. **State the hypothesis precisely.** "Changing X will move metric M from ~A to
   ~B because C." Write it down. If you can't name the metric and the expected
   direction, stop and clarify.

2. **Find the authoritative data source** and respect sampling:
   - **Metrics** (standard Datadog metrics, `trace.*`, CloudWatch) are ~100% —
     use these to count rates/volumes/percentiles.
   - Spans and logs are often heavily sampled on the success path; don't count
     volume from them.
   - For alert/page/incident questions, pull the alert system's own event history
     (e.g. incident.io alerts), not a proxy.
   - Beware aggregation defaults that hide the shape you're testing — e.g. a
     scalar query that silently averages a `max:` series returns avg-of-max and
     will understate peaks. Set the aggregator explicitly.

3. **Pull a representative window** (typically 7–30 days; long enough to include
   the conditions the change targets).

4. **Replay old logic vs new logic over that same window.** Compute concrete
   deltas: old **N** vs new **M** — alerts fired, pages, error rate, p95, cost,
   rows, whatever the goal metric is. For threshold/monitor changes, evaluate
   both the old and the new condition against the historical series and count
   transitions. Identify *which groups/series* change, not just the aggregate.
   For a brand-new monitor, "old" is 0 — say so explicitly rather than omitting it.
   For a composite (a gate combining, say, a rate condition and a traffic floor),
   replay the conditions *jointly* over the same window. Each one alone will fire
   on windows the composite would have suppressed, so per-condition counts
   overstate what the gate actually does.

5. **Separate the two populations.** The threshold's whole job is to divide
   incident from healthy. Report the highest *legitimate* value observed and the
   lowest *incident* value. If they overlap, the threshold cannot work at any
   setting and the signal itself needs to change — say that instead of picking a
   number in the overlap.

6. **Classify the result:**
   - **EFFECTIVE** — data shows the change achieves the goal. Capture the
     old-vs-new numbers for the PR body.
   - **PARTIAL** — moves the metric but not enough / not for the cases that
     matter. Note the gap.
   - **INEFFECTIVE / PREMISE DISPROVED** — the data shows the real driver is
     elsewhere, or the change barely moves M. **Stop. Do not open the PR.**
     Report what the data actually shows and propose the lever that *would* work.
   - **REVISED** — the goal is sound but the proposed number isn't. Ship the
     corrected value and state prominently what you changed and why.

7. **Only if it holds up**, proceed to the change + PR, and put the backtest in
   the PR body: the hypothesis, the window, old-vs-new numbers, and a link to the
   live dashboard/query (prefer a link over stale typed numbers).

## Output

A short backtest report:

- **Hypothesis** and goal metric.
- **Window + data source** (and any sampling caveat applied).
- **Old vs new** with hard numbers and which groups changed.
- **Population separation** — highest healthy value vs lowest incident value.
- **Verdict** (EFFECTIVE / PARTIAL / INEFFECTIVE / REVISED) + recommendation. If
  INEFFECTIVE, the alternative lever.

## Principles

- Backtest **before** acting; never claim a change works without replaying data.
- A user-supplied number is a hypothesis. Testing it is the job, not overriding
  the request — but when the data rejects it, say so and ship the corrected value.
- Be willing to **reverse** — a disproved premise is a successful backtest, not a
  failure.
- Prefer **dashboard/query links** over typed numbers that go stale.
- Distinguish tiers by consequence: a chatty non-paging warning can be
  acceptable; a chatty page destroys trust in the monitor.
- When the change spans owners (e.g. an external-config change + a repo change),
  say which half the data supports and which is out of scope.
