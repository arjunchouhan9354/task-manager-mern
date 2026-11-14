import axios from "axios";

// All API calls go to /api on the same website; the browser sends the login cookie automatically.
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// The server always replies { error, status, message, data }. These read the error parts.
export const getErrorMessage = (err) =>
  err.response?.data?.message || "Something went wrong. Please try again.";

// Server field errors [{ field, message }] → { title: 'Title is required', ... }
export const getFieldErrors = (err) => {
  const errors = {};
  (err.response?.data?.errors || []).forEach((e) => {
    errors[e.field] = e.message;
  });
  return errors;
};

export default api;
