"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to orders since confirmation is now handled inline in checkout
export default function CheckoutConfirmationRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/orders"); }, [router]);
  return null;
}
