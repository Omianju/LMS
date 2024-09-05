import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import { NotificationModel } from "../models/notification.model";
import ErrorHandler from "../utils/ErrorHandler";
import cron from "node-cron"




// get all the notification -- admin only
export const getNotification = catchAsyncErrors(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const notifications = await NotificationModel.find().sort({ createdAt : -1 })

        res.status(200).json({
            success : true,
            notifications
        })
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))    
    }
})


// update notification status -- admin only

export const updateNotification = catchAsyncErrors(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const notification = await NotificationModel.findById(req.params.id)
        if (notification?.status) {
            notification.status = "read"
        }
        // await NotificationModel.findByIdAndUpdate(req.params.id,{status : "read"})

        await notification?.save()

        const notifications = await NotificationModel.find().sort({ createdAt : -1 })

        res.status(200).json({
            success : true,
            notifications
        })

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))
    }
})

cron.schedule("0 0 0 * * *", async () => {
    const lastThirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    await NotificationModel.deleteMany({status : "read", createdAt : {$lt : lastThirtyDays}})
    
    console.log("Read notification deleted.")
})