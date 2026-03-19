import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
});

export const genToken = async (userId) => {
    try {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: "10d",
        });
        return token;
    } catch (error) {
        throw new Error(`Token generation error: ${error}`);
    }
}