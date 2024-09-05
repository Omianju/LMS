import mongoose, {Schema, Document, Model, model} from "mongoose"


export interface FaqItems extends Document {
    question : string;
    answer : string;
}


interface Category extends Document {
    title : string;
}

interface BannerImage extends Document {
    public_id : string;
    url : string;
}

interface Layout extends Document {
    type : string;
    faq : FaqItems[];
    categories: Category[];
    banner : {
        image : BannerImage,
        title : string;
        subTitle : string;
    }
}


const faqSchema = new Schema<FaqItems>({
    question : { type : String },
    answer : { type : String }
})

const categorySchema = new Schema<Category>({
    title : { type : String }
})

const bannerImageSchema = new Schema<BannerImage>({
    public_id : { type : String },
    url : { type : String }
})

const layoutSchema = new Schema<Layout>({
    type : { type : String },
    faq : [faqSchema],
    categories : [categorySchema],
    banner : {
        image : bannerImageSchema,
        title : { type : String },
        subTitle : { type : String }
    }
})

export const LayoutModel : Model<Layout> = mongoose.model("Layout", layoutSchema)