import { useNavigate } from "react-router-dom";
import {
  doc,
  runTransaction,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import type { Idea } from "../types";
import TagBadge from "./TagBadge";
import Avatar from "./Avatar";

interface Props {
  idea: Idea;
  userVoted: boolean;
}

export default function IdeaCard({ idea, userVoted }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate(`/login?next=/`);
      return;
    }
    const voteRef = doc(db, "votes", `${idea.id}_${user.uid}`);
    const ideaRef = doc(db, "ideas", idea.id);
    await runTransaction(db, async (tx) => {
      const [vSnap, iSnap] = await Promise.all([
        tx.get(voteRef),
        tx.get(ideaRef),
      ]);
      if (!iSnap.exists()) return;
      if (vSnap.exists()) {
        tx.delete(voteRef);
        tx.update(ideaRef, { voteCount: (iSnap.data().voteCount || 1) - 1 });
      } else {
        tx.set(voteRef, { ideaId: idea.id, userId: user.uid });
        tx.update(ideaRef, { voteCount: (iSnap.data().voteCount || 0) + 1 });
      }
    });
  };

  const handleRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate(`/login?next=/ideas/${idea.id}`);
      return;
    }
    const q = query(
      collection(db, "teamRequests"),
      where("ideaId", "==", idea.id),
      where("requesterId", "==", user.uid),
    );
    const existing = await getDocs(q);
    if (!existing.empty) return;
    const name = user.displayName || user.email || "Unknown";
    const ref = doc(collection(db, "teamRequests"));
    await setDoc(ref, {
      ideaId: idea.id,
      ideaTitle: idea.title,
      requesterId: user.uid,
      requesterName: name,
      requesterInitials: name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      authorId: idea.authorId,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  };

  const openSlots = idea.teamSize > 0 ? idea.teamSize : 0;

  return (
    <article
      onClick={() => navigate(`/ideas/${idea.id}`)}
      className="group bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-xl p-4 flex gap-3 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all duration-150"
    >
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1 w-8 pt-0.5 flex-shrink-0">
        <button
          onClick={handleVote}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-150 ${
            userVoted
              ? "bg-violet-50 border-violet-300 text-violet-600 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-400"
              : "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 hover:border-violet-300 hover:text-violet-500 dark:hover:border-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1.5L11.5 10H0.5L6 1.5Z" />
          </svg>
        </button>
        <span
          className={`text-[13px] font-medium tabular-nums ${userVoted ? "text-violet-600 dark:text-violet-400" : "text-gray-600 dark:text-gray-400"}`}
        >
          {idea.voteCount}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <TagBadge tag={idea.tag} />
        </div>

        <h3 className="text-[14px] font-medium text-gray-900 dark:text-gray-100 leading-snug mb-1">
          {idea.title}
        </h3>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">
          {idea.description}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <Avatar initials={idea.authorInitials} />
          <span className="text-[12px] text-gray-500 dark:text-gray-400">
            {idea.authorName}
          </span>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <span className="text-[12px] text-gray-400 dark:text-gray-500">
            {idea.commentCount}{" "}
            {idea.commentCount === 1 ? "comment" : "comments"}
          </span>

          {openSlots > 0 && (
            <>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800/40">
                {openSlots} slot{openSlots > 1 ? "s" : ""} open
              </span>
              {user?.uid !== idea.authorId && (
                <button
                  onClick={handleRequest}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  Request to join
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
