import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-indigo-600">404</p>
      <h1 className="mt-3 text-xl font-semibold text-slate-900">
        Page not found
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Go to my tasks
      </Link>
    </div>
  );
}
