"use client"

import Link from "next/link"
import { AnimatedCard } from "@/components/ui/animated-card"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Eye, ArrowUp, Check, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"

interface QuestionCardProps {
  question: {
    id: string
    title: string
    content: string
    slug: string
    votes: number
    views: number
    isResolved: boolean
    createdAt: string
    author: {
      id: string
      username: string
      name?: string
      avatar?: string
      reputation: number
    }
    tags: Array<{
      tag: {
        id: string
        name: string
        color: string
      }
    }>
    _count: {
      answers: number
    }
  }
  delay?: number
}

export function QuestionCard({ question, delay = 0 }: QuestionCardProps) {
  return (
    <AnimatedCard delay={delay} >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link href={`/questions/${question.slug}`} className="block group">
              <motion.h3
                className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors duration-200"
                whileHover={{ x: 4 }}
              >
                {question.title}
              </motion.h3>
            </Link>
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
              {question.content.replace(/<[^>]*>/g, "").substring(0, 150)}...
            </p>
          </div>
          {question.isResolved && (
            <motion.div
              className="flex items-center text-green-600 bg-green-50 p-2 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2 }}
            >
              <Check className="w-5 h-5" />
            </motion.div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <motion.div
          className="flex flex-wrap gap-2 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1 }}
        >
          {question.tags.map(({ tag }, index) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.1 + index * 0.05 }}
            >
              <Link href={`/questions?tag=${tag.name}`}>
                <Badge
                  variant="secondary"
                  className="text-xs hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-colors duration-200"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </Badge>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2 }}
          >
            <motion.div
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <ArrowUp className="w-4 h-4" />
              <span className="font-medium">{question.votes}</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-1 hover:text-green-600 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{question._count.answers}</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-1 hover:text-purple-600 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <Eye className="w-4 h-4" />
              <span>{question.views}</span>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.1 }}>
              <Avatar className="w-8 h-8 ring-2 ring-gray-100">
                <AvatarImage src={question.author.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {question.author.name?.charAt(0) || question.author.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="text-right">
              <div className="font-medium hover:text-blue-600 transition-colors cursor-pointer">
                {question.author.name || question.author.username}
              </div>
              <div className="text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </AnimatedCard>
  )
}
