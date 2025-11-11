# Aggregate People Team FAQs from Slack

Orchestrate the complete Slack FAQ aggregation workflow for the People Team: fetch messages from workplace support Slack channels (`#nyc-office`, `#nyc-office-lunch`, `support`), analyze them for questions using AI, deduplicate against the existing **Workplace Support FAQ Database** in Notion, and create new FAQ entries.

## Usage

```bash
/aggregate-people-team-faqs                           # Last 7 days (default)
/aggregate-people-team-faqs last 3 days               # Last 3 days
/aggregate-people-team-faqs 2025-11-01 to 2025-11-05  # Specific date range (5 days, inclusive)
```

## Input Parameters

**Time Range** (optional):

- **Default**: Last 7 days from today
- **Format 1**: `last N days` - where N is 1-7
- **Format 2**: `YYYY-MM-DD to YYYY-MM-DD` - specific date range (both dates inclusive)
- **Validation**: Range must not exceed 7 days
- **Error handling**: If range >7 days, stop and inform user
- **Note**: Date ranges are inclusive of both start and end dates. For example, "2025-11-01 to 2025-11-05" includes all messages from the entire day of Nov 1 through the entire day of Nov 5 (5 full days).

### Time Range Parsing

```typescript
function parseTimeRange(userInput) {
  if (!userInput || userInput.trim() === '') {
    // Default: last 7 days
    return {
      startTimestamp: Date.now() / 1000 - 7 * 24 * 60 * 60,
      endTimestamp: Date.now() / 1000,
      description: 'Last 7 days (default)',
    };
  }

  // Format 1: "last N days"
  const lastDaysMatch = userInput.match(/last (\d+) days?/i);
  if (lastDaysMatch) {
    const days = parseInt(lastDaysMatch[1]);
    if (days < 1 || days > 7) {
      throw new Error(`Invalid range: ${days} days. Range must be 1-7 days.`);
    }
    return {
      startTimestamp: Date.now() / 1000 - days * 24 * 60 * 60,
      endTimestamp: Date.now() / 1000,
      description: `Last ${days} days`,
    };
  }

  // Format 2: "YYYY-MM-DD to YYYY-MM-DD"
  const dateRangeMatch = userInput.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i);
  if (dateRangeMatch) {
    const startDate = new Date(dateRangeMatch[1]);
    const endDate = new Date(dateRangeMatch[2]);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error(`Invalid date format. Use YYYY-MM-DD to YYYY-MM-DD`);
    }

    // Set end date to end of day (23:59:59) to make it inclusive
    endDate.setHours(23, 59, 59, 999);

    // Check range doesn't exceed 7 days
    const rangeDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (rangeDays > 7) {
      throw new Error(`Range exceeds 7 days (${rangeDays.toFixed(1)} days). Maximum is 7 days.`);
    }

    if (rangeDays < 0) {
      throw new Error(`End date must be after start date`);
    }

    return {
      startTimestamp: startDate.getTime() / 1000,
      endTimestamp: endDate.getTime() / 1000,
      description: `${dateRangeMatch[1]} to ${dateRangeMatch[2]} (inclusive)`,
    };
  }

  throw new Error(`Invalid time range format. Use "last N days" or "YYYY-MM-DD to YYYY-MM-DD"`);
}

// Parse user input
const timeRange = parseTimeRange(userInput);
console.log(`Processing messages from: ${timeRange.description}`);
```

## Target Database

**Notion Database**: Workplace Support FAQ Database
**Database ID**: `287c52b2-548b-8071-8154-000b78b76809`

This command writes FAQ entries to the People Team's centralized Workplace Support FAQ Database in Notion. The database contains:

- **Question** (Title): The canonical form of the question
- **Answer** (Text): The answer to the question (auto-extracted from threads when possible)
- **Category** (Select): Process, Supplies, Facilities, Office, or null
- **Status** (Select): New, In Progress, Answered, Published
- **Source Channels** (Multi-select): Which Slack channels the question appeared in
- **Frequency** (Number): How many times this question was asked
- **Date Added** (Date): When the FAQ was added to the database
- **Last Used** (Select): How recently this question was asked
- **Example Messages** (Text): Sample questions from Slack showing how people ask this

## Target Slack Channels

This command monitors the following People Team workplace support channels:

- **#nyc-office** (ID: `CPUFYKWLE`): General NYC office questions and discussions
- **#nyc-office-lunch** (ID: `C022ZNC5NP5`): NYC office lunch-related questions
- **support** (ID: `C04681E2JQK`): General workplace support and IT questions

### MCP Retry Utility

MCP servers can occasionally time out or become temporarily unavailable. Use this retry utility to handle transient failures:

```typescript
/**
 * Retry an MCP tool call with exponential backoff
 * @param toolCall - The MCP tool call function to retry
 * @param toolName - Name of the tool for logging (e.g., "Slack MCP", "Notion MCP")
 * @param maxRetries - Maximum number of retry attempts (default: 2, so 3 total attempts)
 * @returns The result of the tool call
 */
async function retryMCP(toolCall, toolName, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s...
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(
          `[Retry ${attempt}/${maxRetries}] Waiting ${delayMs}ms before retrying ${toolName}...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      console.log(`[Attempt ${attempt + 1}/${maxRetries + 1}] Calling ${toolName}...`);
      const result = await toolCall();

      if (attempt > 0) {
        console.log(`✓ ${toolName} succeeded on retry ${attempt}`);
      }

      return result;
    } catch (error) {
      lastError = error;
      const errorMsg = error.message || String(error);

      // Check if this is a retryable error
      const isRetryable =
        errorMsg.includes('timeout') ||
        errorMsg.includes('timed out') ||
        errorMsg.includes('ECONNREFUSED') ||
        errorMsg.includes('ETIMEDOUT') ||
        errorMsg.includes('not available') ||
        errorMsg.includes('unavailable') ||
        errorMsg.includes('connection') ||
        errorMsg.includes('network') ||
        errorMsg.includes('503') ||
        errorMsg.includes('504') ||
        errorMsg.includes('500');

      if (!isRetryable) {
        // Non-retryable error (e.g., invalid parameters, permissions)
        console.log(`✗ ${toolName} failed with non-retryable error: ${errorMsg}`);
        throw error;
      }

      if (attempt === maxRetries) {
        // Final attempt failed
        console.log(`✗ ${toolName} failed after ${maxRetries + 1} attempts: ${errorMsg}`);
        throw new Error(
          `${toolName} failed after ${maxRetries + 1} attempts. Last error: ${errorMsg}`
        );
      }

      // Log retry-worthy error
      console.log(`⚠ ${toolName} failed (attempt ${attempt + 1}): ${errorMsg}`);
    }
  }

  throw lastError;
}

// Usage example:
// const messages = await retryMCP(
//   () => mcp__zencoder-slack__slack_get_channel_history({ channel_id: "C123", limit: 30 }),
//   "Slack MCP - channel history"
// );
```

**When to use `retryMCP`:**

- ✅ All Slack MCP calls (`slack_get_channel_history`, `slack_get_thread_replies`)
- ✅ All Notion MCP calls (`notion-search`, `notion-create-pages`)
- ✅ Any external service calls via MCP
- ❌ Local file operations (Read, Write, Edit)
- ❌ Task tool invocations (agents handle their own retries)

## Workflow Architecture

This workflow uses **direct custom agent orchestration** with parallel Slack message fetching for optimal performance and simplicity.

**Why This Architecture:**

- Custom agents in `.claude/agents/` are designed specifically for this workflow
- Slash commands can directly reference and execute custom agent logic
- Parallel MCP calls for Slack fetching improve performance
- No Task tool complexity - simpler and more maintainable

**Workflow Overview:**

```
Step 1: Fetch messages using slack-fetcher agent → Minimal, filtered messages
Step 2: Process agent results → Validated message array
Step 3: Analyze using slack-analyzer.md logic → Identified questions
Step 4: Cluster using question-extractor.md logic → Question clusters
Step 5: Fetch existing FAQs from Notion
Step 6: Deduplicate using deduplicator.md logic → Net-new questions
Step 7: Create Notion pages for net-new questions
```

## Workflow Steps

### Step 1: Fetch Slack Messages Using Specialized Agent

Use the `slack-fetcher` agent to fetch messages from all three channels with immediate field reduction to minimize token usage.

**Target Channels:**

- **#nyc-office**: Channel ID `CPUFYKWLE`
- **#nyc-office-lunch**: Channel ID `C022ZNC5NP5`
- **support**: Channel ID `C04681E2JQK`

**Fetch Strategy:**

Use the Task tool to invoke the slack-fetcher agent:

```typescript
// Invoke slack-fetcher agent
const messages = await Task({
  subagent_type: 'general-purpose',
  description: 'Fetch and filter Slack messages',
  prompt: `
You are the Slack Message Fetcher agent as defined in .claude/agents/slack-fetcher.md.

Fetch messages from the following Slack channels and return only minimal, essential fields:

Input:
${JSON.stringify(
  {
    channels: [
      { id: 'CPUFYKWLE', name: 'nyc-office' },
      { id: 'C022ZNC5NP5', name: 'nyc-office-lunch' },
      { id: 'C04681E2JQK', name: 'support' },
    ],
    limit_per_channel: 35,
    time_range: {
      start_timestamp: timeRange.startTimestamp,
      end_timestamp: timeRange.endTimestamp,
      description: timeRange.description,
    },
  },
  null,
  2
)}

Follow the agent instructions exactly:
1. Fetch messages from each channel using the Slack MCP tool
2. Filter by timestamp range
3. Remove bot messages
4. Reduce to essential fields only (text max 500 chars)
5. Return JSON array of minimal message objects

Return ONLY the JSON array, no additional explanation.
`,
});
```

**Message Limit**: Use 35 messages per channel (optimal balance)

**Why 35?**

- The slack-fetcher agent strips all heavy metadata immediately
- Raw fetch: ~15k-25k tokens per channel (50 messages with full metadata)
- After agent filtering: ~3k-5k tokens per channel (35 minimal messages)
- **60-70% token reduction** while maintaining coverage
- Covers 2-5 days in moderately active channels
- Agent's filtering happens in isolated context

### Step 2: Process Agent Results

The slack-fetcher agent returns pre-filtered, minimal message objects. Simply validate and log the results.

**Parse Agent Response:**

```typescript
// Parse the JSON array returned by the agent
const allMessages = JSON.parse(messages);
```

**Validate Results:**

```typescript
// Ensure we got an array
if (!Array.isArray(allMessages)) {
  throw new Error('Expected JSON array from slack-fetcher agent');
}

// Log results by channel
const channelStats = allMessages.reduce((stats, msg) => {
  const channel = msg.channel_name || msg.channel_id;
  stats[channel] = (stats[channel] || 0) + 1;
  return stats;
}, {});

console.log('Messages received from slack-fetcher agent:');
Object.entries(channelStats).forEach(([channel, count]) => {
  console.log(`  - #${channel}: ${count} messages`);
});
console.log(`  Total: ${allMessages.length} messages`);
```

**Expected Message Format:**

The agent returns messages already filtered and reduced to:

```typescript
{
  channel_id: string,        // "CPUFYKWLE"
  channel_name: string,      // "nyc-office"
  user: string,              // "U12345ABC"
  ts: string,                // "1730419281.123456"
  text: string,              // Max 500 chars, truncated if needed
  thread_ts: string | null,  // Thread parent timestamp
  reply_count: number,       // Number of replies
  has_thread: boolean        // True if has replies
}
```

**Note**: All filtering (timestamp, bots, empty messages) and field reduction has been performed by the agent. Messages are ready for analysis in Step 3.

### Step 3: Analyze Messages for Questions

Follow the logic defined in `.claude/agents/slack-analyzer.md` to identify genuine questions.

**Process**:

1. Read each message and determine if it contains a genuine question
2. Apply the qualification criteria from slack-analyzer.md:
   - Information requests, problem-solving queries, policy questions
   - Exclude: rhetorical questions, greetings, casual conversation
3. For messages with threads, note if the question appears answered
4. Assign confidence levels (high/medium/low)
5. Output structured JSON array of identified questions

**Expected output format**:

```json
[
  {
    "original_text": "...",
    "question_type": "information_request|problem_solving|policy|logistical|resource_location",
    "channel": "nyc-office",
    "channel_id": "CPUFYKWLE",
    "user": "U12345",
    "timestamp": "1762180881.619169",
    "thread_context": "Brief summary if applicable",
    "confidence": "high|medium|low",
    "notes": "Why this is/isn't a good FAQ candidate"
  }
]
```

### Step 4: Extract Canonical Forms and Cluster

Follow the logic defined in `.claude/agents/question-extractor.md` to cluster similar questions.

**Process**:

1. For each identified question, extract the canonical form:
   - Remove personal context ("I", "we", "today", names)
   - Generalize to be universally applicable
   - Use clear, professional language
2. Group semantically similar questions together
3. Calculate frequency (cluster size)
4. Gather metadata (source channels, confidence, examples)
5. Suggest categories based on content

**Expected output format**:

```json
[
  {
    "canonical_question": "How do I resolve issues accessing 1Password?",
    "suggested_category": "Process|Supplies|Facilities|Office|null",
    "frequency": 1,
    "source_channels": [{ "name": "support", "id": "C04681E2JQK" }],
    "confidence": "high",
    "example_messages": [
      {
        "text": "...",
        "user": "U12345",
        "timestamp": "...",
        "channel": "support"
      }
    ],
    "cluster_size": 1,
    "notes": "..."
  }
]
```

### Step 5: Fetch Existing FAQs from Notion

Query the Notion database to get all existing FAQ entries.

**IMPORTANT**: Use the correct data source ID (with hyphens) and wrap the call in `retryMCP` for reliability.

```typescript
const existingFAQs = await retryMCP(
  () =>
    mcp__notion__notion -
    search({
      // Workplace Support FAQ Database
      data_source_url: 'collection://287c52b2-548b-8071-8154-000b78b76809',
      query: '*',
    }),
  'Notion MCP - search existing FAQs'
);
```

**Correct Data Source ID**: `287c52b2-548b-8071-8154-000b78b76809` (Workplace Support FAQ Database - note the hyphens)

**Extract question text** from each result:

```typescript
const existingQuestions = existingFAQs.results.map((faq) => ({
  question: faq.title,
  category: extractPropertyFromHighlight(faq.highlight, 'Category'),
  status: extractPropertyFromHighlight(faq.highlight, 'Status'),
  source_channels: extractPropertyFromHighlight(faq.highlight, 'Source Channels'),
}));
```

### Step 6: Semantic Deduplication

Follow the logic defined in `.claude/agents/deduplicator.md` to identify net-new questions.

**Process**:

1. For each question cluster, compare against all existing Notion FAQs
2. Apply semantic matching:
   - Detect paraphrasing ("Where is X?" vs "Where can I find X?")
   - Detect synonyms ("cables" vs "cords")
   - Consider if existing FAQ covers the new question (even if worded differently)
3. Classify as NEW, DUPLICATE, or RELATED
4. Filter to only NEW questions with high/medium confidence

**Expected output format**:

```json
[
  {
    "new_question": "How do I resolve issues accessing 1Password?",
    "decision": "NEW",
    "confidence": "high",
    "reasoning": "No existing FAQ covers 1Password access troubleshooting",
    "matching_existing_question": null,
    "recommendation": "Add as new FAQ entry",
    "metadata": {
      "frequency": 1,
      "source_channels": [{"name": "support", "id": "C04681E2JQK"}],
      "suggested_category": "Process",
      "example_messages": [...]
    }
  }
]
```

**Filter**: Only include questions where `decision === "NEW" && (confidence === "high" || confidence === "medium")`

### Step 7: Create New FAQ Entries in Notion

For each net-new question, create a Notion page using the correct property format.

**Property Mapping** (with fixes applied and retry logic):

```typescript
const createdPages = await retryMCP(
  () =>
    mcp__notion__notion -
    create -
    pages({
      parent: {
        // Workplace Support FAQ Database
        data_source_id: '287c52b2-548b-8071-8154-000b78b76809',
      },
      pages: [
        {
          properties: {
            // TITLE PROPERTY
            Question: question.canonical_question,

            // TEXT PROPERTIES
            Answer: null,
            'Example Messages': formatExampleMessages(question.example_messages),

            // NUMBER PROPERTY (no trailing space)
            Frequency: question.frequency, // Number, not string

            // SELECT PROPERTIES (no trailing space)
            'Last Used': 'Weekly',
            Status: 'New',
            Category: question.suggested_category || null,

            // MULTI-SELECT PROPERTY (JSON string format)
            'Source Channels': JSON.stringify(question.source_channels.map((ch) => ch.name)), // e.g., "[\"nyc-office\",\"support\"]"

            // DATE PROPERTY
            'date:Date Added:start': new Date().toISOString().split('T')[0],
            'date:Date Added:is_datetime': 0,
          },
        },
      ],
    }),
  'Notion MCP - create FAQ pages'
);
```

**Note**: For creating multiple FAQs, you can batch them into a single `notion-create-pages` call (up to 100 pages), then wrap the entire batch operation in `retryMCP`.

**Format Example Messages**:

```typescript
function formatExampleMessages(examples) {
  return examples.map((ex) => `Asked in #${ex.channel}: "${ex.text}"`).join('\n');
}
```

### Step 3.5: Extract Answers from Thread Replies (NEW FEATURE)

For questions that have thread replies, attempt to automatically extract the answer.

**When to extract**:

- Question has `has_thread === true` and `reply_count > 0`
- Thread has 2-10 replies (sweet spot for answers)
- First reply is from a different user than the question asker

**Fetch thread replies**:

```typescript
if (question.has_thread) {
  const replies =
    (await mcp__zencoder) -
    slack__slack_get_thread_replies({
      channel_id: question.channel_id,
      thread_ts: question.thread_ts,
    });

  // Limit to first 10 replies
  const limitedReplies = replies.slice(0, 10);
}
```

**Answer Detection Patterns**:

Look for answer indicators in replies:

```typescript
const answerIndicators = [
  /^(it'?s|they'?re|you can find)/i, // Direct location answers
  /^(here'?s how|you (should|can|need to))/i, // Procedural answers
  /^(the .* is (in|on|at|located))/i, // Location answers
  /^(contact|reach out to|ask)/i, // Referral answers
  /^(yes|no), /i, // Definitive yes/no answers
];

function isPotentialAnswer(reply) {
  // Skip if same user as question asker (self-answering is rare)
  if (reply.user === question.user) return false;

  // Check for answer indicators
  const hasIndicator = answerIndicators.some((pattern) => pattern.test(reply.text));

  // Check for acknowledgment from original asker (confirms answer)
  const hasAcknowledgment = replies.some(
    (r) => r.user === question.user && /thank|got it|found|perfect|solved/i.test(r.text)
  );

  return hasIndicator || hasAcknowledgment;
}
```

**Extract Answer Text**:

```typescript
const potentialAnswers = limitedReplies.filter(isPotentialAnswer).slice(0, 3); // Take first 3 potential answers

if (potentialAnswers.length > 0) {
  // Combine answers with line breaks
  question.potential_answer = potentialAnswers.map((r) => r.text).join('\n\n');

  question.has_answer = true;
  question.answer_confidence = potentialAnswers.length >= 2 ? 'high' : 'medium';
}
```

**Answer Quality Guidelines**:

- **High confidence**: 2+ replies with answer indicators + acknowledgment from asker
- **Medium confidence**: 1 clear answer with indicator pattern
- **Low confidence**: Reply exists but unclear if it's an answer

**Include in question object**:

```json
{
  "original_text": "Where are spare HDMI cables?",
  "canonical_question": "Where are spare HDMI cables stored?",
  "potential_answer": "They're in the supply closet on the 3rd shelf",
  "has_answer": true,
  "answer_confidence": "high",
  ...
}
```

### Step 8: Report Summary

Provide comprehensive summary with metrics and findings.

**Summary Format**:

```
=== Slack FAQ Aggregation Report ===
Date: {CURRENT_DATE}
Time Window: Past 7 days

CHANNELS PROCESSED:
  ✓ #nyc-office: {X} messages scanned, {Y} questions identified
  ✓ #nyc-office-lunch: {X} messages scanned, {Y} questions identified
  ✓ support: {X} messages scanned, {Y} questions identified

ANALYSIS RESULTS:
  - Total messages scanned: {TOTAL}
  - Bot messages filtered: {COUNT}
  - Human messages analyzed: {COUNT}
  - Questions identified: {COUNT}
  - Questions with auto-extracted answers: {COUNT}
  - After clustering: {COUNT} clusters
  - Existing FAQs checked: {COUNT}
  - Duplicates filtered: {COUNT}
  - Net-new FAQs created: {COUNT}

NEW FAQS ADDED:
  1. {Question} (Frequency: {X}, Channels: {list})
     - Answer: {Auto-filled / Manual needed}
     - URL: {NOTION_URL}
  2. ...

QUESTIONS WITH AUTO-ANSWERS:
  1. {Question} - Answer extracted from thread (confidence: high/medium)
  2. ...

DUPLICATES SKIPPED:
  1. "{New question}" → Already covered by "{Existing FAQ}"
  2. ...
```

## Error Handling

### MCP Retry Logic

**All MCP tool calls MUST use the `retryMCP` utility** (defined earlier in this document) to handle transient failures:

- **Slack MCP**: Timeouts, connection issues, rate limits
- **Notion MCP**: Timeouts, 503/504 errors, temporary unavailability
- **Automatic retry**: Up to 3 total attempts (initial + 2 retries)
- **Exponential backoff**: 1s, 2s delays between retries
- **Smart error detection**: Only retries transient errors, not logical errors

**Example**:

```typescript
const faqs = await retryMCP(
  () => mcp__notion__notion - search({ data_source_url: '...', query: '*' }),
  'Notion MCP - search FAQs'
);
```

### Partial Failure Tolerance

- **If 1-2 Slack channels fail**: Continue with successful channels, log warnings
- **If Notion creation fails for some FAQs**: Log errors, continue creating others
- **If answer extraction fails**: Fall back to null answer, continue workflow
- **If MCP fails after 3 attempts**: Move to critical failure handling

### Critical Failures (Stop Workflow)

Stop execution and report to user if:

- All Slack channels fail to fetch (after retries)
- Notion database cannot be queried (after retries)
- No questions identified at all (may indicate data issue)
- Invalid date range or configuration parameters

## Edge Cases

### 1. Empty Channels

- Log: "Channel had no messages in 7-day window"
- Continue with other channels

### 2. All Duplicates

- Report: "All questions already exist in FAQ database"
- Don't create any pages (this is valid)

### 3. Ambiguous Answers in Threads

- If multiple conflicting answers: Don't auto-fill, leave null
- If answer is unclear: Leave null, flag for manual review

### 4. Very Long Thread Answers

- Truncate answers >500 chars to first 400 chars + "... [See full thread]"
- Include thread URL for reference

## Notes

- Custom agents are referenced directly - no Task tool needed
- Parallel Slack fetching for speed
- Answer extraction is best-effort - fallback to null is fine
- Property names corrected (no trailing spaces per Notion fix)
