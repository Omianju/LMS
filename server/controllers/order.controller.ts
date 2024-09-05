import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CourseModel } from "../models/course.model";
import { getAllTheOrdersService, newOrder } from "../services/order.services";
import ejs from 'ejs'
import path from 'path'
import sendMail from "../utils/send-mail";
import { NotificationModel } from "../models/notification.model";


interface ICreateOrderBody {
    courseId : string;
    payment_info? : object;
}


export const createOrder = catchAsyncErrors(async (req:Request, res: Response, next: NextFunction) => {
    const { courseId, payment_info } = req.body as ICreateOrderBody;

    const user = await userModel.findById(req.user?._id)

    // checking if user already has this course 
    const courseExist = user?.courses.some((course)=> course.courseId.toString() === courseId.toString())

    if (courseExist) {
        return next(new ErrorHandler("You have already purchased this course", 400))
    }

    const course = await CourseModel.findById(courseId)
    
    if (!course) {
        return next(new ErrorHandler("Course not found", 404))
    }

    const data : any  = {
        courseId : course._id,
        userId : user?._id,
        payment_info
    }

    
    // mail data to show it into dynamic mail
    const maildata = {
        order : {
            _id : course._id?.toString().slice(0, 6),
            name: course.title,
            price: course.price,
            date : new Date().toLocaleDateString("en-US", { day:"numeric", month: "long", year:"numeric" })
        }
    }

    const html = await ejs.renderFile(path.join(__dirname, "../mails/confirmation-mail.ejs"), { order : maildata.order })

    
    // sending order confirmation mail to the purchaser or user
    try {
        if (user) {
            await sendMail({
                email : user.email,
                subject : "Order Confirmation Mail",
                template : "confirmation-mail.ejs",
                data : maildata
            })
        }
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))
    }
    

    // adding course id into courselist of the user
    user?.courses.push({courseId})
    await user?.save()

    
    // notification to admin panel
    await NotificationModel.create({
        userId: user?._id,
        title : "New order Received",
        message : `${user?.name} recently purchased your course ${course.title}`
    })

    if(course.purchased) {
        course.purchased += 1
    }

    await course.save()
    
    // creating new order at the end
    newOrder(data, res, next) 
})


export const getAllTheOrders = catchAsyncErrors(async (req:Request, res:Response, next:NextFunction) => {
    try {
        getAllTheOrdersService(res)
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))
    }
})