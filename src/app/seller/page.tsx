"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import { useUser } from "@/hooks/useUser";

interface SellerOrder {

  id: string;

  user_id: string;

  title: string;

  cover_image: string;

  amount: string;

  order_status: string;
}

export default function SellerDashboardPage() {

  const { user } = useUser();

  const [orders, setOrders] =
    useState<SellerOrder[]>([]);

  useEffect(() => {

    async function fetchOrders() {

      if (!user) return;

      const { data, error } =
        await supabase
          .from("orders")
          .select("*")
          .eq(
            "seller_id",
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
    }

    fetchOrders();

  }, [user]);

  async function updateStatus(
    orderId: string,
    newStatus: string
  ) {

    const { error } =
      await supabase
        .from("orders")
        .update({
          order_status:
            newStatus,
        })
        .eq(
          "id",
          orderId
        );

    if (error) {

      console.error(error);

      return;
    }

    /*
      FIND ORDER
    */
    const order =
      orders.find(
        (o) =>
          o.id === orderId
      );

    /*
      CREATE NOTIFICATION
    */
    if (order) {

      await supabase
        .from("notifications")
        .insert([
          {
            user_id:
              order.user_id,

            type:
              "order",

            content:
              `${order.title} is now ${newStatus.replaceAll("_", " ")}`,
          },
        ]);
    }

    /*
      UPDATE UI
    */
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              order_status:
                newStatus,
            }
          : order
      )
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">

      <div className="max-w-7xl mx-auto">

        <div className="mb-14">

          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Marketplace Infrastructure
          </p>

          <h1 className="text-6xl font-serif text-[#2d1e15]">
            Seller Dashboard
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {orders.map((order) => (

            <div
              key={order.id}
              className="bg-white rounded-3xl shadow-lg border border-orange-100 overflow-hidden"
            >

              <img
                src={
                  order.cover_image ||
                  "https://placehold.co/300x450"
                }
                alt={order.title}
                className="w-full aspect-[3/4] object-cover"
              />

              <div className="p-5 space-y-5">

                <div>

                  <h2 className="font-serif text-2xl text-[#2d1e15]">
                    {order.title}
                  </h2>
                </div>

                <div className="flex items-center justify-between">

                  <span className="text-[#c2784e] font-bold">
                    ₹{order.amount}
                  </span>

                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs capitalize">

                    {order.order_status.replaceAll(
                      "_",
                      " "
                    )}

                  </span>
                </div>

                {/* STATUS MANAGEMENT */}
                <div className="space-y-3">

                  <p className="text-sm font-medium text-slate-500">
                    Update Status
                  </p>

                  <select
                    value={
                      order.order_status
                    }
                    onChange={(e) =>
                      updateStatus(
                        order.id,
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-orange-100 bg-white outline-none"
                  >

                    <option value="processing">
                      Processing
                    </option>

                    <option value="packed">
                      Packed
                    </option>

                    <option value="shipped">
                      Shipped
                    </option>

                    <option value="out_for_delivery">
                      Out For Delivery
                    </option>

                    <option value="delivered">
                      Delivered
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (

            <div className="col-span-full bg-white rounded-3xl border border-orange-100 p-16 text-center">

              <h2 className="text-4xl font-serif text-[#2d1e15]">
                No orders yet
              </h2>

              <p className="text-slate-500 mt-4">
                Orders from buyers will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}