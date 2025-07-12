"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/client-auth"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { User, Calendar, Award, MessageSquare, ArrowLeft, UserPlus, UserMinus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function UserProfilePage() {
  const params = useParams()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [userData, setUserData] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
    if (currentUser) {
      checkFollowStatus()
    }
  }, [params.id, currentUser])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`)
      const data = await response.json()
      setUserData(data)
    } catch (error) {
      console.error("Failed to fetch user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkFollowStatus = async () => {
    if (!currentUser) return
    try {
      const response = await fetch(`/api/users/${params.id}/follow-status`)
      const data = await response.json()
      setIsFollowing(data.isFollowing)
    } catch (error) {
      console.error("Failed to check follow status:", error)
    }
  }

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/users/${params.id}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        toast({
          title: isFollowing ? "Unfollowed" : "Following",
          description: `You are ${isFollowing ? "no longer following" : "now following"} ${userData.user.name || userData.user.username}.`,
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
        <div className="max-w-4xl mx-auto">
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

  if (!userData?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <Link href="/questions">
            <AnimatedButton>Browse Questions</AnimatedButton>
          </Link>
        </div>
      </div>
    )
  }

  const { user, questions, answers } = userData
  const isOwnProfile = currentUser?.id === user.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {user.name || user.username}'s Profile
              </h1>
              <p className="text-gray-600 mt-2">View user activity and contributions</p>
            </div>
            {!isOwnProfile && currentUser && (
              <AnimatedButton
                onClick={handleFollowToggle}
                variant={isFollowing ? "outline" : "default"}
                className={isFollowing ? "" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </AnimatedButton>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <AnimatedCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Avatar className="w-24 h-24 ring-4 ring-blue-100">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {user.name?.charAt(0) || user.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold">{user.name || user.username}</h2>
                    <p className="text-gray-600">@{user.username}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {user.reputation} reputation
                      </Badge>
                      {user.isAdmin && <Badge variant="destructive">Admin</Badge>}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-gray-600">{user.bio || "No bio added yet."}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Member since {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Recent Questions */}
            {questions?.length > 0 && (
              <AnimatedCard delay={0.2} className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Questions</CardTitle>
                  <CardDescription>Latest questions by this user</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {questions.map((question: any, index: number) => (
                      <motion.div
                        key={question.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <Link href={`/questions/${question.slug}`} className="hover:text-blue-600">
                          <h4 className="font-medium mb-2">{question.title}</h4>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="secondary">{question._count.answers} answers</Badge>
                          <Badge variant="outline">{question.voteCount} votes</Badge>
                          <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {question.tags.map(({ tag }: any) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </AnimatedCard>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <AnimatedCard delay={0.1}>
              <CardHeader>
                <CardTitle className="text-lg">Activity Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Questions</span>
                  </div>
                  <span className="font-bold">{user._count.questions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Answers</span>
                  </div>
                  <span className="font-bold">{user._count.answers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">Reputation</span>
                  </div>
                  <span className="font-bold text-purple-600">{user.reputation}</span>
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Recent Answers */}
            {answers?.length > 0 && (
              <AnimatedCard delay={0.3}>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {answers.slice(0, 3).map((answer: any, index: number) => (
                      <motion.div
                        key={answer.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <Link href={`/questions/${answer.question.slug}`} className="hover:text-blue-600">
                          <p className="font-medium text-sm line-clamp-2">{answer.question.title}</p>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {answer.voteCount} votes
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </AnimatedCard>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
