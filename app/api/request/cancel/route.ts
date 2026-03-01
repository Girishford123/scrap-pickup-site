import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import PickupRequest from "@/models/PickupRequest";
import { sendStatusEmail } from "@/lib/emailService";

export async function POST(req: NextRequest) {
  try {
    const { requestId, cancelReason, userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — userId is required" },
        { status: 401 }
      );
    }

    if (!requestId || !cancelReason) {
      return NextResponse.json(
        { error: "requestId and cancelReason are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const request = await PickupRequest.findOne({
      _id: requestId,
      userId: userId,
    });

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (["completed", "cancelled"].includes(request.status)) {
      return NextResponse.json(
        { error: "Cannot cancel a completed or already cancelled pickup" },
        { status: 400 }
      );
    }

    request.status = "cancelled";
    request.cancelledAt = new Date();
    request.cancelReason = cancelReason;
    await request.save();

    // Send email notification
    await sendStatusEmail({
      to: request.email,
      name: request.name,
      status: "cancelled",
      cancelReason,
    });

    return NextResponse.json({ message: "Pickup cancelled successfully" });
  } catch (error) {
    console.error("Cancel error:", error);
    return NextResponse.json(
      { error: "Failed to cancel pickup" },
      { status: 500 }
    );
  }
}