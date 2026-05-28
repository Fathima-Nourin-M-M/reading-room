"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

import { useUser } from "@/hooks/useUser";

interface Conversation {

  id: string;

  listing_id: string;

  buyer_id: string;

  seller_id: string;
}

export default function MessagesPage() {

  const { user } = useUser();

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  useEffect(() => {

    async function fetchConversations() {

      if (!user) return;

      const { data, error } =
        await supabase
          .from("conversations")
          .select("*")
          .or(
            `buyer_id.eq.${user.id},seller_id.eq.${user.id}`
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {

        console.error(error);

        return;
      }

      setConversations(
        data || []
      );
    }

    fetchConversations();

  }, [user]);

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">

      <div className="max-w-5xl mx-auto">

        <div className="mb-14">

          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Marketplace Communication
          </p>

          <h1 className="text-6xl font-serif text-[#2d1e15]">
            Messages
          </h1>
        </div>

        <div className="space-y-6">

          {conversations.map(
            (conversation) => (

              <Link
                href={`/messages/${conversation.id}`}
                key={conversation.id}
                className="block bg-white rounded-3xl border border-orange-100 p-8 shadow-sm hover:shadow-lg transition"
              >

                <h2 className="text-2xl font-serif text-[#2d1e15]">
                  Conversation
                </h2>

                <p className="text-slate-500 mt-2">
                  Listing ID:
                  {" "}
                  {
                    conversation.listing_id
                  }
                </p>
              </Link>
            )
          )}
        </div>
      </div>
    </main>
  );
}