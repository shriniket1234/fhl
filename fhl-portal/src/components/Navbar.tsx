import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setPendingCount(0);
      return;
    }
    const q = query(
      collection(db, "teamRequests"),
      where("authorId", "==", user.uid),
      where("status", "==", "pending"),
    );
    return onSnapshot(q, (snap) => setPendingCount(snap.size));
  }, [user]);

  return (
    <nav className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200/60 dark:border-gray-800/60 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-5 h-[52px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500 block" />
          <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
            FHL Portal
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {user ? (
            <>
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path
                    d="M8.5 2a4.5 4.5 0 00-4.5 4.5v2.25L2.5 10.25V11.5h12v-1.25L13 8.75V6.5A4.5 4.5 0 008.5 2zM7 13a1.5 1.5 0 003 0"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-medium rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                    {pendingCount}
                  </span>
                )}
              </Link>

              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

              <span className="text-[13px] text-gray-500 dark:text-gray-400 px-2">
                {user.displayName?.split(" ")[0] || user.email}
              </span>

              <Link
                to="/post"
                className="flex items-center gap-1.5 ml-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium px-3 py-1.5 rounded-lg hover:opacity-85 transition-opacity"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="currentColor"
                >
                  <path
                    d="M5.5 1v9M1 5.5h9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                Post idea
              </Link>

              <button
                onClick={async () => {
                  await signOut(auth);
                  navigate("/");
                }}
                className="ml-1 text-[13px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[13px] text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium px-3 py-1.5 rounded-lg hover:opacity-85 transition-opacity"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
