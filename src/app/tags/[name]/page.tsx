"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/client-auth"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { QuestionCard } from "@/components/question-card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Tag, Users, MessageSquare, ArrowLeft, Plus, Minus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function TagPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [tagData, setTagData] = useState<any>(null)
  const [questions, setQuestions] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTagData()
    if (user) {
      checkFollowStatus()
    }
  }, [params.name, user])

  const fetchTagData = async () => {
    try {
      const [tagResponse, questionsResponse] = await Promise.all([
        fetch(`/api/tags/${params.name}`),
        fetch(`/api/tags/${params.name}/questions`),
      ])

      const tagData = await tagResponse.json()
      const questionsData = await questionsResponse.json()

      setTagData(tagData.tag)
      setQuestions(questionsData.questions || [])
    } catch (error) {
      console.error("Failed to fetch tag data:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkFollowStatus = async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/tags/${params.name}/follow-status`)
      const data = await response.json()
      setIsFollowing(data.isFollowing)
    } catch (error) {
      console.error("Failed to check follow status:", error)
    }
  }

  const handleFollowToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow tags.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/tags/${params.name}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        toast({
          title: isFollowing ? "Unfollowed" : "Following",
          description: `You are ${isFollowing ? "no longer following" : "now following"} the ${params.name} tag.`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!tagData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Tag not found</h1>
          <Link href="/questions">
            <AnimatedButton>Browse Questions</AnimatedButton>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/questions" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Questions
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Badge
                  className="text-2xl px-6 py-3"
                  style={{ backgroundColor: `${tagData.color}20`, color: tagData.color }}
                >
                  <Tag className="w-6 h-6 mr-2" />
                  {tagData.name}
                </Badge>
                {user && (
                  <AnimatedButton
                    onClick={handleFollowToggle}
                    variant={isFollowing ? "outline" : "default"}
                    className={isFollowing ? "" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"}
                  >
                    {isFollowing ? (
                      <>
                        <Minus className="w-4 h-4 mr-2" />
                        Unfollow Tag
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Follow Tag
                      </>
                    )}
                  </AnimatedButton>
                )}
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Questions tagged "{tagData.name}"
              </h1>
              <p className="text-gray-600">{tagData.description || `All questions related to ${tagData.name}`}</p>
            </div>
            <Link href="/ask">
              <AnimatedButton className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                Ask Question
              </AnimatedButton>
            </Link>
          </div>
        </motion.div>

        {/* Tag Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AnimatedCard>
            <div className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{tagData._count.questions}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
          </AnimatedCard>
          <AnimatedCard delay={0.1}>
            <div className="p-6 text-center">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{tagData._count.followers || 0}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
          </AnimatedCard>
          <AnimatedCard delay={0.2}>
            <div className="p-6 text-center">
              <Tag className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">#{tagData.name}</div>
              <div className="text-sm text-gray-600">Tag</div>
            </div>
          </AnimatedCard>
        </div>

        {/* Questions */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {questions.length} {questions.length === 1 ? "Question" : "Questions"}
          </h2>

          {questions.length > 0 ? (
            <div className="space-y-6">
              {questions.map((question: any, index) => (
                <QuestionCard key={question.id} question={question} delay={index * 0.1} />
              ))}
            </div>
          ) : (
            <motion.div
              className="text-center py-16 bg-white rounded-xl shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Tag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">No questions yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Be the first to ask a question about {tagData.name}!
              </p>
              <Link href="/ask">
                <AnimatedButton className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  Ask the First Question
                </AnimatedButton>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
