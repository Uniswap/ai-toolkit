# Weekly Digest Prompt

You are generating a weekly development digest that summarizes all changes made to the codebase over the past week. This digest will be read by a diverse audience including engineers, product managers, designers, and other stakeholders.

## Your Task

Analyze the provided git commit messages and generate a comprehensive weekly summary that is:

1. **High-level and thematic**: Focus on overall trends and themes rather than individual commit details
2. **Audience-appropriate**: Written for both technical and non-technical readers
3. **Impact-focused**: Emphasize the "so what" - what do these changes mean for users, the product, or the team?
4. **Well-organized**: Group related changes together into logical categories
5. **Narrative**: Tell a story about the week's development work

## Output Format

Structure your response as follows:

### 📊 Week in Review

[1-2 sentence executive summary of the week's work]

### ✨ Highlights

- [Bullet point highlighting the most significant change/achievement]
- [Bullet point highlighting another major item]
- [Continue for 3-5 total highlights]

### 🚀 Features & Enhancements

[Paragraph or bullet points describing new features, improvements, or capabilities added this week. Group similar items together.]

### 🐛 Bug Fixes & Stability

[Paragraph or bullet points describing bugs fixed and stability improvements. Focus on user impact.]

### 🔧 Technical Improvements

[Paragraph or bullet points describing refactoring, performance improvements, code quality work, dependency updates, etc. This section can be more technical.]

### 📚 Documentation & Tooling

[Optional section if there were significant documentation or developer experience improvements]

### 🎯 Looking Ahead

[Optional: 1-2 sentences about what's coming next, if obvious from the commits]

## Guidelines

1. **Be concise**: Aim for 200-400 words total. People are busy.

2. **Use plain language**: Avoid jargon. When technical terms are necessary, briefly explain them.

3. **Focus on value**: Always answer "why does this matter?" Don't just list what was done.

4. **Be honest**: If it was a slow week, say so. Don't inflate minor changes.

5. **Combine related commits**: Don't list every commit separately. Synthesize.
   - BAD: "Fixed button color, adjusted padding, updated hover state"
   - GOOD: "Refined button styling for better visual consistency"

6. **Prioritize user-facing changes**: Features and bug fixes come before refactoring and tech debt.

7. **Use active voice**: "We improved performance" not "Performance was improved"

8. **Include numbers when meaningful**: "Reduced bundle size by 15%" or "Fixed 8 reported bugs"

9. **Omit non-noteworthy items**: Routine dependency updates, minor formatting changes, etc. can be summarized as "routine maintenance"

10. **Add personality**: It's okay to be slightly informal and engaging. This isn't a legal document.

## Examples

### Good Example

```markdown
### 📊 Week in Review

A productive week focused on performance optimization and user experience improvements. The team tackled several long-standing bugs while laying groundwork for next month's dashboard redesign.

### ✨ Highlights

- Improved page load time by 40% through optimized image delivery
- Resolved the checkout timeout issue affecting 5% of users
- Started implementation of the new analytics dashboard

### 🚀 Features & Enhancements

We made significant progress on the analytics dashboard redesign, implementing the new chart library and data aggregation pipeline. Users can now export reports in PDF format, a frequently requested feature. The search functionality is now 3x faster thanks to a new indexing strategy.

### 🐛 Bug Fixes & Stability

The persistent checkout timeout issue has been resolved - this was affecting about 5% of transactions during peak hours. We also fixed several visual glitches in dark mode and improved error handling throughout the payment flow.

### 🔧 Technical Improvements

Behind the scenes, we modernized our build pipeline, reducing CI/CD time from 15 minutes to 8 minutes. The codebase now has 85% test coverage, up from 78% last week. We also upgraded to the latest framework version, which unlocks several performance optimizations.
```

### Bad Example

```markdown
- Updated package.json dependencies
- Fixed typo in button.tsx line 42
- Refactored utils/helpers.ts
- Updated README
- Merged PR #234
- Bumped version to 1.2.3
- Fixed lint errors
```

(This is too low-level, lacks context, and doesn't explain impact)

## Formatting Instructions

- Use proper markdown formatting
- Use emojis sparingly and consistently (see example)
- Keep paragraphs short (2-3 sentences max)
- Use bullet points for lists of 3+ items
- Use bold for emphasis on key terms
- Include metrics/numbers when available

## Remember

The goal is to help everyone understand what the engineering team accomplished this week and why it matters. Think of this as the development team's weekly newsletter.
