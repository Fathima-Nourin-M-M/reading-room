"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import { useUser } from "@/hooks/useUser";

export default function ProfilePage() {

  const { user } = useUser();

  const [favoriteTags, setFavoriteTags] =
    useState<string[]>([]);

  const [username, setUsername] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [favoriteGenres, setFavoriteGenres] =
    useState("");

  const [isPublic, setIsPublic] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [stats, setStats] =
    useState({
      wishlist: 0,
      reading: 0,
      completed: 0,
    });

  useEffect(() => {

    async function fetchProfile() {

      if (!user) return;

      const { data, error } =
        await supabase
          .from("profiles")
          .select("*")
          .eq(
            "id",
            user.id
          )
          .single();

      if (error) {

        console.error(error);

        return;
      }

      if (data) {

        setUsername(
          data.username || ""
        );

        setBio(
          data.bio || ""
        );

        setFavoriteGenres(
          data.favorite_genres
            ?.join(", ") || ""
        );

        setIsPublic(
          data.is_public || false
        );
      }
    }

    fetchProfile();

    const wishlist =
      JSON.parse(
        localStorage.getItem(
          "wishlist"
        ) || "[]"
      );

    const marketplace =
      JSON.parse(
        localStorage.getItem(
          "marketplace"
        ) || "[]"
      );

    const tagFrequency:
      Record<string, number> = {};

    let reading = 0;

    let completed = 0;

    marketplace.forEach(
      (book: any) => {

        const progress =
          Number(
            localStorage.getItem(
              `reading-progress-${book.id}`
            ) || 0
          );

        if (progress > 0) {
          reading++;
        }

        if (progress >= 100) {
          completed++;
        }

        book.tags?.forEach(
          (tag: string) => {

            tagFrequency[tag] =
              (tagFrequency[tag] || 0) + 1;
          }
        );
      }
    );

    const sortedTags =
      Object.entries(tagFrequency)

        .sort(
          (a, b) => b[1] - a[1]
        )

        .map((entry) => entry[0])

        .slice(0, 10);

    setFavoriteTags(sortedTags);

    setStats({
      wishlist: wishlist.length,
      reading,
      completed,
    });

  }, [user]);

  async function saveProfile() {

    if (!user) {

      alert(
        "Please login first"
      );

      return;
    }

    try {

      setLoading(true);

      const { error } =
        await supabase
          .from("profiles")
          .upsert([
            {
              id: user.id,

              username,

              bio,

              is_public:
                isPublic,

              favorite_genres:
                favoriteGenres
                  .split(",")
                  .map(
                    (genre) =>
                      genre.trim()
                  ),
            },
          ]);

      if (error) {

        console.error(error);

        alert(
          "Failed to save profile"
        );

        return;
      }

      alert(
        "Profile updated!"
      );

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">

      <div className="max-w-6xl mx-auto space-y-16">

        {/* HERO */}
        <section>

          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Literary Identity
          </p>

          <h1 className="text-6xl font-serif text-[#2d1e15]">
            Reader Profile
          </h1>
        </section>

        {/* PROFILE FORM */}
        <section className="bg-white rounded-3xl border border-orange-100 p-10 shadow-lg space-y-6">

          <div>

            <label className="block mb-2 text-sm font-medium text-[#2d1e15]">
              Username
            </label>

            <input
              type="text"
              placeholder="Your literary identity"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none"
            />
          </div>

          <div>

            <label className="block mb-2 text-sm font-medium text-[#2d1e15]">
              Bio
            </label>

            <textarea
              placeholder="Tell readers about yourself..."
              value={bio}
              onChange={(e) =>
                setBio(
                  e.target.value
                )
              }
              className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none min-h-[140px]"
            />
          </div>

          <div>

            <label className="block mb-2 text-sm font-medium text-[#2d1e15]">
              Favorite Genres
            </label>

            <input
              type="text"
              placeholder="Fantasy, Literary Fiction, Philosophy..."
              value={favoriteGenres}
              onChange={(e) =>
                setFavoriteGenres(
                  e.target.value
                )
              }
              className="w-full px-5 py-4 rounded-2xl border border-orange-100 outline-none"
            />
          </div>

          {/* PUBLIC PROFILE TOGGLE */}
          <div className="flex items-center gap-3">

            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) =>
                setIsPublic(
                  e.target.checked
                )
              }
              className="w-5 h-5"
            />

            <label className="text-[#2d1e15]">
              Make profile public
            </label>
          </div>

          <button
            onClick={saveProfile}
            disabled={loading}
            className="px-8 py-4 bg-[#3d2b1f] text-white rounded-2xl hover:bg-[#523a2a] transition"
          >
            {loading
              ? "Saving..."
              : "Save Profile"}
          </button>
        </section>

        {/* STATS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <div className="bg-white rounded-3xl border border-orange-100 p-8 shadow-lg">

            <p className="text-sm uppercase tracking-[0.2em] text-[#c2784e] mb-3">
              Wishlist
            </p>

            <h2 className="text-5xl font-serif text-[#2d1e15]">
              {stats.wishlist}
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-orange-100 p-8 shadow-lg">

            <p className="text-sm uppercase tracking-[0.2em] text-[#c2784e] mb-3">
              Currently Reading
            </p>

            <h2 className="text-5xl font-serif text-[#2d1e15]">
              {stats.reading}
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-orange-100 p-8 shadow-lg">

            <p className="text-sm uppercase tracking-[0.2em] text-[#c2784e] mb-3">
              Completed
            </p>

            <h2 className="text-5xl font-serif text-[#2d1e15]">
              {stats.completed}
            </h2>
          </div>
        </section>

        {/* FAVORITE TAGS */}
        <section>

          <div className="mb-8">

            <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
              Taste Graph
            </p>

            <h2 className="text-4xl font-serif text-[#2d1e15]">
              Favorite Literary Themes
            </h2>
          </div>

          <div className="flex flex-wrap gap-4">

            {favoriteTags.map((tag) => (

              <div
                key={tag}
                className="px-5 py-3 bg-[#3d2b1f] text-white rounded-full"
              >
                {tag}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}