# Sankofa

Live: https://sankofa-gray.vercel.app

Virtual WASSCE remedial classes for Ghana. Students follow screened teachers, join virtual classroom sessions, ask public questions, submit classwork and book private or group extra hours. Teachers run a studio of classrooms, lesson paths, timetables and bookings. Admins screen teachers (certificate, CV, references, Ghana Card, digital address) and feed the WASSCE predictor agent with past papers and chief examiner reports.

## Stack
- Next.js 15 (App Router) on Vercel
- Supabase: Postgres with row-level security, Auth, Storage, Realtime notifications
- Anthropic Claude for the predictor agent

## Environment variables
| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key |
| `ANTHROPIC_API_KEY` | Enables the predictor agent |
| `ANTHROPIC_MODEL` | Optional, defaults to `claude-sonnet-5-5` |
| `PREDICTION_CREDIT_COST` | Optional, credits per generated paper (default 1) |

## Roles
- Sign up as **student** or **teacher**. There is a single admin account (egu.quecy@gmail.com); no other account can become admin.
- Teachers are invisible to students until an admin approves their screening.
