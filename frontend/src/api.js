// import axios from "axios";

// const api = axios.create({
//     baseURL: "http://localhost:5000",
//     withCredentials: true,
//  });

//  export default api;
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true
});

export default api;
