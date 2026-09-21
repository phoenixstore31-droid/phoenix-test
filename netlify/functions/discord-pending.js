export default async (req) => {

  try {

    if (req.method !== "POST") {

      return new Response(
        JSON.stringify({
          success: false,
          error: "Method not allowed"
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    }

    const body = await req.json();

    const token =
      process.env.DISCORD_BOT_ORDER_TOKEN;

    const channelId =
      process.env.DISCORD_CHANNEL_ID;

    if (!token || !channelId) {

      return new Response(
        JSON.stringify({
          success: false,
          error: "Discord environment variables are missing"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    }

    const productName =
      body?.productName || "Unknown Product";

    const uid =
      body?.uid || "N/A";

    const quantity =
      Number(body?.quantity || 1);

    const totalPrice =
      Number(body?.totalPrice || 0);

    const orderNumber =
      body?.orderNumber || "N/A";

    const message =
`🆕 **New Pending Order**

📦 **Order:** ${orderNumber}
🎮 **Product:** ${productName}
🆔 **UID:** ${uid}
🔢 **Quantity:** ${quantity}
💰 **Amount:** Rs.${totalPrice.toFixed(2)}
⏳ **Status:** Pending`;

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {

        method: "POST",

        headers: {
          "Authorization": `Bot ${token}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          content: message
        })

      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error(
        "Discord API Error:",
        data
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: data
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    }

    return new Response(
      JSON.stringify({
        success: true
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {

    console.error(
      "Discord Order Error:",
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  }

};