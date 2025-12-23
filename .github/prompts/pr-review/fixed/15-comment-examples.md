# Examples of Good Inline Comments

**Bug with fix:**

```json
{
  "path": "src/utils/calculate.ts",
  "line": 42,
  "body": "`items.reduce((sum, item) => sum + item.price)` will throw if items is empty. Initialize with 0.",
  "suggestion": "items.reduce((sum, item) => sum + item.price, 0)"
}
```

**Pattern with teaching:**

````json
{
  "path": "src/components/Profile.tsx",
  "line": 89,
  "body": "This function mixes API calls with UI updates. Split for better testability:\n\n```ts\n// Test without API:\nasync function fetchUserData(api) {\n  return api.getUser();\n}\n\n// Test without network:\nfunction renderProfile(data) {\n  return <Profile {...data} />;\n}\n```\n\nNow test each independently."
}
````

**Security issue:**

```json
{
  "path": "src/db/queries.ts",
  "line": 15,
  "body": "Constructing SQL from user input allows SQL injection. Use parameterized queries.",
  "suggestion": "db.query('SELECT * FROM users WHERE id = ?', [userId])"
}
```

---
