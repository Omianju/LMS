




import { Router } from "express";
import { activateUser, deleteUser, getAllUsers, getUserInfo, LoginUser, LogoutUser, socialAuth, updateAccessToken, updatePassword, updateProfilePicture, updateUserInfo, updateUserRole, userRegistration } from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";

const router = Router()


router.post("/register", userRegistration)

router.post("/active", activateUser)

router.post("/login", LoginUser)

router.post("/social-auth", socialAuth)

router.get("/logout", isAuthenticated, LogoutUser)

router.get("/refresh", updateAccessToken)

router.get("/me", isAuthenticated, getUserInfo)

router.put("/update-user-info", isAuthenticated, updateUserInfo)

router.put("/update-user-password", isAuthenticated, updatePassword)

router.put("/update-user-avatar",isAuthenticated ,updateProfilePicture)

router.get("/get-users", isAuthenticated, authorizeRoles("admin"), getAllUsers)

router.put("/update-role", isAuthenticated, authorizeRoles("admin"), updateUserRole)

router.delete("/delete-user/:id", isAuthenticated, authorizeRoles("admin"), deleteUser)

export default router;