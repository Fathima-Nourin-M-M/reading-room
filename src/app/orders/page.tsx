"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import { useUser } from "@/hooks/useUser";

interface Order {

  id: string;

  title: string;

  cover_image: string;

  amount: string;

  product_type: string;

  order_status: string;

  created_at: string;
}

const statusSteps = [

  "processing",

  "packed",

  "shipped",

  "out_for_delivery",

  "delivered",
];

export default function OrdersPage() {

  const { user } = useUser();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function fetchOrders() {

      if (!user) return;

      const { data, error } =
        await supabase
          .from("orders")
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

      setOrders(data || []);

      setLoading(false);
    }

    fetchOrders();

  }, [user]);

  if (loading) {

    return (
      <main className="min-h-screen bg-[#fdf9f3] flex items-center justify-center">

        <p className="text-xl text-slate-600">
          Loading orders...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">

      <div className="max-w-7xl mx-auto">

        {/* HERO */}
        <div className="mb-14">

          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Commerce Infrastructure
          </p>

          <h1 className="text-6xl font-serif text-[#2d1e15]">
            Your Orders
          </h1>
        </div>

        <div className="space-y-10">

          {orders.map((order) => {

            const currentStep =
              statusSteps.indexOf(
                order.order_status
              );

            return (

              <div
                key={order.id}
                className="bg-white rounded-3xl shadow-lg border border-orange-100 overflow-hidden"
              >

                <div className="grid lg:grid-cols-[240px_1fr]">

                  {/* COVER */}
                  <img
                    src={
                      order.cover_image ||
                      "https://placehold.co/300x450"
                    }
                    alt={order.title}
                    className="w-full h-full object-cover"
                  />

                  {/* CONTENT */}
                  <div className="p-8">

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

                      <div>

                        <h2 className="font-serif text-4xl text-[#2d1e15]">
                          {order.title}
                        </h2>

                        <p className="text-slate-500 mt-3 capitalize">
                          {order.product_type}
                        </p>

                        <p className="text-sm text-slate-400 mt-4">
                          Order ID:
                          {" "}
                          {order.id}
                        </p>
                      </div>

                      <div className="text-left lg:text-right">

                        <p className="text-3xl font-bold text-[#c2784e]">
                          ₹{order.amount}
                        </p>

                        <p className="text-sm text-slate-500 mt-3">
                          {new Date(
                            order.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* TRACKING */}
                    <div className="mt-10">

                      <div className="flex flex-wrap gap-4">

                        {statusSteps.map(
                          (
                            step,
                            index
                          ) => {

                            const active =
                              index <=
                              currentStep;

                            return (

                              <div
                                key={step}
                                className={`px-4 py-3 rounded-2xl text-sm capitalize transition ${
                                  active
                                    ? "bg-[#3d2b1f] text-white"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {step.replaceAll(
                                  "_",
                                  " "
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* CURRENT STATUS */}
                    <div className="mt-8">

                      <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm capitalize">

                        {order.order_status.replaceAll(
                          "_",
                          " "
                        )}

                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {orders.length === 0 && (

            <div className="bg-white rounded-3xl border border-orange-100 p-16 text-center">

              <h2 className="text-4xl font-serif text-[#2d1e15]">
                No orders yet
              </h2>

              <p className="text-slate-500 mt-4">
                Your purchases will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}