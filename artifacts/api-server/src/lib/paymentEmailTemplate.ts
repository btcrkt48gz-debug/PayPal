interface PaymentEmailData {
  recipientName: string;
  amount: number;
  verificationAmount: number;
  note: string | null;
  senderName: string | null;
}

export function buildPaymentEmailHtml(data: PaymentEmailData): string {
  const { recipientName, amount, verificationAmount, note, senderName } = data;
  const displayAmount = amount.toFixed(2);
  const displayVerification = verificationAmount.toFixed(2);
  const fromLabel = senderName ? senderName : "Someone";
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color:#003087;padding:32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Pay</span><span style="font-size:26px;font-weight:800;color:#009cde;letter-spacing:-0.5px;">Send</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Amount Banner -->
          <tr>
            <td style="background-color:#0070ba;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 4px 0;color:rgba(255,255,255,0.85);font-size:13px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Amount Received</p>
              <p style="margin:0;color:#ffffff;font-size:48px;font-weight:800;letter-spacing:-1px;">$${displayAmount}</p>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.75);font-size:13px;">USD</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:#1c1c1e;">Hello, ${recipientName}</p>
              <p style="margin:0 0 28px 0;font-size:15px;color:#6b7280;line-height:1.6;">
                ${fromLabel} has sent you a payment of <strong style="color:#0070ba;">$${displayAmount} USD</strong> on ${currentDate}.
              </p>

              <!-- Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border-radius:8px;border:1px solid #e8ecf0;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:6px 0;border-bottom:1px solid #eef1f5;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size:13px;color:#6b7280;font-weight:500;">From</td>
                              <td align="right" style="font-size:13px;color:#1c1c1e;font-weight:600;">${fromLabel}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-bottom:1px solid #eef1f5;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size:13px;color:#6b7280;font-weight:500;">Payment Amount</td>
                              <td align="right" style="font-size:13px;color:#1c1c1e;font-weight:700;">$${displayAmount} USD</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-bottom:1px solid #eef1f5;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size:13px;color:#6b7280;font-weight:500;">Verification Amount</td>
                              <td align="right" style="font-size:13px;color:#1c1c1e;font-weight:700;">$${displayVerification} USD</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size:13px;color:#6b7280;font-weight:500;">Date</td>
                              <td align="right" style="font-size:13px;color:#1c1c1e;font-weight:600;">${currentDate}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${
                note
                  ? `<!-- Note -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff8e7;border-radius:8px;border:1px solid #fde68a;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#92400e;">Note from Sender</p>
                    <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">${note}</p>
                  </td>
                </tr>
              </table>`
                  : ""
              }

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:#0070ba;border-radius:6px;padding:0;">
                          <a href="#" style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">
                            Accept Payment
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;text-align:center;">
                If you did not expect this payment, you can safely ignore this email.<br/>
                For security, never share your account details with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e8ecf0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated payment notification. &copy; ${new Date().getFullYear()} PaySend. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
