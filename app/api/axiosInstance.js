import axios from "axios";

const API = axios.create({
  baseURL: "http://truck-sarthi-env.eba-keistpaa.ap-south-1.elasticbeanstalk.com", 
});

export default API;
