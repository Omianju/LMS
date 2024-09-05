
import { Router } from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import { createLayout, editLayout, getLayoutByType } from "../controllers/layout.controller";

const router = Router();

router.post("/create-layout", isAuthenticated, authorizeRoles("admin"), createLayout)

router.put("/edit-layout", isAuthenticated, authorizeRoles("admin"), editLayout)

router.get("/get-layout", getLayoutByType)

export default router;