exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({
          success: false,
          error: "Method not allowed"
        })
      };
    }

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

    const application = JSON.parse(event.body || "{}");

    const {
      real_name,
      branch_name,
      email,
      whatsapp,
      address,
      country,
      website_or_app,
      age,
      monthly_profit,
      plan_name,
      plan_price
    } = application;

    const embed = {
      title: "🔥 New Phoenix Reseller Application",
      color: 0xff3b30,

      fields: [
        {
          name: "👤 Applicant",
          value: real_name || "Not provided",
          inline: true
        },
        {
          name: "🏪 Business",
          value: branch_name || "Not provided",
          inline: true
        },
        {
          name: "📧 Email",
          value: email || "Not provided",
          inline: false
        },
        {
          name: "📱 WhatsApp",
          value: whatsapp || "Not provided",
          inline: true
        },
        {
          name: "🎂 Age",
          value: String(age ?? "Not provided"),
          inline: true
        },
        {
          name: "🌍 Country",
          value: country || "Not provided",
          inline: true
        },
        {
          name: "💰 Monthly Profit",
          value: monthly_profit != null
            ? `Rs. ${Number(monthly_profit).toLocaleString()}`
            : "Not provided",
          inline: true
        },
        {
          name: "💎 Selected Plan",
          value: plan_name
            ? `${plan_name} — Rs. ${Number(plan_price || 0).toLocaleString()}`
            : "Not provided",
          inline: true
        },
        {
          name: "🌐 Website / App",
          value: website_or_app || "Not provided",
          inline: false
        },
        {
          name: "📍 Address",
          value: address || "Not provided",
          inline: false
        }
      ],

      footer: {
        text: "Phoenix Store • Reseller Application"
      },

      timestamp: new Date().toISOString()
    };

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",

        headers: {
          "Authorization": `Bot ${token}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          content: "🚨 **New reseller application received!**",
          embeds: [embed]
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
        message: "Reseller application sent to Discord"
      })
    };

  } catch (error) {
    console.error(
      "Reseller Discord function error:",
      error
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Internal server error"
      })
    };
  }
};