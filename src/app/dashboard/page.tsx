"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/client-auth"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Users, MessageSquare, Award, TrendingUp, Plus, Eye, Calendar, Activity, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchDashboardData()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, {user.name || user.username}!
              </h1>
              <p className="text-gray-600 mt-2">Here's what's happening in your community</p>
            </div>
            <div className="flex gap-3">
              <Link href="/ask">
                <AnimatedButton >
                  <Plus className="w-4 h-4 mr-2" />
                  Ask Question
                </AnimatedButton>
              </Link>
              <Link href="/questions">
                <AnimatedButton >
                  <Eye className="w-4 h-4 mr-2" />
                  Browse Questions
                </AnimatedButton>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Your Questions",
              value: stats?.stats?.userQuestions || 0,
              icon: MessageSquare,
              color: "blue",
              change: "+12%",
            },
            {
              title: "Your Answers",
              value: stats?.stats?.userAnswers || 0,
              icon: Award,
              color: "green",
              change: "+8%",
            },
            {
              title: "Reputation",
              value: user.reputation,
              icon: TrendingUp,
              color: "purple",
              change: "+15%",
            },
            {
              title: "Total Users",
              value: stats?.stats?.totalUsers || 0,
              icon: Users,
              color: "orange",
              change: "+5%",
            },
          ].map((stat, index) => (
            <AnimatedCard key={index} delay={index * 0.1}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
                  </div>
                  <motion.div
                    className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </motion.div>
                </div>
              </CardContent>
            </AnimatedCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Questions */}
          <AnimatedCard delay={0.5}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Recent Questions
              </CardTitle>
              <CardDescription>Latest questions from the community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentQuestions?.map((question: any, index: number) => (
                  <motion.div
                    key={question.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={question.author.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {question.author.name?.charAt(0) || question.author.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link href={`/questions/${question.slug}`} className="hover:text-blue-600">
                        <p className="font-medium text-sm line-clamp-2">{question.title}</p>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">by {question.author.username}</span>
                        <Badge variant="secondary" className="text-xs">
                          {question._count.answers} answers
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/questions">
                  <AnimatedButton variant="outline" className="w-full">
                    View All Questions
                  </AnimatedButton>
                </Link>
              </div>
            </CardContent>
          </AnimatedCard>

          {/* Top Users */}
          <AnimatedCard delay={0.6}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Top Contributors
              </CardTitle>
              <CardDescription>Users with highest reputation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topUsers?.map((topUser: any, index: number) => (
                  <motion.div
                    key={topUser.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ x: -4 }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={topUser.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {topUser.name?.charAt(0) || topUser.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <Link href={`/dashboard/profile/${topUser.id}`} className="hover:text-blue-600">
                          <p className="font-medium">{topUser.name || topUser.username}</p>
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{topUser._count.questions} questions</span>
                          <span>•</span>
                          <span>{topUser._count.answers} answers</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{topUser.reputation}</p>
                      <p className="text-xs text-gray-500">reputation</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/dashboard/users">
                  <AnimatedButton variant="outline" className="w-full">
                    View All Users
                  </AnimatedButton>
                </Link>
              </div>
            </CardContent>
          </AnimatedCard>
        </div>

        {/* Quick Actions */}
        <motion.div
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Link href="/dashboard/profile">
            <AnimatedCard className="cursor-pointer hover:border-blue-300">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">My Profile</h3>
                <p className="text-sm text-gray-600">View and edit your profile information</p>
              </CardContent>
            </AnimatedCard>
          </Link>

          <Link href="/dashboard/notifications">
            <AnimatedCard className="cursor-pointer hover:border-purple-300">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Notifications</h3>
                <p className="text-sm text-gray-600">Check your latest notifications</p>
              </CardContent>
            </AnimatedCard>
          </Link>

          {user.isAdmin && (
            <Link href="/dashboard/admin">
              <AnimatedCard className="cursor-pointer hover:border-red-300">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 text-red-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Admin Panel</h3>
                  <p className="text-sm text-gray-600">Manage users and content</p>
                </CardContent>
              </AnimatedCard>
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  )
}
