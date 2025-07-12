import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Increment view count
    await prisma.question.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    })

    const question = await prisma.question.findUnique({
      where: { id: params.id },
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
        tags: {
          include: {
            tag: true,
          },
        },
        answers: {
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
          orderBy: [{ isAccepted: "desc" }, { votes: "desc" }, { createdAt: "asc" }],
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error("Get question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content, tags } = await request.json()

    const question = await prisma.question.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (question.authorId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: params.id },
      data: {
        title,
        content,
        tags: {
          deleteMany: {},
          create:
            tags?.map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName },
                },
              },
            })) || [],
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({ question: updatedQuestion })
  } catch (error) {
    console.error("Update question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.question.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Delete question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
