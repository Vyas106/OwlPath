import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tag = await prisma.tag.findUnique({
      where: { name: params.name },
      select: { id: true },
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    // Check if already following
    const existingFollow = await prisma.tagFollow.findUnique({
      where: {
        userId_tagId: {
          userId: user.id,
          tagId: tag.id,
        },
      },
    })

    if (existingFollow) {
      return NextResponse.json({ error: "Already following this tag" }, { status: 400 })
    }

    await prisma.tagFollow.create({
      data: {
        userId: user.id,
        tagId: tag.id,
      },
    })

    return NextResponse.json({ message: "Tag followed successfully" })
  } catch (error) {
    console.error("Follow tag error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tag = await prisma.tag.findUnique({
      where: { name: params.name },
      select: { id: true },
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    await prisma.tagFollow.deleteMany({
      where: {
        userId: user.id,
        tagId: tag.id,
      },
    })

    return NextResponse.json({ message: "Tag unfollowed successfully" })
  } catch (error) {
    console.error("Unfollow tag error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
