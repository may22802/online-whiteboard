"use client";

import Image from "next/image";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  ArrowRight,
  Download,
  MousePointer2,
  Sparkles,
  ThumbsUp,
  UsersRound,
} from "lucide-react";

const featureItems = [
  {
    icon: UsersRound,
    label: "Collaborate",
    description: "Work on the same board with your team in real time.",
  },
  {
    icon: ThumbsUp,
    label: "Vote",
    description: "Run quick voting sessions on sticky notes and ideas.",
  },
  {
    icon: Download,
    label: "Export",
    description: "Download your finished board as an SVG file.",
  },
];

export default function Home() {
  return (
    <>
      <Authenticated>
        <AuthenticatedLanding />
      </Authenticated>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </>
  );
}

function LandingPage() {
  return (
    <LandingShell
      action={
        <div className="flex flex-col gap-3 sm:flex-row">
          <SignUpButton mode="modal">
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800">
              Sign up
              <ArrowRight className="size-4" />
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50">
              Log in
            </button>
          </SignInButton>
        </div>
      }
    />
  );
}

function AuthenticatedLanding() {
  return (
    <LandingShell
      action={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Go to dashboard
            <ArrowRight className="size-4" />
          </Link>
          <UserButton />
        </div>
      }
      eyebrow="Welcome back"
      supportingCopy="Your boards are ready when you are. Jump back into your workspace and keep building ideas together."
    />
  );
}

function LandingShell({
  action,
  eyebrow = "Online whiteboard",
  supportingCopy = "Create, vote, and export ideas with a shared canvas built for quick workshops and team sessions.",
}: {
  action: React.ReactNode;
  eyebrow?: string;
  supportingCopy?: string;
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f3ec] text-zinc-950">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-x-0 top-0 z-20 border-b border-zinc-900/10 bg-[#f7f3ec]/85 backdrop-blur">
          <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Online whiteboard logo"
                width={34}
                height={34}
                priority
                className="h-8 w-8"
              />
              <span className="text-sm font-semibold tracking-normal text-zinc-900">
                Online whiteboard
              </span>
            </div>
            <div className="hidden sm:block">{action}</div>
          </header>
        </div>

        <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 pb-12 pt-28 lg:grid-cols-[0.94fr_1.06fr] lg:pt-20">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-900/10 bg-white/80 px-3 py-1 text-sm font-medium text-zinc-700 shadow-sm">
              <Sparkles className="size-4 text-amber-500" />
              {eyebrow}
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-normal text-zinc-950 sm:text-6xl lg:text-7xl">
              Online whiteboard
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-700">
              {supportingCopy}
            </p>
            <div className="mt-8">{action}</div>
          </div>

          <div className="relative min-h-[430px] lg:min-h-[560px]">
            <div className="absolute left-4 top-0 hidden rotate-[-8deg] rounded-md bg-[#ff8b2b] px-5 py-4 text-sm font-semibold text-white shadow-xl sm:block">
              Sprint ideas
            </div>
            <div className="absolute right-2 top-6 rounded-md bg-[#4acb68] px-5 py-4 text-sm font-semibold text-zinc-950 shadow-xl">
              Vote today
            </div>

            <div className="absolute left-0 right-0 top-20 mx-auto max-w-[560px] rounded-md border border-zinc-900/10 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-900/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
                  Workshop board
                </div>
              </div>
              <div className="relative h-[330px] overflow-hidden bg-[#fbfbf8] sm:h-[390px]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.05)_1px,transparent_1px)] bg-[size:38px_38px]" />
                <div className="absolute left-[9%] top-[16%] h-28 w-36 rounded-sm bg-[#fff4a8] p-5 text-center text-lg font-semibold shadow-lg">
                  Roadmap
                </div>
                <div className="absolute left-[39%] top-[9%] h-28 w-36 rounded-sm bg-[#cfc4ff] p-5 text-center text-lg font-semibold shadow-lg">
                  Research
                  <div className="absolute -top-5 left-4 flex h-8 items-center gap-1 rounded-full border border-blue-300 bg-white px-3 text-sm text-blue-600 shadow-md">
                    <ThumbsUp className="size-4 fill-blue-500 text-blue-500" />
                    4
                  </div>
                </div>
                <div className="absolute bottom-[18%] left-[18%] h-24 w-24 rounded-full bg-[#2f8de4] shadow-lg" />
                <div className="absolute bottom-[14%] right-[13%] h-28 w-36 rounded-sm bg-[#ff8b2b] p-5 text-center text-lg font-semibold shadow-lg">
                  Launch
                </div>
                <div className="absolute right-[16%] top-[38%] h-16 w-40 rounded-md border-2 border-zinc-950 bg-white px-4 py-3 text-sm font-semibold shadow-lg">
                  Export SVG
                  <Download className="absolute bottom-3 right-3 size-5" />
                </div>
                <div className="absolute left-[48%] top-[53%] rounded-md border border-zinc-900/10 bg-white px-3 py-2 text-sm font-medium shadow-lg">
                  <MousePointer2 className="mr-2 inline size-4 text-blue-600" />
                  May
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto grid max-w-6xl gap-3 px-5 pb-10 sm:grid-cols-3">
          {featureItems.map((item) => (
            <div
              key={item.label}
              className="rounded-md border border-zinc-900/10 bg-white/85 p-5 shadow-sm backdrop-blur"
            >
              <item.icon className="mb-4 size-5 text-zinc-900" />
              <h2 className="text-base font-semibold text-zinc-950">
                {item.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
