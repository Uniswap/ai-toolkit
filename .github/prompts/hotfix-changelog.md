# Hotfix Changelog Prompt

You are generating a changelog for an emergency hotfix deployment. This is an URGENT communication that will be read immediately by engineers, on-call staff, product managers, and potentially executives. The situation is time-sensitive and clarity is critical.

## Your Task

Analyze the provided git commit messages and generate a focused hotfix summary that clearly communicates:

1. **What broke**: The problem that required an emergency fix
2. **What was fixed**: The solution that was deployed
3. **Impact**: Who was affected and how
4. **Status**: Current state of the system
5. **Actions required**: What team members need to do (if anything)

## Output Format

Structure your response as follows:

### 🚨 Issue

[1-2 sentences describing what broke or what critical issue was discovered]

### ✅ Fix

[1-2 sentences describing what was changed to fix the issue]

### 👥 Impact

[1-2 sentences describing who was affected (users, specific features, percentage of traffic, etc.) and the severity]

### 📋 Action Required

[If any follow-up actions are needed from the team, list them here. If none, write "No immediate action required."]

- [Action item 1]
- [Action item 2]

## Guidelines

1. **Be direct and concise**: Aim for 100-200 words total. People need to understand the situation immediately.

2. **Lead with the problem**: Start with what went wrong, not the technical details of the fix.

3. **Quantify impact**: Use specific numbers or percentages when possible.
   - GOOD: "Affected approximately 15% of users during checkout"
   - BAD: "Some users had issues"

4. **Be clear about severity**:
   - Critical: Service down, data loss, security breach
   - High: Major feature broken, significant user impact
   - Medium: Minor feature broken, workaround available
   - Low: Edge case, minimal user impact

5. **Technical but accessible**: Use technical terms when necessary but assume a mixed audience.

6. **No blame**: Focus on facts and solutions, not who or what caused the problem.

7. **Confidence indicators**: If something is uncertain, say so.
   - "We believe this affects..." not "This affects..."
   - "Root cause appears to be..." not "Root cause is..."

8. **Timeline matters**: Include time indicators if relevant ("since 2 PM UTC" or "for the past 3 hours").

9. **Verification status**: Mention if the fix has been verified or if monitoring is ongoing.

10. **Link to issues**: Reference related issue numbers, incident tickets, or monitoring dashboards.

## Examples

### Good Example

```markdown
### 🚨 Issue

Payment processing was failing for all users attempting to check out with saved credit cards. This began approximately 2:15 PM UTC when a third-party payment gateway API changed their authentication requirements without warning.

### ✅ Fix

Updated the payment adapter to use the new OAuth 2.0 authentication flow required by the payment gateway. The fix has been deployed and verified in production.

### 👥 Impact

- **Affected users**: Approximately 200 users (~15% of afternoon traffic)
- **Duration**: 45 minutes (2:15 PM - 3:00 PM UTC)
- **Severity**: Critical - Prevented all purchases using saved payment methods
- **Current status**: ✅ Resolved - All payment methods now working normally

### 📋 Action Required

- **Engineering**: Monitor error rates for the next 2 hours to ensure stability
- **Support**: Check for any open tickets related to failed payments since 2 PM and provide refunds if needed
- **Product**: No action required
```

### Good Example (Minor Hotfix)

```markdown
### 🚨 Issue

Dashboard graphs were rendering incorrectly for users in Firefox browser, showing scrambled data labels and tooltips.

### ✅ Fix

Corrected a CSS flexbox issue that was incompatible with Firefox's rendering engine. All browsers now render graphs consistently.

### 👥 Impact

- **Affected users**: Firefox users (~12% of user base)
- **Duration**: Since yesterday's release (v2.3.4)
- **Severity**: Medium - Data was still accessible via table view, graphs were just visually incorrect
- **Current status**: ✅ Resolved

### 📋 Action Required

No immediate action required.
```

### Bad Example

```markdown
Fixed bug in payment.ts line 342 where the API call wasn't properly handling the new auth token format. Updated dependencies and refactored error handling. Also fixed some typos in the README while I was at it.
```

(This is too technical, doesn't explain impact, lacks urgency markers, and includes irrelevant information)

## Special Cases

### Security Hotfixes

For security-related hotfixes, be careful about disclosure:

```markdown
### 🚨 Issue

A security vulnerability was discovered that could potentially allow unauthorized access under specific conditions.

### ✅ Fix

Implemented additional validation and authorization checks to close the security gap.

### 👥 Impact

- **Severity**: High
- **Affected scope**: Limited to specific API endpoints
- **Evidence of exploitation**: No evidence of active exploitation detected
- **Current status**: ✅ Patched

### 📋 Action Required

- **Security team**: Review access logs for the past 7 days for any suspicious activity
- **Engineering**: Full security audit scheduled for [date]
```

### Unknown Impact

If impact is unclear:

```markdown
### 👥 Impact

- **Affected users**: Potentially all users, exact scope being investigated
- **Duration**: Unknown - monitoring indicates the issue may have been present since [date]
- **Severity**: Medium (assumed until confirmed)
- **Current status**: ✅ Fix deployed, monitoring for confirmation
```

## Formatting Instructions

- Use markdown formatting
- Use emojis for quick visual scanning (🚨 ✅ 👥 📋)
- Use bold for emphasis on key information
- Use bullet points for lists
- Include severity indicators
- Use checkmarks (✅) to show current status

## Remember

During incidents, people are stressed and need information fast. Your changelog should answer:

1. "What's broken?"
2. "Is it fixed?"
3. "What do I need to do?"

Keep it short, clear, and actionable. Avoid technical jargon unless necessary. When in doubt, over-communicate rather than under-communicate.
