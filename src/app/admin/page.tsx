"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import { useUser } from "@/hooks/useUser";

interface Listing {

  id: string;

  title: string;

  seller_name: string;

  price: string;
}

interface Review {

  id: string;

  review: string;

  rating: number;
}

interface Report {

  id: string;

  target_type: string;

  target_id: string;

  reason: string;

  status: string;
}

export default function AdminPage() {

  const { user } = useUser();

  const [loading, setLoading] =
    useState(true);

  const [authorized,
  setAuthorized] =
    useState(false);

  const [listings,
  setListings] =
    useState<Listing[]>([]);

  const [reviews,
  setReviews] =
    useState<Review[]>([]);

  const [reports,
  setReports] =
    useState<Report[]>([]);

  /*
    ANALYTICS
  */
  const [totalUsers,
  setTotalUsers] =
    useState(0);

  const [totalOrders,
  setTotalOrders] =
    useState(0);

  const [totalListings,
  setTotalListings] =
    useState(0);

  const [totalRevenue,
  setTotalRevenue] =
    useState(0);

  useEffect(() => {

    async function loadAdmin() {

      if (!user) return;

      /*
        CHECK ADMIN
      */
      const {
        data: profile,
      } =
        await supabase
          .from("profiles")
          .select("is_admin")
          .eq(
            "id",
            user.id
          )
          .single();

      if (
        !profile?.is_admin
      ) {

        setAuthorized(false);

        setLoading(false);

        return;
      }

      setAuthorized(true);

      /*
        FETCH LISTINGS
      */
      const {
        data: listingsData,
      } =
        await supabase
          .from("listings")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      /*
        FETCH REVIEWS
      */
      const {
        data: reviewsData,
      } =
        await supabase
          .from("reviews")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      /*
        FETCH REPORTS
      */
      const {
        data: reportsData,
      } =
        await supabase
          .from("reports")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      /*
        TOTAL USERS
      */
      const {
        count: usersCount,
      } =
        await supabase
          .from("profiles")
          .select("*", {
            count: "exact",
            head: true,
          });

      /*
        TOTAL ORDERS
      */
      const {
        data: ordersData,
        count: ordersCount,
      } =
        await supabase
          .from("orders")
          .select("*", {
            count: "exact",
          });

      /*
        TOTAL LISTINGS
      */
      const {
        count: listingsCount,
      } =
        await supabase
          .from("listings")
          .select("*", {
            count: "exact",
            head: true,
          });

      /*
        TOTAL REVENUE
      */
      const revenue =
        ordersData?.reduce(
          (
            sum,
            order: any
          ) =>
            sum +
            Number(
              order.amount
            ),
          0
        ) || 0;

      setTotalUsers(
        usersCount || 0
      );

      setTotalOrders(
        ordersCount || 0
      );

      setTotalListings(
        listingsCount || 0
      );

      setTotalRevenue(
        revenue
      );

      setListings(
        listingsData || []
      );

      setReviews(
        reviewsData || []
      );

      setReports(
        reportsData || []
      );

      setLoading(false);
    }

    loadAdmin();

  }, [user]);

  async function deleteListing(
    id: string
  ) {

    const confirmed =
      confirm(
        "Delete this listing?"
      );

    if (!confirmed) return;

    await supabase
      .from("listings")
      .delete()
      .eq("id", id);

    setListings(
      (prev) =>
        prev.filter(
          (l) =>
            l.id !== id
        )
    );
  }

  async function deleteReview(
    id: string
  ) {

    const confirmed =
      confirm(
        "Delete this review?"
      );

    if (!confirmed) return;

    await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    setReviews(
      (prev) =>
        prev.filter(
          (r) =>
            r.id !== id
        )
    );
  }

  async function resolveReport(
    id: string
  ) {

    await supabase
      .from("reports")
      .update({
        status:
          "resolved",
      })
      .eq("id", id);

    setReports((prev) =>
      prev.map((report) =>
        report.id === id
          ? {
              ...report,
              status:
                "resolved",
            }
          : report
      )
    );
  }

  if (loading) {

    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fdf9f3]">

        <p className="text-xl">
          Loading admin panel...
        </p>
      </main>
    );
  }

  if (!authorized) {

    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fdf9f3]">

        <p className="text-xl text-red-500">
          Unauthorized
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">

      <div className="max-w-7xl mx-auto space-y-20">

        {/* HERO */}
        <div>

          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Platform Infrastructure
          </p>

          <h1 className="text-6xl font-serif text-[#2d1e15]">
            Admin Dashboard
          </h1>
        </div>

        {/* ANALYTICS */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-white rounded-3xl border border-orange-100 p-8">

            <p className="text-slate-500 text-sm">
              Total Users
            </p>

            <h2 className="text-5xl font-serif text-[#2d1e15] mt-4">
              {totalUsers}
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-orange-100 p-8">

            <p className="text-slate-500 text-sm">
              Total Orders
            </p>

            <h2 className="text-5xl font-serif text-[#2d1e15] mt-4">
              {totalOrders}
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-orange-100 p-8">

            <p className="text-slate-500 text-sm">
              Total Listings
            </p>

            <h2 className="text-5xl font-serif text-[#2d1e15] mt-4">
              {totalListings}
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-orange-100 p-8">

            <p className="text-slate-500 text-sm">
              Revenue
            </p>

            <h2 className="text-5xl font-serif text-[#2d1e15] mt-4">
              ₹{totalRevenue}
            </h2>
          </div>
        </section>

        {/* LISTINGS */}
        <section>

          <h2 className="text-4xl font-serif text-[#2d1e15] mb-8">
            Marketplace Listings
          </h2>

          <div className="space-y-4">

            {listings.map(
              (listing) => (

                <div
                  key={listing.id}
                  className="bg-white rounded-3xl border border-orange-100 p-6 flex items-center justify-between"
                >

                  <div>

                    <h3 className="text-2xl font-serif text-[#2d1e15]">
                      {listing.title}
                    </h3>

                    <p className="text-slate-500 mt-2">
                      Seller:
                      {" "}
                      {
                        listing.seller_name
                      }
                    </p>

                    <p className="text-[#c2784e] font-bold mt-2">
                      ₹{listing.price}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      deleteListing(
                        listing.id
                      )
                    }
                    className="px-5 py-3 bg-red-500 text-white rounded-2xl"
                  >
                    Delete
                  </button>
                </div>
              )
            )}
          </div>
        </section>

        {/* REVIEWS */}
        <section>

          <h2 className="text-4xl font-serif text-[#2d1e15] mb-8">
            Reviews
          </h2>

          <div className="space-y-4">

            {reviews.map(
              (review) => (

                <div
                  key={review.id}
                  className="bg-white rounded-3xl border border-orange-100 p-6 flex items-center justify-between gap-6"
                >

                  <div>

                    <p className="text-amber-500 font-bold">
                      {"★".repeat(
                        review.rating
                      )}
                    </p>

                    <p className="text-slate-700 mt-3">
                      {review.review}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      deleteReview(
                        review.id
                      )
                    }
                    className="px-5 py-3 bg-red-500 text-white rounded-2xl"
                  >
                    Delete
                  </button>
                </div>
              )
            )}
          </div>
        </section>

        {/* REPORTS */}
        <section>

          <h2 className="text-4xl font-serif text-[#2d1e15] mb-8">
            Reports
          </h2>

          <div className="space-y-4">

            {reports.map(
              (report) => (

                <div
                  key={report.id}
                  className="bg-white rounded-3xl border border-orange-100 p-6 flex items-center justify-between gap-6"
                >

                  <div>

                    <p className="text-sm text-slate-500 uppercase">
                      {report.target_type}
                    </p>

                    <p className="text-slate-700 mt-3">
                      {report.reason}
                    </p>

                    <p className="text-xs text-slate-400 mt-3">
                      Target:
                      {" "}
                      {report.target_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">

                    <span className={`px-4 py-2 rounded-full text-sm ${
                      report.status ===
                      "resolved"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>

                      {report.status}

                    </span>

                    {report.status !==
                      "resolved" && (

                      <button
                        onClick={() =>
                          resolveReport(
                            report.id
                          )
                        }
                        className="px-5 py-3 bg-[#3d2b1f] text-white rounded-2xl"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}