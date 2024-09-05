import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import cloudinary from "cloudinary"
import { createCourse } from "../services/course.services";
import ErrorHandler from "../utils/ErrorHandler";
import { CourseModel } from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose, { ObjectId } from "mongoose";
import ejs from "ejs"
import path from "path"
import sendMail from "../utils/send-mail";
import { NotificationModel } from "../models/notification.model";
import { getAllTheOrdersService } from "../services/order.services";

// Upload Course
export const uploadCourse = catchAsyncErrors(async (req : Request, res:Response, next : NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail

        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail,{
                folder: "courses"
            })

            data.thumbnail = {
                public_id : myCloud.public_id,
                url : myCloud.secure_url
            }
        }

        createCourse(data, res, next)

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


// Edit Course

export const editCourse = catchAsyncErrors(async (req: Request,res:Response, next:NextFunction) => {
    try {
        const data = req.body
        const thumbnail = data.thumbnail
        const courseId = req.params.id

        const course = await CourseModel.findById(courseId)

        if ( thumbnail && course?.thumbnail ) {
            await cloudinary.v2.uploader.destroy(course.thumbnail.public_id )
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail,{
                folder : "courses"
            })

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }

        const updatedCourse  = await CourseModel.findByIdAndUpdate(courseId, {
            $set:data
        },{ new : true })

        res.status(201).json({
            success: true,
            course : updatedCourse
        })

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

// fetching course from database or redis.
export const getCourse = catchAsyncErrors(async (req:Request, res: Response, next: NextFunction) => {
    try {
        const courseId = req.params.id
        const isCacheExist = await redis.get(courseId)

        if(isCacheExist) {
            const course = JSON.parse(isCacheExist)
            
            res.status(200).json({
                success : true,
                course
            })
        } else {
            const course = await CourseModel.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.links -courseData.questions")

            await redis.set(courseId, JSON.stringify(course))

            res.status(200).json({
                success : true,
                course
            })
        }

        
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400))    
    }
})

// Get all courses - Without purchasing
export const getAllCourses = catchAsyncErrors(async (req:Request, res:Response, next:NextFunction) => {
    try {
        const isCacheExist = await redis.get("allCourses")

        if (isCacheExist) {
            const courses = JSON.parse(isCacheExist)
            console.log("redis")
            res.status(200).json({
                success : true,
                courses
            })
        } else {
            const courses = await CourseModel.find().select('-courseData.videoUrl -courseData.suggestion -courseData.links -courseData.questions')

            await redis.set("allCourses", JSON.stringify(courses))

            res.status(200).json({
                success : true,
                courses
            })
        }

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400))    
    }
})


// get course content - only for valid user

export const getCourseByUser = catchAsyncErrors(async (req:Request, res:Response, next: NextFunction) => {
    const courseList = req.user?.courses
    const courseId = req.params.id

    const subscribed = courseList?.find((course)=>course.courseId === courseId)
    if (!subscribed) {
        return next(new ErrorHandler("Paid course please buy first!", 400))
    }

    const course = await CourseModel.findById(courseId)
    
    const content = course?.courseData

    res.status(200).json({
        success : true,
        content 
    })
})


interface IAddQuestionBody {
    courseId : string;
    contentId : string;
    question : string;
}


export const addQuestion = catchAsyncErrors(async(req:Request, res:Response,next:NextFunction) =>{
    const { courseId, contentId, question } : IAddQuestionBody = req.body
    const course = await CourseModel.findById(courseId)

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id!", 400))
    }
    
    const courseContent = course?.courseData.find((item: any)=>item._id.toString() === contentId)
    
    if (!courseContent) {
        return next(new ErrorHandler("Invalid content id2!", 400))
    }


    // create a new question object 
    const newQuestion : any = {
        user : req.user,
        question,
        questionReplies : []
    }

    // push the question to the database questions array
    courseContent.questions.push(newQuestion)

    // create a question notification for the admin panel
    await NotificationModel.create({
        user : req.user?._id,
        title: "New Question Received",
        message : `You have a new question in ${courseContent.title}.`
    })

    // then save it 
    await course?.save()

    res.status(200).json({
        success : true,
        course
    })
})


interface IAddAnswerBody {
    answer     : string;
    courseId   : string;
    contentId  : string;
    questionId : string
}


export const addAnswer = catchAsyncErrors(async (req:Request, res:Response, next:NextFunction)=> {
    const { answer, courseId, contentId, questionId } : IAddAnswerBody = req.body
    const course = await CourseModel.findById(courseId)

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id!", 400))
    }
    
    const courseContent = course?.courseData.find((item: any)=>item._id.toString() === contentId)
    
    if (!courseContent) {
        return next(new ErrorHandler("Invalid content id2!", 400))
    }

    const question = courseContent.questions.find((item : any) => item._id.toString() === questionId )

    if (!question) {
        return next(new ErrorHandler("Invalid question id3!", 400))
    }

    const newAnswer : any = {
        user : req.user,
        answer
    }

    question?.questionReplies?.push(newAnswer)

    await course?.save()

    if (req?.user?._id === question.user._id) {
        // add notification 

        await NotificationModel.create({
            user : req.user?._id,
            title : "New Question Reply Received",
            message : `You have a new question reply from ${courseContent.title}.`
        })
    } else {
        const data = {
            name : question.user.name,
            title: courseContent.title
        }

        const html = ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"), data)

        try {
            await sendMail({
                email: question.user.email,
                template:  "question-reply.ejs",
                subject:"Question Reply",
                data
            })
        } catch (error : any) {
            return next(new ErrorHandler(error.message, 400))
        }
    }

    res.status(200).json({
        success : true,
        course
    })
})


interface IAddReviewBody {
    review : string;
    rating : number; 
}


export const addReview = catchAsyncErrors(async(req:Request, res:Response, next:NextFunction) => {
    try {
        const courseList = req.user?.courses
        const courseId = req.params.id

        const courseExist = courseList?.some((course)=>course.courseId.toString() === courseId)
        if (!courseExist) {
            return next(new ErrorHandler("You are not eligible to access this course!", 400))
        }

        const course = await CourseModel.findById(courseId)

        const { review, rating } : IAddReviewBody = req.body

        const newReview : any = {
            user: req.user,
            comment : review,
            rating
        }

        course?.review.push(newReview)

        let totalRating = 0;

        course?.review.forEach((rev)=>{
            totalRating += rev.rating
        })
        
        if(course) {
            course.rating = parseFloat((totalRating / course.review.length).toFixed(1))
        }

        await course?.save()

        const notification = {
            title : "New Review Received",
            message : `${req.user?.name} has been added review on ${course?.title}`
        }

        //  add notification functionality

        res.status(200).json({
            success : true,
            course
        })
    
    } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))    
    }
})


interface IAddReplyToReviewBody {
    comment  : string;
    courseId : string;
    reviewId : string;
}


export const addReplyToReview = catchAsyncErrors(async (req:Request, res:Response, next:NextFunction ) =>{
    try {
        const { comment, courseId, reviewId } : IAddReplyToReviewBody = req.body
        const course = await CourseModel.findById(courseId)

        if (!course) {
            return next(new ErrorHandler("Invalid course Id!", 400))
        }

        const review = course.review.find((rev : any)=>rev._id.toString() === reviewId.toString())

        if (!review) {
            return next(new ErrorHandler("Invalid Review Id!", 400))
        }

        if (!review.commentReplies) {
            review.commentReplies = []
        }

        const replyData : any = {
            user: req.user,
            comment,
        }

        review.commentReplies?.push(replyData)
        await course.save()
        
        res.status(200).json({
            success : true,
            course
        })

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))
    }
})


// get all courses -- admin only
export const getAllCoursesAdmin = (req:Request, res: Response, next: NextFunction) => {
    try {
        getAllTheOrdersService(res)
    } catch ( error : any ) {
        return next(new ErrorHandler(error.message, 500))
    }
}


// delete course -- only admin

export const deleteCourse = catchAsyncErrors(async(req:Request, res : Response, next : NextFunction) => {
    try {
        const { id } = req.params

        const course = await CourseModel.findByIdAndDelete(id)

        if (!course) {
            return next(new ErrorHandler("Course not found!", 404))
        }

        await redis.del(id)

        res.status(200).json({
            success: true,
            message : "Course Deleted successfully."
        })

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 500))
    }
})