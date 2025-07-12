"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/client-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ArrowUp, ArrowDown, Eye, MessageSquare, Edit, Share, Check, Reply, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"

interface Answer {
  id: string
  content: string
  voteCount: number
  isAccepted: boolean
  createdAt: string
  author: {
    id: string
    username: string
    name?: string
    avatar?: string
    reputation: number
  }
  replies: Answer[]
  parentId?: string
}

export default function QuestionDetailPage() {
  const [question, setQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [answerContent, setAnswerContent] = useState("")
  const [replyContent, setReplyContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})

  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchQuestion()
  }, [params.slug])

  const fetchQuestion = async () => {
    try {
      const response = await fetch(`/api/questions/slug/${params.slug}`)
      const data = await response.json()

      if (response.ok) {
        setQuestion(data.question)
        // Fetch user votes
        if (user) {
          fetchUserVotes(data.question.id)
        }
      } else {
        toast({
          title: "Error",
          description: "Question not found",
          variant: "destructive",
        })
        router.push("/questions")
      }
    } catch (error) {
      console.error("Failed to fetch question:", error)
      toast({
        title: "Error",
        description: "Failed to load question",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserVotes = async (questionId: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}/user-votes`)
      if (response.ok) {
        const data = await response.json()
        setUserVotes(data.votes)
      }
    } catch (error) {
      console.error("Failed to fetch user votes:", error)
    }
  }

  const handleVoteQuestion = async (type: "UP" | "DOWN") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote on questions.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/questions/${question.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuestion({ ...question, voteCount: data.voteCount })
        setUserVotes({ ...userVotes, [`question_${question.id}`]: data.userVote })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record vote",
        variant: "destructive",
      })
    }
  }

  const handleVoteAnswer = async (answerId: string, type: "UP" | "DOWN") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote on answers.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/answers/${answerId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      if (response.ok) {
        const data = await response.json()
        updateAnswerVotes(answerId, data.voteCount)
        setUserVotes({ ...userVotes, [`answer_${answerId}`]: data.userVote })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record vote",
        variant: "destructive",
      })
    }
  }

  const updateAnswerVotes = (answerId: string, newVoteCount: number) => {
    const updateAnswers = (answers: Answer[]): Answer[] => {
      return answers.map((answer) => {
        if (answer.id === answerId) {
          return { ...answer, voteCount: newVoteCount }
        }
        if (answer.replies.length > 0) {
          return { ...answer, replies: updateAnswers(answer.replies) }
        }
        return answer
      })
    }

    setQuestion({
      ...question,
      answers: updateAnswers(question.answers),
    })
  }

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      const response = await fetch(`/api/answers/${answerId}/accept`, {
        method: "POST",
      })

      if (response.ok) {
        setQuestion({
          ...question,
          isResolved: true,
          acceptedAnswerId: answerId,
          answers: question.answers.map((answer: any) => ({
            ...answer,
            isAccepted: answer.id === answerId,
          })),
        })
        toast({
          title: "Answer accepted",
          description: "This answer has been marked as the solution.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept answer",
        variant: "destructive",
      })
    }
  }

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to post an answer.",
        variant: "destructive",
      })
      return
    }

    if (!answerContent.trim()) {
      toast({
        title: "Content required",
        description: "Please provide an answer before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingAnswer(true)
    try {
      const response = await fetch(`/api/questions/${question.id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: answerContent }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuestion({
          ...question,
          answers: [...question.answers, data.answer],
          _count: { ...question._count, answers: question._count.answers + 1 },
        })
        setAnswerContent("")
        toast({
          title: "Answer posted",
          description: "Your answer has been posted successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post answer",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to reply.",
        variant: "destructive",
      })
      return
    }

    if (!replyContent.trim()) {
      toast({
        title: "Content required",
        description: "Please provide a reply before submitting.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/answers/${parentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      })

      if (response.ok) {
        const data = await response.json()
        // Add reply to the parent answer
        const addReplyToAnswers = (answers: Answer[]): Answer[] => {
          return answers.map((answer) => {
            if (answer.id === parentId) {
              return { ...answer, replies: [...answer.replies, data.reply] }
            }
            if (answer.replies.length > 0) {
              return { ...answer, replies: addReplyToAnswers(answer.replies) }
            }
            return answer
          })
        }

        setQuestion({
          ...question,
          answers: addReplyToAnswers(question.answers),
        })
        setReplyContent("")
        setReplyingTo(null)
        toast({
          title: "Reply posted",
          description: "Your reply has been posted successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      })
    }
  }

  const renderAnswer = (answer: Answer, depth = 0) => {
    const isQuestionAuthor = user?.id === question.author.id
    const isAnswerAuthor = user?.id === answer.author.id
    const canEdit = isAnswerAuthor || user?.isAdmin
    const userVote = userVotes[`answer_${answer.id}`]

    return (
      <motion.div
        key={answer.id}
        className={`border rounded-lg p-6 ${answer.isAccepted ? "border-green-200 bg-green-50" : "bg-white"} ${depth > 0 ? "ml-8 mt-4" : ""}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start gap-4">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVoteAnswer(answer.id, "UP")}
              className={`p-1 h-8 w-8 ${userVote === "UP" ? "text-blue-600 bg-blue-50" : ""}`}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-lg">{answer.voteCount}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVoteAnswer(answer.id, "DOWN")}
              className={`p-1 h-8 w-8 ${userVote === "DOWN" ? "text-red-600 bg-red-50" : ""}`}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            {isQuestionAuthor && !answer.isAccepted && depth === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAcceptAnswer(answer.id)}
                className="p-1 h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                title="Accept this answer"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            {answer.isAccepted && (
              <div className="p-1 h-8 w-8 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
            )}
          </div>

          {/* Answer content */}
          <div className="flex-1">
            <div className="prose max-w-none mb-4" dangerouslySetInnerHTML={{ __html: answer.content }} />

            {/* Answer actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {answer.isAccepted && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <Check className="w-3 h-3 mr-1" />
                    Accepted Answer
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(replyingTo === answer.id ? null : answer.id)}
                  className="h-8 px-2"
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Edit className="w-3 h-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {user?.isAdmin && <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Author info */}
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={answer.author.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {answer.author.name?.charAt(0) || answer.author.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right text-sm">
                  <Link href={`/profile/${answer.author.id}`} className="font-medium hover:text-blue-600">
                    {answer.author.name || answer.author.username}
                  </Link>
                  <div className="text-gray-500 text-xs">{answer.author.reputation} reputation</div>
                  <div className="text-gray-500 text-xs">
                    {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>

            {/* Reply form */}
            <AnimatePresence>
              {replyingTo === answer.id && (
                <motion.div
                  className="mt-4 p-4 bg-gray-50 rounded-lg"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <RichTextEditor
                    value={replyContent}
                    onChange={setReplyContent}
                    placeholder="Write your reply..."
                    className="mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleSubmitReply(answer.id)}>Post Reply</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Render replies */}
            {answer.replies && answer.replies.length > 0 && (
              <div className="mt-4">{answer.replies.map((reply) => renderAnswer(reply, depth + 1))}</div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-6 w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Question not found</h1>
        <Link href="/questions">
          <Button>Browse Questions</Button>
        </Link>
      </div>
    )
  }

  const isQuestionAuthor = user?.id === question.author.id
  const canEdit = isQuestionAuthor || user?.isAdmin
  const userQuestionVote = userVotes[`question_${question.id}`]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Question */}
      <motion.div
        className="bg-white border rounded-lg p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start gap-6">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVoteQuestion("UP")}
              className={`p-2 h-10 w-10 ${userQuestionVote === "UP" ? "text-blue-600 bg-blue-50" : ""}`}
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
            <span className="font-bold text-xl">{question.voteCount}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVoteQuestion("DOWN")}
              className={`p-2 h-10 w-10 ${userQuestionVote === "DOWN" ? "text-red-600 bg-red-50" : ""}`}
            >
              <ArrowDown className="w-5 h-5" />
            </Button>
          </div>

          {/* Question content */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-4">{question.title}</h1>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{question.views} views</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{question._count.answers} answers</span>
              </div>
              {question.isResolved && <Badge className="bg-green-100 text-green-800">Resolved</Badge>}
            </div>

            <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: question.content }} />

            <div className="flex flex-wrap gap-2 mb-6">
              {question.tags.map(({ tag }: any) => (
                <Link key={tag.id} href={`/tags/${tag.name}`}>
                  <Badge variant="secondary" className="hover:bg-gray-200 cursor-pointer">
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Link href={`/questions/${question.slug}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                  <Share className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={question.author.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {question.author.name?.charAt(0) || question.author.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link href={`/profile/${question.author.id}`} className="font-medium hover:text-blue-600">
                    {question.author.name || question.author.username}
                  </Link>
                  <div className="text-sm text-gray-500">
                    {question.author.reputation} reputation •{" "}
                    {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Answers */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">
          {question._count.answers} {question._count.answers === 1 ? "Answer" : "Answers"}
        </h2>

        {question.answers.length > 0 ? (
          <div className="space-y-4">{question.answers.map((answer: Answer) => renderAnswer(answer))}</div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No answers yet. Be the first to help!</p>
          </div>
        )}
      </div>

      {/* Answer form */}
      {user ? (
        <motion.div
          className="bg-white border rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4">Your Answer</h3>
          <form onSubmit={handleSubmitAnswer}>
            <RichTextEditor
              value={answerContent}
              onChange={setAnswerContent}
              placeholder="Write your answer here..."
              className="mb-4"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmittingAnswer || !answerContent.trim()}>
                {isSubmittingAnswer ? "Posting..." : "Post Answer"}
              </Button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="bg-gray-50 border rounded-lg p-6 text-center">
          <p className="mb-4">Please log in to post an answer.</p>
          <Link href="/auth/login">
            <Button>Log In</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
