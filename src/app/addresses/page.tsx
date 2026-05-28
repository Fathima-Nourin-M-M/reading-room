"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

export default function AddressesPage() {

  const { user } = useUser();
  const { pushToast } = useToast();

  const [loading, setLoading] =
    useState(false);

  const [savedAddress, setSavedAddress] =
    useState<any>(null);

  const [formData, setFormData] =
    useState({

      full_name: "",

      phone: "",

      address_line: "",

      city: "",

      state: "",

      pincode: "",
    });

  useEffect(() => {

    async function fetchAddress() {

      if (!user) return;

      const { data, error } =
        await supabase
          .from("addresses")
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .single();

      if (error) {

        console.error(error);

        return;
      }

      if (data) {

        setSavedAddress(data);

        setFormData({

          full_name:
            data.full_name || "",

          phone:
            data.phone || "",

          address_line:
            data.address_line || "",

          city:
            data.city || "",

          state:
            data.state || "",

          pincode:
            data.pincode || "",
        });
      }
    }

    fetchAddress();

  }, [user]);

  async function saveAddress() {

    if (!user) {

      pushToast("Please sign in first", "info");

      return;
    }

    try {

      setLoading(true);

      const { error } =
        await supabase
          .from("addresses")
          .upsert([
            {
              user_id:
                user.id,

              ...formData,
            },
          ]);

      if (error) {

        console.error(error);

        pushToast("Failed to save address", "error");

        return;
      }

      pushToast("Address saved", "success");

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">

      <div className="max-w-3xl mx-auto">

        {/* HERO */}
        <div className="mb-14">

          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Commerce Infrastructure
          </p>

          <h1 className="text-6xl font-serif text-[#2d1e15]">
            Delivery Address
          </h1>
        </div>

        {/* FORM */}
        <div className="bg-white rounded-3xl border border-orange-100 p-10 shadow-lg space-y-6">

          <div>

            <label className="block mb-2 text-sm font-medium text-[#2d1e15]">
              Full Name
            </label>

            <input
              type="text"
              value={
                formData.full_name
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  full_name:
                    e.target.value,
                })
              }
              className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none"
            />
          </div>

          <div>

            <label className="block mb-2 text-sm font-medium text-[#2d1e15]">
              Phone Number
            </label>

            <input
              type="text"
              value={
                formData.phone
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phone:
                    e.target.value,
                })
              }
              className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none"
            />
          </div>

          <div>

            <label className="block mb-2 text-sm font-medium text-[#2d1e15]">
              Address
            </label>

            <textarea
              value={
                formData.address_line
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address_line:
                    e.target.value,
                })
              }
              className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none min-h-[120px]"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">

            <div>

              <label className="block mb-2 text-sm font-medium text-[#2d1e15]">
                City
              </label>

              <input
                type="text"
                value={
                  formData.city
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    city:
                      e.target.value,
                  })
                }
                className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none"
              />
            </div>

            <div>

              <label className="block mb-2 text-sm font-medium text-[#2d1e15]">
                State
              </label>

              <input
                type="text"
                value={
                  formData.state
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    state:
                      e.target.value,
                  })
                }
                className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none"
              />
            </div>

            <div>

              <label className="block mb-2 text-sm font-medium text-[#2d1e15]">
                Pincode
              </label>

              <input
                type="text"
                value={
                  formData.pincode
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pincode:
                      e.target.value,
                  })
                }
                className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none"
              />
            </div>
          </div>

          <button
            onClick={saveAddress}
            disabled={loading}
            className="w-full py-4 bg-[#3d2b1f] text-white rounded-2xl text-lg hover:bg-[#523a2a] transition"
          >
            {loading
              ? "Saving..."
              : "Save Address"}
          </button>
        </div>
      </div>
    </main>
  );
}