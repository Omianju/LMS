import { Document, Model } from "mongoose";

interface MonthData {
  month: string;
  count: number;
}

// => It is a generic.
// => When you see Model<T>, it just means "a Mongoose model that works with  documents of type T.

// => T: The type of documents (e.g., User, Course).

// => T extends Document: Ensures T behaves like a Mongoose document.

export async function generateLast12MonthsData<T extends Document> (
  model: Model<T>
) : Promise<{last12Months : MonthData[]}> {
  const last12Months : MonthData[] = []   // {month: "", count: 5 }
  const currentDate = new Date()
  currentDate.setDate(currentDate.getDate() + 1)

  for (let i = 11; i >= 0; i--) {
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i * 28)
    
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 28)

    const monthYear = endDate.toLocaleString("default", { day : "numeric", month : "short", year : "numeric" })


    const count = await model.countDocuments({ createdAt : {
      $gte : startDate,
      $lt  : endDate 
    }})

    last12Months.push({ month: monthYear, count })
  }

  return { last12Months }
}


// const a :add = {hello: [{month: "", count: 5 }]}