"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/client-auth"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Check, CheckCheck, MessageSquare, Award, Users, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function NotificationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, unread, read

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      })

      if (response.ok) {
        setNotifications(
          notifications.map((notif: any) => (notif.id === notificationId ? { ...notif, isRead: true } : notif)),
        )
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
      })

      if (response.ok) {
        setNotifications(notifications.map((notif: any) => ({ ...notif, isRead: true })))
        toast({
          title: "Success",
          description: "All notifications marked as read.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "QUESTION_ANSWERED":
        return <MessageSquare className="w-5 h-5 text-blue-600" />
      case "ANSWER_ACCEPTED":
        return <Award className="w-5 h-5 text-green-600" />
      case "USER_FOLLOWED":
        return <Users className="w-5 h-5 text-purple-600" />
      case "QUESTION_VOTED":
      case "ANSWER_VOTED":
        return <Award className="w-5 h-5 text-orange-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const filteredNotifications = notifications.filter((notif: any) => {
    if (filter === "unread") return !notif.isRead
    if (filter === "read") return notif.isRead
    return true
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view notifications</h1>
          <Link href="/auth/login">
            <AnimatedButton>Log In</AnimatedButton>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg mb-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
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
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Notifications
              </h1>
              <p className="text-gray-600 mt-2">Stay updated with your activity</p>
            </div>
            <div className="flex gap-2">
              <AnimatedButton
                variant="outline"
                onClick={markAllAsRead}
                disabled={notifications.every((notif: any) => notif.isRead)}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </AnimatedButton>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all", label: "All", count: notifications.length },
            { key: "unread", label: "Unread", count: notifications.filter((n: any) => !n.isRead).length },
            { key: "read", label: "Read", count: notifications.filter((n: any) => n.isRead).length },
          ].map((tab) => (
            <AnimatedButton
              key={tab.key}
              variant={filter === tab.key ? "default" : "outline"}
              onClick={() => setFilter(tab.key)}
              className={filter === tab.key ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : ""}
            >
              {tab.label} ({tab.count})
            </AnimatedButton>
          ))}
        </div>

        {/* Notifications List */}
        <AnimatePresence>
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification: any, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AnimatedCard
                    className={`cursor-pointer transition-all duration-200 ${
                      !notification.isRead ? "border-blue-200 bg-blue-50" : "bg-white"
                    }`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                              <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                                {!notification.isRead && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                    New
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {!notification.isRead && (
                              <motion.button
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Check className="w-4 h-4 text-gray-400" />
                              </motion.button>
                            )}
                          </div>
                          {notification.question && (
                            <Link
                              href={`/questions/${notification.question.slug}`}
                              className="inline-block mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Question →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="text-center py-16 bg-white rounded-xl shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Bell className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                {filter === "unread" ? "No unread notifications" : "No notifications"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {filter === "unread"
                  ? "You're all caught up! Check back later for new updates."
                  : "When you get notifications, they'll appear here."}
              </p>
              <Link href="/questions">
                <AnimatedButton className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  Browse Questions
                </AnimatedButton>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
