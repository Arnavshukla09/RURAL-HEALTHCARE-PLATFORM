"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check, X, ShieldAlert } from "lucide-react"

interface ChatCacheItem {
  id: string
  question: string
  lang: string
  answer: string
  status: string
  created_at: string
}

export default function ChatReviewPage() {
  const [items, setItems] = useState<ChatCacheItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)

  const supabase = createClient()

  const fetchPending = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("chat_cache")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          // Table does not exist yet
          setTableExists(false)
        }
        setItems([])
      } else {
        setItems(data || [])
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleUpdate = async (id: string, status: "approved" | "rejected") => {
    setProcessingId(id)
    try {
      await supabase
        .from("chat_cache")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)

      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Chat Review & Governance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review, edit, and approve pending Gemini responses for permanent Tier 2 promotion.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPending} disabled={loading}>
          Refresh
        </Button>
      </div>

      {!tableExists && (
        <Card className="border-amber-200 bg-amber-50 mb-6">
          <CardContent className="p-4 flex items-center gap-3 text-amber-800 text-sm">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <div>
              <strong>Database Table Pending:</strong> The <code>chat_cache</code> table has not been created in Supabase yet.
              Please execute <code>supabase/05_chat_cache.sql</code> in your Supabase SQL Editor.
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No pending questions awaiting review.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.lang.toUpperCase()}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <CardTitle className="text-base font-semibold mt-2">{item.question}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-3.5 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
                  {item.answer}
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    disabled={processingId === item.id}
                    onClick={() => handleUpdate(item.id, "rejected")}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={processingId === item.id}
                    onClick={() => handleUpdate(item.id, "approved")}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
