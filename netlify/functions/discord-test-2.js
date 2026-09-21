export default async (req) => {
  try {
    const token = process.env.DISCORD_BOT_ORDER_TOKEN;
    const channelId = process.env.DISCORD_CHANNEL_ID;

    if (!token || !channelId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Discord environment variables are missing"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: "Your admin dashboard pending orders 10"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Discord Error:", data);

      return new Response(
        JSON.stringify({
          success: false,
          error: data
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Discord notification sent successfully"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {

    console.error(error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};