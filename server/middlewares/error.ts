import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";

export const errorMiddleware = (
    err : any,
    req : Request,
    res : Response,
    next : NextFunction
) => {
    err.message = err.message || "Something went wrong!";
    err.statusCode = err.statusCode || 500;

    // wrong mongoDb id error
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid ${err.path}`
        err = new ErrorHandler(message, 400)
    }

    // Duplicate key error
    if (err.name === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`
        err = new ErrorHandler(message, 400)
    }

    // wrong jwt error

    if (err.name === "JsonWebTokenError") {
        const message = `Json web token is invalid, try again`
        err = new ErrorHandler(message, 400)
    }

    // JWT expired error

    if (err.name === "TokenExpiredError") {
        const message = `Json web token is expired, try again`
        err = new ErrorHandler(message, 400)
    }

    res.status(err.statusCode).json({
        success : false,
        message : err.message
    })

}