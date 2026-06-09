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

function moodStyle(mood: Mood) {
  switch (mood) {
    case "しんどい":
      return {
        selected: "bg-red-500 text-white border-red-500",
        label: "bg-red-100 text-red-700 border-red-200",
      };
    case "普通":
      return {
        selected: "bg-sky-500 text-white border-sky-500",
        label: "bg-sky-100 text-sky-700 border-sky-200",
      };
    case "小マシ":
      return {
        selected: "bg-emerald-500 text-white border-emerald-500",
        label: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
  }
}

function checkItemStyle(item: string) {
  if (["起きた", "飯を食った", "水を飲んだ", "風呂に入った"].includes(item)) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  if (["仕事に行った", "帰ってきた", "人と最低限話した"].includes(item)) {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }

  if (["ミスに気づけた", "相談できた", "休めた"].includes(item)) {
    return "bg-violet-100 text-violet-800 border-violet-200";
  }

  return "bg-stone-100 text-stone-700 border-stone-200";
}

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
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const targetDate = editingDate ?? today;

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

  function resetForm() {
    setMood("普通");
    setChecks([]);
    setMemo("");
    setEditingDate(null);
    setSavedMessage("");
  }

  function handleSave() {
    const newEntry: Entry = {
      date: targetDate,
      mood,
      checks,
      memo,
    };

    const withoutTarget = entries.filter((e) => e.date !== targetDate);
    const updated = [...withoutTarget, newEntry].sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    setEntries(updated);
    saveEntries(updated);

    setSavedMessage(editingDate ? "記録を修正しました" : "保存しました");
    setEditingDate(null);
    setTimeout(() => setSavedMessage(""), 1800);
  }

  function handleEdit(entry: Entry) {
    setEditingDate(entry.date);
    setMood(entry.mood);
    setChecks(entry.checks);
    setMemo(entry.memo);
    setSavedMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(date: string) {
    const ok = window.confirm(`${date} の記録を削除しますか？`);
    if (!ok) return;

    const updated = entries.filter((e) => e.date !== date);
    setEntries(updated);
    saveEntries(updated);

    if (editingDate === date) {
      resetForm();
    }

    setSavedMessage("記録を削除しました");
    setTimeout(() => setSavedMessage(""), 1800);
  }

  return (
    <main className="min-h-screen bg-orange-50 text-stone-900 px-4 py-6">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-2">
          <div className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            {editingDate ? "記録を編集中" : "今日の記録"}
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            今日の小マシログ
          </h1>

          <p className="text-sm leading-6 text-stone-600">
            小さな進歩を残すアプリ。
          </p>

          <p className="text-sm text-stone-500">
            {editingDate ? `編集中：${editingDate}` : `今日：${today}`}
          </p>
        </header>

        <section className="rounded-3xl bg-white p-4 space-y-4 border border-orange-100 shadow-sm">
          <h2 className="text-lg font-semibold">状態</h2>

          <div className="grid grid-cols-3 gap-2">
            {(["しんどい", "普通", "小マシ"] as Mood[]).map((m) => {
              const style = moodStyle(m);

              return (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`rounded-2xl py-3 text-sm font-semibold border transition active:scale-[0.98] ${
                    mood === m ? style.selected : style.label
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 space-y-4 border border-orange-100 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">あった小マシ</h2>
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
            {editingDate ? "修正を保存" : "保存"}
          </button>

          <button
            onClick={resetForm}
            className="rounded-2xl bg-white text-stone-700 px-4 py-3 font-bold border border-orange-200 transition active:scale-[0.98]"
          >
            {editingDate ? "編集をやめる" : "クリア"}
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
            <div className={`rounded-2xl p-3 border ${moodStyle("しんどい").label}`}>
              <div className="text-2xl font-bold">
                {weeklySummary.moodCount["しんどい"]}
              </div>
              <div className="text-xs">しんどい</div>
            </div>

            <div className={`rounded-2xl p-3 border ${moodStyle("普通").label}`}>
              <div className="text-2xl font-bold">
                {weeklySummary.moodCount["普通"]}
              </div>
              <div className="text-xs">普通</div>
            </div>

            <div className={`rounded-2xl p-3 border ${moodStyle("小マシ").label}`}>
              <div className="text-2xl font-bold">
                {weeklySummary.moodCount["小マシ"]}
              </div>
              <div className="text-xs">小マシ</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">よく出た小マシ</h3>

            {weeklySummary.topChecks.length === 0 ? (
              <p className="text-sm text-stone-400">まだ記録がありません。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {weeklySummary.topChecks.map(([item, count]) => (
                  <span
                    key={item}
                    className={`rounded-full px-3 py-1 text-sm border ${checkItemStyle(
                      item
                    )}`}
                  >
                    {item}：{count}回
                  </span>
                ))}
              </div>
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
                className={`rounded-3xl bg-white p-4 border shadow-sm space-y-3 ${
                  editingDate === entry.date
                    ? "border-orange-400 ring-2 ring-orange-200"
                    : "border-orange-100"
                }`}
              >
                <div className="flex justify-between items-center gap-3">
                  <h3 className="font-bold">{entry.date}</h3>

                  <div className="flex items-center gap-2">
                    <span
                      className={`shrink-0 text-sm rounded-full px-3 py-1 border ${
                        moodStyle(entry.mood).label
                      }`}
                    >
                      {entry.mood}
                    </span>

                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-xs rounded-full bg-white text-stone-600 px-3 py-1 border border-stone-200"
                    >
                      編集
                    </button>

                    <button
                      onClick={() => handleDelete(entry.date)}
                      className="text-xs rounded-full bg-white text-red-600 px-3 py-1 border border-red-200"
                    >
                      削除
                    </button>
                  </div>
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
                        className={`text-xs rounded-full px-2 py-1 border ${checkItemStyle(
                          item
                        )}`}
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