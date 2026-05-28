import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    console.log("API BOOK ID:", id);

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}?key=${process.env.GOOGLE_BOOKS_API_KEY}`,
      {
        cache: "no-store",
      }
    );

    console.log("GOOGLE STATUS:", response.status);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Google Books request failed",
          status: response.status,
        },
        {
          status: response.status,
        }
      );
    }

    const data = await response.json();

    console.log("GOOGLE DATA RECEIVED");

    return NextResponse.json(data);
  } catch (error) {
    console.error("API ROUTE ERROR:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}