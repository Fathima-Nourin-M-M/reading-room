"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ToastProvider";

interface ReportModalProps {
  targetType: "listing" | "review" | "user" | "content";
  targetId: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Spam",
  "Offensive content",
  "Fake listing",
  "Harassment",
  "Copyright issue",
  "Misleading information",
  "Other",
];

export default function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const { user } = useUser();
  const { pushToast } = useToast();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!user) {
      pushToast("Please sign in to report", "info");
      onClose();
      return;
    }
    if (!reason) {
      pushToast("Please select a reason", "info");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reports").insert([{
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason: note ? `${reason}: ${note}` : reason,
      }]);
      if (error) throw error;
      pushToast("Report submitted — thank you", "success");
      onClose();
    } catch (err) {
      console.error(err);
      pushToast("Failed to submit report", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a0f08]/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#d8b792]/60 bg-[#fffaf4] p-7 shadow-[0_24px_60px_rgba(74,43,22,0.22)]">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b6842]">
              Community Standards
            </p>
            <h2 className="mt-1 font-serif text-2xl text-[#2b1c14]">
              Submit a Report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#7a5a47] transition hover:bg-[#f4e4d0]"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-3 text-sm font-medium text-[#4e3427]">
              What's the issue?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    reason === r
                      ? "border-[#8a5a3b] bg-[#f5e6d6] text-[#4e3427] font-medium"
                      : "border-[#e0c8b0] bg-[#fff8ef] text-[#614737] hover:border-[#c9a07a] hover:bg-[#fdf0e2]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4e3427]">
              Additional notes
              <span className="ml-1 font-normal text-[#9c7148]">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional context…"
              rows={3}
              className="w-full resize-none rounded-2xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#4e3427] placeholder:text-[#b09a85] focus:border-[#a8794e] focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-[#d8b792] bg-[#fff8ef] py-2.5 text-sm font-medium text-[#4e3427] transition hover:bg-[#f4e4d0]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !reason}
              className="flex-1 rounded-2xl bg-[#3d281d] py-2.5 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#553727] disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
