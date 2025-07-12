import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type } = await request.json() // "UP" or "DOWN"

    if (!["UP", "DOWN"].includes(type)) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 })
    }

    // Check if user already voted
    const existingVote = await prisma.answerVote.findUnique({
      where: {
        userId_answerId: {
          userId: user.id,
          answerId: params.id,
        },
      },
    })

    let voteChange = 0
    let userVote = null

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote if same type
        await prisma.answerVote.delete({
          where: { id: existingVote.id },
        })
        voteChange = type === "UP" ? -1 : 1
        userVote = null
      } else {
        // Update vote type
        await prisma.answerVote.update({
          where: { id: existingVote.id },
          data: { type },
        })
        voteChange = type === "UP" ? 2 : -2
        userVote = type
      }
    } else {
      // Create new vote
      await prisma.answerVote.create({
        data: {
          type,
          userId: user.id,
          answerId: params.id,
        },
      })
      voteChange = type === "UP" ? 1 : -1
      userVote = type
    }

    // Update answer vote count
    const answer = await prisma.answer.update({
      where: { id: params.id },
      data: {
        voteCount: { increment: voteChange },
      },
      include: {
        author: { select: { id: true } },
      },
    })

    // Update author reputation
    await prisma.user.update({
      where: { id: answer.author.id },
      data: {
        reputation: { increment: voteChange * 10 }, // 10 points per vote
      },
    })

    return NextResponse.json({
      message: "Vote recorded",
      voteCount: answer.voteCount,
      userVote,
    })
  } catch (error) {
    console.error("Vote error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
