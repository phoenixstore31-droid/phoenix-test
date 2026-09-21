exports.handler = async (event) => {

    try {

        if (event.httpMethod !== "POST") {

            return {
                statusCode: 405,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    error: "Method not allowed"
                })
            };

        }


        const token =
            process.env.DISCORD_BOT_TOKEN;

        const channelId =
            process.env.DISCORD_RESELLER_CHANNEL_ID;


        if (!token || !channelId) {

            console.error(
                "❌ Discord environment variables are missing"
            );

            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    error: "Discord environment variables are missing"
                })
            };

        }


        const application =
            JSON.parse(event.body || "{}");


        const message = `
🔥 **NEW RESELLER APPLICATION**

👤 **Applicant**
Username: ${application.real_name || "N/A"}
Email: ${application.email || "N/A"}
WhatsApp: ${application.whatsapp || "N/A"}

🏪 **Business**
Business Name: ${application.branch_name || "N/A"}
Address: ${application.address || "N/A"}
Country: ${application.country || "N/A"}

💰 **Monthly Profit**
Rs. ${Number(application.monthly_profit || 0).toLocaleString()}

🌐 **Website / App**
${application.website_or_app || "Not provided"}

🎮 **Selected Plan**
${application.plan_name || "N/A"}

💵 **Plan Price**
Rs. ${Number(application.plan_price || 0).toLocaleString()}

📅 **Age**
${application.age || "N/A"}

📌 **Status**
${application.status || "pending"}

📝 **Business Details**
${application.businessDetails || application.business_details || "Not provided"}

🆔 **Application ID**
${application.id || "N/A"}
`;


        const response =
            await fetch(
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


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "❌ Discord API error:",
                data
            );

            return {
                statusCode: response.status,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    error: "Discord API request failed",
                    details: data
                })
            };

        }


        console.log(
            "✅ Discord reseller application notification sent"
        );


        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: true,
                message: "Reseller application sent to Discord"
            })
        };


    } catch (error) {

        console.error(
            "❌ Reseller Discord function error:",
            error
        );


        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: false,
                error: "Internal server error"
            })
        };

    }

};