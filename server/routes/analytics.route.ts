





import { Router } from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import { getCoursesAnalytics, getOrdersAnalytics, getUsersAnalytics } from "../controllers/analytics.controller";

const router = Router()


router.get("/get-users-analytics", isAuthenticated, authorizeRoles("admin"), getUsersAnalytics)

router.get("/get-courses-analytics", isAuthenticated, authorizeRoles("admin"), getCoursesAnalytics)

router.get("/get-orders-analytics", isAuthenticated, authorizeRoles("admin"), getOrdersAnalytics)

export default router;