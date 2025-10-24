import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ name, email, message }) => {
  const res = await resend.emails.send({
    from: "Portfolio <onboarding@resend.dev>",
    to: ["trinadasgupta.official@gmail.com"],
    subject: `Portfolio Lead - Message from ${name}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New Portfolio Message</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f9fafb;
            line-height: 1.5;
          }
          .container {
            max-width: 600px;
            margin: 32px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(to right, #3b82f6, #2563eb);
            padding: 24px 32px;
          }
          .header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
          }
          .content {
            padding: 24px 32px;
          }
          .info-card {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .info-item {
            margin-bottom: 16px;
          }
          .info-item:last-child {
            margin-bottom: 0;
          }
          .info-label {
            font-size: 12px;
            font-weight: 600;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 18px;
            font-weight: 500;
            color: #111827;
          }
          .email-link {
            color: #2563eb;
            text-decoration: underline;
          }
          .message-section {
            margin-top: 24px;
          }
          .message-label {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .message-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
          }
          .message-text {
            color: #1f2937;
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .footer {
            background-color: #f9fafb;
            padding: 16px 32px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
          }
          .footer-text {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
          }
          .icon {
            font-size: 24px;
            margin-right: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h2><span class="icon">🚀</span> New Portfolio Message</h2>
          </div>
          
          <!-- Content -->
          <div class="content">
            <!-- Contact Info Card -->
            <div class="info-card">
              <div class="info-item">
                <div class="info-label"><span class="icon">👤</span> Name</div>
                <div class="info-value">${name}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label"><span class="icon">📧</span> Email</div>
                <div class="info-value">
                  <a href="mailto:${email}" class="email-link">${email}</a>
                </div>
              </div>
            </div>
            
            <!-- Message Section -->
            <div class="message-section">
              <div class="message-label">
                <span class="icon">💬</span> Message
              </div>
              <div class="message-box">
                <p class="message-text">${message.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p class="footer-text">
              This message was sent from your portfolio contact form on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
  return res;
};