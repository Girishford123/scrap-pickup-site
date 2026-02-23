iexport type EmailData = {
  customerName: string
  customerEmail?: string | null
  phone?: string
  address?: string
  preferredDate?: string
  timeWindow?: string
  scrapCategory?: string
  description?: string
  requestId?: number | string
}

type SendResult = { success: true } | { success: false; error: string }

/**
 * Minimal email helper stub.
 * Replace the console-logging implementation with your SMTP/SendGrid provider code.
 */
export async function sendCustomerConfirmation(data: EmailData): Promise<SendResult> {
  try {
    console.log('[sendCustomerConfirmation]', data)
    // TODO: implement real email send using SMTP / SendGrid / third-party provider
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) }
  }
}

export async function sendAdminNotification(data: EmailData): Promise<SendResult> {
  try {
    console.log('[sendAdminNotification]', data)
    // TODO: implement real email send using SMTP / SendGrid / third-party provider
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) }
  }
}