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
          exists: false,
          error: "Email required"
        })
      };
    }


    const { data, error } = await supabase.auth.admin.listUsers();


    if (error) throw error;


    const userExists = data.users.some(
      user => user.email === email
    );


    return {
      statusCode: 200,
      body: JSON.stringify({
        exists: userExists
      })
    };


  } catch(error) {

    return {
      statusCode:500,
      body:JSON.stringify({
        error:error.message
      })
    };

  }

};