interface PaymentEmailData {
  recipientName: string;
  amount: number;
  verificationAmount: number;
  note: string | null;
  senderName: string | null;
}

function generateTransactionId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "U-";
  for (let i = 0; i < 17; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function buildPaymentEmailHtml(data: PaymentEmailData): string {
  const { recipientName, amount, verificationAmount, note, senderName } = data;

  const displayAmount = Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayVerification = Number(verificationAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fromLabel = senderName ? senderName : "Someone";
  const transactionId = generateTransactionId();
  const transactionDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // PayPal "P" logo as inline SVG (data URI safe for email)
  const paypalLogoLarge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="40" height="48">
    <path d="M32.5 8.5C31.2 3.5 27 1 21 1H9.5C8.5 1 7.7 1.7 7.5 2.7L2 36.7C1.9 37.4 2.4 38 3.1 38H10.5L12.3 26.8C12.5 25.8 13.3 25.1 14.3 25.1H17.8C25.5 25.1 31.4 21.8 33.1 13.7C33.2 13.1 33.3 12.5 33.3 12C33.3 10.7 33 9.6 32.5 8.5Z" fill="#003087"/>
    <path d="M35.1 13.7C33.4 21.8 27.5 25.1 19.8 25.1H16.3C15.3 25.1 14.5 25.8 14.3 26.8L12 40.3C11.9 41 12.4 41.6 13.1 41.6H19.5C20.4 41.6 21.1 41 21.3 40.1L21.4 39.6L22.8 31.1L22.9 30.5C23.1 29.6 23.8 29 24.7 29H25.8C32.5 29 37.7 26.1 39.2 18.2C39.8 14.9 39.5 12.1 37.8 10.2C37.3 9.6 36.3 9.1 35.1 13.7Z" fill="#009cde"/>
    <path d="M33.4 7.8C33.1 7.7 32.8 7.6 32.5 7.5C32.2 7.4 31.9 7.4 31.6 7.3C30.5 7.1 29.3 7 28 7H17C16.1 7 15.3 7.6 15.1 8.5L12.5 24.3L12.4 24.8C12.6 23.8 13.4 23.1 14.4 23.1H17.9C25.6 23.1 31.5 19.8 33.2 11.7C33.3 11.1 33.4 10.5 33.4 10C33.4 9.3 33.3 8.6 33.1 8C33.2 7.9 33.3 7.8 33.4 7.8Z" fill="#012169"/>
  </svg>`;

  const paypalLogoSmall = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="30" height="36">
    <path d="M32.5 8.5C31.2 3.5 27 1 21 1H9.5C8.5 1 7.7 1.7 7.5 2.7L2 36.7C1.9 37.4 2.4 38 3.1 38H10.5L12.3 26.8C12.5 25.8 13.3 25.1 14.3 25.1H17.8C25.5 25.1 31.4 21.8 33.1 13.7C33.2 13.1 33.3 12.5 33.3 12C33.3 10.7 33 9.6 32.5 8.5Z" fill="#003087"/>
    <path d="M35.1 13.7C33.4 21.8 27.5 25.1 19.8 25.1H16.3C15.3 25.1 14.5 25.8 14.3 26.8L12 40.3C11.9 41 12.4 41.6 13.1 41.6H19.5C20.4 41.6 21.1 41 21.3 40.1L21.4 39.6L22.8 31.1L22.9 30.5C23.1 29.6 23.8 29 24.7 29H25.8C32.5 29 37.7 26.1 39.2 18.2C39.8 14.9 39.5 12.1 37.8 10.2C37.3 9.6 36.3 9.1 35.1 13.7Z" fill="#009cde"/>
    <path d="M33.4 7.8C33.1 7.7 32.8 7.6 32.5 7.5C32.2 7.4 31.9 7.4 31.6 7.3C30.5 7.1 29.3 7 28 7H17C16.1 7 15.3 7.6 15.1 8.5L12.5 24.3L12.4 24.8C12.6 23.8 13.4 23.1 14.4 23.1H17.9C25.6 23.1 31.5 19.8 33.2 11.7C33.3 11.1 33.4 10.5 33.4 10C33.4 9.3 33.3 8.6 33.1 8C33.2 7.9 33.3 7.8 33.4 7.8Z" fill="#012169"/>
  </svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PayPal Payment Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#f2f2f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f2f2;padding:20px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Greeting row -->
          <tr>
            <td style="background-color:#f2f2f2;padding:20px 0 10px 0;text-align:center;">
              <p style="margin:0;font-size:15px;color:#444444;">Hello, ${recipientName}</p>
            </td>
          </tr>

          <!-- White card with logo + blue header -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.12);">

                <!-- Logo circle + blue gradient header -->
                <tr>
                  <td style="background:linear-gradient(180deg,#0070ba 0%,#0070ba 55%,#003087 100%);padding:0;text-align:center;position:relative;">
                    <!-- White circle behind logo -->
                    <div style="display:inline-block;background:#ffffff;border-radius:50%;width:72px;height:72px;margin:20px auto 0 auto;line-height:72px;text-align:center;vertical-align:middle;">
                      ${paypalLogoLarge}
                    </div>
                    <div style="height:36px;"></div>
                  </td>
                </tr>

                <!-- "[Sender] sent you $X USD" -->
                <tr>
                  <td style="background-color:#ffffff;padding:28px 40px 8px 40px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:800;color:#000000;line-height:1.3;">${fromLabel} sent you<br/>$${displayAmount} USD</p>
                  </td>
                </tr>

                <!-- Payment Details -->
                <tr>
                  <td style="background-color:#ffffff;padding:24px 40px 0 40px;">
                    <p style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:#0070ba;">Payment Details</p>

                    <!-- Transaction ID row -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #e8e8e8;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size:14px;color:#666666;">Transaction ID</td>
                              <td align="right" style="font-size:14px;color:#333333;">${transactionId}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Transaction Date row -->
                      <tr>
                        <td style="padding:10px 0;border-bottom:2px dotted #cccccc;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size:14px;color:#666666;">Transaction date</td>
                              <td align="right" style="font-size:14px;color:#333333;">${transactionDate}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Amount Received row -->
                      <tr>
                        <td style="padding:14px 0;border-bottom:2px dotted #cccccc;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size:15px;font-style:italic;font-weight:700;color:#333333;">Amount Received</td>
                              <td align="right" style="font-size:15px;font-weight:700;color:#333333;">$${displayVerification} USD</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${note ? `
                <!-- Terms and Conditions / Note -->
                <tr>
                  <td style="background-color:#ffffff;padding:20px 40px 0 40px;">
                    <p style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:#333333;">Terms and Conditions</p>
                    <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;">${note}</p>
                  </td>
                </tr>
                ` : ""}

                <!-- Bottom PayPal logo inside card -->
                <tr>
                  <td style="background-color:#ffffff;padding:28px 40px 24px 40px;text-align:center;">
                    ${paypalLogoSmall}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer links -->
          <tr>
            <td style="padding:24px 20px 12px 20px;text-align:center;">
              <p style="margin:0 0 16px 0;font-size:14px;">
                <a href="#" style="color:#0070ba;text-decoration:none;font-weight:500;">Help &amp; Contact</a>
                <span style="color:#999999;margin:0 8px;">|</span>
                <a href="#" style="color:#0070ba;text-decoration:none;font-weight:500;">Security</a>
                <span style="color:#999999;margin:0 8px;">|</span>
                <a href="#" style="color:#0070ba;text-decoration:none;font-weight:500;">Apps</a>
              </p>

              <!-- Social icons -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px auto;">
                <tr>
                  <td style="padding:0 6px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:36px;height:36px;background-color:#bbbbbb;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="font-size:16px;color:#ffffff;line-height:36px;display:block;">&#120163;</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding:0 6px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:36px;height:36px;background-color:#bbbbbb;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="font-size:14px;color:#ffffff;line-height:36px;display:block;">&#9737;</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding:0 6px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:36px;height:36px;background-color:#bbbbbb;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="font-size:16px;color:#ffffff;font-weight:700;line-height:36px;display:block;">f</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding:0 6px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:36px;height:36px;background-color:#bbbbbb;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="font-size:13px;color:#ffffff;font-weight:700;line-height:36px;display:block;">in</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px 0;font-size:13px;color:#555555;line-height:1.6;text-align:left;padding:0 10px;">
                PayPal is committed to preventing fraudulent emails. Emails from PayPal will always contain your full name.<br/>
                <a href="#" style="color:#0070ba;text-decoration:none;font-weight:500;">Learn to identify phishing</a>
              </p>

              <p style="margin:0 0 12px 0;font-size:13px;color:#555555;line-height:1.6;text-align:left;padding:0 10px;">
                Please don't reply to this email. To get in touch with us, click <a href="#" style="color:#0070ba;text-decoration:none;font-weight:600;">Help &amp; Contact</a>.
              </p>

              <p style="margin:0 0 12px 0;font-size:13px;color:#555555;line-height:1.6;text-align:left;padding:0 10px;">
                Not sure why you received this email? <a href="#" style="color:#0070ba;text-decoration:none;font-weight:600;">Learn more</a>
              </p>

              <p style="margin:0 0 12px 0;font-size:13px;color:#555555;line-height:1.6;text-align:left;padding:0 10px;">
                Copyright &copy; 1999-${new Date().getFullYear()} PayPal, Inc. All rights reserved.<br/>
                PayPal is located at <strong>2211 N. First St., San Jose, CA 95131</strong>.
              </p>

              <p style="margin:0;font-size:12px;color:#888888;text-align:left;padding:0 10px;">
                PayPal RT000186:en_US(en-US):1.0.0:f518225a78354
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
