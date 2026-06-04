import { Router, type IRouter } from "express";
import { db, paymentRecordsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { SendPaymentEmailBody, GetPaymentHistoryResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { buildPaymentEmailHtml } from "../lib/paymentEmailTemplate";

const router: IRouter = Router();

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", AUD: "A$", CHF: "Fr",
  CNY: "¥", INR: "₹", MXN: "$", BRL: "R$", KRW: "₩", SGD: "S$", HKD: "HK$",
  NOK: "kr", SEK: "kr", DKK: "kr", NZD: "NZ$", ZAR: "R", AED: "AED", SAR: "SAR",
  NGN: "₦", GHS: "GH₵", KES: "KSh", TRY: "₺", PLN: "zł", PHP: "₱", THB: "฿",
  IDR: "Rp", MYR: "RM", ILS: "₪", QAR: "QAR", UAH: "₴", EGP: "E£", PKR: "₨",
  BDT: "৳", VND: "₫", CZK: "Kč", HUF: "Ft",
};

async function sendBrevoEmail(params: {
  to: { email: string; name: string };
  subject: string;
  html: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "noreply@paypal.com";

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "PayPal", email: senderEmail },
      to: [{ email: params.to.email, name: params.to.name }],
      subject: params.subject,
      htmlContent: params.html,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { message?: string }).message ?? `Brevo error ${response.status}`);
  }

  const data = await response.json() as { messageId?: string };
  return data.messageId ?? null;
}

router.post("/send-payment-email", async (req, res): Promise<void> => {
  const parsed = SendPaymentEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { recipientName, recipientEmail, amount, verificationAmount, note, senderName, currency: rawCurrency } = parsed.data;
  const currency = rawCurrency ?? "USD";
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const displayAmount = Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let emailId: string | null = null;

  try {
    const html = buildPaymentEmailHtml({
      recipientName,
      amount,
      verificationAmount,
      note: note ?? null,
      senderName: senderName ?? null,
      currency,
    });

    emailId = await sendBrevoEmail({
      to: { email: recipientEmail, name: recipientName },
      subject: `You've received a payment of ${symbol}${displayAmount} ${currency}`,
      html,
    });

    req.log.info({ emailId, recipientEmail }, "Payment email sent successfully");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    req.log.error({ err }, "Failed to send payment email");
    res.status(500).json({ error: message });
    return;
  }

  try {
    await db.insert(paymentRecordsTable).values({
      recipientName,
      recipientEmail,
      amount: String(amount),
      verificationAmount: String(verificationAmount),
      note: note ?? null,
      senderName: senderName ?? null,
      currency,
      emailId,
    });
  } catch (err) {
    logger.error({ err }, "Failed to save payment record to database");
  }

  res.json({ success: true, message: "Payment email sent successfully", emailId });
});

router.get("/payment-history", async (req, res): Promise<void> => {
  try {
    const records = await db
      .select()
      .from(paymentRecordsTable)
      .orderBy(desc(paymentRecordsTable.sentAt))
      .limit(50);

    const mapped = records.map((r) => ({
      id: r.id,
      recipientName: r.recipientName,
      recipientEmail: r.recipientEmail,
      amount: Number(r.amount),
      verificationAmount: Number(r.verificationAmount),
      note: r.note ?? null,
      senderName: r.senderName ?? null,
      currency: r.currency,
      sentAt: r.sentAt.toISOString(),
      emailId: r.emailId ?? null,
    }));

    res.json(GetPaymentHistoryResponse.parse(mapped));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch payment history");
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

export default router;
