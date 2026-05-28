interface RecommendationItem {
  id: string;

  title: string;

  categories?: string[];

  tags?: string[];
}

export function getRecommendations(
  currentItem: RecommendationItem,

  items: RecommendationItem[]
) {

  const scored = items

    .filter(
      (item) =>
        item.id !== currentItem.id
    )

    .map((item) => {

      let score = 0;

      // CATEGORY MATCHES
      currentItem.categories?.forEach(
        (category) => {

          if (
            item.categories?.includes(
              category
            )
          ) {
            score += 3;
          }
        }
      );

      // TAG MATCHES
      currentItem.tags?.forEach(
        (tag) => {

          if (
            item.tags?.includes(tag)
          ) {
            score += 5;
          }
        }
      );

      return {
        ...item,
        recommendationScore:
          score,
      };
    })

    .sort(
      (a, b) =>
        b.recommendationScore -
        a.recommendationScore
    );

  return scored.slice(0, 6);
}