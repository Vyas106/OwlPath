import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.id === params.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: params.id,
        },
      },
    })

    if (existingFollow) {
      return NextResponse.json({ error: "Already following this user" }, { status: 400 })
    }

    await prisma.userFollow.create({
      data: {
        followerId: user.id,
        followingId: params.id,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        type: "USER_FOLLOWED",
        title: "New follower",
        message: `${user.name || user.username} started following you`,
        userId: params.id,
      },
    })

    return NextResponse.json({ message: "User followed successfully" })
  } catch (error) {
    console.error("Follow user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.userFollow.deleteMany({
      where: {
        followerId: user.id,
        followingId: params.id,
      },
    })

    return NextResponse.json({ message: "User unfollowed successfully" })
  } catch (error) {
    console.error("Unfollow user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
