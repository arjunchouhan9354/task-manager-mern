import { useState } from "react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/axios";
import { validateLogin } from "../lib/validate";

const DEMO = { email: "demo@taskmanager.dev", password: "Demo@1234" };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const doLogin = async (values) => {
    setServerError("");
    const formErrors = validateLogin(values);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(values.email.trim(), values.password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(form);
  };

  const useDemoAccount = () => {
    setForm(DEMO);
    doLogin(DEMO);
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Manage your tasks in one place."
      footer={
        <>
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && (
          <p
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {serverError}
          </p>
        )}
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            className={`input ${errors.email ? "input-error" : ""}`}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            className={`input ${errors.password ? "input-error" : ""}`}
          />
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting}
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={useDemoAccount}
          disabled={submitting}
        >
          Use demo account
        </button>
      </form>
    </AuthLayout>
  );
}
