import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const tag = await prisma.tag.findUnique({
      where: { name: params.name },
      include: {
        _count: {
          select: {
            questions: true,
            followers: true,
          },
        },
      },
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    return NextResponse.json({ tag })
  } catch (error) {
    console.error("Get tag error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
