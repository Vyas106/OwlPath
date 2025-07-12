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

    // Get the parent answer to find the question
    const parentAnswer = await prisma.answer.findUnique({
      where: { id: params.id },
      select: { questionId: true },
    })

    if (!parentAnswer) {
      return NextResponse.json({ error: "Parent answer not found" }, { status: 404 })
    }

    const reply = await prisma.answer.create({
      data: {
        content,
        questionId: parentAnswer.questionId,
        authorId: user.id,
        parentId: params.id,
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
        replies: true,
      },
    })

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error("Create reply error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
