require("dotenv").config()
import mongoose,
{ Document,
    Model,
    Schema 
} from "mongoose";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
    name : string
    email : string
    password : string
    avatar : {
        public_id : string
        url : string
    }
    role : string 
    isVerified : boolean
    courses : Array<{courseId : string}>
    comparePassword : (password : string) => Promise<boolean>
    accessToken: () => string;
    refreshToken: () => string;
}


const userSchema : Schema<IUser> = new mongoose.Schema({
    name:{
        type: String,
        required : [true, "Please enter your name"]
    },
    email:{
        type : String,
        required : [true , "Please enter your name!"],
        validate: {
            validator: function (value : string) {
                return emailRegexPattern.test(value)
            },
            message : "Please enter valid Email!"
        },
        unique: true
    },
    password : {
        type: String,
        required: [true , "Please enter yout password."],
        minlength:[6,"password must be atleast 6 characters."],
        select: false
    },
    avatar: {
        type : {
            public_id : String,
            url : String
        }
    },
    role : {
        type : String,
        default: "user"
    },
    isVerified : {
        type : Boolean,
        default : false
    },
    courses : {
        type : [{courseId : String}]

    }
}, {
    timestamps : true  
})

// Hashing Password before saving

userSchema.pre<IUser>("save", async function(next){
    if (!this.isModified("password")) return next()
    
    this.password = await bcrypt.hash(this.password, 10)
    next()  
})


// Access Token
userSchema.methods.accessToken = function() {
    return jwt.sign({_id: this._id}, process.env.ACCESS_TOKEN || "")
}

// Refresh Token

userSchema.methods.refreshToken = function() {
    return jwt.sign({_id: this._id}, process.env.REFRESH_TOKEN || "")
}


userSchema.methods.comparePassword = async function(enteredPassword : string ):Promise<boolean> {
   return await bcrypt.compare(enteredPassword, this.password)
}

const userModel:Model<IUser> = mongoose.model("User", userSchema)

export default userModel;