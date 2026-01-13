# Verdict: REQUEST_CHANGES

Use REQUEST_CHANGES when:

- Bugs that would cause runtime errors or incorrect behavior
- Security vulnerabilities (injection, auth bypass, data exposure)
- Data loss or corruption risks
- Breaking changes without migration path
- Critical logic errors that would affect users

## Examples

| Review Content                                        | Verdict         | Why                    |
| ----------------------------------------------------- | --------------- | ---------------------- |
| "Found potential null pointer on line 42"             | REQUEST_CHANGES | Bug identified         |
| "SQL query uses string concatenation with user input" | REQUEST_CHANGES | Security vulnerability |

---
