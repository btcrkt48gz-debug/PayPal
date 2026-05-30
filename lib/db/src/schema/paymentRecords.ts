import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentRecordsTable = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  recipientName: text("recipient_name").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  verificationAmount: numeric("verification_amount", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  senderName: text("sender_name"),
  currency: text("currency").notNull().default("USD"),
  emailId: text("email_id"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertPaymentRecordSchema = createInsertSchema(paymentRecordsTable).omit({
  id: true,
  sentAt: true,
});

export type InsertPaymentRecord = z.infer<typeof insertPaymentRecordSchema>;
export type PaymentRecord = typeof paymentRecordsTable.$inferSelect;
