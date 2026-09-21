exports.handler = async () => {
  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_RESELLER_CHANNEL_ID;

    if (!token || !channelId) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: "Discord environment variables are missing"
        })
      };
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
          content: "🤖 **Phoenix Store Reseller Bot** is connected successfully! 🔐"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Discord API error:", data);

      return {
        statusCode: response.status,
        body: JSON.stringify({
          success: false,
          error: "Discord API request failed"
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Discord test message sent"
      })
    };

  } catch (error) {
    console.error("Discord test error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Internal server error"
      })
    };
  }
};