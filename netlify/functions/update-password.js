const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {

    const { email, password } = JSON.parse(event.body);


    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Email and password are required"
        })
      };
    }

    // Find user
const {
  data: { users },
  error: userError
} = await supabase.auth.admin.listUsers();

if (userError) throw userError;

console.log("Received email:", email);
console.log(users.map(u => u.email));

const user = users.find(u => u.email === email);

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: "User not found"
        })
      };
    }

    // Update password
    const { error } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: password
      }
    );

    if (error) throw error;

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