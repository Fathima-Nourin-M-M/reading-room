"use client";

import Link from "next/link";

export interface ReadingFormatLink {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
}

interface ReadingFormatChooserProps {
  title: string;
  authors?: string;
  sourceLabel: string;
  links: ReadingFormatLink[];
  hint?: string;
}

export default function ReadingFormatChooser({
  title,
  authors,
  sourceLabel,
  links,
  hint,
}: ReadingFormatChooserProps) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/95 p-8 text-center shadow-[0_20px_48px_rgba(74,43,22,0.12)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
        {sourceLabel}
      </p>
      <h1 className="mt-3 font-serif text-3xl text-[#2b1c14]">{title}</h1>
      {authors && (
        <p className="mt-2 text-sm text-[#614737]">{authors}</p>
      )}
      <p className="mt-4 text-sm leading-relaxed text-[#614737]">
        {hint ||
          "This title is available in another format. Choose how you would like to read it."}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        {links.map((link) =>
          link.external ? (
            <a
              key={link.href + link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-[#3d281d] px-5 py-3 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#553727]"
            >
              {link.label}
              {link.description && (
                <span className="mt-1 block text-xs font-normal text-[#f0dcc8]">
                  {link.description}
                </span>
              )}
            </a>
          ) : (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="rounded-2xl border border-[#3d281d] bg-[#fff8ef] px-5 py-3 text-sm font-medium text-[#3d281d] transition hover:bg-[#f7e6d0]"
            >
              {link.label}
            </Link>
          )
        )}
      </div>
      <Link
        href="/library"
        className="mt-6 inline-block text-sm text-[#7d5134] underline-offset-2 hover:underline"
      >
        Back to library
      </Link>
    </div>
  );
}
