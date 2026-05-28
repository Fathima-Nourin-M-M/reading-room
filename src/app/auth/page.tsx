"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSignup() {

    try {

      setLoading(true);

      const { error } =
        await supabase.auth.signUp({
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

    } catch (err) {

      console.error(err);

      alert("Something went wrong");

    } finally {

      setLoading(false);
    }
  }

  async function handleLogin() {

    try {

      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        alert(error.message);

        return;
      }

      alert(
        "Logged in successfully!"
      );

    } catch (err) {

      console.error(err);

      alert("Something went wrong");

    } finally {

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] flex items-center justify-center px-8">

      <div className="w-full max-w-md bg-white rounded-3xl border border-orange-100 shadow-xl p-10 space-y-8">

        <div>
          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Literary Gateway
          </p>

          <h1 className="text-4xl font-serif text-[#2d1e15]">
            Welcome Back
          </h1>
        </div>

        <div className="space-y-5">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full px-5 py-4 rounded-2xl border border-orange-100"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full px-5 py-4 rounded-2xl border border-orange-100"
          />
        </div>

        <div className="flex gap-4">

          <button
            onClick={handleSignup}
            disabled={loading}
            className="flex-1 px-6 py-4 bg-[#3d2b1f] text-white rounded-2xl"
          >
            Sign Up
          </button>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex-1 px-6 py-4 border border-[#3d2b1f]/20 rounded-2xl"
          >
            Login
          </button>
        </div>
      </div>
    </main>
  );
}