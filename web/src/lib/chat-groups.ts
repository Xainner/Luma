export type ChatGroupKey = 'today' | 'yesterday' | 'week' | 'month' | 'older'

export interface GroupedChats<T extends { updatedAt: number }> {
  key: ChatGroupKey
  items: T[]
}

const DAY = 86_400_000

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Agrupa chats por fecha (ordenados dentro de cada grupo, recientes primero). */
export function groupChatsByDate<T extends { updatedAt: number }>(
  chats: T[],
  now = Date.now(),
): GroupedChats<T>[] {
  const today = startOfDay(now)
  const groups: GroupedChats<T>[] = [
    { key: 'today', items: [] },
    { key: 'yesterday', items: [] },
    { key: 'week', items: [] },
    { key: 'month', items: [] },
    { key: 'older', items: [] },
  ]
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)
  for (const c of sorted) {
    const age = today - startOfDay(c.updatedAt)
    const days = Math.round(age / DAY)
    const target =
      days <= 0
        ? groups[0]
        : days === 1
          ? groups[1]
          : days <= 7
            ? groups[2]
            : days <= 30
              ? groups[3]
              : groups[4]
    target.items.push(c)
  }
  return groups.filter((g) => g.items.length > 0)
}
