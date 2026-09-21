const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { email, otp } = JSON.parse(event.body);

    if (!email || !otp) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Email and OTP are required"
        })
      };
    }


    const { data, error } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .single();


    if (error || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Invalid OTP"
        })
      };
    }


    // OTP correct - delete it
const { error: deleteError } = await supabase
  .from("otp_codes")
  .delete()
  .eq("email", email);

if (deleteError) {
  throw deleteError;
}


    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "OTP verified successfully"
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