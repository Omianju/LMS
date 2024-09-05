import { Router } from "express";
import { getNotification, updateNotification } from "../controllers/notification.controller";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";

const router = Router()


router.get("/get-notifications", isAuthenticated, authorizeRoles("admin"), getNotification)

router.put("/update-notification/:id", isAuthenticated, authorizeRoles("admin"), updateNotification)

export default router;



