import { Router, type IRouter } from "express";
import { Resend } from "resend";
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

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured. Please connect your Resend account.");
  }
  return new Resend(apiKey);
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
    const resend = getResendClient();
    const html = buildPaymentEmailHtml({
      recipientName,
      amount,
      verificationAmount,
      note: note ?? null,
      senderName: senderName ?? null,
      currency,
    });

    const emailResult = await resend.emails.send({
      from: `service@paypal.com <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: `You've received a payment of ${symbol}${displayAmount} ${currency}`,
      html,
    });

    if (emailResult.error) {
      req.log.error({ error: emailResult.error }, "Resend returned an error");
      res.status(500).json({ error: emailResult.error.message ?? "Failed to send email" });
      return;
    }

    emailId = emailResult.data?.id ?? null;
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
