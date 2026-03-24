import { useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTIONS = [
  "ideas",
  "votes",
  "comments",
  "teamRequests",
  "teamMembers",
  "users",
] as const;

type ColName = (typeof COLLECTIONS)[number];

type Status = Record<ColName, { count: number | null; deleting: boolean }>;

const initial: Status = Object.fromEntries(
  COLLECTIONS.map((c) => [c, { count: null, deleting: false }]),
) as Status;

export default function DevTools() {
  const [status, setStatus] = useState<Status>(initial);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const fetchCount = async (col: ColName) => {
    const snap = await getDocs(collection(db, col));
    setStatus((s) => ({
      ...s,
      [col]: { ...s[col], count: snap.size },
    }));
    addLog(`${col}: ${snap.size} docs`);
  };

  const fetchAll = () => COLLECTIONS.forEach(fetchCount);

  const deleteAll = async (col: ColName) => {
    if (
      !window.confirm(
        `Delete ALL documents in "${col}"? This cannot be undone.`,
      )
    )
      return;

    setStatus((s) => ({ ...s, [col]: { ...s[col], deleting: true } }));
    const snap = await getDocs(collection(db, col));
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, col, d.id))));
    addLog(`Deleted ${snap.size} docs from ${col}`);
    setStatus((s) => ({ ...s, [col]: { count: 0, deleting: false } }));
  };

  return (
    <div className="max-w-[640px] mx-auto px-5 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-medium text-gray-900 dark:text-gray-100 mb-1">
          Dev Tools
        </h1>
        <p className="text-[13px] text-red-500 dark:text-red-400 font-medium">
          ⚠ Testing only — deletes are permanent
        </p>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={fetchAll}
          className="text-[13px] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Refresh counts
        </button>
      </div>

      <div className="space-y-2 mb-6">
        {COLLECTIONS.map((col) => {
          const s = status[col];
          return (
            <div
              key={col}
              className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200 font-mono">
                  {col}
                </span>
                {s.count !== null && (
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {s.count} docs
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => fetchCount(col)}
                  className="text-[12px] px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Count
                </button>
                <button
                  onClick={() => deleteAll(col)}
                  disabled={s.deleting}
                  className="text-[12px] font-medium px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-40"
                >
                  {s.deleting ? "Deleting…" : "Delete all"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {log.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Log
            </span>
            <button
              onClick={() => setLog([])}
              className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-48 overflow-y-auto">
            {log.map((entry, i) => (
              <p
                key={i}
                className="px-4 py-2 text-[12px] font-mono text-gray-600 dark:text-gray-400"
              >
                {entry}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
