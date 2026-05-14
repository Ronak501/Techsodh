"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRealtimeComments } from "@/lib/hooks/useRealtime";
import { MessageCircle, Reply, Check, X } from "lucide-react";

interface CommentsProps {
  researchId: string;
}

export function ResearchComments({ researchId }: CommentsProps) {
  const { comments, addComment, deleteComment } =
    useRealtimeComments(researchId);
  const [newComment, setNewComment] = useState("");
  const [section, setSection] = useState("general");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    await addComment(section, newComment, replyingTo || undefined);
    setNewComment("");
    setReplyingTo(null);
  };

  const toggleExpanded = (commentId: string) => {
    const newSet = new Set(expandedComments);
    if (newSet.has(commentId)) {
      newSet.delete(commentId);
    } else {
      newSet.add(commentId);
    }
    setExpandedComments(newSet);
  };

  const rootComments = comments.filter((c) => !c.parent_comment_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5" />
        <h3 className="font-bold">Discussion ({comments.length})</h3>
      </div>

      {/* New Comment Form */}
      <Card className="p-4">
        <div className="space-y-2">
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="general">General</option>
            <option value="executive_summary">Executive Summary</option>
            <option value="main_analysis">Main Analysis</option>
            <option value="conclusions">Conclusions</option>
          </select>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            className="min-h-20"
          />
          <div className="flex gap-2 justify-end">
            {replyingTo && (
              <Button
                variant="outline"
                onClick={() => {
                  setReplyingTo(null);
                  setNewComment("");
                }}
              >
                Cancel
              </Button>
            )}
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              {replyingTo ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-3">
        {rootComments.map((comment) => (
          <Card key={comment.id} className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {comment.author?.email || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
                {comment.resolved && (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <Check className="w-4 h-4" />
                    Resolved
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-700">{comment.content}</p>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
                  {comment.replies.map((reply: any) => (
                    <div key={reply.id} className="text-sm">
                      <p className="font-medium">
                        {reply.author?.email || "Anonymous"}
                      </p>
                      <p className="text-gray-600">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  <Reply className="w-4 h-4 mr-1" />
                  Reply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteComment(comment.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
