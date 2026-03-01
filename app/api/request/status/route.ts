import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import PickupRequest from "@/models/PickupRequest";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const requests = await PickupRequest.find({
      userId: session.user.id,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}