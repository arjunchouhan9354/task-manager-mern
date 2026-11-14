import { useState } from "react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage, getFieldErrors } from "../api/axios";
import { validateRegister } from "../lib/validate";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const formErrors = validateRegister(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setSubmitting(true);
    try {
      const user = await register(
        form.name.trim(),
        form.email.trim(),
        form.password
      );
      toast.success(`Account created. Welcome, ${user.name.split(" ")[0]}!`);
      navigate("/", { replace: true });
    } catch (err) {
      if (err.response?.status === 409)
        setErrors({ email: getErrorMessage(err) });
      // email already registered
      else {
        setErrors(getFieldErrors(err));
        setServerError(getErrorMessage(err));
      }
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:underline"
          >
            Log in
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
          <label htmlFor="name" className="label">
            Name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            className={`input ${errors.name ? "input-error" : ""}`}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
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
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            className={`input ${errors.password ? "input-error" : ""}`}
          />
          {errors.password ? (
            <p className="field-error">{errors.password}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              At least 8 characters, with a letter and a number.
            </p>
          )}
        </div>
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting}
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
