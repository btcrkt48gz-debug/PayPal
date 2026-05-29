import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useSendPaymentEmail,
  useGetPaymentHistory,
  getGetPaymentHistoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, CheckCircle2, ArrowRight, History, ReceiptText, UserRound, Mail, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required"),
  recipientEmail: z.string().email("Please enter a valid email address"),
  amount: z.coerce.number().min(0.01, "Amount must be at least $0.01"),
  verificationAmount: z.coerce.number().min(0.01, "Verification amount must be at least $0.01"),
  note: z.string().optional(),
  senderName: z.string().optional(),
});

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: history, isLoading: historyLoading } = useGetPaymentHistory({
    query: {
      queryKey: getGetPaymentHistoryQueryKey(),
    },
  });

  const sendEmailMutation = useSendPaymentEmail();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientName: "",
      recipientEmail: "",
      amount: 0,
      verificationAmount: 0,
      note: "",
      senderName: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    sendEmailMutation.mutate(
      {
        data: {
          recipientName: values.recipientName,
          recipientEmail: values.recipientEmail,
          amount: values.amount,
          verificationAmount: values.verificationAmount,
          note: values.note || null,
          senderName: values.senderName || null,
        },
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast({
              title: "Payment notification sent",
              description: `Successfully sent email to ${values.recipientEmail}`,
            });
            form.reset();
            queryClient.invalidateQueries({
              queryKey: getGetPaymentHistoryQueryKey(),
            });
          } else {
            toast({
              variant: "destructive",
              title: "Failed to send email",
              description: result.message || "An unknown error occurred",
            });
          }
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Failed to send email",
            description: error.error || "An unknown error occurred",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Send className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Payment Notification Sender
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Send professional, trustworthy payment confirmations directly to your clients.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <Card className="lg:col-span-7 shadow-lg border-primary/10">
            <CardHeader className="bg-muted/30 border-b pb-6">
              <CardTitle className="text-xl flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-primary" />
                Compose Payment Email
              </CardTitle>
              <CardDescription>
                Fill out the details below to generate and send a secure notification.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="recipientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="John Doe" className="pl-9" {...field} data-testid="input-recipient-name" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="recipientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="john@example.com" type="email" className="pl-9" {...field} data-testid="input-recipient-email" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                className="pl-9 font-mono" 
                                {...field} 
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                                data-testid="input-amount" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="verificationAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                className="pl-9 font-mono" 
                                {...field} 
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                                data-testid="input-verification-amount" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Name <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} data-testid="input-sender-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Note <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Thank you for your business..." 
                            className="min-h-[100px] resize-y" 
                            {...field} 
                            data-testid="textarea-note" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium shadow-md"
                    disabled={sendEmailMutation.isPending}
                    data-testid="button-submit-email"
                  >
                    {sendEmailMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Notification
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <Card className="h-full border-border bg-card/50 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-muted-foreground" />
                  Recent History
                </CardTitle>
                <CardDescription>
                  Previously sent payment notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] px-6">
                  {historyLoading ? (
                    <div className="space-y-4 pb-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col gap-2 p-4 border rounded-xl animate-pulse">
                          <div className="h-5 bg-muted rounded w-1/3"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                          <div className="h-6 bg-muted rounded w-1/4 mt-2"></div>
                        </div>
                      ))}
                    </div>
                  ) : !history || history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                        <History className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No history yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sent notifications will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-6">
                      {history.map((record) => (
                        <div 
                          key={record.id} 
                          className="flex flex-col gap-3 p-4 border bg-card rounded-xl shadow-sm hover:border-primary/30 transition-colors"
                          data-testid={`card-history-${record.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 overflow-hidden">
                              <p className="font-medium text-sm truncate" title={record.recipientName}>
                                {record.recipientName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate" title={record.recipientEmail}>
                                {record.recipientEmail}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-semibold font-mono text-sm">
                                {formatCurrency(record.amount)}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                Sent
                              </span>
                            </div>
                          </div>
                          
                          <Separator className="bg-border/50" />
                          
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>
                              {new Date(record.sentAt).toLocaleDateString(undefined, { 
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                            {record.senderName && (
                              <span className="truncate max-w-[120px]">
                                from {record.senderName}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
