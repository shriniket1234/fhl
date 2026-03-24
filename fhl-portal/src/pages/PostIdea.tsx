import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import type { Tag } from "../types";
import TagBadge from "../components/TagBadge";

const TAGS: Tag[] = ["fix", "hack", "learn"];
const SIZE_LABELS = ["Solo", "+1 person", "+2 people", "+3 people"];
const SIZE_HINTS = [
  "You'll be working alone on this one.",
  "Looking for 1 more person to join you.",
  "Looking for 2 more people to join you.",
  "Looking for 3 more people to join you.",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function PostIdea() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState<Tag>("hack");
  const [teamSize, setTeamSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const ref = doc(collection(db, "ideas"));
      const name = user.displayName || user.email || "Unknown";
      await setDoc(ref, {
        title: title.trim(),
        description: description.trim(),
        tag,
        authorId: user.uid,
        authorName: name,
        authorInitials: getInitials(name),
        teamSize,
        voteCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
      });
      navigate(`/ideas/${ref.id}`);
    } catch {
      setError("Failed to post. Please try again.");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-600 transition-all";

  return (
    <div className="max-w-[560px] mx-auto px-5 py-8">
      <div className="mb-7">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-5 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M9 2L4 7l5 5" />
          </svg>
          Back to ideas
        </Link>
        <h1 className="text-[22px] font-medium text-gray-900 dark:text-gray-100 mb-1">
          Post an idea
        </h1>
        <p className="text-[14px] text-gray-500 dark:text-gray-400">
          Share what you want to fix, build, or learn this FHL.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px] font-medium text-gray-600 dark:text-gray-400">
              Title
            </label>
            <span className="text-[11px] text-gray-300 dark:text-gray-600">
              {title.length} / 100
            </span>
          </div>
          <input
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="One clear, specific sentence"
            className={inputClass}
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px] font-medium text-gray-600 dark:text-gray-400">
              Description
            </label>
            <span className="text-[11px] text-gray-300 dark:text-gray-600">
              {description.length} / 500
            </span>
          </div>
          <textarea
            required
            rows={4}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the problem? What's your approach? What does success look like?"
            className={`${inputClass} resize-none leading-relaxed`}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-400 mb-2">
            Category
          </label>
          <div className="flex gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] transition-all ${
                  tag === t
                    ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <TagBadge tag={t} />
              </button>
            ))}
          </div>
        </div>

        {/* Team size */}
        <div>
          <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-400 mb-2">
            Team size
          </label>
          <div className="flex gap-2 flex-wrap">
            {SIZE_LABELS.map((label, n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTeamSize(n)}
                className={`px-3 py-2 rounded-lg border text-[13px] transition-all ${
                  teamSize === n
                    ? "border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-2">
            {SIZE_HINTS[teamSize]}
          </p>
        </div>

        {error && (
          <div className="text-[13px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <Link
            to="/"
            className="text-[13px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !title.trim() || !description.trim()}
            className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[14px] font-medium rounded-lg hover:opacity-85 transition-opacity disabled:opacity-40"
          >
            {loading ? "Posting…" : "Post idea"}
          </button>
        </div>
      </form>
    </div>
  );
}
