import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import PickupRequest from "@/models/PickupRequest";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendStatusEmail } from "@/lib/emailService";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, cancelReason } = await req.json();

    await connectDB();

    const request = await PickupRequest.findOne({
      _id: requestId,
      userId: session.user.id,
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

    // Send email notification only
    await sendStatusEmail({
      to: request.email,
      name: request.name,
      status: "cancelled",
      cancelReason,
    });

    return NextResponse.json({ message: "Pickup cancelled successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to cancel pickup" },
      { status: 500 }
    );
  }
}