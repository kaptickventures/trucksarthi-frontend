import axios from "axios";

const API = axios.create({
  baseURL: "https://api.trucksarthi.in", 
});

export default API;
