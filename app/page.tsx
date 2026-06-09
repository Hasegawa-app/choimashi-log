"use client";

import { useEffect, useMemo, useState } from "react";

type Mood = "しんどい" | "普通" | "小マシ";

type Entry = {
  date: string;
  mood: Mood;
  checks: string[];
  memo: string;
};

const STORAGE_KEY = "komashi-log-v1";

const CHECK_ITEMS = [
  "起きた",
  "仕事に行った",
  "帰ってきた",
  "飯を食った",
  "水を飲んだ",
  "風呂に入った",
  "人と最低限話した",
  "ミスに気づけた",
  "休めた",
  "相談できた",
  "何もないけど記録した",
];

function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadEntries(): Entry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Entry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: Entry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function Home() {
  const today = todayString();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [mood, setMood] = useState<Mood>("普通");
  const [checks, setChecks] = useState<string[]>([]);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    const loaded = loadEntries();
    setEntries(loaded);

    const todayEntry = loaded.find((e) => e.date === today);
    if (todayEntry) {
      setMood(todayEntry.mood);
      setChecks(todayEntry.checks);
      setMemo(todayEntry.memo);
    }
  }, [today]);

  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
  }, [entries]);

  const weeklySummary = useMemo(() => {
    const moodCount: Record<Mood, number> = {
      しんどい: 0,
      普通: 0,
      小マシ: 0,
    };

    const checkCount: Record<string, number> = {};

    for (const entry of recentEntries) {
      moodCount[entry.mood] += 1;

      for (const item of entry.checks) {
        checkCount[item] = (checkCount[item] ?? 0) + 1;
      }
    }

    const topChecks = Object.entries(checkCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { moodCount, topChecks };
  }, [recentEntries]);

  function toggleCheck(item: string) {
    setChecks((prev) =>
      prev.includes(item)
        ? prev.filter((x) => x !== item)
        : [...prev, item]
    );
  }

  function handleSave() {
    const newEntry: Entry = {
      date: today,
      mood,
      checks,
      memo,
    };

    const withoutToday = entries.filter((e) => e.date !== today);
    const updated = [...withoutToday, newEntry].sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    setEntries(updated);
    saveEntries(updated);
  }

  function handleClearToday() {
    setMood("普通");
    setChecks([]);
    setMemo("");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-6">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">今日の小マシログ</h1>
          <p className="text-sm text-zinc-400">
            良かったことじゃなくて、「最悪ではなかったこと」を残す。
          </p>
          <p className="text-sm text-zinc-500">今日：{today}</p>
        </header>

        <section className="rounded-2xl bg-zinc-900 p-4 space-y-4 border border-zinc-800">
          <h2 className="text-lg font-semibold">今日の状態</h2>

          <div className="grid grid-cols-3 gap-2">
            {(["しんどい", "普通", "小マシ"] as Mood[]).map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`rounded-xl py-3 text-sm font-semibold border ${
                  mood === m
                    ? "bg-zinc-100 text-zinc-950 border-zinc-100"
                    : "bg-zinc-800 text-zinc-200 border-zinc-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-zinc-900 p-4 space-y-4 border border-zinc-800">
          <h2 className="text-lg font-semibold">今日あった小マシ</h2>

          <div className="grid grid-cols-2 gap-2">
            {CHECK_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => toggleCheck(item)}
                className={`rounded-xl px-3 py-3 text-sm text-left border ${
                  checks.includes(item)
                    ? "bg-zinc-100 text-zinc-950 border-zinc-100"
                    : "bg-zinc-800 text-zinc-200 border-zinc-700"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="一言メモ。空欄でもOK。例：仕事と家の往復だけだった"
            className="w-full min-h-28 rounded-xl bg-zinc-950 border border-zinc-700 p-3 text-sm outline-none focus:border-zinc-400"
          />
        </section>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-zinc-100 text-zinc-950 py-3 font-bold"
          >
            保存
          </button>

          <button
            onClick={handleClearToday}
            className="rounded-xl bg-zinc-800 text-zinc-200 px-4 py-3 font-bold border border-zinc-700"
          >
            クリア
          </button>
        </div>

        <section className="rounded-2xl bg-zinc-900 p-4 space-y-4 border border-zinc-800">
          <h2 className="text-lg font-semibold">直近7件のまとめ</h2>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-zinc-800 p-3">
              <div className="text-xl font-bold">
                {weeklySummary.moodCount["しんどい"]}
              </div>
              <div className="text-xs text-zinc-400">しんどい</div>
            </div>
            <div className="rounded-xl bg-zinc-800 p-3">
              <div className="text-xl font-bold">
                {weeklySummary.moodCount["普通"]}
              </div>
              <div className="text-xs text-zinc-400">普通</div>
            </div>
            <div className="rounded-xl bg-zinc-800 p-3">
              <div className="text-xl font-bold">
                {weeklySummary.moodCount["小マシ"]}
              </div>
              <div className="text-xs text-zinc-400">小マシ</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">よく出た小マシ</h3>

            {weeklySummary.topChecks.length === 0 ? (
              <p className="text-sm text-zinc-500">まだ記録がありません。</p>
            ) : (
              <ul className="space-y-1 text-sm text-zinc-300">
                {weeklySummary.topChecks.map(([item, count]) => (
                  <li key={item}>
                    {item}：{count}回
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">記録一覧</h2>

          {recentEntries.length === 0 ? (
            <p className="text-sm text-zinc-500">まだ記録がありません。</p>
          ) : (
            recentEntries.map((entry) => (
              <article
                key={entry.date}
                className="rounded-2xl bg-zinc-900 p-4 border border-zinc-800 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">{entry.date}</h3>
                  <span className="text-sm rounded-full bg-zinc-800 px-3 py-1">
                    {entry.mood}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {entry.checks.length === 0 ? (
                    <span className="text-sm text-zinc-500">
                      小マシ項目なし
                    </span>
                  ) : (
                    entry.checks.map((item) => (
                      <span
                        key={item}
                        className="text-xs rounded-full bg-zinc-800 px-2 py-1"
                      >
                        {item}
                      </span>
                    ))
                  )}
                </div>

                {entry.memo && (
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {entry.memo}
                  </p>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}