import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    // Increment view count
    await prisma.question.update({
      where: { slug: params.slug },
      data: { views: { increment: 1 } },
    })

    const question = await prisma.question.findUnique({
      where: { slug: params.slug },
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
          where: { parentId: null }, // Only get top-level answers
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
            replies: {
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
                replies: {
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
                },
              },
            },
          },
          orderBy: [{ isAccepted: "desc" }, { voteCount: "desc" }, { createdAt: "asc" }],
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
