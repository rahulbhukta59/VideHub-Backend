import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({
    path:'./.env'
});

const transporter = nodemailer.createTransport({
  host:'smtp.gmail.com',
  port:587,
  secure:false,
  auth:{
    user:process.env.EMAIL,
    pass:process.env.EMAIL_PASSWORD
  }
})

export const sendOtpMail = async (to, token) => {

  const resetLink = `http://localhost:5173/reset-password?email=${to}&token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: "Reset Your Password",
    html: `
<div style="font-family: Arial">

  <h2>Password Reset Request</h2>

  <p>You requested to reset your password.</p>

  <p>
    Click below to reset your password:
  </p>

   <div style="margin:20px 0;">
    <a href="${resetLink}" 
       style="
         background-color:#2563eb;
         color:white;
         padding:12px 24px;
         text-decoration:none;
         border-radius:6px;
         font-weight:600;
         display:inline-block;
       ">
       Reset Password
    </a>
  </div>

  <hr style="margin:20px 0"/>

  <p style="font-size:14px;color:gray">
  If you didn't request a password reset, please ignore this email.
  </p>

  <p style="font-size:12px; color:gray">

  By using VideHub you agree to our  
  <a href="http://localhost:5173/privacy-policy">Privacy Policy</a>  
  and  
  <a href="http://localhost:5173/terms">Terms of Service</a>.

  </p>

  <p style="font-size:12px;color:gray">
    © ${new Date().getFullYear()} VideHub
  </p>

</div>
`
  });

};

export const sendRegistertationMail=async(to,name) => {
    await transporter.sendMail({
        from:process.env.EMAIL,
        to,
        subject:"Welcome to Our Platform",
        html: `
<div style="font-family: Arial, sans-serif; line-height:1.6">

  <h2>Welcome to VideHub, ${name} 🎉</h2>

  <p>Your account has been successfully created.</p>

  <p>You can now upload, watch and share videos.</p>

  <hr style="margin:20px 0"/>

  <p style="font-size:12px; color:gray">

  If you did not create this account, please ignore this email.

  </p>

  <p style="font-size:12px; color:gray">

  By using VideHub you agree to our  
  <a href="http://localhost:5173/privacy-policy">Privacy Policy</a>  
  and  
  <a href="http://localhost:5173/terms">Terms of Service</a>.

  </p>

  <p style="font-size:12px; color:gray">
  © ${new Date().getFullYear()} VideHub. All rights reserved.
  </p>

</div>
`
    })
}