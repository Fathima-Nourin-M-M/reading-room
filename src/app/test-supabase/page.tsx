"use client";

import { supabase } from "@/lib/supabase";

export default function TestSupabasePage() {

  async function testConnection() {

    const { data, error } =
      await supabase
        .from("test")
        .select("*");

    console.log(data);
    console.log(error);
  }

  return (
    <main className="min-h-screen flex items-center justify-center">

      <button
        onClick={testConnection}
        className="px-8 py-4 bg-black text-white rounded-xl"
      >
        Test Supabase
      </button>
    </main>
  );
}