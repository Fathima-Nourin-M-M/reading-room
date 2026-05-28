"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

export default function SignupPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSignup() {

    if (
      password !==
      confirmPassword
    ) {

      alert(
        "Passwords do not match"
      );

      return;
    }

    try {

      setLoading(true);

      const { error } =
        await supabase.auth
          .signUp({
            email,
            password,
          });

      if (error) {

        alert(error.message);

        return;
      }

      alert(
        "Account created successfully!"
      );

      router.push("/login");

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] flex items-center justify-center px-8">

      <div className="w-full max-w-md bg-white rounded-3xl border border-orange-100 shadow-xl p-10">

        <div className="mb-10 text-center">

          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Literary Gateway
          </p>

          <h1 className="text-5xl font-serif text-[#2d1e15]">
            Create Account
          </h1>
        </div>

        <div className="space-y-6">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none"
          />

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-4 bg-[#3d2b1f] text-white rounded-2xl font-medium hover:bg-[#523a2a] transition"
          >
            {loading
              ? "Creating account..."
              : "Sign Up"}
          </button>
        </div>

        <div className="mt-8 text-center">

          <p className="text-slate-600">

            Already have an account?{" "}

            <Link
              href="/login"
              className="text-[#c2784e] font-medium"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}