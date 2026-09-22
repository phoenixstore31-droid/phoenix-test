const SUPABASE_URL = "https://tvhgxlqqeklrdlgbkosa.supabase.co";

const SHELLTOPUP_URL = "https://shelltopup.com/api/v1";


function json(statusCode, body) {

    return {

        statusCode,

        headers: {

            "Content-Type": "application/json",

            "Access-Control-Allow-Origin": "*",

            "Access-Control-Allow-Headers": "Content-Type, Authorization",

            "Access-Control-Allow-Methods": "POST, OPTIONS"

        },

        body: JSON.stringify(body)

    };

}


exports.handler = async (event) => {

    if (event.httpMethod === "OPTIONS") {

        return json(200, { ok: true });

    }


    if (event.httpMethod !== "POST") {

        return json(405, {

            ok: false,

            error: "Method not allowed"

        });

    }


    const SHELL_API_KEY = process.env.SHELL_API_KEY;

    const SUPABASE_SERVICE_ROLE_KEY =
        process.env.SUPABASE_SERVICE_ROLE_KEY;


    if (!SHELL_API_KEY) {

        return json(500, {

            ok: false,

            error: "SHELL_API_KEY is not configured in Netlify."

        });

    }


    if (!SUPABASE_SERVICE_ROLE_KEY) {

        return json(500, {

            ok: false,

            error: "SUPABASE_SERVICE_ROLE_KEY is not configured in Netlify."

        });

    }


    try {

        // ---------------------------------------------------------
        // 1. Read request
        // ---------------------------------------------------------

        let body;


        try {

            body = JSON.parse(event.body || "{}");

        } catch {

            return json(400, {

                ok: false,

                error: "Invalid JSON request."

            });

        }


        const orderId = body.orderId;


        if (!orderId) {

            return json(400, {

                ok: false,

                error: "orderId is required."

            });

        }


        // ---------------------------------------------------------
        // 2. Get logged-in user's access token
        // ---------------------------------------------------------

        const authHeader =
            event.headers.authorization ||
            event.headers.Authorization ||
            "";


        if (!authHeader.startsWith("Bearer ")) {

            return json(401, {

                ok: false,

                error: "Authentication required."

            });

        }


        const accessToken = authHeader.substring(7).trim();


        if (!accessToken) {

            return json(401, {

                ok: false,

                error: "Invalid access token."

            });

        }


        // ---------------------------------------------------------
        // 3. Verify Supabase user
        // ---------------------------------------------------------

        const userResponse = await fetch(

            `${SUPABASE_URL}/auth/v1/user`,

            {

                method: "GET",

                headers: {

                    apikey: SUPABASE_SERVICE_ROLE_KEY,

                    Authorization: `Bearer ${accessToken}`

                }

            }

        );


        if (!userResponse.ok) {

            return json(401, {

                ok: false,

                error: "Invalid or expired login session."

            });

        }


        const user = await userResponse.json();


        if (!user || !user.id) {

            return json(401, {

                ok: false,

                error: "Unable to verify user."

            });

        }


        const userId = user.id;


        // ---------------------------------------------------------
        // 4. Get Phoenix order
        // ---------------------------------------------------------

        const orderUrl =

            `${SUPABASE_URL}/rest/v1/orders` +

            `?id=eq.${encodeURIComponent(orderId)}` +

            `&user_id=eq.${encodeURIComponent(userId)}` +

            `&select=*`;


        const orderResponse = await fetch(orderUrl, {

            method: "GET",

            headers: {

                apikey: SUPABASE_SERVICE_ROLE_KEY,

                Authorization:
                    `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`

            }

        });


        if (!orderResponse.ok) {

            const errorText = await orderResponse.text();


            return json(500, {

                ok: false,

                error: "Failed to read Phoenix order.",

                details: errorText

            });

        }


        const orders = await orderResponse.json();


        if (!orders || orders.length === 0) {

            return json(404, {

                ok: false,

                error: "Order not found."

            });

        }


        const order = orders[0];


        // ---------------------------------------------------------
        // 5. Prevent duplicate processing
        // ---------------------------------------------------------

        if (

            order.status === "Success" ||

            order.provider_status === "DELIVERED"

        ) {

            return json(200, {

                ok: true,

                alreadyProcessed: true,

                status: "Success",

                orderId: order.id,

                orderNumber: order.order_number,

                nickname:
                    order.provider_nickname || null

            });

        }


        // ---------------------------------------------------------
        // 6. Get product from Phoenix database
        // ---------------------------------------------------------

        const productUrl =

            `${SUPABASE_URL}/rest/v1/products` +

            `?product_name=eq.${encodeURIComponent(order.product_name)}` +

            `&category=eq.${encodeURIComponent(order.category)}` +

            `&select=id,product_name,category,shell_game_id,shell_product_id`;


        const productResponse = await fetch(productUrl, {

            method: "GET",

            headers: {

                apikey: SUPABASE_SERVICE_ROLE_KEY,

                Authorization:
                    `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`

            }

        });


        if (!productResponse.ok) {

            const errorText = await productResponse.text();


            return json(500, {

                ok: false,

                error: "Failed to read Phoenix product.",

                details: errorText

            });

        }


        const products = await productResponse.json();


        if (!products || products.length === 0) {

            await updateOrderFailed(

                order.id,

                "Phoenix product not found."

            );


            await refundOrder(

                order.id,

                "Automatic top-up failed: product not found."

            );


            return json(400, {

                ok: false,

                refunded: true,

                error: "Product mapping not found."

            });

        }


        const product = products[0];


        // ---------------------------------------------------------
        // 7. Validate ShellTopup mapping
        // ---------------------------------------------------------

        if (

            !product.shell_game_id ||

            !product.shell_product_id

        ) {

            await updateOrderFailed(

                order.id,

                "ShellTopup game/product mapping is missing."

            );


            await refundOrder(

                order.id,

                "Automatic top-up failed: ShellTopup mapping missing."

            );


            return json(400, {

                ok: false,

                refunded: true,

                error:
                    "ShellTopup product mapping is missing."

            });

        }


        // ---------------------------------------------------------
        // 8. Get client key
        // ---------------------------------------------------------

        const clientKey = order.provider_client_key;


        if (!clientKey) {

            return json(500, {

                ok: false,

                error: "Provider client key is missing."

            });

        }


        // ---------------------------------------------------------
        // 9. Get quantity
        // ---------------------------------------------------------

        const quantity = Number(order.quantity || 1);


        if (

            !Number.isInteger(quantity) ||

            quantity < 1 ||

            quantity > 5

        ) {

            await updateOrderFailed(

                order.id,

                "Invalid order quantity."

            );


            await refundOrder(

                order.id,

                "Automatic top-up failed: invalid quantity."

            );


            return json(400, {

                ok: false,

                refunded: true,

                error: "Invalid quantity."

            });

        }


        // ---------------------------------------------------------
        // 10. Mark order as processing
        // ---------------------------------------------------------

        await updateOrder(order.id, {

            provider_status: "PROCESSING",

            provider_error: null

        });


        // ---------------------------------------------------------
        // 11. Send order to ShellTopup
        // ---------------------------------------------------------

        const shellPayload = {

            gameId: product.shell_game_id,

            productId: product.shell_product_id,

            playerId: String(order.uid),

            // Free Fire (MY-SG) region
            region: "SG",

            quantity: quantity,

            clientKey: clientKey

        };


        console.log(
            "Sending ShellTopup order:",
            {
                gameId: shellPayload.gameId,
                productId: shellPayload.productId,
                region: shellPayload.region,
                quantity: shellPayload.quantity
            }
        );


        const shellResult = await placeShellOrder(

            shellPayload,

            SHELL_API_KEY

        );


        // ---------------------------------------------------------
        // 12. ShellTopup success
        // ---------------------------------------------------------

        if (shellResult.ok) {

            const providerOrder =
                shellResult.data || {};


            const providerStatus =

                String(

                    providerOrder.status ||

                    providerOrder.order?.status ||

                    ""

                ).toUpperCase();


            const providerOrderId =

                providerOrder.orderId ||

                providerOrder.id ||

                providerOrder.order?.id ||

                null;


            const providerRef =

                providerOrder.providerRef ||

                providerOrder.provider_ref ||

                providerOrder.order?.providerRef ||

                null;


            const nickname =

                providerOrder.nickname ||

                providerOrder.playerName ||

                providerOrder.player_name ||

                providerOrder.order?.nickname ||

                null;


            const shellsSpentRaw =

                providerOrder.shellsSpent ??

                providerOrder.shells_spent ??

                providerOrder.order?.shellsSpent ??

                null;


            const shellsSpent =

                shellsSpentRaw !== null

                    ? Number(shellsSpentRaw)

                    : null;


            // -------------------------------------------------------
            // DELIVERED
            // -------------------------------------------------------

            if (providerStatus === "DELIVERED") {

                const updateData = {

                    status: "Success",

                    provider_order_id:
                        providerOrderId,

                    provider_ref:
                        providerRef,

                    provider_status:
                        providerStatus,

                    provider_nickname:
                        nickname,

                    provider_shells_spent:
                        shellsSpent,

                    provider_error:
                        null,

                    provider_processed_at:
                        new Date().toISOString()

                };


                const updated =

                    await updateOrder(

                        order.id,

                        updateData

                    );


                if (!updated.ok) {

                    return json(500, {

                        ok: false,

                        error:
                            "Top-up was delivered, but Phoenix order update failed.",

                        providerStatus:
                            providerStatus

                    });

                }


                return json(200, {

                    ok: true,

                    status: "Success",

                    orderId: order.id,

                    orderNumber:
                        order.order_number,

                    providerOrderId:
                        providerOrderId,

                    providerRef:
                        providerRef,

                    nickname:
                        nickname,

                    shellsSpent:
                        shellsSpent

                });

            }


            // -------------------------------------------------------
            // Provider accepted but still processing
            // -------------------------------------------------------

            await updateOrder(order.id, {

                provider_order_id:
                    providerOrderId,

                provider_ref:
                    providerRef,

                provider_status:
                    providerStatus || "PROCESSING",

                provider_nickname:
                    nickname,

                provider_shells_spent:
                    shellsSpent,

                provider_error:
                    null

            });


            return json(200, {

                ok: true,

                status: "Processing",

                orderId: order.id,

                orderNumber:
                    order.order_number,

                providerStatus:
                    providerStatus || "PROCESSING",

                nickname:
                    nickname

            });

        }


        // ---------------------------------------------------------
        // 13. Permanent provider error
        // ---------------------------------------------------------

        const providerStatusCode =

            Number(
                shellResult.statusCode || 0
            );


        const providerError =

            shellResult.error ||

            "ShellTopup order failed.";


        // 429 = rate limit.
        // Do NOT refund immediately.
        // Same clientKey can safely be retried.

        if (providerStatusCode === 429) {

            await updateOrder(order.id, {

                provider_status: "RETRY",

                provider_error:
                    providerError

            });


            return json(429, {

                ok: false,

                retryable: true,

                refunded: false,

                status: "Retry",

                orderId: order.id,

                error:
                    "ShellTopup is temporarily rate limited. Please retry."

            });

        }


        // ---------------------------------------------------------
        // 14. Unknown/network error
        // ---------------------------------------------------------

        if (

            shellResult.networkError === true ||

            providerStatusCode === 0 ||

            providerStatusCode >= 500

        ) {

            await updateOrder(order.id, {

                provider_status: "PENDING",

                provider_error:
                    providerError

            });


            return json(202, {

                ok: false,

                retryable: true,

                refunded: false,

                status: "Processing",

                orderId: order.id,

                error:
                    "Top-up status could not be confirmed. The same order can be safely retried."

            });

        }


        // ---------------------------------------------------------
        // 15. Permanent failure → refund
        // ---------------------------------------------------------

        await updateOrder(order.id, {

            provider_status: "FAILED",

            provider_error:
                providerError

        });


        const refundResult =

            await refundOrder(

                order.id,

                `ShellTopup failed: ${providerError}`

            );


        if (!refundResult.ok) {

            return json(500, {

                ok: false,

                refunded: false,

                error:
                    "Top-up failed and automatic refund could not be completed. Admin attention required.",

                providerError:
                    providerError

            });

        }


        return json(400, {

            ok: false,

            refunded: true,

            status: "Rejected",

            orderId: order.id,

            error:
                providerError

        });


    } catch (error) {

        console.error(

            "shelltopup-order error:",

            error

        );


        return json(500, {

            ok: false,

            error:
                "Unexpected server error."

        });

    }

};


// ============================================================
// ShellTopup API
// ============================================================


async function placeShellOrder(

    payload,

    apiKey

) {

    const maxAttempts = 3;


    for (

        let attempt = 1;

        attempt <= maxAttempts;

        attempt++

    ) {

        try {

            const controller =

                new AbortController();


            const timeout =

                setTimeout(

                    () => controller.abort(),

                    20000

                );


            let response;


            try {

                response = await fetch(

                    `${SHELLTOPUP_URL}/order`,

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${apiKey}`

                        },

                        body:
                            JSON.stringify(payload),

                        signal:
                            controller.signal

                    }

                );

            } finally {

                clearTimeout(timeout);

            }


            let data = null;

            const text =
                await response.text();


            try {

                data =
                    text
                        ? JSON.parse(text)
                        : {};

            } catch {

                data = {

                    raw: text

                };

            }


            if (response.ok) {

                return {

                    ok: true,

                    statusCode:
                        response.status,

                    data:
                        data

                };

            }


            // Retry rate-limit errors.

            if (

                response.status === 429 &&

                attempt < maxAttempts

            ) {

                await sleep(

                    1500 * attempt

                );


                continue;

            }


            // Retry server errors.

            if (

                response.status >= 500 &&

                attempt < maxAttempts

            ) {

                await sleep(

                    1500 * attempt

                );


                continue;

            }


            return {

                ok: false,

                statusCode:
                    response.status,

                error:
                    extractProviderError(data)

            };


        } catch (error) {

            const isAbort =

                error &&

                error.name === "AbortError";


            // Network/timeout error.

            if (attempt < maxAttempts) {

                await sleep(

                    1500 * attempt

                );


                continue;

            }


            return {

                ok: false,

                statusCode: 0,

                networkError: true,

                error:

                    isAbort

                        ? "ShellTopup request timed out."

                        : "Could not connect to ShellTopup."

            };

        }

    }


    return {

        ok: false,

        statusCode: 0,

        networkError: true,

        error:
            "ShellTopup request could not be completed."

    };

}


// ============================================================
// Extract provider error
// ============================================================


function extractProviderError(data) {

    if (!data) {

        return "ShellTopup order failed.";

    }


    if (typeof data === "string") {

        return data;

    }


    return (

        data.error ||

        data.message ||

        data.details ||

        data.reason ||

        "ShellTopup order failed."

    );

}


// ============================================================
// Update Phoenix order
// ============================================================


async function updateOrder(

    orderId,

    updateData

) {

    try {

        const response =

            await fetch(

                `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,

                {

                    method: "PATCH",

                    headers: {

                        apikey:
                            process.env.SUPABASE_SERVICE_ROLE_KEY,

                        Authorization:
                            `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,

                        "Content-Type":
                            "application/json",

                        Prefer:
                            "return=representation"

                    },

                    body:
                        JSON.stringify(updateData)

                }

            );


        const text =
            await response.text();


        if (!response.ok) {

            console.error(

                "Order update failed:",

                text

            );


            return {

                ok: false,

                error:
                    text

            };

        }


        return {

            ok: true,

            data:

                text

                    ? JSON.parse(text)

                    : null

        };


    } catch (error) {

        console.error(

            "Order update exception:",

            error

        );


        return {

            ok: false,

            error:
                error.message

        };

    }

}


// ============================================================
// Mark provider failure
// ============================================================


async function updateOrderFailed(

    orderId,

    errorMessage

) {

    return updateOrder(

        orderId,

        {

            provider_status:
                "FAILED",

            provider_error:
                errorMessage

        }

    );

}


// ============================================================
// Automatic refund
// ============================================================


async function refundOrder(

    orderId,

    reason

) {

    try {

        const response =

            await fetch(

                `${SUPABASE_URL}/rest/v1/rpc/refund_shelltopup_order`,

                {

                    method: "POST",

                    headers: {

                        apikey:
                            process.env.SUPABASE_SERVICE_ROLE_KEY,

                        Authorization:
                            `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:

                        JSON.stringify({

                            p_order_id:
                                orderId,

                            p_reason:
                                reason

                        })

                }

            );


        const text =
            await response.text();


        if (!response.ok) {

            console.error(

                "Refund RPC failed:",

                text

            );


            return {

                ok: false,

                error:
                    text

            };

        }


        return {

            ok: true,

            data:

                text

                    ? JSON.parse(text)

                    : null

        };


    } catch (error) {

        console.error(

            "Refund exception:",

            error

        );


        return {

            ok: false,

            error:
                error.message

        };

    }

}


// ============================================================
// Sleep helper
// ============================================================


function sleep(ms) {

    return new Promise(

        resolve =>
            setTimeout(resolve, ms)

    );

}