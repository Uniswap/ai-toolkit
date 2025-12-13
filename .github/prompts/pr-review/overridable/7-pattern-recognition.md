# Pattern Recognition

## Red Flags (Comment on these)

**Functions doing too much:**

```ts
// RED FLAG: 4 responsibilities
async function handleCheckout(items, userId) {
  if (!userId) throw new Error('Invalid'); // Validation
  const user = await db.getUser(userId); // Fetching
  const total = calculateTotal(items, user.tier); // Business logic
  await stripe.charge(user.card, total); // External API
  await db.saveOrder(user, items, total); // Persistence
}
```

_Impact: Can't test business logic without database + Stripe. Changes ripple everywhere._

**Hidden dependencies:**

```ts
// RED FLAG: Hardcoded import
import { analytics } from './analytics';
function trackEvent(event) {
  analytics.track(event); // Can't test without real analytics
}
```

_Impact: Every test sends real analytics. Can't swap providers._

**Missing error handling:**

```ts
// RED FLAG: No error handling
async function loadData() {
  const response = await fetch(url);
  return response.data.results.items; // Any of these could be undefined
}
```

_Impact: Production errors that are hard to debug._

## Good Practices Observed

Only if truly noteworthy - especially good applications of engineering principles

- Clean separation of concerns in [specific function/module]
- Excellent use of dependency injection in [specific area]

**Only comment when there's actionable feedback.** If code is fine, don't comment on it.

---
