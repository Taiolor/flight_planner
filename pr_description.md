💡 What: Replaced full tRPC mutation objects (`subscribeMutation`, `unsubscribeMutation`, `sendTestMutation`, and `logoutMutation`) with their stable `.mutateAsync` properties in the dependency arrays of `useCallback` hooks within `usePushNotifications.ts` and `useAuth.ts`.

🎯 Why: Passing the entire mutation object to a `useCallback` dependency array causes the callback to be recreated every time the mutation's internal state (e.g., `isPending`, `isError`) updates. By depending on the stable `mutateAsync` function instead, we maintain referential stability for these callbacks, preventing unnecessary downstream re-renders in components that consume these hooks.

📊 Impact: Reduces unnecessary React component re-renders triggered by state changes in authentication and push notification hooks, saving CPU cycles and memory allocations during state transitions.

🔬 Measurement: Observe that components using `useAuth` and `usePushNotifications` no longer re-render unnecessarily when a mutation is in flight (`isPending`). Verified that `pnpm test` and `pnpm run check` pass successfully.
