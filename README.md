# The Reading Room 📚

A literary e-commerce platform for book lovers — built with a warm, book-themed aesthetic and a full shopping experience from browsing to checkout.

## Overview

The Reading Room is a Next.js/Supabase e-commerce platform designed around the experience of browsing and buying books. It combines a curated catalog (sourced from the Google Books API and Project Gutenberg) with a complete purchase flow — multi-step checkout, simulated payments, and a review/ratings system — wrapped in a cozy, literary visual identity rather than a generic storefront look.

## Features

- 📖 **Curated book catalog** — populated using the Google Books API and Project Gutenberg for realistic, varied listings
- 🛒 **Multi-step checkout flow** — a guided purchase experience from cart to confirmation
- 💳 **Simulated payment gateway** — full checkout UX without requiring real payment processing
- ⭐ **Reviews & ratings** — components for users to leave reviews, plus report modals for moderation
- 🎨 **Warm, book-themed design** — a distinctive visual identity built around the literary subject matter, not a default e-commerce template

## Tech Stack

- **Frontend/Backend**: Next.js
- **Database**: Supabase
- **Data Sources**: Google Books API, Project Gutenberg

## Design Notes

Book catalog data (titles, authors, covers, descriptions) is sourced from the Google Books API and Project Gutenberg to simulate a realistic library; prices are simulated/randomly generated rather than pulled from real retail data, since this is a demonstration platform rather than a live storefront.

## Status

Core shopping experience implemented: catalog browsing, multi-step checkout, simulated payments, and the review/rating system with moderation support.

---

*A bookstore experience that feels like a bookstore — built for readers, not just shoppers.*
