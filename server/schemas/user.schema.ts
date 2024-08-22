import * as z from "zod"






export const UserSchema = z.object({
    name: z.string().min(6,{message : "altest 6 characters are required."}),
    email : z.string().email({message: "Email is required."}),
    password: z.string().min(6,{ message: "atleast 6 character is required."}),
    avatar : z.object({
        public_id : z.string(),
        url : z.string() 
    }).optional(),


})