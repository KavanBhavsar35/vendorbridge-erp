import aiosmtplib
from email.message import EmailMessage
from app.config import get_settings

settings = get_settings()

async def send_email(to_email: str, subject: str, body_html: str):
    """
    Generic async function to send an email using the SMTP settings from .env.
    """
    if not all([settings.SMTP_HOST, settings.SMTP_PORT, settings.SMTP_USER, settings.SMTP_PASS]):
        raise ValueError("SMTP configuration is incomplete in the environment.")

    msg = EmailMessage()
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.add_alternative(body_html, subtype='html')

    # Many providers (like Gmail on 587) require STARTTLS.
    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASS,
        start_tls=True,
    )

async def send_invoice_email(vendor_email: str, document_type: str, document_number: str, amount: float, due_date: str):
    """
    Formats and sends an invoice or PO email.
    """
    subject = f"New {document_type} from VendorBridge: {document_number}"
    
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #2563eb;">VendorBridge Document Notification</h2>
            <p>Hello,</p>
            <p>You have received a new <strong>{document_type}</strong> (<strong>{document_number}</strong>) regarding your recent procurement activities.</p>
            <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
                    <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #eee;">${amount:,.2f}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Due Date / Valid Until:</strong></td>
                    <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #eee;">{due_date}</td>
                </tr>
            </table>
            <p style="margin-top: 20px;">Please log in to your VendorBridge dashboard to view or download the full PDF document.</p>
            <p>Best regards,<br/><strong>The VendorBridge Team</strong></p>
        </div>
      </body>
    </html>
    """
    
    await send_email(to_email=vendor_email, subject=subject, body_html=html_body)
