import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import type { TeamRequest } from "../types";
import Avatar from "../components/Avatar";
import { Link } from "react-router-dom";

export default function Notifications() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TeamRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "teamRequests"),
      where("authorId", "==", user.uid),
      where("status", "==", "pending"),
    );
    return onSnapshot(q, (snap) => {
      setRequests(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamRequest),
      );
    });
  }, [user]);

  const handleAccept = async (req: TeamRequest) => {
    await updateDoc(doc(db, "teamRequests", req.id), { status: "accepted" });
    await setDoc(doc(db, "teamMembers", `${req.ideaId}_${req.requesterId}`), {
      ideaId: req.ideaId,
      userId: req.requesterId,
      userName: req.requesterName,
      userInitials: req.requesterInitials,
      joinedAt: serverTimestamp(),
    });
  };

  const handleDecline = async (req: TeamRequest) => {
    await updateDoc(doc(db, "teamRequests", req.id), { status: "declined" });
  };

  return (
    <div className="max-w-[560px] mx-auto px-5 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-medium text-gray-900 dark:text-gray-100 mb-1">
          Notifications
        </h1>
        <p className="text-[14px] text-gray-500 dark:text-gray-400">
          Team join requests for your ideas.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-[14px] text-gray-400 dark:text-gray-600 mb-1">
            All clear
          </p>
          <p className="text-[13px] text-gray-400 dark:text-gray-600">
            No pending requests right now.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-xl px-4 py-3.5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar initials={req.requesterInitials} size="md" />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100">
                    {req.requesterName}
                  </p>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 truncate">
                    wants to join{" "}
                    <Link
                      to={`/ideas/${req.ideaId}`}
                      className="text-gray-600 dark:text-gray-300 hover:underline"
                    >
                      {req.ideaTitle}
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleAccept(req)}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(req)}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
