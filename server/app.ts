import cookieParser from "cookie-parser"
import express, { NextFunction, Request, Response } from "express"
import cors from "cors"
import { errorMiddleware } from "./middlewares/error"
require("dotenv").config()
import userRouter from "./routes/user.route"
export const app = express()


//  body parser
app.use(express.json({limit:"50mb"}))

// cookie parser
app.use(cookieParser())

//cors => cross origin resource sharing.
app.use(cors({
    credentials : true,
    origin : process.env.ORIGIN
}))

app.use("/user", userRouter)

app.get("/", (req:Request, res:Response, next:NextFunction) => {
    res.send("Server Running")
})

app.all("*", (req:Request, res:Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any
    err.statusCode = 404
    next(err)
})


app.use(errorMiddleware)