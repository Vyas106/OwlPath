"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Link, Code, Quote, Eye, Edit } from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertText = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const formatMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic">$1</blockquote>')
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc pl-6">$1</ul>')
      .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
      .replace(/\n/g, "<br>")
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <div className="flex items-center justify-between border-b p-2 bg-gray-50">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => insertText("**", "**")} title="Bold">
            <Bold className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertText("*", "*")} title="Italic">
            <Italic className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertText("`", "`")} title="Code">
            <Code className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertText("\n> ")} title="Quote">
            <Quote className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertText("\n- ")} title="Bullet List">
            <List className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertText("\n1. ")} title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertText("[", "](url)")} title="Link">
            <Link className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={!isPreview ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsPreview(false)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button type="button" variant={isPreview ? "default" : "ghost"} size="sm" onClick={() => setIsPreview(true)}>
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      <div className="p-3">
        {isPreview ? (
          <div className="prose max-w-none min-h-[200px]" dangerouslySetInnerHTML={{ __html: formatMarkdown(value) }} />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[200px] resize-none border-none outline-none"
          />
        )}
      </div>
    </div>
  )
}
