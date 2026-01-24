'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages()
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages')
      const data = await response.json()

      if (response.ok) {
        const convs = data.conversations || []
        setConversations(convs)

        const requestedId = searchParams.get('conversation_id')
        const requested = requestedId ? convs.find((c: any) => c.id === requestedId) : null

        if (requested) {
          setSelectedConversation(requested)
        } else if (convs.length > 0 && !selectedConversation) {
          setSelectedConversation(convs[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!selectedConversation) return

    try {
      const response = await fetch(`/api/messages?conversation_id=${selectedConversation.id}`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: newMessage
        })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages()
        fetchConversations()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Messages</h1>
          <p className="text-gray-600 dark:text-gray-400">Communicate with employers directly</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-white/10">
              <h2 className="font-bold">Conversations</h2>
            </div>
            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      {conv.farm?.farm_name || 'Employer/Farm'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {conv.job?.title || 'General'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(conv.last_message_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="lg:col-span-2 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-white/10">
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    {selectedConversation.farm?.farm_name || 'Farm'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedConversation.job?.title || 'General Conversation'}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === selectedConversation.farm_id ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-lg ${
                        msg.sender_id === selectedConversation.farm_id
                          ? 'bg-gray-100 dark:bg-white/10'
                          : 'bg-primary text-white'
                      }`}>
                        <p className={msg.sender_id === selectedConversation.farm_id ? 'text-gray-900 dark:text-white' : ''}>
                          {msg.content}
                        </p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === selectedConversation.farm_id
                            ? 'text-gray-500'
                            : 'text-white/70'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
