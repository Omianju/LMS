




import { Router } from "express";
import { activateUser, LoginUser, LogoutUser, userRegistration } from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/auth";

const router = Router()


router.post("/register", userRegistration)
router.post("/active", activateUser)
router.post("/login", LoginUser)
router.get("/logout", isAuthenticated, LogoutUser)


export default router;