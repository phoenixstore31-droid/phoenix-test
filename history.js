import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


const supabaseUrl =
"https://tvhgxlqqeklrdlgbkosa.supabase.co";


const supabaseKey =
"sb_publishable_Ep28HPF1SXIXQXBF2i__eg_h_jmjw4I";


const supabase =
createClient(
    supabaseUrl,
    supabaseKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);


/* =========================================
   ELEMENTS
========================================= */

const topupBox =
document.getElementById("topupHistory");

const walletBox =
document.getElementById("walletHistory");

const topupTab =
document.getElementById("topupTab");

const walletTab =
document.getElementById("walletTab");


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   STATUS CLASS
========================================= */

function getStatusClass(status) {

    const value =
        String(status || "")
            .toLowerCase();


    if (
        value === "success" ||
        value === "completed" ||
        value === "complete"
    ) {

        return "success";

    }


    if (
        value === "reject" ||
        value === "rejected" ||
        value === "failed" ||
        value === "cancelled"
    ) {

        return "reject";

    }


    return "pending";

}


/* =========================================
   FORMAT PRICE
========================================= */

function formatPrice(price) {

    return Number(price || 0)
        .toFixed(2);

}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(date) {

    if (!date) {

        return "";

    }


    const d =
        new Date(date);


    if (Number.isNaN(d.getTime())) {

        return "";

    }


    return d.toLocaleString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================
   AUTH
========================================= */

const {
    data: {
        session
    }
} =
await supabase.auth.getSession();


if (!session) {

    window.location.href =
        "login.html";

    throw new Error(
        "No active session"
    );

}


/* =========================================
   MAINTENANCE CHECK
========================================= */

let isAdmin = false;


const {
    data: admin
} =
await supabase
    .from("admin_users")
    .select("id")
    .eq(
        "id",
        session.user.id
    )
    .maybeSingle();


if (admin) {

    isAdmin = true;

}


const {
    data: settings
} =
await supabase
    .from("settings")
    .select("maintenance")
    .eq("id", 1)
    .single();


if (
    settings?.maintenance === true &&
    !isAdmin
) {

    window.location.replace(
        "maintenance.html"
    );

    throw new Error(
        "Maintenance mode active"
    );

}


/* =========================================
   LIVE WALLET BALANCE
========================================= */

const {
    data: profile,
    error: profileError
} =
await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq(
        "id",
        session.user.id
    )
    .single();


if (!profileError) {

    const liveBalance =
        document.getElementById(
            "liveBalance"
        );


    if (liveBalance) {

        liveBalance.textContent =
            Number(
                profile.wallet_balance || 0
            ).toFixed(2);

    }

}


/* =========================================
   LOAD ALL TOP-UP HISTORY
========================================= */

async function loadTopupHistory() {

    topupBox.innerHTML = `
        <div class="card" style="text-align:center;">
            Loading history...
        </div>
    `;


    try {

        /* =====================================
           NORMAL PRODUCTS
        ===================================== */

        const {
            data: normalOrders,
            error: normalError
        } =
        await supabase
            .from("orders")
            .select("*")
            .eq(
                "user_id",
                session.user.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (normalError) {

            throw normalError;

        }


        /* =====================================
           GARENA SHELL ORDERS
        ===================================== */

        const {
            data: garenaOrders,
            error: garenaError
        } =
        await supabase
            .from("garena_shell_orders")
            .select("*")
            .eq(
                "user_id",
                session.user.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (garenaError) {

            throw garenaError;

        }


        /* =====================================
           COD MOBILE ORDERS
        ===================================== */

        const {
            data: codOrders,
            error: codError
        } =
        await supabase
            .from("cod_mobile_orders")
            .select("*")
            .eq(
                "user_id",
                session.user.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (codError) {

            throw codError;

        }

        /* =====================================
   DELTA FORCE ORDERS
===================================== */

const {
    data: deltaOrders,
    error: deltaError
} =
await supabase
    .from("delta_force_orders")
    .select("*")
    .eq(
        "user_id",
        session.user.id
    )
    .order(
        "created_at",
        {
            ascending: false
        }
    );


if (deltaError) {

    throw deltaError;

}


        /* =====================================
           CONVERT NORMAL ORDERS
        ===================================== */

        const normalHistory =
            (normalOrders || []).map(
                data => {

                    return {

                        type: "normal",

                        orderId:
                            data.order_number,

                        uid:
                            data.uid,

                        product:
                            data.product_name,

                        category:
                            data.category,

                        price:
                            Number(
                                data.total_price ??
                                data.price ??
                                0
                            ),

                        quantity:
                            Number(
                                data.quantity || 1
                            ),

                        status:
                            data.status,

                        createdAt:
                            data.created_at

                    };

                }
            );


        /* =====================================
           CONVERT GARENA ORDERS
        ===================================== */

        const garenaHistory =
            (garenaOrders || []).map(
                data => {

                    const shellAmount =
                        Number(
                            data.shell_amount || 0
                        );


                    return {

                        type: "garena",

                        orderId:
                            data.order_number,

                        uid:
                            null,

                        product:
                            `${shellAmount.toLocaleString(
                                "en-US"
                            )} Shells`,

                        category:
                            "Garena Shells",

                        price:
                            Number(
                                data.price || 0
                            ),

                        quantity:
                            1,

                        status:
                            data.status,

                        createdAt:
                            data.created_at

                    };

                }
            );


        /* =====================================
           CONVERT COD MOBILE ORDERS
        ===================================== */

        const codHistory =
            (codOrders || []).map(
                data => {

                    return {

                        type: "cod_mobile",

                        orderId:
                            data.order_number,

                        playerId:
                            data.player_id,

                        product:
                            data.product_name ||
                            `${Number(
                                data.cp_amount || 0
                            ).toLocaleString(
                                "en-US"
                            )} CP`,

                        category:
                            "Call of Duty: Mobile",

                        price:
                            Number(
                                data.price || 0
                            ),

                        quantity:
                            1,

                        status:
                            data.status,

                        createdAt:
                            data.created_at

                    };

                }
            );


            /* =====================================
   CONVERT DELTA FORCE ORDERS
===================================== */

const deltaHistory =
    (deltaOrders || []).map(
        data => {

            return {

                type: "delta_force",

                orderId:
                    data.order_number,

                playerId:
                    data.player_id,

                product:
                    data.product_name ||
                    `${Number(
                        data.point_amount || 0
                    ).toLocaleString(
                        "en-US"
                    )} Points`,

                category:
                    "Delta Force",

                price:
                    Number(
                        data.price || 0
                    ),

                quantity:
                    1,

                status:
                    data.status,

                createdAt:
                    data.created_at

            };

        }
    );


/* =====================================
   MERGE ALL HISTORY
===================================== */

const allHistory = [

    ...normalHistory,

    ...garenaHistory,

    ...codHistory,

    ...deltaHistory

];


        /* =====================================
           SORT LATEST FIRST
        ===================================== */

        allHistory.sort(
            (a, b) => {

                return (
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
                );

            }
        );


        /* =====================================
           EMPTY
        ===================================== */

        if (!allHistory.length) {

            topupBox.innerHTML = `

                <div
                    class="card"
                    style="text-align:center;"
                >

                    <i
                        class="fas fa-clock-rotate-left"
                        style="
                            font-size:40px;
                            color:#38bdf8;
                        "
                    ></i>

                    <h3>
                        No Top-Up History Found
                    </h3>

                    <p>
                        Your purchase history
                        will appear here.
                    </p>

                </div>

            `;

            return;

        }


        /* =====================================
           RENDER
        ===================================== */

        let html = "";


        allHistory.forEach(
            data => {

                const statusClass =
                    getStatusClass(
                        data.status
                    );


                const quantityText =
                    data.quantity > 1
                        ? ` × ${data.quantity}`
                        : "";


                /* =============================
                   GARENA SHELL
                ============================= */

                if (
                    data.type === "garena"
                ) {

                    html += `

                        <div class="card">

                            <p>
                                🆔 Order ID :
                                ${escapeHTML(
                                    data.orderId
                                )}
                            </p>

                            <p>
                                🔥 Product :
                                ${escapeHTML(
                                    data.product
                                )}
                            </p>

                            <p>
                                📂 Category :
                                ${escapeHTML(
                                    data.category
                                )}
                            </p>

                            <p>
                                💵 Price :
                                Rs.
                                ${formatPrice(
                                    data.price
                                )}
                            </p>

                            <p>
                                📌 Status :
                                <span
                                    class="${statusClass}"
                                >
                                    ${escapeHTML(
                                        data.status
                                    )}
                                </span>
                            </p>

                        </div>

                    `;

                    return;

                }


                /* =============================
                   COD MOBILE
                ============================= */

                if (
                    data.type === "cod_mobile"
                ) {

                    html += `

                        <div class="card">

                            <p>
                                🆔 Order ID :
                                ${escapeHTML(
                                    data.orderId
                                )}
                            </p>

                            <p>
                                🎮 Player ID :
                                ${escapeHTML(
                                    data.playerId
                                )}
                            </p>

                            <p>
                                💎 Package :
                                ${escapeHTML(
                                    data.product
                                )}
                            </p>

                            <p>
                                📂 Category :
                                ${escapeHTML(
                                    data.category
                                )}
                            </p>

                            <p>
                                💵 Price :
                                Rs.
                                ${formatPrice(
                                    data.price
                                )}
                            </p>

                            <p>
                                📌 Status :
                                <span
                                    class="${statusClass}"
                                >
                                    ${escapeHTML(
                                        data.status
                                    )}
                                </span>
                            </p>

                        </div>

                    `;

                    return;

                }

                /* =====================================
   DELTA FORCE
===================================== */

if (data.type === "delta_force") {

    html += `

        <div class="card">

            <p>
                🆔 Order ID :
                ${escapeHTML(
                    data.orderId
                )}
            </p>

            <p>
                🎮 Player ID :
                ${escapeHTML(
                    data.playerId
                )}
            </p>

            <p>
                💎 Package :
                ${escapeHTML(
                    data.product
                )}
            </p>

            <p>
                📂 Category :
                Delta Force
            </p>

            <p>
                💵 Price :
                Rs.
                ${formatPrice(
                    data.price
                )}
            </p>

            <p>
                📌 Status :
                <span
                    class="${statusClass}"
                >
                    ${escapeHTML(
                        data.status
                    )}
                </span>
            </p>

        </div>

    `;

    return;

}


                /* =============================
                   NORMAL PRODUCT
                ============================= */

                html += `

                    <div class="card">

                        <p>
                            🆔 Order ID :
                            ${escapeHTML(
                                data.orderId
                            )}
                        </p>

                        <p>
                            🎮 UID :
                            ${escapeHTML(
                                data.uid
                            )}
                        </p>

                        <p>
                            💎 Product :
                            ${escapeHTML(
                                data.product
                            )}
                        </p>

                        <p>
                            📂 Category :
                            ${escapeHTML(
                                data.category
                            )}
                        </p>

                        <p>
                            💵 Price :
                            Rs.
                            ${formatPrice(
                                data.price
                            )}

                            ${quantityText}
                        </p>

                        <p>
                            📌 Status :
                            <span
                                class="${statusClass}"
                            >
                                ${escapeHTML(
                                    data.status
                                )}
                            </span>
                        </p>

                    </div>

                `;

            }
        );


        topupBox.innerHTML =
            html;


    }
    catch(error) {

        console.error(
            "History Load Error:",
            error
        );


        topupBox.innerHTML = `

            <div
                class="card"
                style="text-align:center;"
            >

                <i
                    class="fas fa-triangle-exclamation"
                    style="
                        font-size:40px;
                        color:#ff3030;
                    "
                ></i>

                <h3>
                    Unable to Load History
                </h3>

                <p>
                    Please try again later.
                </p>

            </div>

        `;

    }

}


/* =========================================
   WALLET HISTORY
========================================= */

async function loadWalletHistory() {

    walletBox.innerHTML = `
        <div class="card" style="text-align:center;">
            Loading wallet history...
        </div>
    `;


    try {

        const {
            data: wallets,
            error
        } =
        await supabase
            .from("wallet_topups")
            .select("*")
            .eq(
                "user_id",
                session.user.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        let walletHtml = "";


        (wallets || []).forEach(
            data => {

                const statusClass =
                    getStatusClass(
                        data.status
                    );


                walletHtml += `

                    <div class="card">

                        <p>
                            💰 Amount :
                            Rs.
                            ${formatPrice(
                                data.amount
                            )}
                        </p>

                        <p>
                            📱 WhatsApp :
                            ${escapeHTML(
                                data.whatsapp
                            )}
                        </p>

                        <p>
                            📧 Email :
                            ${escapeHTML(
                                data.email
                            )}
                        </p>

                        <p>
                            📌 Status :
                            <span
                                class="${statusClass}"
                            >
                                ${escapeHTML(
                                    data.status
                                )}
                            </span>
                        </p>

                        ${
                            data.receipt_url
                            ? `
                            <p>
                                🧾
                                <a
                                    href="${escapeHTML(
                                        data.receipt_url
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style="
                                        color:#38bdf8;
                                        text-decoration:none;
                                    "
                                >
                                    View Receipt
                                </a>
                            </p>
                            `
                            : ""
                        }

                    </div>

                `;

            }
        );


        if (!walletHtml) {

            walletHtml = `

                <div
                    class="card"
                    style="text-align:center;"
                >

                    <i
                        class="fas fa-wallet"
                        style="
                            font-size:40px;
                            color:#38bdf8;
                        "
                    ></i>

                    <h3>
                        No Wallet History Found
                    </h3>

                    <p>
                        Your wallet history
                        will appear here.
                    </p>

                </div>

            `;

        }


        walletBox.innerHTML =
            walletHtml;

    }
    catch(error) {

        console.error(
            "Wallet History Error:",
            error
        );


        walletBox.innerHTML = `

            <div
                class="card"
                style="text-align:center;"
            >

                <h3>
                    Unable to Load Wallet History
                </h3>

            </div>

        `;

    }

}


/* =========================================
   TAB SWITCH
========================================= */

topupTab.onclick = () => {

    topupBox.style.display =
        "block";

    walletBox.style.display =
        "none";


    topupTab.classList.add(
        "active"
    );

    walletTab.classList.remove(
        "active"
    );

};


walletTab.onclick = () => {

    topupBox.style.display =
        "none";

    walletBox.style.display =
        "block";


    walletTab.classList.add(
        "active"
    );

    topupTab.classList.remove(
        "active"
    );

};


/* =========================================
   INITIAL LOAD
========================================= */

await loadTopupHistory();

await loadWalletHistory();


/* =========================================
   OPEN WALLET HISTORY
========================================= */

if (
    localStorage.getItem(
        "openWalletHistory"
    ) === "true"
) {

    localStorage.removeItem(
        "openWalletHistory"
    );


    topupBox.style.display =
        "none";

    walletBox.style.display =
        "block";


    walletTab.classList.add(
        "active"
    );

    topupTab.classList.remove(
        "active"
    );

}


/* =========================================
   OPEN TOP-UP HISTORY
========================================= */

if (
    localStorage.getItem(
        "openTopupHistory"
    ) === "true"
) {

    localStorage.removeItem(
        "openTopupHistory"
    );


    topupBox.style.display =
        "block";

    walletBox.style.display =
        "none";


    topupTab.classList.add(
        "active"
    );

    walletTab.classList.remove(
        "active"
    );

}


console.log(
    "🔥 Phoenix History Loaded"
);