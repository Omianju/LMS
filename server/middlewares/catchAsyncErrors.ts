import { NextFunction, Request, Response } from "express";






export const catchAsyncErrors = (myfunc:any) => (req : Request, res: Response, next:NextFunction) => {
    Promise.resolve(myfunc(req, res, next)).catch(next)
}