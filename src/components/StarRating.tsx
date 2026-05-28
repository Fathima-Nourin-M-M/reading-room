"use client";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClasses = { sm: "text-sm", md: "text-base", lg: "text-xl" };

  return (
    <span className={`inline-flex items-center gap-0.5 ${sizeClasses[size]}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <button
            key={i}
            type="button"
            onClick={() => interactive && onChange?.(i + 1)}
            className={`${interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}`}
            aria-label={interactive ? `Rate ${i + 1} out of ${max}` : undefined}
            tabIndex={interactive ? 0 : -1}
          >
            <span className={filled ? "text-[#c28b4a]" : "text-[#d9c4ae]"}>
              {filled ? "★" : "☆"}
            </span>
          </button>
        );
      })}
    </span>
  );
}

interface RatingSummaryProps {
  average: number;
  count: number;
  size?: "sm" | "md";
}

export function RatingSummary({ average, count, size = "sm" }: RatingSummaryProps) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <StarRating rating={average} size={size} />
      <span className={`font-medium text-[#8a5a3b] ${size === "sm" ? "text-sm" : "text-base"}`}>
        {average.toFixed(1)}
      </span>
      <span className={`text-[#9c7148] ${size === "sm" ? "text-xs" : "text-sm"}`}>
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}
