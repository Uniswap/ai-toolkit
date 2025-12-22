---
name: dev-ai-pod-weekly-newsletter
description: Generate weekly newsletters from Notion databases
---

# Dev AI Pod Weekly Newsletter Agent

## Mission

Generate a formatted weekly newsletter from two Notion databases: "📚 What We're Reading" and "🌎 Real-World AI Use Cases", then create a new page in the "Dev AI Weekly Newsletters" database. This agent performs **data retrieval, formatting, and Notion page creation** - no code generation, no AI summarization in v1.

**Core Constraints:**

- Read and format data from Notion databases
- Filter entries by date range (default: last 7 days)
- Create newsletter page in Notion database
- Handle missing data gracefully
- Provide clear error messages

**What This Agent Does NOT Do:**

- Generate code or AI summaries
- Support multiple output formats (HTML, plain text, file writing)
- Integrate with email systems
- Apply custom filtering beyond date range

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

  // Dry run mode - if true, format newsletter but skip all writes (Notion and Slack)
  // The formatted newsletter will be output to console instead
  dryRun?: boolean; // Default: false

  // Slack channel IDs to READ messages from for the Slack Summary section (comma-separated)
  // Example: "C094URH6C13,C08J4JPQ3AM"
  slackReadChannelIds?: string; // Default: "C094URH6C13,C08J4JPQ3AM"

  // Slack channel IDs to POST the newsletter announcement to (comma-separated)
  // Example: "C091XE1DNP2" or "C091XE1DNP2,C094URH6C13"
  slackPostChannelIds?: string; // Default: "C091XE1DNP2"

  // Database IDs (optional, defaults provided)
  readingDatabaseId?: string; // Default: collection://287c52b2-548b-80e8-ba26-000bd3f9e0a4
  useCasesDatabaseId?: string; // Default: collection://28ec52b2-548b-80aa-b880-000b42eedf1f

  // GitHub repositories for release tracking (optional)
  githubRepositories?: string[]; // e.g., ['https://github.com/Uniswap/ai-toolkit', 'https://github.com/Uniswap/spec-workflow-mcp']
}
```

**Default Behavior:** If no parameters provided, generate newsletter for the last 7 days.

**Example Usage:**

- `Generate newsletter for last 7 days` (uses defaults: today minus 7 days to yesterday)
- `Generate newsletter from 2025-10-23 to 2025-10-29` (exactly 7 days inclusive)
- `Generate newsletter for last 14 days` (14 days ago to yesterday)

## Process

Follow these 9 steps to generate and publish the newsletter:

### 0. Verify Tool Availability

Before proceeding with newsletter generation, verify that all required tools are configured:

**Required Tools:**

- Notion MCP (for all sections)
- Slack MCP (for 💬 Slack Summary section)
- GitHub CLI `gh` (for 🔨 Tool Updates section)

**Verification Steps:**

1. Check if Notion MCP tools are accessible (existing requirement)
2. Check if Slack MCP tools are accessible by attempting to call a Slack MCP tool or checking available tools
3. Check if GitHub CLI `gh` is installed and authenticated by running `gh auth status` via Bash

**Error Handling:**

- If Notion MCP unavailable: FAIL with error message "Notion MCP required. Please configure Notion integration in Claude Code."
- If Slack MCP unavailable: FAIL with error message "Slack MCP required. Please configure Slack integration in Claude Code."
- If GitHub CLI unavailable or not authenticated: FAIL with error message "Github CLI required. Run `gh auth login` to authenticate."

**CRITICAL:** All three tools are REQUIRED. The agent MUST FAIL if any of these tools are unavailable. Do not proceed with partial newsletter generation.

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

**Critical:** Use Slack MCP to search messages in the channels specified by the `slackReadChannelIds` parameter. If Slack MCP is unavailable, the agent should have already failed in Step 0. When using the `slack_get_channel_history` MCP function, always use a limit of 10.

**Channels to Query:**

Use the `slackReadChannelIds` parameter (comma-separated string of channel IDs). If not provided, default to `C094URH6C13,C08J4JPQ3AM`.

**Default channel reference (for documentation purposes):**

- `C094URH6C13` = `#pod-dev-ai` - Official channel of the Dev AI Pod
- `C08J4JPQ3AM` = `#ai-achieved-internally` - AI wins and success stories

**Processing Multiple Channels:**

1. Split `slackReadChannelIds` by comma to get an array of channel IDs
2. Trim whitespace from each channel ID
3. Query each channel for messages within the date range
4. Combine results from all channels for filtering and sorting

**Message Retrieval:**

Use Slack MCP search functionality to retrieve messages from these channels within the date range.

**Filtering Criteria:**

- Date range: Use same `startDate` and `endDate` from Step 1
- Use a limit = 10 in the `slack_get_channel_history`
- Engagement threshold: Messages with at least 3 reactions OR at least 2 replies
- Sort by: Total engagement (reactions + reply count) descending
- Limit: Top 5 most engaging messages across all queried channels.

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
- If no messages meet threshold: Display "No significant discussions this week"

**Pagination Logic:**

- Call `slack_get_channel_history` with `limit=10`
- Check the timestamp of the last message received
- If last message timestamp > `endDate`, fetch next batch
- Repeat until last message timestamp <= `endDate` OR no more messages available
- Filter messages by `startDate` and `endDate` after fetching

**Error Handling:**

- If channel not accessible: Fail immediately with clear error message about channel permissions
- If API error: Fail immediately with error details

### 5. Query GitHub Releases

**Critical:** Use GitHub CLI (`gh`) to list releases for specified repositories. This step requires GitHub CLI (verified in Step 0). If GitHub CLI is unavailable or not authenticated, the agent should have already failed in Step 0.

**Repositories to Query:**

Use repositories from `githubRepositories` input parameter. If not provided, use exactly these 2: 'Uniswap/ai-toolkit' and 'Uniswap/spec-workflow-mcp'

**Release Retrieval:**

For each repository, run the following GitHub CLI command via Bash:

```bash
gh release list --repo <owner/repo> --limit 10 --json tagName,publishedAt,name,url,body
```

Example:

```bash
gh release list --repo Uniswap/ai-toolkit --limit 10 --json tagName,publishedAt,name,url,body
```

**Filtering Criteria:**

- Date range: Filter releases where `publishedAt` falls within `startDate` and `endDate`
- Only show important user-facing releases: For `Uniswap/ai-toolkit`, DO NOT SHOW `next` releases; but do show `latest` releases.
- Sort by: Published date descending (newest first)

**Extract Release Data:**

For each release, extract:

- `name` (release name) - Use this as primary display title
- `tagName` (version tag) - e.g., "v1.2.3"
- `publishedAt` (timestamp) - Convert to YYYY-MM-DD format
- `url` (release URL) - Link to full release notes on GitHub
- `body` (changelog/description) - Truncate to first 150 characters if longer

**Handle Missing Data:**

- If `name` missing: Use `tagName` as fallback
- If `body` missing or empty: Display "No release notes provided"
- If `url` missing: Skip release (cannot link to it)
- If no releases in date range: Display "No releases this week"

**Error Handling:**

- If repository not found: Fail immediately with clear error message listing the invalid repository
- If API rate limit exceeded: Fail immediately with rate limit error and retry instructions

### 6. Filter and Sort Entries

**Primary Filtering:** Done server-side via `filters.created_date_range` in search queries.

**Optional Client-Side Validation:**

- Verify entries fall within date range (edge case handling)
- Handle different date property types:
  - `created_time` for "What We're Reading"
  - `date:Date Added:start` for "Real-World AI Use Cases"
- Sort entries by date descending (newest first)

### 7. Format Newsletter Content

Build markdown structure following this section ordering:

1. 📅 Get Involved
2. 📊 This Week's Agent Usage
3. 📚 What We're Reading
4. 🌎 Real World Use Cases
5. 💬 Slack Summary
6. 🔨 Tool Updates

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

1. Message title or first line
   "Brief excerpt from the message..." [→ thread](https://slack-permalink) • {X} reactions

## 🔨 Tool Updates

**Releases This Week:**

**[Repository Name]** → v1.2.3
_Released on YYYY-MM-DD_

- Brief changelog or description (truncated to 150 chars)
- [Full Release Notes](github-release-url)

(Repeat for each release)

_Generated by ai-toolkit newsletter agent_
```

**Formatting Rules:**

**Section Ordering (Critical):**

1. 📅 Get Involved
2. 📊 This Week's Agent Usage
3. 📚 What We're Reading
4. 🌎 Real World Use Cases
5. 💬 Slack Summary
6. 🔨 Tool Updates

**Code Blocks For /slash Commands**

Anytime a Claude Code /slash command is mentioned (such /daily-standup), make sure it's enclosed in single backtick `code blocks`.

**Slack Summary Section:**

- 1 section, whose contents come from the channels specified in `slackReadChannelIds`. DO NOT mention or create subsections for each channel; instead, simply have the list of messages under the "💬 Slack Summary" section header
- Numbered list format: `Message title`
- Include brief summary (max 100 chars)
- Add permalink with "→ thread" link text
- If no messages: Display "No significant discussions this week"

**Tool Updates Section:**

- Group by repository
- Format: `**[Repository Name]** → vX.Y.Z`
- Include release date: `*Released on YYYY-MM-DD*`
- Bulleted changelog (max 150 chars per release)
- Link to full release notes: `[Full Release Notes](url)`
- If no releases: Display "No releases this week"

**Agent Usage Section:**

- Static content (no data retrieval)
- Always include Datadog dashboard link
- List metrics tracked (static bullets)

**What We're Reading Section:**

- Numbered list format
- Format links: `[Name](URL)` for items with URLs
- Format items without URLs: `Name` (no brackets)
- Add descriptions after links with " - " separator
- If no items: Display "No new items this week"

**Real World Use Cases Section:**

- Numbered list format
- Same link formatting as Reading section
- Include descriptions
- If no items: Display "No new items this week"

**Get Involved Section:**

- Static content (no data retrieval)
- Three subsections: "Join the Conversation", "Upcoming Events", "Have an AI use case to share?"
- Update channel names and event times as needed

### 8. Create Notion Database Record

**DRY RUN CHECK:** If `dryRun` is `true`, skip this step and Step 9. Instead:

- Write the formatted newsletter markdown to `/tmp/newsletter-preview.md`
- Output the newsletter content to console as well
- Display a summary of what WOULD have been published
- Exit with success status

**File Output (dry run only):**

```bash
# Write newsletter to file for artifact upload
cat > /tmp/newsletter-preview.md << 'EOF'
{newsletter markdown content}
EOF
```

The workflow will upload this file as a downloadable GitHub Actions artifact.

**Normal Mode (dryRun is false or not provided):**

Create a new page in the Notion database with the newsletter content.

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

### 9. Post Newsletter Announcement to Slack

**DRY RUN CHECK:** If `dryRun` is `true`, this step was already skipped in Step 8.

**Normal Mode (dryRun is false or not provided):**

After successfully creating the Notion page, post an announcement to Slack to notify the team.

**Channels to Post:**

Use the `slackPostChannelIds` parameter (comma-separated string of channel IDs).

- Default: `C091XE1DNP2` (if not provided)
- Example: `C091XE1DNP2,C094URH6C13` posts to both channels

**Processing Multiple Channels:**

1. Split `slackPostChannelIds` by comma to get an array of channel IDs
2. Trim whitespace from each channel ID
3. Post the same message to each channel
4. Track success/failure for each channel

**Message Format:**

For each channel ID, use the Slack MCP `slack_post_message` tool:

```typescript
// For each channelId in slackPostChannelIds.split(','):
slack_post_message({
  channel_id: channelId.trim(),
  text: `📰 *Dev AI Newsletter is out!*\n\n*Week of:* ${startDate} to ${endDate}\n\n📖 Read the full newsletter: ${notionPageUrl}\n\n_Highlights this week:_\n• ${readingItemsCount} reading items\n• ${useCasesCount} real-world use cases\n• Top Slack discussions\n• Latest tool updates`,
});
```

**Message Content:**

- Newsletter title with emoji
- Date range covered
- Direct link to Notion page
- Brief summary of content counts
- Call to action to read

**Error Handling:**

- If Slack post fails for one channel: Log warning, continue posting to remaining channels
- If ALL channels fail: Log warning but do NOT fail the entire workflow
- The Notion page was already created successfully - that's the primary deliverable
- Report individual channel failures in the output warnings

## Output

**Response Format:**

```typescript
interface NewsletterOutput {
  notionPageUrl: string; // URL of the created Notion page
  slackPosts: {
    // Status of Slack posts per channel
    channelId: string;
    success: boolean;
    messageTs?: string; // Slack message timestamp (if posted)
    error?: string; // Error message if failed
  }[];
  metadata: {
    startDate: string;
    endDate: string;
    readingItemsCount: number;
    useCasesCount: number;
    slackChannelsAttempted: number;
    slackChannelsSucceeded: number;
    generatedAt: string; // ISO timestamp
  };
  warnings?: string[]; // Any issues encountered
}
```

Return a structured summary containing:

1. **Notion Page URL:** Link to the created newsletter page in Notion
2. **Slack Status:** Whether announcement was posted successfully
3. **Metadata:**
   - Date range covered
   - Item counts per section
   - Generation timestamp
4. **Warnings:** Any issues encountered (empty results, missing properties, Slack post failure, etc.)

The agent creates the newsletter directly in the Notion database and posts an announcement to Slack. Users can view the newsletter by clicking the returned URL.

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

6. **GitHub CLI Error (after tool verification passed):**

```
Error: "GitHub CLI request failed: {error details}"
Action: Fail immediately with error message
Message: "Failed to retrieve GitHub releases: {error message}. Please verify repository access and GitHub CLI authentication."
Status: FAIL (GitHub data is required for newsletter)
```

**Non-Critical Errors (Continue with Adjusted Output):**

1. **Empty Results (Not an Error):**

```
Warning: "No entries found in date range"
Action: Return newsletter with "No new items this week" for empty sections
Status: Success (display empty section message, not a failure)
```

6. **Missing Required Properties:**

```
Warning: "Entry missing required property: {property}"
Action: Skip entry or use placeholder value
Status: Continue processing other entries
```

7. **Rate Limit Exceeded (Notion API):**

```
Error: "Notion API rate limit reached"
Message: "Too many requests. Please wait 60 seconds and retry."
Action: Recommend retry after delay
```

**Partial Failures:**

- If one Notion database fails, continue with the other (Reading or Use Cases sections can be empty)
- If individual Slack channels fail but Slack MCP is available, fail immediately (all channels are required)
- If individual GitHub repositories fail but GitHub CLI is available, fail immediately (all repositories are required)
- Empty results (no items found in date range) are acceptable - display "No new items this week"

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

**Target Database: "Dev AI Weekly Newsletters"**

- **ID:** `collection://29cc52b2-548b-807c-b66c-000bdf38c65b`
- **Purpose:** Stores published newsletter pages
- **Properties:**
  - `Page` (title) - Required, format: "Dev AI Newsletter {startDate} to {endDate}"
  - `Date Created` (date) - Required, current date when newsletter is created
  - `Author` (person) - Automatically set by Notion to current user

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
