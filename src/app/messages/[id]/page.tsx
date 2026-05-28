"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { useUser } from "@/hooks/useUser";

interface Message {

  id: string;

  sender_id: string;

  message: string;

  created_at: string;
  seen: boolean
}

export default function ChatPage() {

  const params = useParams();

  const { user } = useUser();

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [newMessage, setNewMessage] =
    useState("");

  const [isTyping,
  setIsTyping] =
    useState(false);

  useEffect(() => {

    fetchMessages();

    /*
      REALTIME SUBSCRIPTION
    */
    const channel =
      supabase
        .channel(
          `chat-${params.id}`
        )

        /*
          NEW MESSAGES
        */
        .on(
          "postgres_changes",
          {
            event: "INSERT",

            schema: "public",

            table: "messages",

            filter:
              `conversation_id=eq.${params.id}`,
          },

          (payload) => {

            setMessages(
              (prev) => {

                const exists =
                  prev.find(
                    (m) =>
                      m.id ===
                      payload.new.id
                  );

                if (exists)
                  return prev;

                return [
                  ...prev,
                  payload.new as Message,
                ];
              }
            );
          }
        )

        /*
          TYPING STATUS
        */
        .on(
          "broadcast",
          {
            event: "typing",
          },

          (payload) => {

            if (
              payload.payload
                .sender !==
              user?.id
            ) {

              setIsTyping(
                payload.payload
                  .typing
              );

              /*
                AUTO HIDE
              */
              setTimeout(() => {

                setIsTyping(
                  false
                );

              }, 1500);
            }
          }
        )

        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );
    };

  }, [params.id]);

  async function fetchMessages() {

    const { data, error } =
      await supabase
        .from("messages")
        .select("*")
        .eq(
          "conversation_id",
          params.id
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

    if (error) {

      console.error(error);

      return;
    }

    setMessages(data || []);
    if (user) {

  await supabase
    .from("messages")
    .update({
      seen: true,
    })
    .eq(
      "conversation_id",
      params.id
    )
    .neq(
      "sender_id",
      user.id
    );
}
  }

  async function sendMessage() {

    if (
      !newMessage.trim() ||
      !user
    ) {

      return;
    }

    /*
      INSERT MESSAGE
    */
    const { error } =
      await supabase
        .from("messages")
        .insert([
          {
            conversation_id:
              params.id,

            sender_id:
              user.id,

            message:
              newMessage,
          },
        ]);

    if (error) {

      console.error(error);

      return;
    }

    /*
      FETCH CONVERSATION
    */
    const {
      data: conversation,
    } =
      await supabase
        .from("conversations")
        .select("*")
        .eq(
          "id",
          params.id
        )
        .single();

    /*
      DETERMINE RECIPIENT
    */
    const recipientId =
      conversation.buyer_id ===
      user.id
        ? conversation.seller_id
        : conversation.buyer_id;

    /*
      CREATE NOTIFICATION
    */
    await supabase
      .from("notifications")
      .insert([
        {
          user_id:
            recipientId,

          type:
            "message",

          content:
            "You received a new message",
        },
      ]);

    setNewMessage("");

    fetchMessages();
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] flex flex-col">

      {/* HEADER */}
      <div className="border-b border-orange-100 bg-white px-8 py-6">

        <h1 className="text-4xl font-serif text-[#2d1e15]">
          Conversation
        </h1>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-8 py-10 space-y-6">

        {messages.map((message) => {

          const isOwn =
            message.sender_id ===
            user?.id;

          return (

            <div
              key={message.id}
              className={`flex ${
                isOwn
                  ? "justify-end"
                  : "justify-start"
              }`}
            >

              <div
                className={`max-w-[70%] px-6 py-4 rounded-3xl ${
                  isOwn
                    ? "bg-[#3d2b1f] text-white"
                    : "bg-white border border-orange-100"
                }`}
              >
                {message.message}
                {isOwn && (

  <p className="text-xs mt-2 opacity-70">

    {message.seen
      ? "Seen"
      : "Sent"}

  </p>
)}
              </div>
            </div>
          );
        })}
      </div>

      {/* TYPING INDICATOR */}
      {isTyping && (

        <div className="max-w-5xl mx-auto w-full px-8 pb-4">

          <p className="text-sm text-slate-500 italic">
            Someone is typing...
          </p>
        </div>
      )}

      {/* INPUT */}
      <div className="border-t border-orange-100 bg-white p-6">

        <div className="max-w-5xl mx-auto flex gap-4">

          <input
            type="text"
            value={newMessage}
            onChange={(e) => {

              setNewMessage(
                e.target.value
              );

              /*
                BROADCAST TYPING
              */
              supabase.channel(
                `chat-${params.id}`
              ).send({

                type:
                  "broadcast",

                event:
                  "typing",

                payload: {

                  sender:
                    user?.id,

                  typing: true,
                },
              });
            }}
            placeholder="Type a message..."
            className="flex-1 px-6 py-4 rounded-2xl border border-orange-100 outline-none"
          />

          <button
            onClick={sendMessage}
            className="px-8 py-4 bg-[#3d2b1f] text-white rounded-2xl"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}