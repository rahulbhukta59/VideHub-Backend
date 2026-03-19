import express from "express"
import { changePassword, loginUser, logoutUser, registerUser, resetPassword, sendOtp, verifyOtp,sendResetLink } from "../Controllers/Auth.Controllers.js"
import { upload } from "../Middlewares/Multer.js"

const authrouter = express.Router()

authrouter.post("/register", upload.single("profileimage"), registerUser)
authrouter.post("/login", loginUser)
authrouter.post("/logout", logoutUser)
authrouter.post("/send-otp", sendOtp)
authrouter.post("/verify-otp", verifyOtp)
authrouter.post("/reset-password", resetPassword)
authrouter.post("/send-reset-link", sendResetLink);
authrouter.post("/change-password", changePassword)

export default authrouter
