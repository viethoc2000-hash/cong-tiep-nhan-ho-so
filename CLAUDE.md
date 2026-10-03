# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint     # eslint (flat config in eslint.config.mjs)
```

There is no test suite. `node_modules` is not committed, so run `npm install` first. Next.js 16 / React 19 docs ship in `node_modules/next/dist/docs/` (see AGENTS.md); read them before using Next APIs.

## Project state

"DuHoc24 - Cổng Tiếp Nhận Hồ Sơ Du Học": a sample repo for a 6-week course, currently at **Week 1 UI + Week 2 chatbot**. The landing-page chat widget calls Gemini for real; everything else is still static mock UI with no database. The README's roadmap lists what later weeks add (Gemini chatbot, Supabase, Gemini document extraction, Make.com emails, magic-link auth); don't build those unless asked. `/login` is intentionally missing (students build it in Week 6). `.env.example` lists the future variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`); none are needed for `npm run dev`.

Khi dự án chuyển sang tuần mới (có backend thật), cập nhật lại mục này cho đúng thực tế: bỏ ghi chú "chỉ UI tĩnh", ghi rõ tính năng nào đã nối thật, và cập nhật mục Architecture nếu `lib/mock-data.ts` không còn là nguồn dữ liệu.

## Architecture

Next.js App Router + TypeScript + Tailwind CSS v4 + shadcn/ui (`base-nova` style on Base UI, not Radix). Path alias `@/*` maps to the repo root.

- **All data is mock data in `lib/mock-data.ts`.** Every page imports its data and types (`School`, `AdmissionRequest`, `StudentProfile`, `Conversation`, status unions such as `DocStatus` / `RequestStatus`) from this one file. When wiring real backends, this file defines the shape the Supabase tables are expected to mirror. Status values are Vietnamese snake_case strings (`cho_duyet`, `hop_le`, ...) and are rendered through `components/status-badge.tsx`.
- **Routes:** `/` (landing: `components/landing/*`), `/portal` (student portal: `components/portal/*`), and `/admin/*` (requests, schools, profiles, conversations). `app/admin/layout.tsx` provides the sidebar shell shared by all admin pages, and `/admin` just redirects to `/admin/requests`.
- **UI is mostly server components.** Interactive pieces are marked `"use client"` (e.g. `components/landing/chat-widget.tsx` and `quote-form.tsx`, which are currently static/mock behavior). Generic primitives live in `components/ui/` (shadcn-generated); add new ones with the shadcn CLI, configured in `components.json`, which also registers the `@tailark-oss` registry that the landing blocks came from.
- **Chatbot (Gemini):** `components/landing/chat-widget.tsx` POSTs the whole conversation to `app/api/chat/route.ts`, which calls Gemini via `@google/genai`. `lib/qna.ts` holds the QnA list and builds the `systemInstruction`; the bot may only answer from that list and must reply with `OUT_OF_SCOPE_REPLY` otherwise. To change what the bot knows, edit `lib/qna.ts` only. The API key is read from `process.env.GEMINI_API_Key` (note the exact casing used in `.env`), server-side only. The model id is the `MODEL` constant in the route; Google retires models for new accounts (`gemini-2.5-flash` returned 404), so check it first if chat starts failing.
- Root layout (`app/layout.tsx`) sets `lang="vi"` and the Be Vietnam Pro font via the `--font-sans` variable. All user-facing copy is Vietnamese.

## Quy tắc Git

- Luôn hỏi xác nhận trước khi push lên GitHub.
- Không bao giờ commit file `.env` hoặc bất kỳ file chứa API key.
