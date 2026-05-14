import { useEffect, useState, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { ResearchCollaborator } from "@/lib/research-types"

export function useRealtimeCollaborators(researchId: string) {
  const [collaborators, setCollaborators] = useState<ResearchCollaborator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current

    // Fetch initial collaborators
    const fetchCollaborators = async () => {
      const response = await fetch(`/api/research/${researchId}/collaborators`)
      if (response.ok) {
        const data = await response.json()
        setCollaborators(data)
      }
      setIsLoading(false)
    }

    fetchCollaborators()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`research:${researchId}:collaborators`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "research_collaborators",
          filter: `research_id=eq.${researchId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setCollaborators((prev) => [...prev, payload.new])
          } else if (payload.eventType === "UPDATE") {
            setCollaborators((prev) =>
              prev.map((c) => (c.id === payload.new.id ? payload.new : c))
            )
          } else if (payload.eventType === "DELETE") {
            setCollaborators((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [researchId])

  const updatePresence = async (cursorPosition?: number, selectedSection?: string) => {
    await fetch(`/api/research/${researchId}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cursor_position: cursorPosition, selected_section: selectedSection }),
    })
  }

  return { collaborators, isLoading, updatePresence }
}

export function useRealtimeComments(researchId: string) {
  const [comments, setComments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current

    // Fetch initial comments
    const fetchComments = async () => {
      const response = await fetch(`/api/research/${researchId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
      setIsLoading(false)
    }

    fetchComments()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`research:${researchId}:comments`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "research_comments",
          filter: `research_id=eq.${researchId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setComments((prev) => [...prev, payload.new])
          } else if (payload.eventType === "UPDATE") {
            setComments((prev) =>
              prev.map((c) => (c.id === payload.new.id ? payload.new : c))
            )
          } else if (payload.eventType === "DELETE") {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [researchId])

  const addComment = async (section: string, content: string, parentCommentId?: string) => {
    const response = await fetch(`/api/research/${researchId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, content, parent_comment_id: parentCommentId }),
    })
    return response.json()
  }

  const deleteComment = async (commentId: string) => {
    await fetch(`/api/research/${researchId}/comments?commentId=${commentId}`, {
      method: "DELETE",
    })
  }

  return { comments, isLoading, addComment, deleteComment }
}
