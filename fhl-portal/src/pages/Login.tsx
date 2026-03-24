import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(params.get("next") || "/");
    } catch {
      setError("Incorrect email or password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-5">
      <div className="w-full max-w-[360px]">
        <div className="mb-7">
          <h1 className="text-[22px] font-medium text-gray-900 dark:text-gray-100 mb-1">
            Welcome back
          </h1>
          <p className="text-[14px] text-gray-500 dark:text-gray-400">
            Sign in to vote, comment, and join teams.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@vcheckglobal.com"
              className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-600 transition-all"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-600 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[13px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="currentColor"
                className="flex-shrink-0"
              >
                <path
                  d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 3.5v3m0 2v.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[14px] font-medium rounded-lg hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center mt-5">
          No account?{" "}
          <Link
            to="/register"
            className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
