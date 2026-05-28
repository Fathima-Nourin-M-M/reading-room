"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import { useUser } from "@/hooks/useUser";

interface Notification {

  id: string;

  type: string;

  content: string;

  read: boolean;

  created_at: string;
}

export default function NotificationsPage() {

  const { user } = useUser();

  const [notifications,
  setNotifications] =
    useState<Notification[]>([]);

  useEffect(() => {

  async function fetchNotifications() {

    if (!user) return;

    const { data, error } =
      await supabase
        .from("notifications")
        .select("*")
        .eq(
          "user_id",
          user.id
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

    setNotifications(
      data || []
    );
  }

  fetchNotifications();

  /*
    REALTIME
    NOTIFICATIONS
  */
  if (user) {

    const channel =
      supabase
        .channel(
          `notifications-${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",

            schema: "public",

            table:
              "notifications",

            filter:
              `user_id=eq.${user.id}`,
          },

          (payload) => {

            setNotifications(
              (prev) => [
                payload.new as Notification,
                ...prev,
              ]
            );
          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );
    };
  }

}, [user]);

  async function markAsRead(
    id: string
  ) {

    await supabase
      .from("notifications")
      .update({
        read: true,
      })
      .eq("id", id);

    setNotifications(
      (prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                read: true,
              }
            : n
        )
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">

      <div className="max-w-4xl mx-auto">

        <div className="mb-14">

          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Platform Activity
          </p>

          <h1 className="text-6xl font-serif text-[#2d1e15]">
            Notifications
          </h1>
        </div>

        <div className="space-y-6">

          {notifications.map(
            (notification) => (

              <div
                key={notification.id}
                className={`rounded-3xl border p-6 shadow-sm ${
                  notification.read
                    ? "bg-white border-orange-100"
                    : "bg-amber-50 border-amber-200"
                }`}
              >

                <div className="flex items-center justify-between gap-6">

                  <div>

                    <p className="text-[#2d1e15] text-lg leading-relaxed">
                      {
                        notification.content
                      }
                    </p>

                    <p className="text-sm text-slate-500 mt-3 capitalize">
                      {
                        notification.type
                      }
                    </p>
                  </div>

                  {!notification.read && (

                    <button
                      onClick={() =>
                        markAsRead(
                          notification.id
                        )
                      }
                      className="px-5 py-3 bg-[#3d2b1f] text-white rounded-2xl"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}