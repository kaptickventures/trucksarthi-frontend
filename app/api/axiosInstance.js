import axios from "axios";

const API = axios.create({
  baseURL: "https://trucksarthi-backend.onrender.com", 
});

export default API;
