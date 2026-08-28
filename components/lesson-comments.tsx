"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useLessonComments, useAddComment, useDeleteComment } from "@/lib/react-query/hooks/use-classroom"
import { Button } from "@/components/ui/button"
import { MessageSquare, Trash2, Reply, Send, Loader2, User } from "lucide-react"
import Swal from "sweetalert2"

interface LessonCommentsProps {
  lessonId: string
}

export function LessonComments({ lessonId }: LessonCommentsProps) {
  const { user, profile } = useAuth()
  const { data: comments = [], isLoading } = useLessonComments(lessonId)
  const addCommentMutation = useAddComment()
  const deleteCommentMutation = useDeleteComment()

  // Input states
  const [newCommentContent, setNewCommentContent] = useState("")
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return "Just now"
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newCommentContent.trim()) return

    try {
      await addCommentMutation.mutateAsync({
        lessonId,
        userId: user.id,
        content: newCommentContent.trim(),
      })
      setNewCommentContent("")
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Failed to post comment",
        text: err.message || "Please try again later.",
        background: "#18181b",
        color: "#fff",
      })
    }
  }

  const handlePostReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!user || !replyContent.trim()) return

    try {
      await addCommentMutation.mutateAsync({
        lessonId,
        userId: user.id,
        content: replyContent.trim(),
        parentId,
      })
      setReplyContent("")
      setReplyToCommentId(null)
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Failed to post reply",
        text: err.message || "Please try again later.",
        background: "#18181b",
        color: "#fff",
      })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    const result = await Swal.fire({
      title: "Delete comment?",
      text: "Are you sure you want to delete this comment? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#9ACD32",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      background: "#18181b",
      color: "#fff",
    })

    if (result.isConfirmed) {
      try {
        await deleteCommentMutation.mutateAsync({ commentId, lessonId })
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Your comment has been deleted.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          background: "#18181b",
          color: "#fff",
        })
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Delete failed",
          text: err.message || "Please try again.",
          background: "#18181b",
          color: "#fff",
        })
      }
    }
  }

  // Filter root comments and map replies
  const rootComments = comments.filter((c: any) => !c.parent_id)
  const getRepliesForComment = (parentId: string) => {
    return comments.filter((c: any) => c.parent_id === parentId)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-500/10 text-red-400 border border-red-500/20">Admin</span>
      case "instructor":
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20">Instructor</span>
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-800 text-zinc-400">Student</span>
    }
  }

  if (isLoading) {
    return (
      <div className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-2xl flex items-center justify-center py-12 gap-3 text-zinc-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-[#9ACD32]" />
        <span>Loading discussion...</span>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-2xl space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-850 pb-4">
        <MessageSquare className="w-5 h-5 text-[#9ACD32]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          Q&A & Discussion ({comments.length})
        </h3>
      </div>

      {/* Main Comment Box */}
      {user ? (
        <form onSubmit={handlePostComment} className="space-y-3">
          <textarea
            required
            rows={3}
            placeholder="Ask a question or share your thoughts about this lesson..."
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary/80 transition-colors resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={addCommentMutation.isPending || !newCommentContent.trim()}
              className="bg-[#9ACD32] hover:bg-[#9ACD32]/90 text-black text-xs font-semibold py-4 px-6 rounded-xl flex items-center gap-2 transition-all"
              style={{ backgroundColor: '#9ACD32', color: '#000' }}
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-zinc-900/10 border border-zinc-850 rounded-xl text-center text-xs text-zinc-500">
          Please log in to participate in the discussion.
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {rootComments.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No questions or comments yet. Start the conversation!
          </div>
        ) : (
          rootComments.map((comment: any) => {
            const replies = getRepliesForComment(comment.comment_id)
            const canDelete =
              user &&
              (user.id === comment.user_id ||
                profile?.role === "admin" ||
                profile?.role === "instructor")

            return (
              <div key={comment.comment_id} className="group/item border-b border-zinc-850/30 pb-6 last:border-b-0 last:pb-0">
                {/* Root Comment Row */}
                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    {comment.profiles?.avatar_url ? (
                      <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-zinc-650" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-zinc-200 text-xs truncate">
                        {comment.profiles?.full_name || "Academy Member"}
                      </strong>
                      {getRoleBadge(comment.profiles?.role || "student")}
                      <span className="text-[10px] text-zinc-500">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>

                    <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>

                    {/* Actions Row */}
                    {user && (
                      <div className="flex items-center gap-4 pt-1 text-[11px] text-zinc-500">
                        <button
                          onClick={() => {
                            setReplyToCommentId(
                              replyToCommentId === comment.comment_id ? null : comment.comment_id
                            )
                            setReplyContent("")
                          }}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          <Reply className="w-3 h-3" />
                          Reply
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment.comment_id)}
                            className="flex items-center gap-1 hover:text-red-400 text-zinc-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Reply Input */}
                {replyToCommentId === comment.comment_id && user && (
                  <form
                    onSubmit={(e) => handlePostReply(e, comment.comment_id)}
                    className="pl-13 mt-4 space-y-3"
                  >
                    <textarea
                      required
                      rows={2}
                      placeholder={`Reply to ${comment.profiles?.full_name || "Academy Member"}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary/80 transition-colors resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setReplyToCommentId(null)}
                        className="text-zinc-400 hover:text-white text-xs px-4 py-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={addCommentMutation.isPending || !replyContent.trim()}
                        className="bg-[#9ACD32] hover:bg-[#9ACD32]/90 text-black text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-all"
                        style={{ backgroundColor: '#9ACD32', color: '#000' }}
                      >
                        {addCommentMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Reply
                      </Button>
                    </div>
                  </form>
                )}

                {/* Replies Thread */}
                {replies.length > 0 && (
                  <div className="pl-12 space-y-4 border-l border-zinc-850/50 ml-[18px] mt-4">
                    {replies.map((reply: any) => {
                      const canDeleteReply =
                        user &&
                        (user.id === reply.user_id ||
                          profile?.role === "admin" ||
                          profile?.role === "instructor")

                      return (
                        <div key={reply.comment_id} className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                            {reply.profiles?.avatar_url ? (
                              <img src={reply.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-zinc-650" />
                            )}
                          </div>

                          <div className="space-y-1 min-w-0 flex-grow">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-zinc-200 text-xs truncate">
                                {reply.profiles?.full_name || "Academy Member"}
                              </strong>
                              {getRoleBadge(reply.profiles?.role || "student")}
                              <span className="text-[10px] text-zinc-500">
                                {formatDate(reply.created_at)}
                              </span>
                            </div>

                            <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-line">
                              {reply.content}
                            </p>

                            {/* Reply deletion */}
                            {canDeleteReply && (
                              <div className="pt-0.5">
                                <button
                                  onClick={() => handleDeleteComment(reply.comment_id)}
                                  className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
