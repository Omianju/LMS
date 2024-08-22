import { NextFunction, Request, Response } from "express"
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors"
import userModel, { IUser } from "../models/user.model"
import ErrorHandler from "../utils/ErrorHandler"
import jwt, { JwtPayload, Secret } from 'jsonwebtoken'
import path from "path"
import ejs from "ejs"
import sendMail from "../utils/send-mail"
import { sendToken } from "../utils/jwt"
import { redis } from "../utils/redis"

require("dotenv").config()

interface IRegistration {
    name : string
    email : string
    password : string
    avatar? : string 
}

// Phase 1
//  - Getting Credentials
//  - Generate token and activation token {user, activationCode}
//  - Find path to EJS
//  - send Customised Email
//  - Response

export const userRegistration = catchAsyncErrors(
    async (req:Request, res: Response, next:NextFunction) => {
        try {
            const { name, email, password} = req.body as IRegistration
            const existingUser = await userModel.findOne({ email })

            if (existingUser) return next(new ErrorHandler("Email already exist!",400))
            
            const user : IRegistration = {
                name,
                email,
                password
            }
            
            const activationToken = createActivationToken(user)
            const activationCode = activationToken.activationCode

            // For sending email
            const data = {user: {name}, activationCode}
            
            const html = ejs.renderFile(path.join(__dirname,"../mails/activation-mail.ejs"), data)

            try {
                await sendMail({
                    email,
                    subject: "Activate your account",
                    template:"activation-mail.ejs",
                    data
                })

                res.status(201).json({
                    success: true,
                    message : `Please check ${email} to activate your account.`,
                    activationToken
                })

            } catch (error : any) {
                return next(new ErrorHandler(error.message, 400))
            }

        } catch (error:any) {
            next(new ErrorHandler(error.message, 400))
        }

    }
)


// Generate Activation Token and Activation Code


interface IActivationToken {
    token: string,
    activationCode : string
}

export const createActivationToken = (user:any) : IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString()

    const token = jwt.sign({user, activationCode}, process.env.ACTIVATION_SECRET as Secret, { expiresIn : "5m" })

    return {token, activationCode}
}

interface IActivationRequest {
    activation_token : string,
    activation_code : string
}


// Creating user after verifying token and activation code

export const activateUser = catchAsyncErrors(async (req:Request, res: Response, next: NextFunction)=>{
    try {
        const {activation_code, activation_token} = req.body as IActivationRequest

        const newUser = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
        ) as {user:IUser; activationCode:string}

        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler("Invalid Activation Code", 400))
        }

        const {email, name, password} = newUser.user

        const existingUser = await userModel.findOne({email})
        if (existingUser) {
            return next(new ErrorHandler("Email already exist", 400))
        }

        await userModel.create({
            name,
            email,
            password
        })

        res.status(201).json({
            success: true,
            message:"User created successfully."
        })


    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


interface ILoginRequest {
    email: string;
    password: string;
}


export const LoginUser = catchAsyncErrors(async (req:Request, res:Response, next:NextFunction) => {
    try {
        const { email, password } = req.body as ILoginRequest

        if (!email || !password) {
            return next(new ErrorHandler("Please enter email or password!", 400))
        }

        const user = await userModel.findOne({email}).select("+password")

        if (!user) {
            return next(new ErrorHandler("Invalid Email!", 400))
        }

        const passwordMatch = await user.comparePassword(password)

        if (!passwordMatch) {
            return next(new ErrorHandler("Invalid password!", 400))
        }

        sendToken(user, 200, res)
            
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400))
    }

})


export const LogoutUser = catchAsyncErrors(async (req:Request, res: Response, next: |NextFunction)=>{
    try {
        res.cookie("access_token", "", {maxAge : 1})
        res.cookie("refresh_token", "", {maxAge : 1})
        const userid = req.user?._id as string;
        redis.del(userid) 
        res.status(200).json({
            success : true,
            message : "User logout successfully" 
        })
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400))    
    }
})