---
name: Mobile write operations / teacher attendance
description: Pattern for teacher POST operations on mobile using useMutation and apiClient.createItem
---

## Pattern
Mobile API client has `createItem<T>(collection, data)` which does a POST to `/<collection>`.

For teacher attendance logging:
- `useMutation({ mutationFn: (data) => apiClient.createItem("attendance", data) })`
- On success: `queryClient.invalidateQueries({ queryKey: ["attendance"] })` to refresh the list
- The form modal uses `KeyboardAvoidingView` with `behavior="padding"` on iOS for proper keyboard handling

## Attendance record shape
```ts
{ date: "YYYY-MM-DD", class: string, present: number, absent: number, late: number }
```
The API server generates the `id` and persists to PostgreSQL via the generic items store.
