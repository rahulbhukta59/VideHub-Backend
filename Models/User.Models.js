import mongoose,{Schema} from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, 
    },
    name:{
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    resetOtp:{
        type:String
    },
    isOtpVerified:{
        type:Boolean,
        default:false
    },
    otpExpires:{
        type:Date
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        // unique: true,
    },
    profileimage:{
        type: String,
        required: true,
        default:""
    },
     watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
}, { timestamps: true })

const User = mongoose.model("User", userSchema)

export default User
