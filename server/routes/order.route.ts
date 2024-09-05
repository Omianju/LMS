import { Router } from "express"
import { authorizeRoles, isAuthenticated } from "../middlewares/auth"
import { createOrder, getAllTheOrders } from "../controllers/order.controller"

const router = Router()

router.post("/create-order", isAuthenticated, createOrder)

router.get("/get-orders", isAuthenticated, authorizeRoles("admin"), getAllTheOrders)

export default router