import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

interface EmailParams {
  to: string;
  name: string;
  status: EmailStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  cancelReason?: string;
}

const statusMessages: Record<
  EmailStatus,
  { subject: string; message: string; color: string }
> = {
  scheduled: {
    subject: "Your Pickup Has Been Scheduled!",
    message: "Great news! Your scrap pickup has been scheduled.",
    color: "#3B82F6",
  },
  confirmed: {
    subject: "Your Pickup Is Confirmed!",
    message: "Your scrap pickup has been confirmed and is on the way.",
    color: "#10B981",
  },
  completed: {
    subject: "Pickup Completed — Thank You!",
    message: "Your scrap pickup has been completed successfully. Thank you!",
    color: "#6366F1",
  },
  cancelled: {
    subject: "Your Pickup Has Been Cancelled",
    message: "Your scrap pickup request has been cancelled.",
    color: "#EF4444",
  },
};

export async function sendStatusEmail(params: EmailParams) {
  const { to, name, status, scheduledDate, scheduledTime, cancelReason } =
    params;
  const { subject, message, color } = statusMessages[status];

  await resend.emails.send({
    from: "ScrapPickup <noreply@yourdomain.com>",
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${color}; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">ScrapPickup</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
          <h2 style="color: #111827;">Hello, ${name}!</h2>
          <p style="color: #374151; font-size: 16px;">${message}</p>

          ${scheduledDate ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">
              <strong>📅 Date:</strong> ${scheduledDate}
            </p>
            ${scheduledTime ? `
            <p style="margin: 10px 0 0; color: #374151;">
              <strong>🕐 Time:</strong> ${scheduledTime}
            </p>` : ""}
          </div>` : ""}

          ${cancelReason ? `
          <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #DC2626;">
              <strong>Reason:</strong> ${cancelReason}
            </p>
          </div>` : ""}

          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/track-pickup"
               style="background: ${color}; color: white; padding: 12px 30px;
                      border-radius: 6px; text-decoration: none; font-weight: bold;">
              Track Your Pickup
            </a>
          </div>

          <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px; text-align: center;">
            ScrapPickup — Helping you go green 🌿
          </p>
        </div>
      </div>
    `,
  });
}