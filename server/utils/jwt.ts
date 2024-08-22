require("dotenv").config()
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis"




interface ITokenOptions {
    expires  : Date;
    maxAge   : number;
    httpOnly : boolean; 
    sameSite : "lax" | "strict" | "none" | undefined;
    secure?  : boolean;
    
 }


 export const sendToken = (user:IUser, statusCode: number, res: Response) => {
    const accessToken = user.accessToken()
    const refreshToken = user.refreshToken()

    // TODO: Upload session to radis
    redis.set(user._id as string, JSON.stringify(user))

    const accessTokenExpires = parseInt(process.env.ACCESS_TOKEN_EXPIRES || "300", 10)
    const refereshTokenExpires = parseInt(process.env.REFRESH_TOKEN_EXPIRES || "1200", 10)

    const accessTokenOptions : ITokenOptions = {
      expires  : new Date(Date.now() + accessTokenExpires * 1000),
      maxAge   : accessTokenExpires * 1000,
      httpOnly : true,
      sameSite : "lax"
    }

    const refereshTokenOptions : ITokenOptions = {
      expires  : new Date(Date.now() + refereshTokenExpires * 1000),
      maxAge   : refereshTokenExpires * 1000,
      httpOnly : true,
      sameSite : "lax"
    }

    if (process.env.NODE_ENV === "production") {
      accessTokenOptions.secure = true 
    }

    res.cookie("access_token", accessToken, accessTokenOptions)
    res.cookie("refresh_token", refreshToken, refereshTokenOptions)

    res.json({
      success : true,
      accessToken,
      user 
    })
 }