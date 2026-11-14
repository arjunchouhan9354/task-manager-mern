import api from "./axios";

export const getMeApi = async () => {
  const res = await api.get("/auth/me");
  return res.data.data;
};

export const loginApi = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data.data;
};

export const registerApi = async (name, email, password) => {
  const res = await api.post("/auth/register", { name, email, password });
  return res.data.data;
};

export const logoutApi = async () => {
  await api.post("/auth/logout");
};
