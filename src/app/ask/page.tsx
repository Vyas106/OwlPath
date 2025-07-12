"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextEditor } from "@/components/rich-text-editor"
import { TagSelector } from "@/components/tag-selector"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AskQuestionPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

  

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and description for your question.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, tags }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Question posted",
          description: "Your question has been posted successfully.",
        })
        router.push(`/questions/${data.question.slug}`)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to post question",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post question. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }



  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/questions" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Questions
        </Link>
        <h1 className="text-3xl font-bold">Ask a Question</h1>
        <p className="text-gray-600 mt-2">Get help from our community by asking a clear, detailed question.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Details</CardTitle>
                <CardDescription>Be specific and imagine you're asking a question to another person.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., How do I center a div with CSS?"
                    className="mt-1"
                    maxLength={200}
                  />
                  <p className="text-sm text-gray-500 mt-1">{title.length}/200 characters</p>
                </div>

                <div>
                  <Label htmlFor="content">Description *</Label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder="Describe your problem in detail. Include what you've tried and what you expected to happen..."
                    />
                  </div>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="mt-1">
                    <TagSelector selectedTags={tags} onTagsChange={setTags} maxTags={5} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Add up to 5 tags to describe what your question is about.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Link href="/questions">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
                {isSubmitting ? "Posting..." : "Post Question"}
              </Button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Writing Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium">Be specific</h4>
                <p className="text-gray-600">
                  Include details about your environment, what you've tried, and what went wrong.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Include code</h4>
                <p className="text-gray-600">Share relevant code snippets using the code formatting tools.</p>
              </div>
              <div>
                <h4 className="font-medium">Add context</h4>
                <p className="text-gray-600">Explain what you're trying to achieve and why.</p>
              </div>
              <div>
                <h4 className="font-medium">Use tags</h4>
                <p className="text-gray-600">Tag your question with relevant technologies to help others find it.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>• Search for existing answers before posting</p>
              <p>• Be respectful and constructive</p>
              <p>• Accept helpful answers to help others</p>
              <p>• Follow up with additional details if needed</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
