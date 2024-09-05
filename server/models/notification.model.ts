import mongoose, { Document, Schema, Model } from "mongoose"




interface INotification extends Document {
    title : string;
    message : string;
    status : string;
    user : string; 
}


const notificationSchema = new Schema<INotification>({
    title : {
        type : String,
        required : true
    },
    message : {
        type : String,
        required : true
    },
    status : {
        type : String,
        default : "unread" 
    }
}, { timestamps : true })


export const NotificationModel : Model<INotification> = mongoose.model("Notification", notificationSchema) 