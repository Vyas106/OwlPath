import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        reputation: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            answers: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's recent questions
    const questions = await prisma.question.findMany({
      where: { authorId: params.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
    })

    // Get user's recent answers
    const answers = await prisma.answer.findMany({
      where: { authorId: params.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ user, questions, answers })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
