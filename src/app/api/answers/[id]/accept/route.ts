import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const answer = await prisma.answer.findUnique({
      where: { id: params.id },
      include: {
        question: { select: { authorId: true, id: true } },
        author: { select: { id: true } },
      },
    })

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 })
    }

    // Only question author can accept answers
    if (answer.question.authorId !== session.user.id) {
      return NextResponse.json({ error: "Only question author can accept answers" }, { status: 403 })
    }

    // Unaccept all other answers for this question
    await prisma.answer.updateMany({
      where: { questionId: answer.question.id },
      data: { isAccepted: false },
    })

    // Accept this answer
    const updatedAnswer = await prisma.answer.update({
      where: { id: params.id },
      data: { isAccepted: true },
    })

    // Mark question as resolved
    await prisma.question.update({
      where: { id: answer.question.id },
      data: {
        isResolved: true,
        acceptedAnswerId: params.id,
      },
    })

    // Give reputation bonus to answer author
    await prisma.user.update({
      where: { id: answer.author.id },
      data: { reputation: { increment: 15 } }, // Bonus for accepted answer
    })

    // Create notification
    await prisma.notification.create({
      data: {
        type: "ANSWER_ACCEPTED",
        title: "Your answer was accepted",
        message: "Your answer was marked as the solution",
        userId: answer.author.id,
        questionId: answer.question.id,
        answerId: params.id,
      },
    })

    return NextResponse.json({ message: "Answer accepted", answer: updatedAnswer })
  } catch (error) {
    console.error("Accept answer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
