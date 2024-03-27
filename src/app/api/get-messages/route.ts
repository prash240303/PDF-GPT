import { messages } from "@/lib/db/schema"
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { NextResponse } from "next/server"

export const runtime = 'edge'
export const POST = async (req: Request) => {
  const { chatId } = await req.json()
  const _messsaegs = await db.select().from(messages).where(eq(messages.chatId, chatId))

  return NextResponse.json(_messsaegs)
}