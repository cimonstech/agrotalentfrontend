'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, Search, Send } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { cn, formatDate, getInitials, timeAgo, truncate } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

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

function MessageBubble({ m, selfId }: { m: MessageRow; selfId: string | null }) {
  const mine = selfId != null && m.sender_id === selfId
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-xs rounded-2xl px-4 py-2.5 text-sm',
          mine
            ? 'rounded-tr-md bg-brand text-white shadow-sm shadow-brand/30'
            : 'rounded-tl-md border border-gray-100 bg-white/80 text-gray-900 shadow-sm backdrop-blur-sm'
        )}
      >
        <p className='whitespace-pre-wrap'>{m.content}</p>
        <p className={cn('mt-0.5 text-right text-[10px]', mine ? 'text-white/70' : 'text-gray-400')}>
          {formatDate(m.created_at, 'HH:mm')}
        </p>
      </div>
    </div>
  )
}

export default function GraduateMessagesPage() {
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
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null }; error: unknown }) => setUserId(data.user?.id ?? null))
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
      const { data: profs } = await supabase.from('profiles').select('id, farm_name').in('id', farmIds)
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

    const { data: allMsgs } = await supabase.from('messages').select('*').in('conversation_id', convIds).order('created_at', { ascending: false })
    const latest: Record<string, MessageRow> = {}
    for (const m of (allMsgs as MessageRow[]) ?? []) if (!latest[m.conversation_id]) latest[m.conversation_id] = m
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
    await supabase.from('messages').update({ read: true }).eq('conversation_id', conversationId).neq('sender_id', uid)
  }, [])

  const loadThread = useCallback(
    async (conversationId: string) => {
      setThreadLoading(true)
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true })
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
    if (selectedId) void loadThread(selectedId)
    else setMessages([])
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

  const visibleConversations = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter((c) => {
      const name = (nameMap[c.farm_id] ?? 'Farm').toLowerCase()
      const latest = (latestMap[c.id]?.content ?? '').toLowerCase()
      return name.includes(q) || latest.includes(q)
    })
  }, [conversations, latestMap, nameMap, search])

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
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', selectedId)
    setDraft('')
    await loadThread(selectedId)
    await loadConversations()
    setSending(false)
  }

  return (
    <div className='h-[calc(100vh-100px)] p-6'>
      <div className='flex h-full gap-4'>
        <Card className='flex h-full w-72 flex-shrink-0 flex-col overflow-hidden p-0'>
          <div className='border-b border-gray-50 p-4'>
            <h2 className='text-base font-bold text-gray-900'>Messages</h2>
            <div className='relative mt-2'>
              <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' aria-hidden />
              <input
                className='w-full rounded-xl border-0 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none'
                placeholder='Search conversations'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className='flex-1 overflow-y-auto'>
            {loading ? (
              <p className='p-4 text-sm text-gray-500'>Loading...</p>
            ) : visibleConversations.length === 0 ? (
              <p className='p-4 text-sm text-gray-500'>No conversations yet.</p>
            ) : (
              visibleConversations.map((c) => {
                const name = nameMap[c.farm_id] ?? 'Farm'
                const latest = latestMap[c.id]
                const unread = unreadMap[c.id] ?? 0
                const active = selectedId === c.id
                return (
                  <button
                    key={c.id}
                    type='button'
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50',
                      active ? 'border-l-2 border-brand bg-brand/5 shadow-sm backdrop-blur-sm' : ''
                    )}
                  >
                    <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand'>
                      {getInitials(name)}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <p className='truncate text-sm font-semibold text-gray-900'>{name}</p>
                        <p className='text-xs text-gray-400'>{c.last_message_at ? timeAgo(c.last_message_at) : ''}</p>
                      </div>
                      <p className='mt-0.5 truncate text-xs text-gray-500'>
                        {latest ? truncate(latest.content, 44) : 'No messages yet'}
                      </p>
                    </div>
                    {unread > 0 ? <span className='h-2 w-2 flex-shrink-0 rounded-full bg-brand' /> : null}
                  </button>
                )
              })
            )}
          </div>
        </Card>

        <Card className='flex h-full min-w-0 flex-1 flex-col overflow-hidden p-0'>
          {!selectedId ? (
            <div className='flex flex-1 items-center justify-center p-8'>
              <EmptyState icon={<MessageSquare className='mx-auto h-12 w-12 text-gray-400' />} title='Select a conversation' />
            </div>
          ) : (
            <>
              <div className='flex items-center gap-3 border-b border-gray-50 p-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand'>
                  {getInitials(nameMap[conversations.find((c) => c.id === selectedId)?.farm_id ?? ''] ?? 'Farm')}
                </div>
                <p className='font-semibold text-gray-900'>
                  {nameMap[conversations.find((c) => c.id === selectedId)?.farm_id ?? ''] ?? 'Conversation'}
                </p>
              </div>
              <div className='flex-1 overflow-y-auto bg-gray-50/50 p-4'>
                {threadLoading ? (
                  <p className='text-sm text-gray-500'>Loading messages...</p>
                ) : (
                  <div className='flex flex-col gap-3'>
                    {grouped.map((g) => (
                      <div key={g.date}>
                        <p className='mb-2 text-center text-[10px] text-gray-400'>{g.date}</p>
                        <div className='flex flex-col gap-2'>
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
              {error ? <p className='px-4 pb-2 text-xs text-red-600'>{error}</p> : null}
              <div className='flex gap-3 border-t border-gray-50 p-4'>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={1}
                  placeholder='Type a message'
                  className='flex-1 resize-none rounded-2xl border-0 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand/30'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void sendMessage()
                    }
                  }}
                />
                <button
                  type='button'
                  className='flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white hover:bg-forest disabled:opacity-60'
                  disabled={sending || !draft.trim()}
                  onClick={() => void sendMessage()}
                  aria-label='Send'
                >
                  <Send className='h-4 w-4' aria-hidden />
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
