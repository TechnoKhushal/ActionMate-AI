"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function Home() {
  const [goal, setGoal] = useState(
    "Schedule a 30-minute meeting with Rahul tomorrow afternoon"
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function connectGoogle() {
    window.location.href =
      `${API_URL}/auth/google`;
  }

  async function runTask() {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            goal,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Task failed"
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">

        <h1 className="text-5xl font-bold">
          ActionMate
        </h1>

        <p className="mt-3 text-xl text-slate-400">
          Your Autonomous AI Employee
        </p>

        <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900 p-8">

          <label className="text-sm text-slate-400">
            Give ActionMate a job
          </label>

          <textarea
            value={goal}
            onChange={(e) =>
              setGoal(e.target.value)
            }
            rows={5}
            className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950 p-5 text-lg outline-none focus:border-slate-400"
          />

          <div className="mt-5 flex gap-3">

            <button
              onClick={connectGoogle}
              className="rounded-xl border border-slate-700 px-5 py-3 hover:bg-slate-800"
            >
              Connect Google
            </button>

            <button
              onClick={runTask}
              disabled={loading}
              className="rounded-xl bg-white px-6 py-3 font-bold text-slate-950 hover:bg-slate-200 disabled:opacity-50"
            >
              {loading
                ? "ActionMate is working..."
                : "Give ActionMate a Job →"}
            </button>

          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-800 bg-red-950/40 p-5">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">

            <h2 className="text-2xl font-bold">
              Action Proof
            </h2>

            <div className="mt-6 space-y-4">

              <div>
                <span className="text-slate-500">
                  Status
                </span>

                <p className="font-semibold">
                  {result.status}
                </p>
              </div>

              {result.contact && (
                <div>
                  <span className="text-slate-500">
                    Contact
                  </span>

                  <p>
                    {result.contact.name}
                  </p>

                  <p className="text-slate-400">
                    {result.contact.email}
                  </p>
                </div>
              )}

              {result.slot?.startDateTime && (
                <div>
                  <span className="text-slate-500">
                    Verified time
                  </span>

                  <p>
                    {new Date(
                      result.slot.startDateTime
                    ).toLocaleString("en-IN")}
                  </p>

                  <p className="text-slate-400">
                    →
                    {" "}
                    {new Date(
                      result.slot.endDateTime
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              {result.meeting && (
                <div>
                  <span className="text-slate-500">
                    Calendar
                  </span>

                  <p className="font-semibold">
                    ✓ Meeting created
                  </p>

                  {result.meeting.htmlLink && (
                    <a
                      href={result.meeting.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block underline"
                    >
                      Open Google Calendar event
                    </a>
                  )}
                </div>
              )}

              {result.message && (
                <div className="rounded-xl bg-slate-950 p-4">
                  {result.message}
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </main>
  );
}