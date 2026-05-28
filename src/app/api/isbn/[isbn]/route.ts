import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    isbn: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { isbn } = await context.params;

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.GOOGLE_BOOKS_API_KEY}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch ISBN data",
      },
      {
        status: 500,
      }
    );
  }
}