import mongoose, {Document, Model, Schema} from "mongoose"
import { IUser } from "./user.model";

interface IComment extends Document {
    user            : IUser;
    question         : string;
    questionReplies? : IComment[]
}

interface IReview extends Document {
    user           : object;
    rating         : number;
    comment        : string;
    commentReplies? : IComment[]   // only admin can reply
}

interface ILink extends Document {
    title : string;
    url   : string;
}

interface ICourseData extends Document {
    title         : string;
    description   : string;
    videoUrl      : string;
    videoSection  : string;
    videoLength   : number;
    videoPlayer   : string;
    questions     : IComment[];
    suggestion   : string;
    links         : ILink[];
}

interface ICourse extends Document {
    title           : string;
    description     : string
    price           : number;
    estimatedPrice? : number;
    tags            : string;
    thumbnail       : {
                        public_id : string
                        url : string
                     };
    demoUrl         : string;
    courseData      : ICourseData[];
    level           : string;
    benefits        : { title : string }[];
    prerequisites   : { title : string }[];
    review          : IReview[]
    rating?         : number;
    purchased?      : number
}

const reviewSchema = new Schema<IReview>({
    user    : Object,
    comment : String,
    rating  : {
                type    : Number,
                default : 0 
              },
    commentReplies: [Object]
})

const commentSchema = new Schema<IComment>({
    user           : Object,
    question        : String,
    questionReplies : [Object] 
})

const linkSchema = new Schema<ILink>({
    title : String,
    url   : String
})

 
const courseDataSchema = new Schema<ICourseData>({
    title        : String,
    description  : String,
    videoUrl     : String,
    videoPlayer  : String,
    videoSection : String,
    videoLength  : Number,
    questions    : [commentSchema],
    suggestion   : String,
    links        : [linkSchema],
})

const courseSchema = new Schema<ICourse>({
    title : {
        type     : String,
        required : true 
    },
    description: {
        type    : String,
        required: true
    },
    price : {
        type     : Number,
        required : true
    },
    estimatedPrice: {
        type    : Number,
        default : 0
    },
    thumbnail : {
        public_id : {
            type : String,
        },
        url : {
            type : String
        }
    },
    tags : {
        type     : String,
        required : true
    },
    demoUrl: {
        type     : String,
        required : true
    },
    courseData : [ courseDataSchema ],
    level : {
        type     : String,
        required : true
    },
    benefits: [{ title : String }],
    prerequisites: [{ title : String }],
    review: [ reviewSchema ],
    rating: {
        type    : Number,
        default : 0
    },
    purchased: {
        type    : Number,
        default : 0
    }
}, { timestamps : true })


export const CourseModel : Model<ICourse> = mongoose.model("Course", courseSchema)

