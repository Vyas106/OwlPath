import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        questions: {
          _count: "desc",
        },
      },
      take: 20,
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error("Get popular tags error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
