'use client'

import { useCallback, useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { SystemSetting } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'

const supabase = createSupabaseClient()

export default function AdminSettingsPage() {
  const [rows, setRows] = useState<SystemSetting[]>([])
  const [textById, setTextById] = useState<Record<string, string>>({})
  const [errById, setErrById] = useState<Record<string, string>>({})
  const [okById, setOkById] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('{}')
  const [newErr, setNewErr] = useState('')
  const [newOk, setNewOk] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key', { ascending: true })
    if (error) {
      setRows([])
    } else {
      const list = (data as SystemSetting[]) ?? []
      setRows(list)
      const next: Record<string, string> = {}
      for (const r of list) {
        next[r.id] = JSON.stringify(r.value ?? {}, null, 2)
      }
      setTextById(next)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function saveRow(row: SystemSetting) {
    setErrById((e) => ({ ...e, [row.id]: '' }))
    setOkById((e) => ({ ...e, [row.id]: '' }))
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(textById[row.id] ?? '{}') as Record<string, unknown>
    } catch {
      setErrById((e) => ({
        ...e,
        [row.id]: 'Invalid JSON. Fix the value and try again.',
      }))
      return
    }
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return
    const { error } = await supabase
      .from('system_settings')
      .update({
        value: parsed,
        updated_by: uid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
    if (error) {
      setErrById((e) => ({ ...e, [row.id]: error.message }))
      return
    }
    setOkById((e) => ({ ...e, [row.id]: 'Saved.' }))
    void load()
  }

  async function addSetting(e: React.FormEvent) {
    e.preventDefault()
    setNewErr('')
    setNewOk('')
    if (!newKey.trim()) {
      setNewErr('Key is required.')
      return
    }
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(newVal) as Record<string, unknown>
    } catch {
      setNewErr('Value must be valid JSON.')
      return
    }
    setAdding(true)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setNewErr('You must be signed in.')
      setAdding(false)
      return
    }
    const { error } = await supabase.from('system_settings').insert({
      key: newKey.trim(),
      value: parsed,
      updated_by: uid,
    })
    setAdding(false)
    if (error) {
      setNewErr(error.message)
      return
    }
    setNewOk('Setting created.')
    setNewKey('')
    setNewVal('{}')
    void load()
  }

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((k) => (
                  <div
                    key={k}
                    className="h-40 animate-pulse rounded-2xl bg-gray-100"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="mb-4 rounded-2xl border border-gray-100 bg-white p-5"
                  >
                    <span className="inline-block rounded-lg bg-gray-50 px-3 py-1 font-mono text-sm font-semibold text-gray-700">
                      {row.key}
                    </span>
                    <textarea
                      className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      rows={4}
                      value={textById[row.id] ?? ''}
                      onChange={(e) =>
                        setTextById((t) => ({ ...t, [row.id]: e.target.value }))
                      }
                      aria-label={`Value for ${row.key}`}
                    />
                    {errById[row.id] ? (
                      <p className="mt-1 text-xs text-red-500">
                        {errById[row.id]}
                      </p>
                    ) : null}
                    {okById[row.id] ? (
                      <p className="mt-1 text-xs text-green-700">
                        {okById[row.id]}
                      </p>
                    ) : null}
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
                        onClick={() => void saveRow(row)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <form
              onSubmit={addSetting}
              className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-5"
            >
              <h2 className="mb-4 font-semibold text-gray-800">
                Add New Setting
              </h2>
              {newErr ? (
                <p className="mb-2 text-xs text-red-500">{newErr}</p>
              ) : null}
              {newOk ? (
                <p className="mb-2 text-xs text-green-700">{newOk}</p>
              ) : null}
              <div className="space-y-3">
                <Input
                  label="Key"
                  name="newKey"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  required
                />
                <Textarea
                  label="Value (JSON)"
                  name="newVal"
                  className="font-mono text-xs"
                  value={newVal}
                  onChange={(e) => setNewVal(e.target.value)}
                  rows={6}
                  required
                />
                <Button
                  type="submit"
                  className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white"
                  loading={adding}
                >
                  Add
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
