import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        questionId: params.id,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            reputation: true,
          },
        },
      },
    })

    // Create notification for question author
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      select: { authorId: true, title: true },
    })

    if (question && question.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "QUESTION_ANSWERED",
          title: "Your question was answered",
          message: `Someone answered your question "${question.title}"`,
          userId: question.authorId,
          questionId: params.id,
          answerId: answer.id,
        },
      })
    }

    return NextResponse.json({ answer }, { status: 201 })
  } catch (error) {
    console.error("Create answer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
