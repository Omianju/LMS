import { Redis } from "ioredis";
require("dotenv").config()
const redisClient = () => {
    if(process.env.RADIS_URL) {
        console.log("Redis Connected")
        return process.env.RADIS_URL
    };

    throw new Error("Redis Connection failed!");
};

export const redis = new Redis(redisClient());