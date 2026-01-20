# Draft Slack AI Update

Draft an update message for the broader organization about Developer AI Pod work.

## Arguments

- `$ARGUMENTS` - A Notion document URL or ID that contains the content for this update

## Instructions

You are helping draft a Slack message to share updates from the Developer AI Pod with the broader organization. These messages announce new tools, features, or capabilities that the team has built to improve developer workflows.

### Step 1: Read the Notion Document

First, fetch and read the provided Notion document to understand the content of this update:

```
Notion URL/ID: $ARGUMENTS
```

Use the Notion MCP tools to fetch the full content of this document. This is your primary source material.

### Step 2: Gather Additional Context

Ask the user if they have any additional source materials to incorporate:

**Potential additional sources:**

- Local files or code examples
- Other documentation or Notion pages
- Slack threads with relevant context
- Screenshots or demos
- Related PRs or commits

Use the AskUserQuestion tool to ask:
"Do you have any additional source materials to include in this update? (e.g., code examples, Slack threads, screenshots, other docs)"

If they provide additional sources, read/fetch those as well.

### Step 3: Draft the Message

Using the gathered content, draft a Slack message following the tone and structure of these reference examples from the Developer AI Pod:

---

**Reference Example 1 - Tool Announcement (AI-Powered Changelogs):**

> As teams grow, AI improves, and we're generally shipping more across the board, it's tough to keep up with what -- _exactly_ -- is in a given release! So, @ai-pod has created a small internal tool to help you out: :page_with_curl: **AI-Powered Changelogs in GitHub Actions**
>
> **TLDR:**
> Pre-configured GitHub Actions that...
>
> - :claude: use Claude to generate a changelog between any 2 refs! Use our default prompt, or customize to whatever you'd like
> - :rocket: take the changelog and send it to a Slack channel and/or a Notion database of your choosing
>
> Respond in this thread or drop by #pod-dev-ai with any questions/comments/feedback!

---

**Reference Example 2 - Tool Announcement (MCP Configuration):**

> Connecting MCPs to Claude Code (and Cursor!) is powerful, but having too many connected leads to rapid context filling and, subsequently, a degraded experience!
>
> - :white_check_mark: Cursor shows warnings around this (i.e. you have too many MCPs and tools connected)
> - :no_entry_sign: Claude Code does not
>
> So, we've created a small tool that lets you easily enable/disable MCP servers in Claude Code -- check it out! **Configuring MCPs in your Claude Code Chats**

---

**Reference Example 3 - Multi-Tool Announcement with Thread Structure (GitHub Actions Workflows):**

_Main message (channel post):_

> As we continue shipping AI-powered developer tools, @ai-pod has 3 new GitHub Actions workflows from `ai-toolkit` ready for your repos! See :thread: for more...

_Thread reply 1 (TLDR):_

> **Note:** `ai-toolkit` is currently private, meaning its _shared GitHub Actions workflows can only be used by repos within Uniswap that are also private_. We're **actively working on making it public**, as we know many of Uniswap's repos are already public, themselves!
>
> :unicorn_face: :unicorn_face: :unicorn_face:
>
> **TLDR:**
> Pre-configured GitHub Actions that uses Claude to...
>
> - :robot_face: review your PRs with inline comments and formal GitHub reviews
> - :clipboard: autonomously implement Linear tasks and create draft PRs (that are then reviewed by :claude: )
> - :memo: generate PR titles and descriptions following your repo's patterns

_Thread reply 2 (Details with linked Notion docs):_

> **1. Claude PR Reviews**
> Automated code reviews that run on every PR push -- Claude analyzes your changes and submits formal GitHub reviews (APPROVE/REQUEST_CHANGES/COMMENT) with inline comments, just like a human reviewer. Also features a single standard comment on the PR that's updated (edited) with each subsequent formal review, reducing PR clutter!
>
> **2. Automatic Claude Task Assistant (alpha)**
> Delegate routine Linear tasks to Claude. Scope out a Linear task, add a `claude` label, and add a GitHub Actions workflow to your repo. It will autonomously do its best to address the issue, resulting in a draft PR synced with Linear + no human required.
>
> **3. Generate PR Title & Description**
> Automatically generates (and updates on PR changes) conventional commit-style PR titles and comprehensive PR descriptions by analyzing your code changes and learning from your repo's commit history.
>
> :unicorn_face: :unicorn_face: :unicorn_face:
>
> If you have interest in adding these to your repos (hopefully, you do!), **message us and we'll get the ball rolling** :basketball:.
>
> Questions/comments/feedback welcome :handshake:.

---

### Message Structure Guidelines

Based on the reference examples, your message should follow this structure:

1. **Opening Hook**: Start with context about the problem or opportunity (1-2 sentences that frame why this matters)

2. **Attribution**: Mention "@ai-pod" as the team behind this work

3. **Main Announcement**: Link to the Notion doc with a bolded title, preceded by a relevant emoji like :page_with_curl:

4. **TLDR Section** (if applicable): A bolded "TLDR:" followed by bullet points with emojis summarizing key features/benefits

5. **Call to Action**: End with an invitation to engage - respond in thread or visit #pod-dev-ai for questions/feedback

6. **Footer (Required)**: Always include a link to the entrypoint doc for newcomers:

   ```
   :books: New to Claude Code? Start here: <URL|How to Claude Code at Uniswap>
   ```

### Format Considerations

- **Single tool/feature**: Use a single message format (Examples 1 & 2)
- **Multiple tools/features**: Consider using a thread structure with a teaser in the main channel message and details in the thread (Example 3)
- **Numbered lists with Notion links**: When announcing multiple related items, use numbered bold headers that link to individual Notion docs

### Tone Guidelines

- **Conversational but professional**: Write like you're talking to colleagues, not writing formal documentation
- **Problem-first framing**: Lead with the problem being solved, not the solution
- **Humble and helpful**: Position tools as "small internal tools to help you out" rather than grand announcements
- **Inclusive**: Encourage feedback and questions
- **Emoji usage**: Use relevant emojis sparingly to highlight key points (:claude:, :rocket:, :page_with_curl:, :white_check_mark:, :no_entry_sign:, :robot_face:, :clipboard:, :memo:, :unicorn_face:, :basketball:, :handshake:, etc.)
- **Unicorn separators**: Use `:unicorn_face: :unicorn_face: :unicorn_face:` as visual section dividers for longer messages

### Footer Guidelines

Every message MUST include a footer that links to the canonical "How to Claude Code at Uniswap" entrypoint document. This ensures newcomers always have a clear path to comprehensive resources.

**Footer Format:**

```text
:books: New to Claude Code? Start here: <https://www.notion.so/uniswaplabs/How-to-Claude-Code-at-Uniswap-2ccc52b2548b80e69413cb3b060191ed|How to Claude Code at Uniswap>
```

**Placement:**

- **Single messages**: Add the footer as the last line, after the call to action
- **Thread structures**: Add the footer at the end of the LAST thread reply (not every reply)

**Purpose:**

This footer serves as the canonical entrypoint for anyone new to Claude Code at the company. It links to the comprehensive guide maintained by the Dev AI team that covers:

- Getting started with Claude Code
- Recommended tools and configurations
- AI Toolkit components and their quick start guides
- Best practices and workflows

### Step 4: Present the Draft

Present the drafted message to the user and ask for feedback. Be ready to iterate based on their input.

If the update involves multiple tools/features, ask whether they prefer:

1. A single comprehensive message
2. A thread structure (teaser + detailed replies)

### Step 5: Final Output

Once approved, provide the final message ready to copy-paste into Slack, formatted with proper Slack markdown (bold with `*text*`, italic with `_text_`, links with `<URL|display text>`).

### Step 6: Send to Slack

After the user approves the final message, use the Slack MCP tools to post the message to the #ai-draft-messages channel:

- **Channel ID**: `C0A2G6GLVBP`
- **Channel URL**: <https://uniswapteam.enterprise.slack.com/archives/C0A2G6GLVBP>

Use `mcp__zencoder-slack__slack_post_message` with:

- `channel_id`: `C0A2G6GLVBP`
- `text`: The approved message content

If the update uses a thread structure (main message + thread replies), post the main message first, then use `mcp__zencoder-slack__slack_reply_to_thread` to add the thread replies using the `ts` (timestamp) from the main message response.

Confirm with the user before posting to Slack.
