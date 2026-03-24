import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  runTransaction,
  getDocs,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import type { Idea, Comment, TeamRequest, TeamMember } from "../types";
import TagBadge from "../components/TagBadge";
import Avatar from "../components/Avatar";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(ts: any): string {
  if (!ts?.seconds) return "";
  const diff = Math.floor(Date.now() / 1000 - ts.seconds);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [userVoted, setUserVoted] = useState(false);
  const [requestStatus, setRequestStatus] = useState<
    "none" | "pending" | "accepted" | "declined"
  >("none");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, "ideas", id), (snap) => {
      if (snap.exists()) setIdea({ id: snap.id, ...snap.data() } as Idea);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "comments"), where("ideaId", "==", id));
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...d.data({ serverTimestamps: "estimate" }),
          }) as Comment,
      );
      docs.sort((a, b) => {
        const aS = (a.createdAt as any)?.seconds ?? 0;
        const bS = (b.createdAt as any)?.seconds ?? 0;
        return aS - bS;
      });
      setComments(docs);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "teamMembers"), where("ideaId", "==", id));
    return onSnapshot(q, (snap) =>
      setMembers(snap.docs.map((d) => d.data() as TeamMember)),
    );
  }, [id]);

  useEffect(() => {
    if (!id || !user || !idea || user.uid !== idea.authorId) return;
    const q = query(
      collection(db, "teamRequests"),
      where("ideaId", "==", id),
      where("status", "==", "pending"),
    );
    return onSnapshot(q, (snap) =>
      setRequests(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamRequest),
      ),
    );
  }, [id, user, idea]);

  useEffect(() => {
    if (!user || !id) return;
    const checkVote = async () => {
      const snap = await getDocs(
        query(
          collection(db, "votes"),
          where("ideaId", "==", id),
          where("userId", "==", user.uid),
        ),
      );
      setUserVoted(!snap.empty);
    };
    checkVote();
  }, [user, id]);

  useEffect(() => {
    if (!user || !id) return;
    getDocs(
      query(
        collection(db, "teamRequests"),
        where("ideaId", "==", id),
        where("requesterId", "==", user.uid),
      ),
    ).then((snap) => {
      if (!snap.empty) setRequestStatus(snap.docs[0].data().status as any);
    });
  }, [user, id]);

  const handleVote = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!id) return;
    const voteRef = doc(db, "votes", `${id}_${user.uid}`);
    const ideaRef = doc(db, "ideas", id);
    await runTransaction(db, async (tx) => {
      const [vSnap, iSnap] = await Promise.all([
        tx.get(voteRef),
        tx.get(ideaRef),
      ]);
      if (!iSnap.exists()) return;
      if (vSnap.exists()) {
        tx.delete(voteRef);
        tx.update(ideaRef, { voteCount: (iSnap.data().voteCount || 1) - 1 });
        setUserVoted(false);
      } else {
        tx.set(voteRef, { ideaId: id, userId: user.uid });
        tx.update(ideaRef, { voteCount: (iSnap.data().voteCount || 0) + 1 });
        setUserVoted(true);
      }
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !commentText.trim()) return;
    setSubmitting(true);
    const name = user.displayName || user.email || "Unknown";
    await addDoc(collection(db, "comments"), {
      ideaId: id,
      authorId: user.uid,
      authorName: name,
      authorInitials: getInitials(name),
      text: commentText.trim(),
      createdAt: serverTimestamp(),
    });
    if (idea)
      await updateDoc(doc(db, "ideas", id), {
        commentCount: (idea.commentCount || 0) + 1,
      });
    setCommentText("");
    setSubmitting(false);
  };

  const handleRequestJoin = async () => {
    if (!user || !idea || !id) return;
    const existing = await getDocs(
      query(
        collection(db, "teamRequests"),
        where("ideaId", "==", id),
        where("requesterId", "==", user.uid),
      ),
    );
    if (!existing.empty) return;
    const name = user.displayName || user.email || "Unknown";
    await addDoc(collection(db, "teamRequests"), {
      ideaId: id,
      ideaTitle: idea.title,
      requesterId: user.uid,
      requesterName: name,
      requesterInitials: getInitials(name),
      authorId: idea.authorId,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    setRequestStatus("pending");
  };

  const handleAccept = async (req: TeamRequest) => {
    await updateDoc(doc(db, "teamRequests", req.id), { status: "accepted" });
    await setDoc(doc(db, "teamMembers", `${id}_${req.requesterId}`), {
      ideaId: id,
      userId: req.requesterId,
      userName: req.requesterName,
      userInitials: req.requesterInitials,
      joinedAt: serverTimestamp(),
    });
  };

  const handleDecline = async (req: TeamRequest) => {
    await updateDoc(doc(db, "teamRequests", req.id), { status: "declined" });
  };

  const isAuthor = user?.uid === idea?.authorId;
  const isMember = members.some((m) => m.userId === user?.uid);
  const filledSlots = members.length;
  const totalSlots = idea?.teamSize || 0;
  const fillPct =
    totalSlots > 0
      ? Math.round(((filledSlots + 1) / (totalSlots + 1)) * 100)
      : 0;

  if (!idea)
    return (
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );

  return (
    <div className="max-w-[640px] mx-auto px-5 py-6 space-y-3">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-1 transition-colors"
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
        All ideas
      </Link>

      {/* Idea card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TagBadge tag={idea.tag} />
          </div>
          <h1 className="text-[20px] font-medium text-gray-900 dark:text-gray-100 leading-snug mb-3">
            {idea.title}
          </h1>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
            {idea.description}
          </p>
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Avatar initials={idea.authorInitials} size="md" />
            <span className="text-[13px] text-gray-600 dark:text-gray-400">
              {idea.authorName}
            </span>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <span className="text-[13px] text-gray-400 dark:text-gray-500">
              {timeAgo(idea.createdAt)}
            </span>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <button
            onClick={handleVote}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-all ${
              userVoted
                ? "bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300 hover:bg-violet-50 dark:hover:border-violet-700 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 1.5L11.5 10H0.5L6 1.5Z" />
            </svg>
            {idea.voteCount} upvote{idea.voteCount !== 1 ? "s" : ""}
          </button>
        </div>
      </div>

      {/* Team section */}
      {idea.teamSize > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-xl overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <h2 className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Team
            </h2>

            <div className="space-y-2.5 mb-4">
              <div className="flex items-center gap-2.5">
                <Avatar initials={idea.authorInitials} size="md" />
                <div>
                  <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">
                    {idea.authorName}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    Author
                  </p>
                </div>
              </div>
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2.5">
                  <Avatar initials={m.userInitials} size="md" />
                  <div>
                    <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">
                      {m.userName}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      Member
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Slots progress */}
            <div className="mb-1">
              <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-teal-400 dark:bg-teal-500 rounded-full transition-all"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400 dark:text-gray-500">
                  {filledSlots + 1} of {totalSlots + 1} spots filled
                </span>
                {totalSlots - filledSlots > 0 && (
                  <span className="text-teal-600 dark:text-teal-400 font-medium">
                    {totalSlots - filledSlots} open
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pending requests — author only */}
          {isAuthor && requests.length > 0 && (
            <div className="mx-5 my-3 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Pending requests · {requests.length}
                </p>
              </div>
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Avatar initials={req.requesterInitials} size="sm" />
                    <span className="text-[13px] text-gray-800 dark:text-gray-200">
                      {req.requesterName}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAccept(req)}
                      className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(req)}
                      className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Join CTA */}
          {!isAuthor && !isMember && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="text-[13px] text-gray-500 dark:text-gray-400">
                {requestStatus === "none" && "Interested in joining this team?"}
                {requestStatus === "pending" &&
                  "Your request is awaiting approval."}
                {requestStatus === "accepted" &&
                  "You've been accepted to this team."}
                {requestStatus === "declined" && "Your request was declined."}
              </p>
              {requestStatus === "none" && (
                <button
                  onClick={user ? handleRequestJoin : () => navigate("/login")}
                  className="text-[13px] font-medium px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-85 transition-opacity"
                >
                  {user ? "Request to join" : "Sign in to join"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-xl overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Comments
            <span className="ml-1.5 text-gray-300 dark:text-gray-600 font-normal normal-case tracking-normal">
              {idea.commentCount}
            </span>
          </h2>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {comments.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-gray-400 dark:text-gray-600 text-center">
              No comments yet. Be the first.
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3 px-5 py-3.5">
                <Avatar initials={c.authorInitials} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100">
                      {c.authorName}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-600">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    {c.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {user ? (
          <form
            onSubmit={handleComment}
            className="flex gap-2.5 px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30"
          >
            <Avatar
              initials={getInitials(user.displayName || user.email || "?")}
              size="md"
            />
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-600 transition-all"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-lg hover:opacity-85 transition-opacity disabled:opacity-30"
            >
              Post
            </button>
          </form>
        ) : (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => navigate(`/login?next=/ideas/${id}`)}
              className="text-[13px] text-violet-600 dark:text-violet-400 hover:underline"
            >
              Sign in to comment →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
