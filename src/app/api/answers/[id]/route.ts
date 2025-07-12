import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await request.json()

    const answer = await prisma.answer.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    })

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 })
    }

    if (answer.authorId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: params.id },
      data: { content },
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

    return NextResponse.json({ answer: updatedAnswer })
  } catch (error) {
    console.error("Update answer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.answer.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Answer deleted successfully" })
  } catch (error) {
    console.error("Delete answer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
