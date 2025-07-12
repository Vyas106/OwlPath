import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [
      totalQuestions,
      totalAnswers,
      totalUsers,
      totalVotes,
      userQuestions,
      userAnswers,
      recentQuestions,
      topUsers,
    ] = await Promise.all([
      prisma.question.count(),
      prisma.answer.count(),
      prisma.user.count(),
      prisma.questionVote.count() + prisma.answerVote.count(),
      prisma.question.count({ where: { authorId: user.id } }),
      prisma.answer.count({ where: { authorId: user.id } }),
      prisma.question.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              answers: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { reputation: "desc" },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          reputation: true,
          _count: {
            select: {
              questions: true,
              answers: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      stats: {
        totalQuestions,
        totalAnswers,
        totalUsers,
        totalVotes,
        userQuestions,
        userAnswers,
      },
      recentQuestions,
      topUsers,
    })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
