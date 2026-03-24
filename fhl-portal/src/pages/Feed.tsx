import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import type { Idea } from "../types";
import IdeaCard from "../components/IdeaCard";
import { Link } from "react-router-dom";

type SortMode = "top" | "new";
type FilterTag = "all" | "fix" | "hack" | "learn";

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-xl p-4 flex gap-3">
      <div className="w-8 flex flex-col items-center gap-2 pt-1">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="w-4 h-3 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="flex-1 space-y-2.5 pt-1">
        <div className="w-16 h-4 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="w-3/4 h-4 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="w-full h-3.5 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="w-2/3 h-3.5 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    </div>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortMode>("top");
  const [filter, setFilter] = useState<FilterTag>("all");
  const [loading, setLoading] = useState(true);
  const [totalIdeas, setTotalIdeas] = useState(0);
  const [teamsForming, setTeamsForming] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "ideas"),
      orderBy(sort === "top" ? "voteCount" : "createdAt", "desc"),
    );
    return onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Idea);
      setIdeas(all);
      setTotalIdeas(all.length);
      setTeamsForming(all.filter((i) => i.teamSize > 0).length);
      setTotalVotes(all.reduce((sum, i) => sum + (i.voteCount || 0), 0));
      setLoading(false);
    });
  }, [sort]);

  useEffect(() => {
    if (!user) {
      setUserVotes(new Set());
      return;
    }
    getDocs(
      query(collection(db, "votes"), where("userId", "==", user.uid)),
    ).then((snap) => {
      setUserVotes(new Set(snap.docs.map((d) => d.data().ideaId as string)));
    });
  }, [user]);

  const filtered =
    filter === "all" ? ideas : ideas.filter((i) => i.tag === filter);

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-[22px] font-medium text-gray-900 dark:text-gray-100 mb-1">
          FHL 2025 — Ideas board
        </h1>
        <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-5">
          Vote on ideas, form teams, and build something great.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {[
            { value: totalVotes, label: "total votes" },
            { value: totalIdeas, label: "ideas posted" },
            { value: teamsForming, label: "teams forming" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-xl px-4 py-3"
            >
              <div className="text-[20px] font-medium text-gray-900 dark:text-gray-100 leading-none mb-1">
                {stat.value}
              </div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg gap-0.5">
            {(["top", "new"] as SortMode[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 text-[12px] rounded-md transition-all capitalize ${
                  sort === s
                    ? "bg-white dark:bg-gray-700 font-medium text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {(["all", "fix", "hack", "learn"] as FilterTag[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 text-[12px] rounded-full border transition-all capitalize ${
                  filter === t
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white font-medium"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[14px] text-gray-400 dark:text-gray-600 mb-3">
            {filter !== "all" ? `No ${filter} ideas yet.` : "No ideas yet."}
          </p>
          {user && (
            <Link
              to="/post"
              className="text-[13px] font-medium text-violet-600 dark:text-violet-400 hover:underline"
            >
              Be the first to post one →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              userVoted={userVotes.has(idea.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
