// Simple form checks before calling the API (the server checks again, it's the real guard).
// Each function returns an object like { email: 'Enter a valid email address' }; empty object = valid.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!EMAIL_REGEX.test(email.trim()))
    errors.email = "Enter a valid email address";
  if (!password) errors.password = "Password is required";
  return errors;
}

export function validateRegister({ name, email, password }) {
  const errors = {};
  if (name.trim().length < 2)
    errors.name = "Name must be at least 2 characters";
  if (!EMAIL_REGEX.test(email.trim()))
    errors.email = "Enter a valid email address";
  if (password.length < 8)
    errors.password = "Password must be at least 8 characters";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    errors.password = "Password must contain a letter and a number";
  return errors;
}

export function validateTask({ title, description }) {
  const errors = {};
  if (!title.trim()) errors.title = "Title is required";
  else if (title.trim().length > 120)
    errors.title = "Title must be at most 120 characters";
  if (description.length > 1000)
    errors.description = "Description must be at most 1000 characters";
  return errors;
}
