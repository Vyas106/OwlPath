"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/client-auth"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { User, Mail, Calendar, Award, MessageSquare, Edit, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
  })
  const [userStats, setUserStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
      })
      fetchUserStats()
    }
  }, [user])

  const fetchUserStats = async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/users/${user.id}`)
      const data = await response.json()
      setUserStats(data)
    } catch (error) {
      console.error("Failed to fetch user stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser.user)
        setIsEditing(false)
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!user || loading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 mt-2">Manage your account information and activity</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <AnimatedCard>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Profile Information
                  </CardTitle>
                  {!isEditing ? (
                    <AnimatedButton variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </AnimatedButton>
                  ) : (
                    <div className="flex gap-2">
                      <AnimatedButton onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </AnimatedButton>
                      <AnimatedButton variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4" />
                      </AnimatedButton>
                    </div>
                  )}
                </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 p-2 bg-gray-50 rounded">{user.name || "Not set"}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.email}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="mt-1"
                      rows={3}
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-gray-50 rounded min-h-[80px]">{user.bio || "No bio added yet."}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Member since {formatDistanceToNow(new Date(user.createdAt || Date.now()), { addSuffix: true })}
                </div>
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <AnimatedCard delay={0.2}>
              <CardHeader>
                <CardTitle className="text-lg">Activity Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Questions</span>
                  </div>
                  <span className="font-bold">{userStats?.user?._count?.questions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Answers</span>
                  </div>
                  <span className="font-bold">{userStats?.user?._count?.answers || 0}</span>
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

            {/* Recent Questions */}
            {userStats?.questions?.length > 0 && (
              <AnimatedCard delay={0.3}>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userStats.questions.slice(0, 3).map((question: any, index: number) => (
                      <motion.div
                        key={question.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <p className="font-medium text-sm line-clamp-2">{question.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {question._count.answers} answers
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
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
