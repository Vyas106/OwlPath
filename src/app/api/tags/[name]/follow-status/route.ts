import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ isFollowing: false })
    }

    const tag = await prisma.tag.findUnique({
      where: { name: params.name },
      select: { id: true },
    })

    if (!tag) {
      return NextResponse.json({ isFollowing: false })
    }

    const follow = await prisma.tagFollow.findUnique({
      where: {
        userId_tagId: {
          userId: user.id,
          tagId: tag.id,
        },
      },
    })

    return NextResponse.json({ isFollowing: !!follow })
  } catch (error) {
    console.error("Check tag follow status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
