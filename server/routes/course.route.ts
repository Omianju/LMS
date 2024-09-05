import {Router} from "express"
import { addAnswer, addQuestion, addReplyToReview, addReview, deleteCourse, editCourse, getAllCourses, getAllCoursesAdmin, getCourse, getCourseByUser, uploadCourse } from "../controllers/course.controller"
import { authorizeRoles, isAuthenticated } from "../middlewares/auth"

const router = Router()

router.post("/create-course", isAuthenticated, uploadCourse)

router.put("/update-course/:id", isAuthenticated, editCourse)

router.get("/get-course/:id", getCourse)

router.get("/get-all-courses", getAllCourses)

router.get("/paid-access/:id", isAuthenticated, getCourseByUser)

router.put("/add-question", isAuthenticated, addQuestion)

router.put("/add-answer", isAuthenticated, addAnswer)

router.put("/add-review/:id", isAuthenticated, addReview)

router.put("/add-reply", isAuthenticated, authorizeRoles("admin"), addReplyToReview)

router.get("/get-courses", isAuthenticated, authorizeRoles("admin"), getAllCoursesAdmin)

router.delete("/delete-course", isAuthenticated, authorizeRoles("admin"), deleteCourse)

export default router