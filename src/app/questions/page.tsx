"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { QuestionCard } from "@/components/question-card"
import { Search, Plus, X, Filter, SortAsc } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [sortBy, setSortBy] = useState("recent")

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const tag = searchParams.get("tag") || ""
    const search = searchParams.get("search") || ""
    const sort = searchParams.get("sort") || "recent"
    const page = Number.parseInt(searchParams.get("page") || "1")

    setSelectedTag(tag)
    setSearchTerm(search)
    setSortBy(sort)

    fetchQuestions(page, search, tag, sort)
  }, [searchParams])

  const fetchQuestions = async (page = 1, search = "", tag = "", sort = "recent") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(tag && { tag }),
        sort,
      })

      const response = await fetch(`/api/questions?${params}`)
      const data = await response.json()

      setQuestions(data.questions || [])
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (error) {
      console.error("Failed to fetch questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    if (updates.search !== undefined || updates.tag !== undefined || updates.sort !== undefined) {
      params.set("page", "1")
    }

    router.push(`/questions?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL({ search: searchTerm })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedTag("")
    setSortBy("recent")
    router.push("/questions")
  }

  const popularTags = ["javascript", "react", "nextjs", "typescript", "nodejs", "css", "html", "database"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <motion.div
            className="lg:w-64 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Popular Tags</h3>
              </div>
              <div className="space-y-2">
                {popularTags.map((tag, index) => (
                  <motion.button
                    key={tag}
                    onClick={() => updateURL({ tag: selectedTag === tag ? "" : tag })}
                    className="block w-full text-left"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <Badge
                      variant={selectedTag === tag ? "default" : "secondary"}
                      className={`w-full justify-start cursor-pointer transition-all duration-200 ${
                        selectedTag === tag
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                          : "hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {tag}
                    </Badge>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                  All Questions
                </h1>
                <motion.p
                  className="text-gray-600 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {pagination.total} questions found
                </motion.p>
              </div>
              <Link href="/ask">
                <AnimatedButton className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Ask Question
                </AnimatedButton>
              </Link>
            </motion.div>

            {/* Filters */}
            <motion.div
              className="bg-white rounded-xl p-6 mb-8 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="search"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <SortAsc className="w-5 h-5 text-gray-400" />
                  <Select value={sortBy} onValueChange={(value) => updateURL({ sort: value })}>
                    <SelectTrigger className="w-full sm:w-40 h-12">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="votes">Most Voted</SelectItem>
                      <SelectItem value="views">Most Viewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <AnimatedButton type="submit" className="h-12 px-6">
                  Search
                </AnimatedButton>
                {(searchTerm || selectedTag || sortBy !== "recent") && (
                  <AnimatedButton type="button" variant="outline" onClick={clearFilters} className="h-12 px-6">
                    Clear
                  </AnimatedButton>
                )}
              </form>

              <AnimatePresence>
                {(selectedTag || searchTerm) && (
                  <motion.div
                    className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                    {selectedTag && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-700">
                          Tag: {selectedTag}
                          <button onClick={() => updateURL({ tag: "" })}>
                            <X className="w-3 h-3 hover:text-red-500" />
                          </button>
                        </Badge>
                      </motion.div>
                    )}
                    {searchTerm && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700">
                          Search: {searchTerm}
                          <button onClick={() => updateURL({ search: "" })}>
                            <X className="w-3 h-3 hover:text-red-500" />
                          </button>
                        </Badge>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Questions List */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="bg-white rounded-xl p-6 shadow-lg animate-pulse"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="h-6 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                      <div className="flex gap-2 mb-4">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex gap-4">
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : questions.length > 0 ? (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {questions.map((question: any, index) => (
                    <QuestionCard key={question.id} question={question} delay={index * 0.1} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  className="text-center py-16 bg-white rounded-xl shadow-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <motion.div
                    className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Search className="w-12 h-12 text-gray-400" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">No questions found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm || selectedTag
                      ? "Try adjusting your search criteria or browse all questions."
                      : "Be the first to ask a question!"}
                  </p>
                  <Link href="/ask">
                    <AnimatedButton className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      Ask the First Question
                    </AnimatedButton>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <motion.div
                className="flex justify-center gap-2 mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <AnimatedButton
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() => updateURL({ page: (pagination.page - 1).toString() })}
                  className="bg-white shadow-md"
                >
                  Previous
                </AnimatedButton>

                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                  const page = i + 1
                  return (
                    <AnimatedButton
                      key={page}
                      variant={pagination.page === page ? "default" : "outline"}
                      onClick={() => updateURL({ page: page.toString() })}
                      className={
                        pagination.page === page
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                          : "bg-white shadow-md"
                      }
                    >
                      {page}
                    </AnimatedButton>
                  )
                })}

                <AnimatedButton
                  variant="outline"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => updateURL({ page: (pagination.page + 1).toString() })}
                  className="bg-white shadow-md"
                >
                  Next
                </AnimatedButton>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

