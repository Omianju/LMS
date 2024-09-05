import { NextFunction, Request, Response } from "express"
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors"
import userModel, { IUser } from "../models/user.model"
import ErrorHandler from "../utils/ErrorHandler"
import jwt, { JwtPayload, Secret } from 'jsonwebtoken'
import path from "path"
import ejs from "ejs"
import sendMail from "../utils/send-mail"
import { accessTokenOptions, refereshTokenOptions, sendToken } from "../utils/jwt"
import { redis } from "../utils/redis"
import { getAllUsersService, getUserById, updateUserRoleService } from "../services/user.services"
import cloudinary from "cloudinary"

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


// Loging out user
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


// Updating token
export const updateAccessToken = catchAsyncErrors(async (req:Request, res:Response, next:NextFunction) => {
    try {
        const refresh_token = req.cookies.refresh_token as string

        if (!refresh_token) {
            return next(new ErrorHandler("Refresh token not found!", 400))
        }

        const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload

        if (!decoded) {
            return next(new ErrorHandler("Invalid refresh token!", 400))
        }

        const session = await redis.get(decoded._id)

        if (!session) {
            return next(new ErrorHandler("Please login to access this resource!", 400))
        }

        const user = JSON.parse(session)
        
        const accessToken = jwt.sign({ _id : user._id } ,process.env.ACCESS_TOKEN as string, {expiresIn : "5m"})
        const refreshToken = jwt.sign({_id : user._id}, process.env.REFRESH_TOKEN as string, { expiresIn : "3d" })

        req.user = user

        res.cookie("access_token", accessToken, accessTokenOptions)
        res.cookie("refresh_token", refreshToken, refereshTokenOptions)

        // The created session will be expired after 7 days if user is inactive
        await redis.set(user._id, JSON.stringify(user), "EX", 604800) 

        res.status(200).json({
            success : true,
            accessToken
        })

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400))
    }

})


// get the user info

export const getUserInfo = catchAsyncErrors(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const userId = req.user?._id as string
        getUserById(userId, res)

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400))
    } 
})

// social Auth

interface ISocialAuthBody {
    name   : string;
    email  : string;
    avatar : string;
}

export const socialAuth = catchAsyncErrors(async (req:Request, res:Response, next:NextFunction) => {
    try {
        const { name, email, avatar } = req.body as ISocialAuthBody
        const user = await userModel.findOne({email});
        if (!user) {
            const newUser = await userModel.create({
                name,
                email,
                avatar
            });
            sendToken(newUser, 200, res);
        } else {
            sendToken(user, 200, res);
        };
        
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400))      
    };
})


// Updating user information
interface IUpdateUserInfoBody {
    name?  : string;
    email? : string;
}


export const updateUserInfo = catchAsyncErrors(async (req:Request, res:Response, next:NextFunction) => {
    try {
        const { name, email } = req.body as IUpdateUserInfoBody
        const userId = req.user?._id as string
        const user = await userModel.findById(userId)

        if (email && user) {
            const existingUser = await userModel.findOne({email})
            if (existingUser) {
                return next(new ErrorHandler("Email already exist!", 400))
            }
            user.email = email
        }

        if (name && user) {
            user.name = name
        }

        await user?.save()

        await redis.set(userId, JSON.stringify(user))

        res.status(201).json({
            success : true,
            user 
        })
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400))
    }

})

// Updating password 
interface IUpdatePassword {
    oldPassword : string;
    newPassword : string;
}


export const updatePassword = catchAsyncErrors(async (req:Request, res:Response, next:NextFunction) => {
    try {
        const { oldPassword, newPassword } = req.body as IUpdatePassword
        const userId = req.user?._id as string
        const user = await userModel.findById(userId).select("+password")
        
        if (user?.password === undefined) {
            return next(new ErrorHandler("Invalid user!", 400))
        }

        const isPasswordMatch = await user?.comparePassword(oldPassword)
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid old password!", 400))
        }

        user.password = newPassword
        await user.save()

        await redis.set(userId, JSON.stringify(user))

        res.status(201).json({
            success: true,
            user
        })
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400))      
    }
})


// update avatar or profile picture

interface IProfilePictureBody {
    avatar : string;
}

export const updateProfilePicture = catchAsyncErrors(async (req : Request, res : Response, next : NextFunction) => {
    const { avatar } = req.body as IProfilePictureBody
    const userId = req.user?._id as string
    const user = await userModel.findById(userId)

    if (avatar && user) {
        if(user.avatar.public_id) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id)

            const myCloud = await cloudinary.v2.uploader.upload(avatar,{
                folder : "avatars",
                width  : 150
            }) 

            await userModel.findByIdAndUpdate(userId,{avatar: {
                public_id : myCloud.public_id,
                url       : myCloud.secure_url
            }})

            // user.avatar = {
            //     public_id : myCloud.public_id,
            //     url       : myCloud.secure_url
            // }

        } else {
            console.log("from here------")
            const myCloud = await cloudinary.v2.uploader.upload(avatar,{
                folder : "avatars",
                width  : 150
            })

            user.avatar = {
                public_id : myCloud.public_id,
                url       : myCloud.secure_url
            }

        }
    }

    // await user?.save()

    await redis.set(userId, JSON.stringify(user))

    res.status(201).json({
        success : true,
        user
    })
})


// get all the users -- only admin
export const getAllUsers = catchAsyncErrors(async (req: Request, res:Response, next: NextFunction) => {
    try {
        getAllUsersService(res)
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))
    }
})


// update the user's Role by -- admin only

export const updateUserRole = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, role } = req.body;
        
        updateUserRoleService(res, id, role)

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))
    }
})


// delete course -- admin only

export const deleteUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id

    const user = await userModel.findByIdAndDelete(userId)

    if (!user) {
        return next(new ErrorHandler("User not found", 404))
    }

    await redis.del(userId)

    res.status(200).json({
        success : true,
        message : `User deleted succesfully`
    })
})