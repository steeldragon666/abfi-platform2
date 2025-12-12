"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, XCircle, Loader2 } from "lucide-react";

interface InquiryResponseFormProps {
  inquiryId: string;
}

export function InquiryResponseForm({ inquiryId }: InquiryResponseFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRespond = async (accept: boolean) => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: accept ? "responded" : "rejected",
          response_message: message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to respond");
      }

      toast.success(accept ? "Response sent successfully" : "Inquiry declined");
      router.refresh();
    } catch (error) {
      console.error("Error responding to inquiry:", error);
      toast.error("Failed to send response");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle>Respond to Inquiry</CardTitle>
        <CardDescription>
          Send a response to the buyer about their inquiry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">Your Response</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Thank you for your interest in our feedstock. We can supply the requested volume with the following terms..."
            rows={5}
            className="bg-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleRespond(true)}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Response
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleRespond(false)}
            disabled={submitting}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
