import mongoose, { Document, Model, Schema } from "mongoose"




interface IOrder extends Document {
    courseId    : string;
    userId      : string;
    paymentinfo : object;
}


const orderSchema = new Schema<IOrder>({
    courseId : {
        type : String,
        required : true
    },
    userId : {
        type : String,
        required : true
    },
    paymentinfo : {
        type : Object,
        // required : true
    }
}, { timestamps : true })

export const OrderModel : Model<IOrder> = mongoose.model("Order", orderSchema) 