import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import cloudinary from "cloudinary"
import { FaqItems, LayoutModel } from "../models/layout.model";
import ErrorHandler from "../utils/ErrorHandler";




export const createLayout = catchAsyncErrors(async (req : Request, res : Response, next : NextFunction) => {
   try {
        
        const { type } = req.body;

        const typeExist = await LayoutModel.findOne({type})
        
        if (typeExist) {
            return next(new ErrorHandler(`${type} already exist!`, 400))
        }

        if (type === "Banner") {
            const { image, title, subtitle } = req.body;

            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder : "layout"
            })

            const banner = {
                image : {
                    public_id : myCloud.public_id,
                    url : myCloud.secure_url
                },
                title,
                subtitle
            }

            await LayoutModel.create({type : "Banner", banner})
        }

        if (type === "FAQ") {
            const { faq } = req.body;

            const faqItems = await Promise.all(
                faq.map(( item : FaqItems ) => ({ question: item.question, answer: item.answer }))
            )

            await LayoutModel.create({type:"FAQ", faq : faqItems})
        }

        if (type === "Categories") {
            const { categoriesData } = req.body;
            const allCategory = await Promise.all(
                categoriesData.map((item : any) => item)
            ) 

            await LayoutModel.create({type : "Categories", categories: allCategory})
        }

        res.status(201).json({
            success : true,
            message : "Layout created successfully."
        })

   } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))
   }
})


// Edit Layout


export const editLayout = catchAsyncErrors(async (req: Request, res : Response, next : NextFunction) => {
    try {
        const { type } = req.body;

        if (type === "Banner") {
            const { image, title, subtitle } = req.body;

            const layout : any = await LayoutModel.findOne({type})
            
            await cloudinary.v2.uploader.destroy(layout?.banner.image)

            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder : "layout"
            })

            const banner = {
                image : {
                    public_id : myCloud.public_id,
                    url : myCloud.secure_url
                },
                title,
                subtitle
            }

            await LayoutModel.findByIdAndUpdate(layout._id ,{type : "Banner", banner})
        }

        if (type === "FAQ") {
            const { faq } = req.body;
            const layout = await LayoutModel.findOne({type})
            const faqItems = await Promise.all(
                faq.map(( item : FaqItems ) => ({ question: item.question, answer: item.answer }))
            )

            await LayoutModel.findByIdAndUpdate(layout?._id ,{type:"FAQ", faq : faqItems})
        }

        if (type === "Categories") {
            const { categoriesData } = req.body;
            const layout = await LayoutModel.findOne({type})
            const allCategory = await Promise.all(
                categoriesData.map((item : any) => item)
            ) 

            await LayoutModel.findByIdAndUpdate(layout?._id ,{type : "Categories", categories: allCategory})
        }

        res.status(201).json({
            success : true,
            message : "Layout updated successfully."
        })
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))
    }
})


export const getLayoutByType = catchAsyncErrors(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { type } = req.body;
        
        const layout = await LayoutModel.findOne({type})

        if (!layout) {
            return next(new ErrorHandler(`${type} not found`, 404))
        }

        res.status(200).json({
            success : true,
            layout
        })
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))
    }
});