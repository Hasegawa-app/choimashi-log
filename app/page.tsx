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
  const [savedMessage, setSavedMessage] = useState("");

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

    setSavedMessage("保存しました");
    setTimeout(() => setSavedMessage(""), 1800);
  }

  function handleClearToday() {
    setMood("普通");
    setChecks([]);
    setMemo("");
    setSavedMessage("");
  }

  return (
    <main className="min-h-screen bg-orange-50 text-stone-900 px-4 py-6">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-2">
          <div className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            今日の記録
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            今日の小マシログ
          </h1>

          <p className="text-sm leading-6 text-stone-600">
            小さな記録をするアプリ。
          </p>

          <p className="text-sm text-stone-500">今日：{today}</p>
        </header>

        <section className="rounded-3xl bg-white p-4 space-y-4 border border-orange-100 shadow-sm">
          <h2 className="text-lg font-semibold">今日の状態</h2>

          <div className="grid grid-cols-3 gap-2">
            {(["しんどい", "普通", "小マシ"] as Mood[]).map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`rounded-2xl py-3 text-sm font-semibold border transition active:scale-[0.98] ${
                  mood === m
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                    : "bg-orange-50 text-stone-700 border-orange-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 space-y-4 border border-orange-100 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">今日あった小マシ</h2>
            <p className="text-xs text-stone-500">
              それっぽいものを押すだけ。何もなければ「何もないけど記録した」でOK。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CHECK_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => toggleCheck(item)}
                className={`rounded-2xl px-3 py-3 text-sm text-left border transition active:scale-[0.98] ${
                  checks.includes(item)
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                    : "bg-white text-stone-700 border-orange-100"
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
            className="w-full min-h-28 rounded-2xl bg-orange-50 border border-orange-200 p-3 text-sm outline-none focus:border-orange-400 placeholder:text-stone-400"
          />
        </section>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded-2xl bg-orange-500 text-white py-3 font-bold shadow-sm transition active:scale-[0.98]"
          >
            保存
          </button>

          <button
            onClick={handleClearToday}
            className="rounded-2xl bg-white text-stone-700 px-4 py-3 font-bold border border-orange-200 transition active:scale-[0.98]"
          >
            クリア
          </button>
        </div>

        {savedMessage && (
          <p className="rounded-2xl bg-orange-100 px-4 py-3 text-sm font-semibold text-orange-700">
            {savedMessage}
          </p>
        )}

        <section className="rounded-3xl bg-white p-4 space-y-4 border border-orange-100 shadow-sm">
          <h2 className="text-lg font-semibold">直近7件のまとめ</h2>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-orange-50 p-3 border border-orange-100">
              <div className="text-2xl font-bold">
                {weeklySummary.moodCount["しんどい"]}
              </div>
              <div className="text-xs text-stone-500">しんどい</div>
            </div>

            <div className="rounded-2xl bg-orange-50 p-3 border border-orange-100">
              <div className="text-2xl font-bold">
                {weeklySummary.moodCount["普通"]}
              </div>
              <div className="text-xs text-stone-500">普通</div>
            </div>

            <div className="rounded-2xl bg-orange-50 p-3 border border-orange-100">
              <div className="text-2xl font-bold">
                {weeklySummary.moodCount["小マシ"]}
              </div>
              <div className="text-xs text-stone-500">小マシ</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">よく出た小マシ</h3>

            {weeklySummary.topChecks.length === 0 ? (
              <p className="text-sm text-stone-400">まだ記録がありません。</p>
            ) : (
              <ul className="space-y-1 text-sm text-stone-700">
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
            <p className="text-sm text-stone-400">まだ記録がありません。</p>
          ) : (
            recentEntries.map((entry) => (
              <article
                key={entry.date}
                className="rounded-3xl bg-white p-4 border border-orange-100 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center gap-3">
                  <h3 className="font-bold">{entry.date}</h3>
                  <span className="shrink-0 text-sm rounded-full bg-orange-100 text-orange-800 px-3 py-1">
                    {entry.mood}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {entry.checks.length === 0 ? (
                    <span className="text-sm text-stone-400">
                      小マシ項目なし
                    </span>
                  ) : (
                    entry.checks.map((item) => (
                      <span
                        key={item}
                        className="text-xs rounded-full bg-orange-100 text-orange-800 px-2 py-1"
                      >
                        {item}
                      </span>
                    ))
                  )}
                </div>

                {entry.memo && (
                  <p className="text-sm leading-6 text-stone-700 whitespace-pre-wrap">
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