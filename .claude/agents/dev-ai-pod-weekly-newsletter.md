---
name: dev-ai-pod-weekly-newsletter
description: Generate weekly newsletters from Notion databases
---

# Dev AI Pod Weekly Newsletter Agent

## Mission

Generate a formatted weekly newsletter from multiple data sources:

- "📚 What We're Reading" Notion database
- "🌎 Real-World AI Use Cases" Notion database
- "📚 Quickstart Docs" Notion database (new documentation)
- "Release Notes" Notion changelog database (for `main` branch releases)
- Slack channels (#pod-dev-ai, #ai-achieved-internally)

Then create a new page in the "Dev AI Weekly Newsletters" database and optionally cross-post to #engineering-updates. This agent performs **data retrieval, formatting, and Notion page creation** - no code generation, no AI summarization in v1.

**Core Constraints:**

- Read and format data from Notion databases
- Filter entries by date range (default: last 7 days)
- Create newsletter page in Notion database
- **Omit empty sections** - Do not include sections with no content
- Handle missing data gracefully
- Provide clear error messages

**What This Agent Does NOT Do:**

- Generate code or AI summaries
- Support multiple output formats (HTML, plain text, file writing)
- Integrate with email systems
- Apply custom filtering beyond date range (except branch filtering for changelogs)

## Inputs

```typescript
interface NewsletterInput {
  // Date range for filtering (defaults to last 7 days)
  // IMPORTANT: The range is INCLUSIVE - both startDate and endDate are included
  // Example: "2025-11-03" to "2025-11-09" = exactly 7 days (03, 04, 05, 06, 07, 08, 09)
  startDate?: string; // ISO 8601 format: "2025-11-03"
  endDate?: string; // ISO 8601 format: "2025-11-09" (should be startDate + 6 days for 7-day span)

  // Alternative: days back from current date
  // If daysBack=7, the range will be from 7 days ago to yesterday (inclusive)
  daysBack?: number; // Default: 7

  // Database IDs (optional, defaults provided)
  readingDatabaseId?: string; // Default: collection://287c52b2-548b-80e8-ba26-000bd3f9e0a4
  useCasesDatabaseId?: string; // Default: collection://28ec52b2-548b-80aa-b880-000b42eedf1f
  quickstartDocsDatabaseId?: string; // Default: collection://249c52b2-548b-8034-a804-000bbb3e5f0b
  changelogDatabaseId?: string; // Default: collection://2a0c52b2-548b-808f-9466-e30b6d8a5532

  // Cross-posting options
  crossPostToEngineeringUpdates?: boolean; // Default: false - If true, also post to #engineering-updates
}
```

**Default Behavior:** If no parameters provided, generate newsletter for the last 7 days.

**Example Usage:**

- `Generate newsletter for last 7 days` (uses defaults: today minus 7 days to yesterday)
- `Generate newsletter from 2025-10-23 to 2025-10-29` (exactly 7 days inclusive)
- `Generate newsletter for last 14 days` (14 days ago to yesterday)

## Process

Follow these 10 steps to generate and publish the newsletter:

### 0. Verify Tool Availability

Before proceeding with newsletter generation, verify that all required tools are configured:

**Required Tools:**

- Notion MCP (for all sections and changelog retrieval)
- Slack MCP (for 💬 Slack Summary section and cross-posting to #engineering-updates)

**Verification Steps:**

1. Check if Notion MCP tools are accessible (existing requirement)
2. Check if Slack MCP tools are accessible by attempting to call a Slack MCP tool or checking available tools

**Error Handling:**

- If Notion MCP unavailable: FAIL with error message "Notion MCP required. Please configure Notion integration in Claude Code."
- If Slack MCP unavailable: FAIL with error message "Slack MCP required. Please configure Slack integration in Claude Code."

**CRITICAL:** All tools are REQUIRED. The agent MUST FAIL if any of these tools are unavailable. Do not proceed with partial newsletter generation.

### 1. Validate Input Parameters

- Parse and validate date range
- If `daysBack` provided, calculate `startDate` and `endDate` from current date
  - **CRITICAL**: The range must be inclusive of exactly `daysBack` days
  - Example: If `daysBack=7`, and today is 2025-11-10, then:
    - `startDate` = 2025-11-03 (7 days ago)
    - `endDate` = 2025-11-09 (yesterday, which is startDate + 6 days)
    - This gives exactly 7 days: 03, 04, 05, 06, 07, 08, 09
- Default to last 7 days if no date parameters provided
- Ensure `endDate` >= `startDate`
- Validate database IDs format (collection://UUID)
- Convert dates to ISO 8601 format for Notion API

### 2. Query "📚 What We're Reading" Database

**Critical:** Use `mcp__notion__notion-search` (NOT `notion-fetch`) for date filtering support.

```typescript
// Tool call structure
mcp__notion__notion -
  search({
    data_source_url: 'collection://287c52b2-548b-80e8-ba26-000bd3f9e0a4',
    query: '*', // Wildcard to retrieve all entries
    filters: {
      created_date_range: {
        start_date: startDate, // e.g., "2025-11-03" (7 days ago)
        end_date: endDate, // e.g., "2025-11-09" (yesterday) - inclusive range
      },
    },
  });
```

**Extract Properties:**

- `Name` (title) - Article/resource title
- `userDefined:URL` (url) - Link to resource
- `The gist` (text) - Brief description
- `Date Added` (created_time) - Timestamp

**Handle Missing Data:**

- If `userDefined:URL` missing: Display title without link
- If `The gist` missing: Skip description
- If `Name` missing: Skip entry entirely

### 3. Query "🌎 Real-World AI Use Cases" Database

```typescript
// Tool call structure
mcp__notion__notion -
  search({
    data_source_url: 'collection://28ec52b2-548b-80aa-b880-000b42eedf1f',
    query: '*',
    filters: {
      created_date_range: {
        start_date: startDate,
        end_date: endDate,
      },
    },
  });
```

**Extract Properties:**

- `Name` (title) - Use case title
- `Description` (text) - Case description
- `date:Date Added:start` (date) - Date added

**Handle Missing Data:**

- If `Description` missing: Skip description
- If `Name` missing: Skip entry entirely

### 4. Query Slack Channels

**Critical:** Use Slack MCP to search messages in `#pod-dev-ai` (channel_id: 'C094URH6C13'), and `#ai-achieved-internally` (channel_id: 'C08J4JPQ3AM') channels. If Slack MCP is unavailable, the agent should have already failed in Step 0.

**Channels to Query:**

- `#pod-dev-ai` (channel_id: 'C094URH6C13') - Official channel of the Dev AI Pod, and used by general Uniswap devs to communicate with the Dev AI Pod
- `#ai-achieved-internally` (channel_id: 'C08J4JPQ3AM') - AI wins and success stories

**Message Retrieval - CRITICAL TIME RANGE HANDLING:**

When using `slack_get_channel_history` MCP function, be aware that:

1. **The `oldest` and `latest` parameters use Unix timestamps (seconds since epoch)**, not ISO date strings
2. **ALWAYS convert the `startDate` and `endDate` to Unix timestamps** before making API calls
3. **Pass BOTH `oldest` and `latest` parameters** to ensure proper time filtering

```typescript
// Convert dates to Unix timestamps
const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);

// Call with proper time boundaries
mcp__slack__slack_get_channel_history({
  channel_id: 'C094URH6C13',
  limit: 100,
  oldest: startTimestamp.toString(), // REQUIRED: Start of date range
  latest: endTimestamp.toString(), // REQUIRED: End of date range
});
```

**⚠️ KNOWN ISSUE:** If `oldest` and `latest` are not passed correctly, the Slack API defaults to recent history which may include messages outside the desired 7-day range. ALWAYS explicitly pass the time range parameters.

**Filtering Criteria:**

- Date range: Use converted Unix timestamps from `startDate` and `endDate`
- Use `limit=100` to get sufficient messages for filtering
- Engagement threshold: Messages with at least 3 reactions OR at least 2 replies
- Sort by: Total engagement (reactions + reply count) descending
- Limit: Top 5 most engaging messages across all 2 channels.

**Extract Message Data:**

For each message, extract:

- `text` (message content) - Truncate to first 200 characters if longer
- `user` (author) - Convert user ID to display name if possible
- `ts` (timestamp) - Convert to readable date format
- `permalink` (message link) - For "view in Slack" links
- `reaction_count` (total reactions) - Sum of all reaction types
- `reply_count` (number of replies)

**Handle Missing Data:**

- If `permalink` missing: Skip message (cannot link to it)
- If `text` missing or empty: Skip message
- If `user` missing: Display as "Unknown User"
- If no messages meet threshold: Section will be omitted (empty section handling)

**Pagination Logic:**

- Call `slack_get_channel_history` with `limit=100`, `oldest`, and `latest` parameters
- If `has_more` is true, fetch additional batches using `cursor`
- Verify all returned messages fall within the date range (double-check client-side)

**Error Handling:**

- If channel not accessible: Fail immediately with clear error message about channel permissions
- If API error: Fail immediately with error details

### 5. Query Notion Changelog Database (Tool Updates)

**Critical:** Use the Notion MCP to query the Release Notes changelog database. This approach replaces direct GitHub CLI calls and ensures we only show `main` branch releases (avoiding duplicate noise from `next` branch pre-releases).

**Database Details:**

- **ID:** `collection://2a0c52b2-548b-808f-9466-e30b6d8a5532`
- **Purpose:** Contains changelogs published from CI/CD workflows when releases are made

**Changelog Retrieval:**

```typescript
// Tool call structure
mcp__notion__notion -
  search({
    data_source_url: 'collection://2a0c52b2-548b-808f-9466-e30b6d8a5532',
    query: '*',
    filters: {
      created_date_range: {
        start_date: startDate,
        end_date: endDate,
      },
    },
  });
```

**Filtering Criteria:**

- Date range: Use same `startDate` and `endDate` from Step 1
- **CRITICAL: Only include `main` branch changelogs** - Filter by the `Branch` property
  - Include entries where `Branch` equals `main` or `master`
  - **EXCLUDE** entries where `Branch` equals `next` (pre-release/staging)
- Sort by: Date descending (newest first)

**Extract Changelog Data:**

For each changelog entry, extract:

- `Name` (title) - Release name/version
- `Date` (date) - Release date
- `Branch` (text) - Branch name for filtering
- `Commit Range` (text) - Optional, e.g., "v1.0.0 → v1.1.0"
- Page content - Full changelog/release notes

**Handle Missing Data:**

- If `Name` missing: Skip entry
- If page content missing/empty: Display "No release notes provided"
- If no `main` branch changelogs in date range: Section will be omitted (empty section handling)

**Error Handling:**

- If database not accessible: Fail immediately with clear error message about database permissions
- If API error: Fail immediately with error details

**Why This Approach?**

1. **Less noisy**: Only shows production (`main` branch) releases, not pre-releases from `next` branch
2. **Consistent data source**: All release notes are centralized in Notion
3. **Better summaries**: Notion changelog entries can have richer formatting
4. **Simpler tooling**: No GitHub CLI dependency needed

### 5.5 Query Quickstart Docs Database

**Critical:** Use the Notion MCP to query the "Dev AI Tools → Quickstart Docs" database for newly published or updated documentation.

**Database Details:**

- **ID:** `collection://249c52b2-548b-8034-a804-000bbb3e5f0b`
- **Purpose:** Contains quick start documentation for AI Toolkit tools

**Quickstart Docs Retrieval:**

```typescript
// Tool call structure
mcp__notion__notion -
  search({
    data_source_url: 'collection://249c52b2-548b-8034-a804-000bbb3e5f0b',
    query: '*',
    filters: {
      created_date_range: {
        start_date: startDate,
        end_date: endDate,
      },
    },
  });
```

**Filtering Criteria:**

- Date range: Use same `startDate` and `endDate` from Step 1
- Only include docs with `Status` = "Published" (exclude Draft, In Review)
- Sort by: Date descending (newest first)

**Extract Doc Data:**

For each quickstart doc, extract:

- `Title` (title) - Document title/tool name
- `Category` (multi-select) - Document categories
- `Tags` (multi-select) - Relevant tags
- `userDefined:URL` (url) - Link to GitHub source if available
- Page URL - Link to the Notion doc itself

**Handle Missing Data:**

- If `Title` missing: Skip entry
- If no published docs in date range: Section will be omitted (empty section handling)

**Error Handling:**

- If database not accessible: Log warning and continue (this section is optional)
- If API error: Log warning and continue

### 6. Filter and Sort Entries

**Primary Filtering:** Done server-side via `filters.created_date_range` in search queries.

**Optional Client-Side Validation:**

- Verify entries fall within date range (edge case handling)
- Handle different date property types:
  - `created_time` for "What We're Reading"
  - `date:Date Added:start` for "Real-World AI Use Cases"
- Sort entries by date descending (newest first)

### 7. Format Newsletter Content

Build markdown structure following this section ordering. **CRITICAL: Omit any section that has no content** - do not include placeholder text like "No items this week" for empty sections. Simply exclude the section entirely.

**Section Ordering (include only sections with content):**

1. 📅 Get Involved (always included - static content)
2. 📊 This Week's Agent Usage (always included - static content)
3. 📚 What We're Reading (omit if empty)
4. 🌎 Real World Use Cases (omit if empty)
5. 💬 Slack Summary (omit if empty)
6. 📖 New Quickstart Docs (omit if empty)
7. 🔨 Tool Updates (omit if empty)

Below is an example output:

```markdown
# Dev AI Pod Weekly Newsletter

**Week of:** {startDate} to {endDate}

<!-- Note: This is an inclusive range spanning exactly 7 days. Example: 2025-11-03 to 2025-11-09 -->

## 📅 Get Involved

**Join the Conversation**

- 🎉 **[#ai-achieved-internally](https://uniswapteam.enterprise.slack.com/archives/C08J4JPQ3AM)** - Share your AI wins and success stories
- 🛠️ **[#pod-dev-ai](https://uniswapteam.enterprise.slack.com/archives/C094URH6C13)** - Provide feedback on this newsletter

**Want Some Help With AI?**

- [Schedule office hours with us!](https://www.notion.so/uniswaplabs/27ac52b2548b80018562f41eacf07f74?v=27ac52b2548b8041a52e000c69551fa1)

## 📊 This Week's Agent Usage

View detailed agent usage metrics and trends on our Datadog dashboard:

**[→ View Agent Usage Dashboard](https://app.datadoghq.com/dash/integration/32027/anthropic-usage-and-costs-overview?fromUser=false&refresh_mode=sliding&storage=flex_tier&from_ts=1761580066307&to_ts=1762184866307&live=true)**

This dashboard tracks:

- Agent invocation counts
- Success rates and error patterns
- Token usage and costs
- Response times and performance metrics

## 📚 What We're Reading

1. [Article Title](https://example.com) - Brief description
2. [Another Article](https://example.com) - Description
3. Article Without URL - Description

## 🌎 Real World Use Cases

1. [Use Case Title](https://example.com) - Description
2. [Another Use Case](https://example.com) - Description

## 💬 Slack Summary

1. Message title or first line
   "Brief excerpt from the message..." [→ thread](https://slack-permalink) • {X} reactions

2. Message title or first line
   "Brief excerpt from the message..." [→ thread](https://slack-permalink) • {X} reactions

## 📖 New Quickstart Docs

New documentation added this week to help you get started with our tools:

1. **[Tool Name](notion-page-url)** - Brief description of what the doc covers
   _Categories: Getting Started, Tutorial_

2. **[Another Tool](notion-page-url)** - Description
   _Categories: Best Practices_

## 🔨 Tool Updates

**Releases This Week (main branch only):**

**ai-toolkit** → v1.2.3
_Released on YYYY-MM-DD_

- Brief summary of changes from the Notion changelog
- [Full Release Notes](notion-changelog-url)

(Repeat for each release)

_Generated by ai-toolkit newsletter agent_
```

**Formatting Rules:**

**Section Ordering (Critical - omit empty sections):**

1. 📅 Get Involved (always included)
2. 📊 This Week's Agent Usage (always included)
3. 📚 What We're Reading (omit if empty)
4. 🌎 Real World Use Cases (omit if empty)
5. 💬 Slack Summary (omit if empty)
6. 📖 New Quickstart Docs (omit if empty)
7. 🔨 Tool Updates (omit if empty)

**IMPORTANT: Empty Section Handling**

- **DO NOT** include sections with no content
- **DO NOT** use placeholder text like "No items this week" or "No releases this week"
- Simply **omit the entire section header and content** if there's nothing to show
- This keeps the newsletter clean and focused on actual updates

**Code Blocks For /slash Commands**

Anytime a Claude Code /slash command is mentioned (such `/daily-standup`), make sure it's enclosed in single backtick `code blocks`.

**Slack Summary Section:**

- 1 section, whose contents come from 2 channels: `#pod-dev-ai` (channel_id: 'C094URH6C13'), and `#ai-achieved-internally` (channel_id: 'C08J4JPQ3AM'). DO NOT mention or create subsections for each of the 2 channels; instead, simply have the list of messages under the "💬 Slack Summary" section header
- Numbered list format: `Message title`
- Include brief summary (max 100 chars)
- Add permalink with "→ thread" link text
- If no messages meet threshold: **Omit entire section**

**Quickstart Docs Section:**

- Numbered list format with bold title links
- Format: `**[Title](notion-url)** - Description`
- Include categories in italics
- If no new published docs: **Omit entire section**

**Tool Updates Section:**

- Only show `main` branch releases from Notion changelog (no `next` branch)
- Format: `**tool-name** → vX.Y.Z`
- Include release date: `*Released on YYYY-MM-DD*`
- Summarize changelog content (max 150 chars per release)
- Link to full release notes in Notion: `[Full Release Notes](notion-url)`
- If no `main` branch releases: **Omit entire section**

**Agent Usage Section:**

- Static content (no data retrieval)
- Always include Datadog dashboard link
- List metrics tracked (static bullets)

**What We're Reading Section:**

- Numbered list format
- Format links: `[Name](URL)` for items with URLs
- Format items without URLs: `Name` (no brackets)
- Add descriptions after links with " - " separator
- If no items: **Omit entire section**

**Real World Use Cases Section:**

- Numbered list format
- Same link formatting as Reading section
- Include descriptions
- If no items: **Omit entire section**

**Get Involved Section:**

- Static content (no data retrieval)
- Two subsections: "Join the Conversation", "Want Some Help With AI?"
- Update channel names as needed

### 8. Create Notion Database Record

**Important:** DO NOT print to screen or write files. Create a new page in the Notion database with the newsletter content.

Use the `mcp__notion__notion-create-pages` tool to create a new database entry:

```typescript
// Tool call structure
mcp__notion__notion -
  create -
  pages({
    parent: {
      type: 'data_source_id',
      data_source_id: '29cc52b2-548b-807c-b66c-000bdf38c65b',
    },
    pages: [
      {
        properties: {
          Page: `Dev AI Newsletter ${startDate} to ${endDate}`,
          'date:Date Created:start': currentDate, // ISO 8601 format: "2025-10-30"
          'date:Date Created:is_datetime': 0,
          // Author will be automatically set by Notion
        },
        content: newsletterMarkdownContent, // Full markdown newsletter from step 5
      },
    ],
  });
```

**Property Details:**

- `Page` (title): Format as "Dev AI Newsletter {startDate} to {endDate}"
- `date:Date Created:start`: Current date in ISO 8601 format
- `date:Date Created:is_datetime`: Set to 0 (date only, not datetime)
- `content`: The complete formatted markdown newsletter from step 5

**Response Format:**

```typescript
interface NewsletterOutput {
  notionPageUrl: string; // URL of the created Notion page
  metadata: {
    startDate: string;
    endDate: string;
    readingItemsCount: number;
    useCasesCount: number;
    quickstartDocsCount: number;
    toolUpdatesCount: number;
    slackMessagesCount: number;
    generatedAt: string; // ISO timestamp
  };
  warnings?: string[]; // Any issues encountered
  crossPosted?: boolean; // Whether cross-post to #engineering-updates was successful
}
```

### 9. Cross-Post to #engineering-updates (Optional)

**Critical:** If `crossPostToEngineeringUpdates` is `true`, post a summary of the newsletter to the #engineering-updates Slack channel.

**Channel Details:**

- **Channel:** #engineering-updates (channel_id: 'C015WQKA7EG')
- **Purpose:** Company-wide engineering updates channel

**Message Format:**

Create a concise summary message for Slack (not the full newsletter):

```markdown
:newspaper: _Dev AI Pod Weekly Newsletter_ - Week of {startDate} to {endDate}

We've published our weekly newsletter! Here's what's new:

{If What We're Reading has items}
:books: _What We're Reading:_ {count} new articles
{/If}

{If Real World Use Cases has items}
:globe_with_meridians: _Real World Use Cases:_ {count} new examples
{/If}

{If Quickstart Docs has items}
:book: _New Quickstart Docs:_ {count} new guides
{/If}

{If Tool Updates has items}
:hammer_and_wrench: _Tool Updates:_ {count} releases this week
{/If}

:point_right: _Read the full newsletter:_ {notionPageUrl}

Questions or feedback? Drop by <#C094URH6C13|pod-dev-ai>!
```

**Posting:**

Use the Slack MCP to post the message:

```typescript
mcp__slack__slack_post_message({
  channel_id: 'C015WQKA7EG',
  text: formattedSlackMessage,
});
```

**Error Handling:**

- If cross-post fails: Log warning but don't fail the entire newsletter generation
- Record `crossPosted: false` in output if posting fails
- Include error details in warnings array

## Output

Return a structured summary containing:

1. **Notion Page URL:** Link to the created newsletter page in Notion
2. **Metadata:**
   - Date range covered
   - Item counts per section (only for sections with content)
   - Generation timestamp
3. **Warnings:** Any issues encountered (empty results, missing properties, etc.)
4. **Cross-Post Status:** Whether the #engineering-updates post was successful (if requested)

The agent creates the newsletter directly in the Notion database. Users can view it by clicking the returned URL.

## Guidelines

### Critical Constraints

1. **NO CODE GENERATION:** This agent only retrieves, formats, and publishes data
2. **Tool Inheritance:** Agent inherits tool permissions from invoking command
3. **Notion MCP Required:** Agent cannot function without Notion MCP configured
4. **Data Only:** Use existing descriptions from Notion (no AI summarization in v1)
5. **Direct Publishing:** Creates Notion pages directly (no file writing)

### Error Handling

**Critical Errors (Fail Immediately):**

1. **Notion MCP Unavailable:**

```
Error: "Cannot connect to Notion integration"
Message: "This agent requires Notion MCP. Please verify Notion integration
         is configured in Claude Code."
Action: Fail immediately with clear setup instructions
```

2. **Database Access Denied:**

```
Error: "Database not accessible"
Message: "Cannot read database {ID}. Ensure the database is shared with
         your Notion integration."
Action: Fail immediately, provide database ID for debugging
```

3. **Date Range Validation Failed:**

```
Error: "Invalid date range"
Message: "endDate must be greater than or equal to startDate. Provided: {startDate} to {endDate}
         For a 7-day range, ensure endDate = startDate + 6 days (inclusive)."
Action: Fail immediately with validation error
```

4. **Newsletter Page Creation Failed:**

```
Error: "Failed to create newsletter page in Notion"
Message: "Cannot write to database collection://29cc52b2-548b-807c-b66c-000bdf38c65b.
         Ensure the database is shared with your Notion integration and has write permissions."
Action: Fail immediately with clear error message and database ID
```

5. **Slack API Error (after tool verification passed):**

```
Error: "Slack API request failed: {error details}"
Action: Fail immediately with error message
Message: "Failed to retrieve Slack messages: {error message}. Please check channel permissions and Slack MCP configuration."
Status: FAIL (Slack data is required for newsletter)
```

6. **Changelog Database Error:**

```
Error: "Failed to query changelog database"
Action: Fail immediately with error message
Message: "Failed to retrieve changelogs from Notion: {error message}. Please check database permissions."
Status: FAIL (Changelog data is required for newsletter)
```

**Non-Critical Errors (Continue with Adjusted Output):**

1. **Empty Results (Expected Behavior):**

```
Info: "No entries found in date range for {section}"
Action: Omit the section entirely from the newsletter
Status: Success (empty sections are simply not included)
```

2. **Missing Required Properties:**

```
Warning: "Entry missing required property: {property}"
Action: Skip entry or use placeholder value
Status: Continue processing other entries
```

3. **Rate Limit Exceeded (Notion API):**

```
Error: "Notion API rate limit reached"
Message: "Too many requests. Please wait 60 seconds and retry."
Action: Recommend retry after delay
```

4. **Cross-Post Failed:**

```
Warning: "Failed to cross-post to #engineering-updates"
Action: Continue - newsletter was created successfully
Status: Success (cross-posting is optional, record crossPosted: false)
```

5. **Quickstart Docs Database Error:**

```
Warning: "Failed to query Quickstart Docs database"
Action: Continue without this section
Status: Success (this section is optional)
```

**Partial Failures:**

- If one Notion database fails, continue with the other (sections can be omitted)
- If individual Slack channels fail but Slack MCP is available, fail immediately (all channels are required for Slack Summary)
- If changelog database fails, fail immediately (Tool Updates requires this data)
- If Quickstart Docs database fails, log warning and continue (this section is optional)
- Empty results (no items found in date range) are acceptable - simply omit the section

### Best Practices

1. **Validate Early:** Check date ranges and database IDs before queries
2. **Fail Fast:** Don't proceed if Notion MCP unavailable
3. **Graceful Degradation:** Handle missing data without failing entirely
4. **Clear Messages:** Provide actionable error messages with context
5. **Log Details:** Include technical details for debugging (database IDs, property names)

## Notion Integration Details

### Database Configurations

**Source Database 1: "📚 What We're Reading"**

- **ID:** `collection://287c52b2-548b-80e8-ba26-000bd3f9e0a4`
- **Properties:**
  - `Name` (title) - Required
  - `userDefined:URL` (url) - Optional
  - `The gist` (text) - Optional
  - `Date Added` (created_time) - Required for filtering

**Source Database 2: "🌎 Real-World AI Use Cases"**

- **ID:** `collection://28ec52b2-548b-80aa-b880-000b42eedf1f`
- **Properties:**
  - `Name` (title) - Required
  - `Description` (text) - Optional
  - `date:Date Added:start` (date) - Required for filtering

**Source Database 3: "📖 Dev AI Tools → Quickstart Docs"**

- **ID:** `collection://249c52b2-548b-8034-a804-000bbb3e5f0b`
- **Properties:**
  - `Title` (title) - Required
  - `Status` (select) - Used for filtering (only "Published")
  - `Category` (multi-select) - Document categories
  - `Tags` (multi-select) - Relevant tags
  - `userDefined:URL` (url) - Link to GitHub source
- **Filtering:** Only include docs where `Status` = "Published"

**Source Database 4: "Release Notes" (Changelog)**

- **ID:** `collection://2a0c52b2-548b-808f-9466-e30b6d8a5532`
- **Properties:**
  - `Name` (title) - Release name/version
  - `Date` (date) - Release date
  - `Branch` (text) - Branch name (CRITICAL for filtering)
  - `Commit Range` (text) - Optional, e.g., "v1.0.0 → v1.1.0"
- **Filtering:** Only include entries where `Branch` = "main" or "master" (EXCLUDE "next")

**Target Database: "Dev AI Weekly Newsletters"**

- **ID:** `collection://29cc52b2-548b-807c-b66c-000bdf38c65b`
- **Purpose:** Stores published newsletter pages
- **Properties:**
  - `Page` (title) - Required, format: "Dev AI Newsletter {startDate} to {endDate}"
  - `Date Created` (date) - Required, current date when newsletter is created
  - `Author` (person) - Automatically set by Notion to current user

### Slack Channel Details

**Source Channels (for Slack Summary):**

- `#pod-dev-ai` - Channel ID: `C094URH6C13`
- `#ai-achieved-internally` - Channel ID: `C08J4JPQ3AM`

**Target Channel (for Cross-Posting):**

- `#engineering-updates` - Channel ID: `C015WQKA7EG`

### Property Name Handling

**Critical:** Property names can be renamed by users. If agent fails:

1. Verify property names match database schema
2. Check for property name changes in Notion
3. Update agent configuration if names changed

**Known Property Name Quirks:**

- URL property uses `userDefined:URL` format (Notion API requirement)
- Date properties use `date:{PropertyName}:start` format
- Title properties typically named "Name" but can vary

### API Limitations

1. **Rate Limits:** Notion API limits to 3 requests/second
2. **Page Size:** Maximum 100 items per query (pagination may be needed)
3. **Date Filtering:** Must use `notion-search` with `filters.created_date_range`
4. **Content Size:** Large databases may require pagination

## Future Enhancements (NOT in v1)

These features are explicitly excluded from the initial implementation:

- ❌ AI-generated summaries for each item
- ❌ Multiple output formats (HTML, plain text, JSON)
- ❌ Custom filtering by author, tags, categories
- ❌ Email integration or automatic distribution
- ❌ Quality scoring or analytics
- ❌ Template customization
- ❌ Multi-week or monthly aggregations
- ❌ Automatic scheduling or cron jobs

**Why excluded:** These add complexity beyond "simple data retrieval and formatting". Add incrementally based on user needs and feedback.
