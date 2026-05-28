"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { useUser } from "@/hooks/useUser";

interface Profile {

  id: string;

  username: string;

  bio?: string;

  avatar_url?: string;

  is_public?: boolean;
}

export default function PublicProfilePage() {

  const params = useParams();

  const { user } = useUser();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [followers, setFollowers] =
    useState(0);

  const [following, setFollowing] =
    useState(0);

  const [isFollowing, setIsFollowing] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function fetchProfile() {

      try {

        const { data, error } =
          await supabase
            .from("profiles")
            .select("*")
            .eq(
              "username",
              params.username
            )
            .single();

        if (error || !data) {

          console.error(error);

          return;
        }

        setProfile(data);

        /* FOLLOWERS */
        const {
          count: followerCount,
        } =
          await supabase
            .from("follows")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq(
              "following_id",
              data.id
            );

        setFollowers(
          followerCount || 0
        );

        /* FOLLOWING */
        const {
          count: followingCount,
        } =
          await supabase
            .from("follows")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq(
              "follower_id",
              data.id
            );

        setFollowing(
          followingCount || 0
        );

        /* CHECK FOLLOW */
        if (user) {

          const {
            data: existingFollow,
          } =
            await supabase
              .from("follows")
              .select("*")
              .eq(
                "follower_id",
                user.id
              )
              .eq(
                "following_id",
                data.id
              )
              .single();

          setIsFollowing(
            !!existingFollow
          );
        }

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    }

    fetchProfile();

  }, [params.username, user]);

  async function toggleFollow() {

    if (!user || !profile) {

      alert(
        "Please login first"
      );

      return;
    }

    try {

      if (isFollowing) {

        await supabase
          .from("follows")
          .delete()
          .eq(
            "follower_id",
            user.id
          )
          .eq(
            "following_id",
            profile.id
          );

        setFollowers(
          (prev) => prev - 1
        );

        setIsFollowing(false);

      } else {

        await supabase
          .from("follows")
          .insert([
            {
              follower_id:
                user.id,

              following_id:
                profile.id,
            },
          ]);

        /*
          FOLLOW NOTIFICATION
        */
        await supabase
          .from("notifications")
          .insert([
            {
              user_id:
                profile.id,

              type:
                "follow",

              content:
                `${user.email} followed you`,
            },
          ]);

        setFollowers(
          (prev) => prev + 1
        );

        setIsFollowing(true);
      }

    } catch (error) {

      console.error(error);
    }
  }

  if (loading) {

    return (
      <main className="min-h-screen bg-[#fdf9f3] flex items-center justify-center">

        <p className="text-xl text-slate-600">
          Loading profile...
        </p>
      </main>
    );
  }

  if (!profile) {

    return (
      <main className="min-h-screen bg-[#fdf9f3] flex items-center justify-center">

        <p className="text-xl text-slate-600">
          Profile not found.
        </p>
      </main>
    );
  }

  if (
    profile.is_public === false
  ) {

    return (
      <main className="min-h-screen bg-[#fdf9f3] flex items-center justify-center">

        <p className="text-xl text-slate-600">
          This profile is private.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">

      <div className="max-w-4xl mx-auto">

        {/* HERO */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-12">

          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">

            {/* AVATAR */}
            <div>

              <img
                src={
                  profile.avatar_url ||
                  "https://placehold.co/200x200"
                }
                alt={
                  profile.username
                }
                className="w-40 h-40 rounded-full object-cover border-4 border-orange-100"
              />
            </div>

            {/* CONTENT */}
            <div className="flex-1 space-y-6 text-center md:text-left">

              <div>

                <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
                  Literary Identity
                </p>

                <h1 className="text-5xl font-serif text-[#2d1e15]">
                  @{profile.username}
                </h1>
              </div>

              <p className="text-slate-600 text-lg leading-relaxed">
                {profile.bio ||
                  "No bio yet."}
              </p>

              {/* STATS */}
              <div className="flex gap-10 justify-center md:justify-start">

                <div>

                  <p className="text-3xl font-bold text-[#2d1e15]">
                    {followers}
                  </p>

                  <p className="text-slate-500">
                    Followers
                  </p>
                </div>

                <div>

                  <p className="text-3xl font-bold text-[#2d1e15]">
                    {following}
                  </p>

                  <p className="text-slate-500">
                    Following
                  </p>
                </div>
              </div>

              {/* FOLLOW BUTTON */}
              {user?.id !==
                profile.id && (

                <button
                  onClick={
                    toggleFollow
                  }
                  className={`px-8 py-4 rounded-2xl text-white font-medium transition ${
                    isFollowing
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-[#3d2b1f] hover:bg-[#523a2a]"
                  }`}
                >
                  {isFollowing
                    ? "Unfollow"
                    : "Follow"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}