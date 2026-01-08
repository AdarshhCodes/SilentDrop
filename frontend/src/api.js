import axios from "axios";

const api = axios.create({
  baseURL: "https://silentdrop-backend.onrender.com",
  withCredentials: true,
});

export default api;

