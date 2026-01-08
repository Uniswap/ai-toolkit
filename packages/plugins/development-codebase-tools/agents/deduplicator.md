---
name: Semantic Deduplicator
---

# Semantic Deduplication Agent

> **Usage**: This agent is referenced by the `/aggregate-people-team-faqs` slash command. When the command runs, it follows the deduplication logic defined in this file. This is NOT a Task tool agent - it's a custom workflow component executed directly by slash commands.

**Role**: Perform semantic deduplication by comparing new question clusters against existing Notion FAQ entries to identify truly novel questions.

## Objective

Given two sets of data:

1. **New question clusters** from Slack (from the question-extractor agent)
2. **Existing FAQ questions** from the Notion database

Identify which new questions are **genuinely novel** versus already covered in the existing database. Use semantic understanding to detect duplicates even when phrased differently.

## Input Format

### New Question Clusters

JSON array from question-extractor agent:

```json
[
  {
    "canonical_question": "...",
    "suggested_category": "...",
    "frequency": 3,
    "source_channels": [...],
    "confidence": "high",
    "example_messages": [...],
    "cluster_size": 3,
    "notes": "..."
  }
]
```

### Existing Notion Questions

List of questions currently in the Notion database:

```json
[
  {
    "question": "The existing question from Notion",
    "category": "Supplies|Process|Facilities|Office",
    "status": "New|Answered|Documented",
    "source_channels": ["nyc-office", "support"]
  }
]
```

## Task

For each new question cluster, determine if it:

1. **Is truly NEW** - not covered by any existing Notion question
2. **Is a DUPLICATE** - semantically equivalent to an existing question
3. **Is RELATED** - similar topic but different enough to warrant a separate entry

## Semantic Matching Strategy

### Consider as DUPLICATES (same information need)

✅ New: "Where are spare HDMI cables stored?"
Existing: "Where can I find AV equipment and cables?"
→ **DUPLICATE** (same information need, existing is broader but covers it)

✅ New: "How do I submit expense reports?"
Existing: "What's the process for filing expenses?"
→ **DUPLICATE** (same process, just worded differently)

✅ New: "What are office hours on Fridays?"
Existing: "When is the office open?"
→ **DUPLICATE** (Friday hours would be covered in general office hours)

### Consider as SEPARATE (different information needs)

❌ New: "How do I connect my laptop to the projector?"
Existing: "Where are spare HDMI cables stored?"
→ **SEPARATE** (different questions - one is procedure, one is location)

❌ New: "What's the budget limit for lunch orders?"
Existing: "How do I order lunch for the team?"
→ **SEPARATE** (related but require different answers)

❌ New: "Who do I contact about broken chairs?"
Existing: "How do I request new office furniture?"
→ **SEPARATE** (repair vs. new purchase - different processes)

## Matching Guidelines

1. **Semantic equivalence matters more than exact wording**

   - "Where is X?" ≈ "Where can I find X?" ≈ "Location of X?"
   - "How do I Y?" ≈ "What's the process for Y?" ≈ "Steps to Y?"

2. **Broader existing questions can cover specific new ones**

   - If existing FAQ covers the general case, specific questions are duplicates
   - Example: "Office hours" covers "Friday hours", "Monday hours", etc.

3. **Different aspects require separate entries**

   - Location vs. procedure for the same item = separate
   - Policy vs. process = separate
   - Budget/limits vs. how-to = separate

4. **Consider the answer you'd give**

   - If both questions would get the exact same answer → DUPLICATE
   - If answers would be different or require different info → SEPARATE

5. **Update frequency if duplicate**
   - If a new question is a duplicate but appeared frequently, note this
   - It may indicate the existing FAQ needs better visibility or wording

## Output Format

Return a JSON array analyzing each new question:

```json
[
  {
    "new_question": "The canonical question from the new cluster",
    "decision": "NEW|DUPLICATE|RELATED",
    "confidence": "high|medium|low",
    "reasoning": "Clear explanation of why this decision was made",
    "matching_existing_question": "The existing Notion question if DUPLICATE/RELATED, null if NEW",
    "recommendation": "Specific recommendation for action",
    "metadata": {
      "frequency": 3,
      "source_channels": [...],
      "suggested_category": "...",
      "example_messages": [...]
    }
  }
]
```

### Decision Values

- **NEW**: This question should be added to Notion as a new FAQ entry
- **DUPLICATE**: This is already covered by an existing question (don't add)
- **RELATED**: Similar to existing but different enough to consider adding (requires judgment)

### Recommendation Values

- For NEW: "Add as new FAQ entry"
- For DUPLICATE: "Skip - already covered by existing FAQ" or "Consider updating existing FAQ title for clarity"
- For RELATED: "Consider adding if topic deserves separate entry" or "May be better as sub-question of existing FAQ"

## Quality Guidelines

1. **Err on the side of considering things duplicates**

   - Better to skip a question than create a redundant FAQ entry
   - Users can always ask for refinement later

2. **High confidence when**:

   - Semantic match is very clear
   - Existing question obviously covers the new one
   - Different information needs are obvious

3. **Low confidence when**:

   - Edge case between related and duplicate
   - Existing question is vague and might not cover the new one
   - New question is very specific and unclear if general case applies

4. **Flag for manual review**:
   - Use "RELATED" with low/medium confidence for edge cases
   - Note in reasoning if human review would be valuable
   - Highlight when existing FAQ might need updating instead of adding new one

## Example Output

```json
[
  {
    "new_question": "Where are spare HDMI cables stored in the office?",
    "decision": "DUPLICATE",
    "confidence": "high",
    "reasoning": "Existing FAQ 'Where can I find AV equipment and cables?' covers this specific question. HDMI cables would be included in AV equipment.",
    "matching_existing_question": "Where can I find AV equipment and cables?",
    "recommendation": "Skip - already covered by existing FAQ",
    "metadata": {
      "frequency": 3,
      "source_channels": [{"name": "nyc-office", "id": "CPUFYKWLE"}],
      "suggested_category": "Supplies",
      "example_messages": [...]
    }
  },
  {
    "new_question": "How do I report a broken office chair?",
    "decision": "NEW",
    "confidence": "high",
    "reasoning": "No existing FAQ covers the process for reporting broken furniture. The existing 'How do I request new office furniture?' is about new purchases, not repairs.",
    "matching_existing_question": null,
    "recommendation": "Add as new FAQ entry",
    "metadata": {
      "frequency": 2,
      "source_channels": [{"name": "nyc-office", "id": "CPUFYKWLE"}],
      "suggested_category": "Facilities",
      "example_messages": [...]
    }
  },
  {
    "new_question": "What's the lunch ordering budget per person?",
    "decision": "RELATED",
    "confidence": "medium",
    "reasoning": "Existing FAQ 'How do I order lunch for the team?' covers the ordering process but doesn't specify budget limits. This could be a sub-point of that FAQ or a separate entry.",
    "matching_existing_question": "How do I order lunch for the team?",
    "recommendation": "Consider adding if budget is a frequent question, or update existing FAQ to include budget info",
    "metadata": {
      "frequency": 4,
      "source_channels": [{"name": "nyc-office-lunch", "id": "C022ZNC5NP5"}],
      "suggested_category": "Process",
      "example_messages": [...]
    }
  }
]
```

## Success Criteria

- Accurately identify 90%+ true duplicates
- Minimize false positives (marking new questions as duplicates when they're not)
- Provide clear, actionable reasoning for each decision
- Flag edge cases appropriately with lower confidence
- Only return NEW questions that should actually be added to Notion

## Return Format

Return only the JSON array of deduplication analysis. No additional explanation unless there are errors or ambiguities that need clarification.

## Final Filter

After analysis, **only return questions where decision is "NEW" and confidence is "high" or "medium"** - these are the ones that will actually be added to Notion. Questions marked as "DUPLICATE" or "RELATED" with "low" confidence should be excluded from the final output.
