import User from "../Models/User.Models.js";
import bcrypt from "bcrypt";
import uploadOnCloudinary from "../Middlewares/Cloudinary.js";
import { genToken } from "../Config/Token.js";
import { sendOtpMail, sendRegistertationMail } from "../Config/Mail.js";
import crypto from "crypto";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!email.includes("@gmail.com")) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // if (!passwordRegex.test(password)) {
    //   return res.status(400).json({
    //     message:
    //       "Password must include letters, numbers, and special characters.",
    //   });
    // }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if(!req.file) {
      return res.status(400).json({
      message: "Profile image is required",
      });
    }
    const profileImageUrl = await uploadOnCloudinary(req.file.path);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      name,
      profileimage: profileImageUrl,
    });

    const token = await genToken(newUser._id);

    const nameuppercase =
      name.charAt(0).toUpperCase() + name.slice(1);

    await sendRegistertationMail(email, nameuppercase);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 15 * 24 * 60 * 60 * 1000,
      secure: false,
      sameSite: "Strict",
    });
  
    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });

  } catch (error) {
    return res.status(500).json({
      message: `Registration error: ${error.message}`,
    });
  }
};


export const loginUser = async(req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }
        const token = await genToken(user._id);
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 15 * 24 * 60 * 60 * 1000,
            secure: false,
            sameSite: "Strict",
          });
        res.status(200).json({ message: "Login successfully" });  
    } catch (error) {
        return res.status(500).json({ message: `Login error: ${error}` });
    }
}

export const logoutUser = async(req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ message: "Logout successfully" });
    } catch (error) {
        return res.status(500).json({ message: `Logout error: ${error}` });
    }
}

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist." });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetOtp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.isOtpVerified = false;
    await user.save();
    await sendOtpMail(email, otp);
    return res.status(200).json({ message: "otp sent successfully" });
  } catch (error) {
    return res.status(500).json(`send otp error ${error}`);
  }
}; 

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.resetOtp != otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "invalid/expired otp" });
    }
    user.isOtpVerified = true;
    user.resetOtp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return res.status(200).json({ message: "otp verify successfully" });
  } catch (error) {
    return res.status(500).json(`verify otp error ${error}`);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isOtpVerified) {
      return res.status(400).json({ message: "otp verification required" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.isOtpVerified = false;
    await user.save();
    return res.status(200).json({ message: "password reset successfully" });
  } catch (error) {
    return res.status(500).json(`reset password error ${error}`);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found with this email" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({ message: "password reset successfully" });
  } catch (error) {
    return res.status(500).json(`reset password error ${error}`);
  }
};

export const sendResetLink = async (req, res) => {
  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const resetLink = `http://localhost:5173/reset-password?email=${email}`;

    await sendOtpMail(email, resetLink); // you can rename later

    return res.status(200).json({
      message: "Reset link sent to email"
    });

  } catch (error) {

    return res.status(500).json({
      message: `Send reset link error: ${error}`
    });

  }
};
