'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { formatDate, timeAgo, truncate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Textarea } from '@/components/ui/Input'

const supabase = createSupabaseClient()

type Conversation = {
  id: string
  farm_id: string
  graduate_id: string
  job_id?: string | null
  last_message_at?: string | null
  created_at: string
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
}

function dateKey(iso: string) {
  try {
    return formatDate(iso, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

function RowSkeleton() {
  return (
    <div className="animate-pulse border-b border-gray-100 px-3 py-3">
      <div className="h-4 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
    </div>
  )
}

function MessageBubble({
  m,
  selfId,
}: {
  m: MessageRow
  selfId: string | null
}) {
  const mine = selfId != null && m.sender_id === selfId
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] px-4 py-2 text-sm',
          mine
            ? 'rounded-2xl rounded-tr-sm bg-green-700 text-white'
            : 'rounded-2xl rounded-tl-sm bg-gray-100 text-gray-900'
        )}
      >
        <p className="whitespace-pre-wrap">{m.content}</p>
        <p
          className={cn(
            'mt-1 text-right text-xs',
            mine ? 'text-green-100' : 'text-gray-500'
          )}
        >
          {formatDate(m.created_at, 'HH:mm')}
        </p>
      </div>
    </div>
  )
}

export default function StudentMessagesPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [nameMap, setNameMap] = useState<Record<string, string>>({})
  const [latestMap, setLatestMap] = useState<Record<string, MessageRow>>({})
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null }; error: unknown }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [])

  const loadConversations = useCallback(async () => {
    setError('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setError('You must be signed in')
      setConversations([])
      setLoading(false)
      return
    }
    const { data: convs, error: cErr } = await supabase
      .from('conversations')
      .select('*')
      .eq('graduate_id', uid)
      .order('last_message_at', { ascending: false, nullsFirst: false })
    if (cErr) {
      setError(cErr.message)
      setConversations([])
      setLoading(false)
      return
    }
    const list = (convs as Conversation[]) ?? []
    setConversations(list)

    const farmIds = Array.from(new Set(list.map((c) => c.farm_id)))
    if (farmIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, farm_name')
        .in('id', farmIds)
      const nm: Record<string, string> = {}
      for (const p of profs ?? []) {
        const row = p as { id: string; farm_name: string | null }
        nm[row.id] = row.farm_name ?? 'Farm'
      }
      setNameMap(nm)
    } else {
      setNameMap({})
    }

    const convIds = list.map((c) => c.id)
    if (convIds.length === 0) {
      setLatestMap({})
      setUnreadMap({})
      setLoading(false)
      return
    }

    const { data: allMsgs } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })

    const latest: Record<string, MessageRow> = {}
    for (const m of (allMsgs as MessageRow[]) ?? []) {
      if (!latest[m.conversation_id]) {
        latest[m.conversation_id] = m
      }
    }
    setLatestMap(latest)

    const { data: unreadRows } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .eq('read', false)
      .neq('sender_id', uid)

    const uc: Record<string, number> = {}
    for (const r of unreadRows ?? []) {
      const cid = (r as { conversation_id: string }).conversation_id
      uc[cid] = (uc[cid] ?? 0) + 1
    }
    setUnreadMap(uc)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  const markRead = useCallback(async (conversationId: string) => {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', uid)
  }, [])

  const loadThread = useCallback(
    async (conversationId: string) => {
      setThreadLoading(true)
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      setMessages((msgs as MessageRow[]) ?? [])
      setThreadLoading(false)
      if (uid) {
        await markRead(conversationId)
        setUnreadMap((prev) => ({ ...prev, [conversationId]: 0 }))
      }
    },
    [markRead]
  )

  useEffect(() => {
    if (selectedId) {
      void loadThread(selectedId)
    } else {
      setMessages([])
    }
  }, [selectedId, loadThread])

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedId])

  const grouped = useMemo(() => {
    const groups: { date: string; items: MessageRow[] }[] = []
    let cur = ''
    for (const m of messages) {
      const dk = dateKey(m.created_at)
      if (dk !== cur) {
        cur = dk
        groups.push({ date: dk, items: [m] })
      } else {
        groups[groups.length - 1].items.push(m)
      }
    }
    return groups
  }, [messages])

  async function sendMessage() {
    const text = draft.trim()
    if (!text || !selectedId) return
    setSending(true)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setSending(false)
      return
    }
    const { error: mErr } = await supabase.from('messages').insert({
      conversation_id: selectedId,
      sender_id: uid,
      content: text,
      read: false,
    })
    if (mErr) {
      setError(mErr.message)
      setSending(false)
      return
    }
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', selectedId)
    setDraft('')
    await loadThread(selectedId)
    await loadConversations()
    setSending(false)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-80 shrink-0 border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-3 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
        </div>
        {loading ? (
          <div>
            {[0, 1, 2, 3, 4].map((k) => (
              <RowSkeleton key={k} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="p-3 text-sm text-gray-600">No conversations yet</p>
        ) : (
          <ul>
            {conversations.map((c) => {
              const name = nameMap[c.farm_id] ?? 'Farm'
              const latest = latestMap[c.id]
              const unread = unreadMap[c.id] ?? 0
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      'w-full border-b border-gray-100 px-3 py-3 text-left transition-colors',
                      selectedId === c.id ? 'bg-green-50' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-gray-900">{name}</span>
                      {unread > 0 ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-green-600" />
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                      {latest
                        ? truncate(latest.content, 60)
                        : 'No messages yet'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {c.last_message_at
                        ? timeAgo(c.last_message_at)
                        : ''}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      <section className="flex min-h-[70vh] min-w-0 flex-1 flex-col">
        {error ? (
          <p className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {!selectedId ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <EmptyState
              icon={<MessageSquare className="mx-auto h-12 w-12 text-gray-400" />}
              title="Select a conversation"
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {threadLoading ? (
                <p className="text-sm text-gray-600">Loading messages...</p>
              ) : (
                <div className="space-y-6">
                  {grouped.map((g) => (
                    <div key={g.date}>
                      <p className="mb-3 text-center text-xs text-gray-500">
                        {g.date}
                      </p>
                      <div className="space-y-2">
                        {g.items.map((m) => (
                          <MessageBubble key={m.id} m={m} selfId={userId} />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 bg-white p-3">
              <div className="flex gap-2">
                <Textarea
                  className="min-h-[44px] flex-1"
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void sendMessage()
                    }
                  }}
                  placeholder="Type a message"
                />
                <Button
                  type="button"
                  variant="primary"
                  className="shrink-0 self-end"
                  disabled={sending || !draft.trim()}
                  onClick={() => void sendMessage()}
                >
                  <Send className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
