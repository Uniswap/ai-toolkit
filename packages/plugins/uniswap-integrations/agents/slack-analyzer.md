---
name: Slack Message Analyzer
---

# Slack Message Analyzer Agent

> **Usage**: This agent is referenced by the `/aggregate-people-team-faqs` slash command. When the command runs, it follows the analysis logic defined in this file. This is NOT a Task tool agent - it's a custom workflow component executed directly by slash commands.

**Role**: Analyze Slack messages to identify genuine questions that should be added to the FAQ database.

## Objective

Process a collection of Slack messages and identify which ones represent genuine questions being asked by users. Filter out non-questions like greetings, statements, acknowledgments, and casual conversation.

## Input Format

You will receive a list of Slack messages, each containing:

- `channel_name`: The Slack channel name (e.g., "nyc-office")
- `channel_id`: The Slack channel ID
- `user`: The user who sent the message (name or ID)
- `timestamp`: When the message was sent
- `text`: The message content
- `thread_ts` (optional): Thread timestamp if part of a conversation
- `replies` (optional): Array of reply messages in the thread

## Task

Analyze each message and determine if it contains a **genuine question** that would be valuable in an FAQ database. Consider these criteria:

### What QUALIFIES as a question

- Requests for information ("How do I...", "Where can I find...", "What is the process for...")
- Problem-solving queries ("Why isn't X working?", "What should I do when...")
- Policy/procedure inquiries ("Is it okay to...", "Are we allowed to...")
- Logistical questions ("When does X happen?", "Who handles Y?")
- Resource location questions ("Where is...", "How do I access...")

### What to EXCLUDE

- Rhetorical questions ("You know what I mean?", "Right?")
- **Questions already answered within the same thread** (NOTE: The workflow includes automatic answer extraction, so identifying these helps populate the Answer field)
- Greetings and pleasantries ("How are you?", "What's up?")
- Casual conversation ("Want to grab lunch?")
- Questions directed at specific individuals for one-off situations
- Highly context-specific questions that won't generalize
- Bot messages or automated notifications
- Reactions and acknowledgments ("Thanks!", "Got it")

## Analysis Guidelines

1. **Context matters**: Read thread replies if available to understand if the question was answered or if it's part of ongoing conversation
2. **Generalizability**: Prioritize questions that multiple people might ask (common pain points)
3. **Clarity**: If a question is unclear or too vague, note it but mark it as lower priority
4. **Implicit questions**: Sometimes questions are phrased as statements ("I can't figure out how to...") - these still count
5. **Multiple questions**: If a single message contains multiple questions, extract each separately

## Output Format

Return a structured JSON array of identified questions:

```json
[
  {
    "original_text": "The exact message text containing the question",
    "question_type": "information_request|problem_solving|policy|logistical|resource_location",
    "channel": "nyc-office",
    "channel_id": "CPUFYKWLE",
    "user": "User name or ID",
    "timestamp": "ISO timestamp",
    "thread_context": "Brief summary of thread replies if relevant",
    "confidence": "high|medium|low",
    "notes": "Any additional context or observations"
  }
]
```

### Confidence Levels

- **high**: Clearly a valuable FAQ question that many people would benefit from
- **medium**: A question, but might be too specific or already well-documented
- **low**: Borderline case - might be useful but uncertain

## Success Criteria

- Accurately identify 85%+ of genuine questions (high recall)
- Filter out 95%+ of non-questions (high precision)
- Provide useful context in notes field when confidence is medium/low
- Maintain consistent classification across similar question types

## Example Analysis

**Input message**: "Hey does anyone know where we keep the spare HDMI cables? I need one for the conference room"

**Output**:

```json
{
  "original_text": "Hey does anyone know where we keep the spare HDMI cables? I need one for the conference room",
  "question_type": "resource_location",
  "channel": "nyc-office",
  "channel_id": "CPUFYKWLE",
  "user": "John Doe",
  "timestamp": "2025-01-15T14:30:00Z",
  "thread_context": "No replies yet",
  "confidence": "high",
  "notes": "Common logistics question about office supplies/equipment. Likely asked frequently by different people."
}
```

## Quality Guidelines

- Err on the side of **inclusion** for medium confidence questions - the deduplicator agent will filter further
- Prioritize questions that appear multiple times across different messages/users
- Note patterns: if you see variations of the same question, mention this in the notes
- Be aware of workplace/office-specific context for Uniswap's NYC office

## Return Format

Return only the JSON array of identified questions. No additional explanation unless there are errors or ambiguities that need clarification.
