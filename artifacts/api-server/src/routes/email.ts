import { Router, type IRouter } from "express";
import { Resend } from "resend";
import { db, paymentRecordsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { SendPaymentEmailBody, GetPaymentHistoryResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { buildPaymentEmailHtml } from "../lib/paymentEmailTemplate";

const router: IRouter = Router();

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

  const { recipientName, recipientEmail, amount, verificationAmount, note, senderName } = parsed.data;

  let emailId: string | null = null;

  try {
    const resend = getResendClient();
    const html = buildPaymentEmailHtml({ recipientName, amount, verificationAmount, note: note ?? null, senderName: senderName ?? null });

    const displayAmount = Number(amount).toFixed(2);
    const fromName = senderName ? senderName : "Payment Sender";

    const emailResult = await resend.emails.send({
      from: `${fromName} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: `You've received a payment of $${displayAmount}`,
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

  // Record in database
  try {
    await db.insert(paymentRecordsTable).values({
      recipientName,
      recipientEmail,
      amount: String(amount),
      verificationAmount: String(verificationAmount),
      note: note ?? null,
      senderName: senderName ?? null,
      emailId,
    });
  } catch (err) {
    logger.error({ err }, "Failed to save payment record to database");
    // Don't fail the request — email was already sent
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
