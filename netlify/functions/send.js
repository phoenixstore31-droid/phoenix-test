const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Email is required"
        })
      };
    }

const otp = Math.floor(100000 + Math.random() * 900000);


// Delete old OTP
const { error: deleteError } = await supabase
  .from("otp_codes")
  .delete()
  .eq("email", email);

if (deleteError) {
  throw deleteError;
}


// Save new OTP
const { error } = await supabase
  .from("otp_codes")
  .insert([
    {
      email: email,
      otp: otp.toString()
    }
  ]);

if (error) {
  throw error;
}


    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

await transporter.sendMail({
  from: `"Phoenix Store" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "Your One-Time Password (OTP)",
  html: `
  <div style="background:#f4f7fb;padding:30px;font-family:Arial,sans-serif;">
    <div style="max-width:500px;margin:auto;background:#ffffff;padding:30px;border-radius:12px;border:1px solid #ddd;">

      <h2 style="color:#1e293b;">Hello,</h2>

      <p>Your One-Time Password (OTP) for verification is:</p>

      <div style="
        background:#e0f2fe;
        border:2px solid #38bdf8;
        border-radius:12px;
        padding:20px;
        text-align:center;
        margin:25px 0;
      ">
        <span style="
          font-size:34px;
          font-weight:bold;
          color:#fbbf24;
          letter-spacing:8px;
        ">
          ${otp}
        </span>
      </div>

      <p><b>This OTP is valid for 2 minutes.</b></p>

      <p><b>For your security:</b></p>

      <ul>
        <li>Do not share this OTP with anyone.</li>
        <li>Our team will never ask for your OTP.</li>
      </ul>

      <p>If you did not request this code, you can safely ignore this email.</p>

      <br>

      <p>Thank you,<br><b>© Phoenix Store Security Team</b></p>

    </div>
  </div>
  `
});

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "OTP sent successfully"
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};