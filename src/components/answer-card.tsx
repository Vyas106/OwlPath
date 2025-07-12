"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Check, Edit, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
// import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

interface AnswerCardProps {
  answer: {
    id: string
    content: string
    votes: number
    isAccepted: boolean
    createdAt: string
    author: {
      id: string
      username: string
      name?: string
      avatar?: string
      reputation: number
    }
  }
  questionAuthorId: string
  onVote?: (answerId: string, type: "UP" | "DOWN") => void
  onAccept?: (answerId: string) => void
  onEdit?: (answerId: string) => void
  onDelete?: (answerId: string) => void
}

export function AnswerCard({ answer, questionAuthorId, onVote, onAccept, onEdit, onDelete }: AnswerCardProps) {
  // const { data: session } = useSession()
  const { toast } = useToast()
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (type: "UP" | "DOWN") => {
    // if (!session) {
    //   toast({
    //     title: "Authentication required",
    //     description: "Please log in to vote on answers.",
    //     variant: "destructive",
    //   })
    //   return
    // }

    setIsVoting(true)
    try {
      await onVote?.(answer.id, type)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  const handleAccept = async () => {
    // if (!session) {
    //   toast({
    //     title: "Authentication required",
    //     description: "Please log in to accept answers.",
    //     variant: "destructive",
    //   })
    //   return
    // }

    try {
      await onAccept?.(answer.id)
      toast({
        title: "Answer accepted",
        description: "This answer has been marked as the solution.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept answer. Please try again.",
        variant: "destructive",
      })
    }
  }

  // const isQuestionAuthor = session?.user?.id === questionAuthorId
  // const isAnswerAuthor = session?.user?.id === answer.author.id
  // const canEdit = isAnswerAuthor || session?.user?.isAdmin
  // const canDelete = session?.user?.isAdmin

  return (
    <Card className={`${answer.isAccepted ? "border-green-200 bg-green-50" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("UP")}
              disabled={isVoting}
              className="p-1 h-8 w-8"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-lg">{answer.votes}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("DOWN")}
              disabled={isVoting}
              className="p-1 h-8 w-8"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            {isQuestionAuthor && !answer.isAccepted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAccept}
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

          <div className="flex-1">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: answer.content }} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {answer.isAccepted && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <Check className="w-3 h-3 mr-1" />
                Accepted Answer
              </Badge>
            )}
            {(canEdit || canDelete) && (
              <div className="flex gap-1">
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit?.(answer.id)} className="h-8 px-2">
                    <Edit className="w-3 h-3" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete?.(answer.id)}
                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={answer.author.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {answer.author.name?.charAt(0) || answer.author.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-right text-sm">
              <div className="font-medium">{answer.author.name || answer.author.username}</div>
              <div className="text-gray-500 text-xs">{answer.author.reputation} reputation</div>
              <div className="text-gray-500 text-xs">
                {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
