"use client"

import Link from "next/link"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Users, Award, TrendingUp, ArrowRight, Sparkles, Zap, Target } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

function PopularTags() {
  const [tags, setTags] = useState([])

  useEffect(() => {
    fetch("/api/tags/popular")
      .then((res) => res.json())
      .then((data) => setTags(data.tags || []))
      .catch(console.error)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-4"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {tags.map((tag: any, index) => (
        <motion.div key={tag.id} variants={itemVariants}>
          <Link href={`/tags/${tag.name}`}>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Badge
                variant="secondary"
                className="px-6 py-3 text-sm font-medium cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name} ({tag._count.questions})
              </Badge>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <motion.div
          className="absolute inset-0 bg-grid-pattern opacity-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 2 }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div className="text-center" variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants} className="mb-6">
              <motion.div
                className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-4 h-4" />
                Welcome to the future of Q&A
              </motion.div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Ask. Answer. Learn.{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Together.
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join our vibrant community of developers sharing knowledge, solving problems, and growing together. Get
              answers to your coding questions and help others learn.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/questions">
                <AnimatedButton
                  size="lg"
                  className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl"
                >
                  <motion.div className="flex items-center gap-2">
                    Browse Questions
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                </AnimatedButton>
              </Link>
              <Link href="/auth/register">
                <AnimatedButton
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-4 border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 bg-white/80 backdrop-blur-sm"
                >
                  Join Community
                </AnimatedButton>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-16 h-16 bg-purple-200 rounded-full opacity-20"
          animate={{
            y: [0, 20, 0],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </section>

     
      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How StackIt Works</h2>
            <p className="text-xl text-gray-600">Simple steps to get help and help others</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: MessageSquare,
                title: "Ask Questions",
                description:
                  "Post your coding questions with detailed descriptions and relevant tags. Our community is here to help you solve any programming challenge.",
                color: "blue",
              },
              {
                icon: Users,
                title: "Get Answers",
                description:
                  "Receive detailed answers from experienced developers. Vote on the best answers and mark the solution that helped you most.",
                color: "green",
              },
              {
                icon: Award,
                title: "Build Reputation",
                description:
                  "Help others by answering questions and earn reputation points. Build your profile and become a trusted member of the community.",
                color: "purple",
              },
            ].map((step, index) => (
              <AnimatedCard key={index} delay={index * 0.1} className="text-center group">
                <CardHeader>
                  <motion.div
                    className={`w-20 h-20 bg-gradient-to-br from-${step.color}-100 to-${step.color}-200 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow duration-300`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <step.icon className={`w-10 h-10 text-${step.color}-600`} />
                  </motion.div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">{step.description}</CardDescription>
                </CardContent>
              </AnimatedCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Popular Tags */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Topics</h2>
            <p className="text-xl text-gray-600">Explore questions by technology</p>
          </motion.div>

          <PopularTags />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-black/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Join the Community?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Start asking questions, sharing knowledge, and connecting with developers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <AnimatedButton
                  size="lg"
                  className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 shadow-xl"
                >
                  <motion.div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Sign Up Free
                  </motion.div>
                </AnimatedButton>
              </Link>
              <Link href="/ask">
                <AnimatedButton
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
                >
                  <motion.div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Ask Your First Question
                  </motion.div>
                </AnimatedButton>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Animated background elements */}
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.1, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </section>
    </div>
  )
}
