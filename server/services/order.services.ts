import { NextFunction, Response } from "express";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import { OrderModel } from "../models/order.model";





export const newOrder = catchAsyncErrors(async (data : any, res : Response, next : NextFunction) => {
    const order = await OrderModel.create(data)
    res.status(201).json({
        success : true,
        order
    })
})


export const getAllTheOrdersService = async (res : Response) => {
    const orders = await OrderModel.find().sort({ createdAt : -1 })

    res.status(200).json({
        success : true,
        orders
    })
}