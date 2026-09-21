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

    // Check user exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .single();

    if (!profile) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: "Email not found"
        })
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    // Delete old OTP
    await supabase
      .from("otp_codes")
      .delete()
      .eq("email", email);

    // Save new OTP
    await supabase
      .from("otp_codes")
      .insert([
        {
          email,
          otp: otp.toString()
        }
      ]);

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
  subject: "🔐 Password Reset Verification Code",
  html: `
  <div style="background:#f4f7fb;padding:30px;font-family:Arial,sans-serif;">
    <div style="max-width:500px;margin:auto;background:#ffffff;padding:30px;border-radius:12px;border:1px solid #ddd;">

      <h2 style="color:#1e293b;text-align:center;">
        Phoenix Store Password Reset
      </h2>

      <p>Hello,</p>

      <p>
        We received a request to reset your Phoenix Store account password.
        Use the verification code below to continue:
      </p>

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

      <p>
        <b>This verification code is valid for 2 minutes.</b>
      </p>

      <p><b>Security Notice:</b></p>

      <ul>
        <li>Never share this code with anyone.</li>
        <li>Phoenix Store team will never ask for your OTP.</li>
      </ul>

      <p>
        If you did not request a password reset, please ignore this email.
      </p>

      <br>

      <p>
        Thank you,<br>
        <b>© Phoenix Store Security Team</b>
      </p>

    </div>
  </div>
  `
});

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true
      })
    };

  } catch (err) {

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message
      })
    };

  }

};