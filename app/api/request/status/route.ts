import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import PickupRequest from "@/models/PickupRequest";

export async function GET(req: NextRequest) {
  try {
    // Get userId from query param sent by client
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — userId is required" },
        { status: 401 }
      );
    }

    await connectDB();

    const requests = await PickupRequest.find({
      userId: userId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Status fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}