import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ votes: {} })
    }

    // Get user's votes for this question and all its answers
    const [questionVote, answerVotes] = await Promise.all([
      prisma.questionVote.findUnique({
        where: {
          userId_questionId: {
            userId: user.id,
            questionId: params.id,
          },
        },
      }),
      prisma.answerVote.findMany({
        where: {
          userId: user.id,
          answer: {
            questionId: params.id,
          },
        },
      }),
    ])

    const votes: Record<string, string> = {}

    if (questionVote) {
      votes[`question_${params.id}`] = questionVote.type
    }

    answerVotes.forEach((vote) => {
      votes[`answer_${vote.answerId}`] = vote.type
    })

    return NextResponse.json({ votes })
  } catch (error) {
    console.error("Get user votes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
