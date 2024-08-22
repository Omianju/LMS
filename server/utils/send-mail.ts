require("dotenv").config()

import ejs from "ejs"
import { Transporter } from "nodemailer"
import nodemailer from "nodemailer"
import path from "path"


interface EmailOptions {
    email : string
    subject : string
    template: string
    data : {[key:string]:any}
}


const sendMail = async (options: EmailOptions) => {
    const transpoter: Transporter = nodemailer.createTransport({
        host : process.env.SMTP_HOST,
        port : parseInt(process.env.SMTP_PORT || "587"),
        service : process.env.SMTP_SERVICE,
        auth : {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        },
    })

    const { template, data, subject, email } = options

    // Get the path to the email template
    const templatePath = path.join(__dirname,"../mails", template)
    
    // Render the email template with ejs
    const html:string = await ejs.renderFile(templatePath, data)
   
    const mailOptions = {
        from :process.env.SMTP_MAIL,
        to : email,
        subject : subject,
        html 
    }

    await transpoter.sendMail(mailOptions)
}


export default sendMail;