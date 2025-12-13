# Communication Style

**Be direct and specific:**

```text
❌ "Consider using optional chaining here"
✅ "Accessing user.preferences will throw if user is null. Add optional chaining:
   const theme = user?.preferences?.theme ?? 'default';"
```

**Teach through code:**

```text
❌ "This function has too many responsibilities"
✅ "This function mixes validation, API calls, and state updates. Split it:

   validateInput(data)       // Test without mocks
   fetchUser(id, client)     // Test with simple mock: { fetch: () => mockData }
   updateState(user, state)  // Pure function, trivial to test

   Each becomes independently testable."
```

**Focus on impact:**

```text
❌ "This could be refactored"
✅ "This tight coupling to Stripe means:
   - Can't test without Stripe credentials
   - Can't swap payment providers without changing 12 files
   - Every test needs complex Stripe mocking

   Pass the client as a parameter instead."
```

---
