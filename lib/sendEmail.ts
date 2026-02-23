import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface PickupRequestEmail {
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  preferredDate: string;
  timeWindow: string;
  scrapCategory: string;
  description: string;
  requestId: string;
}

export async function sendCustomerConfirmation(data: PickupRequestEmail) {
  try {
    const result = await resend.emails.send({
      from: 'Scrap Pickup <onboarding@resend.dev>',
      to: [data.customerEmail],
      subject: 'Pickup Request Confirmation',
      html: `
        <h2>Thank you for your pickup request!</h2>
        <p>Hi ${data.customerName},</p>
        <p>We've received your scrap metal pickup request. Here are the details:</p>
        
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Request ID:</strong> ${data.requestId}</li>
          <li><strong>Preferred Date:</strong> ${data.preferredDate}</li>
          <li><strong>Time Window:</strong> ${data.timeWindow}</li>
          <li><strong>Category:</strong> ${data.scrapCategory}</li>
          <li><strong>Address:</strong> ${data.address}</li>
        </ul>
        
        ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
        
        <p>We'll contact you soon to confirm your pickup.</p>
        
        <p>Best regards,<br>Your Scrap Pickup Team</p>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending customer email:', error);
    return { success: false, error };
  }
}

export async function sendAdminNotification(data: PickupRequestEmail) {
  try {
    const result = await resend.emails.send({
      from: 'Scrap Pickup <onboarding@resend.dev>',
      to: ['gkulkara@ford.com'],
      subject: `New Pickup Request - ${data.scrapCategory}`,
      html: `
        <h2>New Pickup Request Received</h2>
        
        <h3>Customer Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.customerName}</li>
          <li><strong>Email:</strong> ${data.customerEmail}</li>
          <li><strong>Phone:</strong> ${data.phone}</li>
          <li><strong>Address:</strong> ${data.address}</li>
        </ul>
        
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Request ID:</strong> ${data.requestId}</li>
          <li><strong>Preferred Date:</strong> ${data.preferredDate}</li>
          <li><strong>Time Window:</strong> ${data.timeWindow}</li>
          <li><strong>Category:</strong> ${data.scrapCategory}</li>
        </ul>
        
        ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending admin email:', error);
    return { success: false, error };
  }
}