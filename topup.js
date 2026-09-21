import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


// ===========================================
// SUPABASE
// ===========================================

const supabase = createClient(

    "https://tvhgxlqqeklrdlgbkosa.supabase.co",

    "sb_publishable_Ep28HPF1SXIXQXBF2i__eg_h_jmjw4I",

    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }

);


// ===========================================
// CHECK LOGIN
// ===========================================

const {
    data: { session }
} = await supabase.auth.getSession();


// ===========================================
// LOGIN REQUIRED
// ===========================================

if (!session) {

    window.location.replace("login.html");

    throw new Error("Login required");

}


// ===========================================
// WALLET BALANCE
// ===========================================

if (session) {

    const {
        data: profile,
        error
    } = await supabase

        .from("profiles")

        .select("wallet_balance")

        .eq("id", session.user.id)

        .single();


    if (!error) {

        document.getElementById(
            "walletBalance"
        ).textContent =

            "Rs. " +

            Number(
                profile?.wallet_balance || 0
            ).toFixed(2);

    }

}


// ===========================================
// GLOBAL STOCK STATUS
// ===========================================

let stockOut = false;


async function loadStockStatus() {

    const {
        data,
        error
    } = await supabase

        .from("settings")

        .select("stock_out")

        .limit(1);


    if (error) {

        console.error(
            "Stock Status Error:",
            error
        );

        stockOut = false;

        return;

    }


    if (
        data &&
        data.length > 0
    ) {

        stockOut =
            data[0].stock_out === true;

    } else {

        stockOut = false;

    }


    console.log(

        stockOut

            ? "Global Stock: OUT OF STOCK"

            : "Global Stock: IN STOCK"

    );

}


// ===========================================
// SHELLTOPUP PROVIDER PRODUCTS
// ===========================================

let shellTopupProducts = new Map();


async function loadShellTopupStock() {

    try {

        const response = await fetch(
            "/.netlify/functions/shelltopup-products"
        );


        if (!response.ok) {

            throw new Error(
                `ShellTopup API Error: ${response.status}`
            );

        }


        const result =
            await response.json();


        if (
            !result.ok ||
            !Array.isArray(result.products)
        ) {

            throw new Error(
                "Invalid ShellTopup response"
            );

        }


        shellTopupProducts.clear();


        result.products.forEach(
            providerProduct => {

                if (
                    !providerProduct.product_id
                ) {

                    return;

                }


                shellTopupProducts.set(

                    String(
                        providerProduct.product_id
                    ),

                    {

                        productId:
                            String(
                                providerProduct.product_id
                            ),

                        name:
                            providerProduct.name ||
                            "",

                        shells:
                            Number(
                                providerProduct.shells || 0
                            ),

                        inStock:
                            providerProduct.in_stock === true

                    }

                );

            }

        );


        console.log(
            "ShellTopup Products:",
            shellTopupProducts
        );


    } catch (error) {

        console.error(
            "ShellTopup Stock Error:",
            error
        );


        shellTopupProducts.clear();

    }

}


// ===========================================
// LOAD USER RESELLER DISCOUNT
// ===========================================

let resellerDiscount = 0;

let isReseller = false;

let resellerSystemEnabled = true;

let resellerPausedAt = null;

let wasReseller = false;


async function loadResellerDiscount() {

    if (!session) {

        return;

    }


    // =======================================
    // LOAD USER RESELLER APPLICATION
    // =======================================

    const {
        data: application,
        error
    } = await supabase

        .from("reseller_applications")

        .select(`

            status,

            plan_id,

            expires_at,

            submitted_at,

            reseller_plans (

                discount_percentage

            )

        `)

        .eq(
            "user_id",
            session.user.id
        )

        .eq(
            "status",
            "approved"
        )

        .order(
            "submitted_at",
            {
                ascending: false
            }
        )

        .limit(1)

        .maybeSingle();


    // =======================================
    // ERROR
    // =======================================

    if (error) {

        console.error(
            "Reseller discount error:",
            error
        );

        resellerDiscount = 0;

        isReseller = false;

        wasReseller = false;

        return;

    }


    // =======================================
    // NO APPROVED RESELLER
    // =======================================

    if (
        !application ||
        !application.reseller_plans
    ) {

        resellerDiscount = 0;

        isReseller = false;

        wasReseller = false;

        return;

    }


    wasReseller = true;


    // =======================================
    // CHECK EXPIRY
    // =======================================

    if (
        !application.expires_at ||
        new Date(
            application.expires_at
        ) <= new Date()
    ) {

        resellerDiscount = 0;

        isReseller = false;

        console.log(
            "Reseller membership expired"
        );

        return;

    }


    // =======================================
    // LOAD RESELLER SYSTEM STATUS
    // =======================================

    const {
        data: systemSettings,
        error: systemError
    } = await supabase

        .from("reseller_system_settings")

        .select(`

            enabled,

            paused_at

        `)

        .eq(
            "id",
            1
        )

        .maybeSingle();


    if (systemError) {

        console.error(
            "Reseller system status error:",
            systemError
        );

        resellerDiscount = 0;

        isReseller = false;

        resellerSystemEnabled = false;

        return;

    }


    // =======================================
    // SAVE SYSTEM STATUS
    // =======================================

    resellerSystemEnabled =
        systemSettings?.enabled === true;


    resellerPausedAt =
        systemSettings?.paused_at || null;


    // =======================================
    // SYSTEM DISABLED
    // =======================================

    if (!resellerSystemEnabled) {

        resellerDiscount = 0;

        isReseller = false;

        console.log(
            "Reseller System Temporarily Disabled"
        );

        console.log(
            "Disabled Since:",
            resellerPausedAt
        );

        return;

    }


    // =======================================
    // ACTIVE RESELLER
    // =======================================

    resellerDiscount =
        Number(
            application
                .reseller_plans
                .discount_percentage || 0
        );


    isReseller =
        resellerDiscount > 0;


    console.log(
        "Active reseller:",
        resellerDiscount + "% discount"
    );

}


// ===========================================
// RESELLER SYSTEM WARNING
// ===========================================

function showResellerSystemWarning() {

    document
        .getElementById(
            "resellerSystemWarning"
        )
        ?.remove();


    if (resellerSystemEnabled) {

        return;

    }


    if (!wasReseller) {

        return;

    }


    const warning =
        document.createElement("div");


    warning.id =
        "resellerSystemWarning";


    warning.innerHTML = `

        <div class="reseller-system-warning">

            <div class="warning-icon">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>


            <div class="warning-content">

                <strong>
                    Reseller Access Temporarily Disabled
                </strong>


                <p>
                    Your Phoenix Store reseller access has been
                    temporarily disabled by the administrator.
                    Your account is currently using normal user pricing.
                </p>


                ${
                    resellerPausedAt
                        ? `

                            <small>

                                Disabled since:

                                ${new Date(
                                    resellerPausedAt
                                ).toLocaleString()}

                            </small>

                        `
                        : ""
                }

            </div>

        </div>

    `;


    const container =
        document.getElementById(
            "productsContainer"
        );


    if (container) {

        container.parentNode.insertBefore(
            warning,
            container
        );

    }

}


// ===========================================
// LOAD PRODUCTS FROM SUPABASE
// ===========================================

async function loadProducts() {

    const container =
        document.getElementById(
            "productsContainer"
        );


    container.innerHTML =
        "<p>Loading products...</p>";


    // =======================================
    // LOAD SHELLTOPUP STOCK
    // =======================================

    await loadShellTopupStock();


    // =======================================
    // LOAD SUPABASE PRODUCTS
    // =======================================

    const {
        data: products,
        error
    } = await supabase

        .from("products")

        .select("*")

        .eq(
            "active",
            true
        )

        .order(
            "id",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Products Error:",
            error
        );

        container.innerHTML =
            "<p>Failed to load products ❌</p>";

        return;

    }


    container.innerHTML = "";


    if (
        !products ||
        products.length === 0
    ) {

        container.innerHTML =
            "<p>No products available.</p>";

        return;

    }


    // =======================================
    // GROUP PRODUCTS
    // =======================================

    const groups = {};


    products.forEach(
        product => {

            /*
             * Only provider mapped products
             * are shown.
             */

            if (
                !product.shell_product_id
            ) {

                return;

            }


            const providerProduct =
                shellTopupProducts.get(
                    String(
                        product.shell_product_id
                    )
                );


            /*
             * ShellTopup active product
             * must exist.
             */

            if (!providerProduct) {

                return;

            }


            if (
                !groups[
                    product.category
                ]
            ) {

                groups[
                    product.category
                ] = [];

            }


            groups[
                product.category
            ].push(
                product
            );

        }

    );


    // =======================================
    // NO PROVIDER PRODUCTS
    // =======================================

    if (
        Object.keys(groups).length === 0
    ) {

        container.innerHTML =
            "<p>No products available.</p>";

        return;

    }


    // =======================================
    // CATEGORY ICONS
    // =======================================

    const categoryIcons = {

        "Membership":
            "🔥",

        "Diamonds":
            "💎",

        "Level UP Pass":
            "🎮"

    };


    // =======================================
    // PRODUCT IMAGES
    // =======================================

    const categoryImages = {

        "Membership": [

            "../image/M-0.jpg",

            "../image/M-1.jpg",

            "../image/M-2.jpg",

            "../image/M-3.jpg",

            "../image/M-4.jpg"

        ],


        "Diamonds": [

            "../image/D-2.jpg"

        ],


        "Level UP Pass": [

            "../image/L-3.jpg"

        ]

    };


    // =======================================
    // CREATE CATEGORIES
    // =======================================

    Object.keys(groups)
        .forEach(
            category => {


                // =================================
                // CATEGORY TITLE
                // =================================

                const heading =
                    document.createElement(
                        "h3"
                    );


                heading.innerText =
                    `${categoryIcons[
                        category
                    ] || "📦"} ${category}`;


                container.appendChild(
                    heading
                );


                // =================================
                // PRODUCT GRID
                // =================================

                const grid =
                    document.createElement(
                        "div"
                    );


                grid.className =
                    "product-grid";


                groups[
                    category
                ].forEach(
                    (
                        product,
                        index
                    ) => {


                        // =============================
                        // PROVIDER PRODUCT
                        // =============================

                        const providerProduct =
                            shellTopupProducts.get(
                                String(
                                    product
                                        .shell_product_id
                                )
                            );


                        if (!providerProduct) {

                            return;

                        }


                        // =============================
                        // PRODUCT CARD
                        // =============================

                        const card =
                            document.createElement(
                                "div"
                            );


                        card.className =
                            "product-card";


                        // =============================
                        // IMAGE
                        // =============================

                        let image;


                        if (
                            category ===
                            "Membership"
                        ) {

                            image =
                                categoryImages[
                                    category
                                ][index] ||
                                "../image/M-0.jpg";

                        } else {

                            image =
                                categoryImages[
                                    category
                                ][0];

                        }


                        // =============================
                        // PRODUCT NAME
                        // =============================

                        let displayName =
                            product.product_name;


                        if (
                            category ===
                            "Membership"
                        ) {

                            displayName =
                                displayName.replace(
                                    " Membership",
                                    ""
                                );

                        }


                        if (
                            category ===
                            "Diamonds"
                        ) {

                            displayName =
                                displayName.replace(
                                    " Diamonds",
                                    " 💎"
                                );

                        }


                        if (
                            category ===
                            "Level UP Pass"
                        ) {

                            displayName =
                                displayName.replace(
                                    " Level UP Pass",
                                    " Level"
                                );

                        }


                        // =============================
                        // PRICE
                        // =============================

                        const normalPrice =
                            Number(
                                product.price
                            );


                        let finalPrice =
                            normalPrice;


                        if (
                            isReseller &&
                            resellerDiscount > 0
                        ) {

                            finalPrice =
                                normalPrice -

                                (
                                    normalPrice *
                                    resellerDiscount /
                                    100
                                );

                        }


                        // =============================
                        // STOCK
                        // =============================

                        const isInStock =
                            providerProduct
                                .inStock === true;


                        // =============================
                        // CARD HTML
                        // =============================

                        card.innerHTML = `

                            <div class="product-image-wrap">

                                <img
                                    src="${image}"
                                    alt="${displayName}"
                                >

                            </div>


                            <h4>
                                ${displayName}
                            </h4>


                            <div
                                class="
                                    stock-status
                                    ${
                                        isInStock
                                            ? "in-stock"
                                            : "out-of-stock"
                                    }
                                "

                                data-shell-cost="${
                                    Number(
                                        providerProduct
                                            .shells || 0
                                    )
                                }"
                            >

                                <span class="stock-dot"></span>

                                ${
                                    isInStock
                                        ? "IN STOCK"
                                        : "OUT OF STOCK"
                                }

                            </div>


                            ${
                                isReseller

                                    ? `

                                        <p class="reseller-price">

                                            Rs.
                                            ${finalPrice.toFixed(2)}/=

                                        </p>

                                    `

                                    : `

                                        <p>

                                            Rs.
                                            ${normalPrice.toFixed(2)}/=

                                        </p>

                                    `
                            }

                        `;


                        // =============================
                        // LONG PRESS VARIABLES
                        // =============================

                        let pressTimer =
                            null;

                        let longPressTriggered =
                            false;


                        // =============================
                        // OPEN PRODUCT
                        // =============================

                        const openProduct =
                            async () => {


                                // =========================
                                // LIVE PROVIDER STOCK
                                // =========================

                                const latestProviderProduct =
                                    shellTopupProducts.get(
                                        String(
                                            product
                                                .shell_product_id
                                        )
                                    );


                                const liveInStock =
                                    latestProviderProduct
                                        ?.inStock === true;


                                if (!liveInStock) {

                                    showOutOfStockPopup();

                                    return;

                                }


                                // =========================
                                // LEVEL UP WARNING
                                // =========================

                                if (
                                    product.category ===
                                    "Level UP Pass"
                                ) {

                                    await
                                        showLevelUpWarning();

                                }


                                // =========================
                                // SELECTED PRODUCT
                                // =========================

                                const selectedProduct = {

                                    id:
                                        product.id,

                                    category:
                                        product.category,

                                    title:
                                        product.product_name,

                                    fullTitle:
                                        `${product.product_name} (${finalPrice.toFixed(2)}/=)`,

                                    image:
                                        image,

                                    price:
                                        Number(
                                            finalPrice.toFixed(2)
                                        ),

                                    normal_price:
                                        normalPrice,

                                    reseller_discount:
                                        resellerDiscount,

                                    is_reseller:
                                        isReseller,

                                    reward_points:
                                        Number(
                                            product.reward_points || 0
                                        ),

                                    shell_product_id:
                                        product.shell_product_id,

                                    shell_game_id:
                                        product.shell_game_id,

                                    shell_cost:
                                        Number(
                                            latestProviderProduct
                                                ?.shells || 0
                                        )

                                };


                                // =========================
                                // SAVE
                                // =========================

                                localStorage.setItem(

                                    "selectedProduct",

                                    JSON.stringify(
                                        selectedProduct
                                    )

                                );


                                // =========================
                                // NEXT PAGE
                                // =========================

                                location.href =
                                    "OrderDetails.html";

                            };


                        // =============================
                        // LONG PRESS START
                        // =============================

                        const startLongPress =
                            () => {

                                if (!isReseller) {

                                    return;

                                }


                                longPressTriggered =
                                    false;


                                pressTimer =
                                    setTimeout(
                                        () => {

                                            longPressTriggered =
                                                true;


                                            showResellerPricePopup(

                                                product,

                                                normalPrice,

                                                finalPrice,

                                                resellerDiscount,

                                                openProduct

                                            );

                                        },

                                        2000
                                    );

                            };


                        // =============================
                        // LONG PRESS CANCEL
                        // =============================

                        const cancelLongPress =
                            () => {

                                if (pressTimer) {

                                    clearTimeout(
                                        pressTimer
                                    );

                                    pressTimer =
                                        null;

                                }

                            };


                        // =============================
                        // MOUSE
                        // =============================

                        card.addEventListener(
                            "mousedown",
                            startLongPress
                        );


                        card.addEventListener(
                            "mouseup",
                            cancelLongPress
                        );


                        card.addEventListener(
                            "mouseleave",
                            cancelLongPress
                        );


                        // =============================
                        // TOUCH
                        // =============================

                        card.addEventListener(
                            "touchstart",
                            startLongPress,
                            {
                                passive: true
                            }
                        );


                        card.addEventListener(
                            "touchend",
                            cancelLongPress
                        );


                        card.addEventListener(
                            "touchcancel",
                            cancelLongPress
                        );


                        // =============================
                        // CONTEXT MENU
                        // =============================

                        card.addEventListener(
                            "contextmenu",
                            event => {

                                event.preventDefault();

                                return false;

                            }
                        );


                        // =============================
                        // TEXT SELECTION
                        // =============================

                        card.addEventListener(
                            "selectstart",
                            event => {

                                event.preventDefault();

                            }
                        );


                        // =============================
                        // IMAGE DRAG
                        // =============================

                        card.addEventListener(
                            "dragstart",
                            event => {

                                event.preventDefault();

                            }
                        );


                        // =============================
                        // NORMAL CLICK
                        // =============================

                        card.addEventListener(
                            "click",
                            () => {

                                if (
                                    longPressTriggered
                                ) {

                                    longPressTriggered =
                                        false;

                                    return;

                                }


                                openProduct();

                            }
                        );


                        // =============================
                        // ADD CARD
                        // =============================

                        grid.appendChild(
                            card
                        );

                    }
                );


                container.appendChild(
                    grid
                );

            }
        );

}


// ===========================================
// START
// ===========================================

await loadStockStatus();

await loadResellerDiscount();

showResellerSystemWarning();

await loadProducts();


// ===========================================
// RESELLER PRICE POPUP
// ===========================================

function showResellerPricePopup(

    product,

    normalPrice,

    finalPrice,

    discount,

    continueCallback

) {


    document
        .getElementById(
            "resellerPricePopup"
        )
        ?.remove();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "resellerPricePopup";


    overlay.className =
        "reseller-price-overlay";


    overlay.innerHTML = `

        <div class="reseller-price-popup">

            <button
                type="button"
                class="reseller-popup-close"
                aria-label="Close"
            >

                <i class="fa-solid fa-xmark"></i>

            </button>


            <div class="reseller-popup-icon">

                <i class="fa-solid fa-crown"></i>

            </div>


            <div class="reseller-popup-badge">

                RESELLER BENEFIT

            </div>


            <h2>

                ${product.product_name}

            </h2>


            <p class="reseller-popup-subtitle">

                Your exclusive reseller pricing

            </p>


            <div class="reseller-price-details">


                <div class="reseller-price-row">

                    <span>

                        Normal Price

                    </span>


                    <strong
                        class="normal-price-popup"
                    >

                        Rs.
                        ${normalPrice.toFixed(2)}

                    </strong>

                </div>


                <div
                    class="
                        reseller-price-row
                        reseller-final-row
                    "
                >

                    <span>

                        Reseller Price

                    </span>


                    <strong>

                        Rs.
                        ${finalPrice.toFixed(2)}/=

                    </strong>

                </div>


            </div>


            <div class="reseller-discount-badge">

                <i class="fa-solid fa-tag"></i>

                ${discount}%
                Reseller Discount

            </div>


            <button
                type="button"
                class="reseller-popup-continue"
            >

                Continue

                <i class="fa-solid fa-arrow-right"></i>

            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    // =======================================
    // SHOW
    // =======================================

    requestAnimationFrame(
        () => {

            overlay.classList.add(
                "show"
            );

        }
    );


    // =======================================
    // CLOSE
    // =======================================

    const closePopup =
        () => {

            overlay.classList.remove(
                "show"
            );


            setTimeout(
                () => {

                    overlay.remove();

                },
                250
            );

        };


    overlay
        .querySelector(
            ".reseller-popup-close"
        )
        ?.addEventListener(
            "click",
            closePopup
        );


    overlay
        .querySelector(
            ".reseller-popup-continue"
        )
        ?.addEventListener(
            "click",
            () => {

                closePopup();


                if (continueCallback) {

                    setTimeout(
                        () => {

                            continueCallback();

                        },
                        260
                    );

                }

            }
        );


    // =======================================
    // CLICK OUTSIDE
    // =======================================

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closePopup();

            }

        }
    );

}


// ===========================================
// LEVEL UP PASS WARNING
// ===========================================

function showLevelUpWarning() {

    return new Promise(
        resolve => {


            const overlay =
                document.createElement(
                    "div"
                );


            overlay.className =
                "levelup-warning-overlay";


            overlay.innerHTML = `

                <div class="levelup-warning-popup">

                    <div class="levelup-warning-icon">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                    </div>


                    <h2>

                        Important Notice

                    </h2>


                    <p class="levelup-warning-subtitle">

                        Please read before purchasing

                    </p>


                    <div class="levelup-warning-message">


                        <div class="warning-row">

                            <i class="fa-solid fa-user"></i>

                            <span>

                                One Account Can Buy

                                <strong>
                                    Level Up Pass
                                </strong>

                                Only One Time.

                            </span>

                        </div>


                        <div class="warning-row">

                            <i class="fa-solid fa-rotate-left"></i>

                            <span>

                                If You Buy Again,

                                <strong>
                                    Phoenix Store
                                </strong>

                                Will Not Take Any Action On Refund.

                            </span>

                        </div>


                        <div class="warning-row">

                            <i class="fa-solid fa-ban"></i>

                            <span>

                                All Purchases Are

                                <strong>
                                    One-way
                                </strong>

                                (No Refund).

                            </span>

                        </div>


                    </div>


                    <div class="levelup-warning-note">

                        <i class="fa-solid fa-circle-info"></i>

                        Please make sure you are purchasing

                        for the correct Free Fire account.

                    </div>


                    <button
                        type="button"
                        class="levelup-warning-ok"
                    >

                        I Understand & Continue

                        <i class="fa-solid fa-arrow-right"></i>

                    </button>

                </div>

            `;


            document.body.appendChild(
                overlay
            );


            requestAnimationFrame(
                () => {

                    overlay.classList.add(
                        "show"
                    );

                }
            );


            const closePopup =
                () => {

                    overlay.classList.remove(
                        "show"
                    );


                    setTimeout(
                        () => {

                            overlay.remove();

                            resolve(true);

                        },
                        250
                    );

                };


            overlay
                .querySelector(
                    ".levelup-warning-ok"
                )
                ?.addEventListener(
                    "click",
                    closePopup
                );

        }
    );

}


// ===========================================
// OUT OF STOCK POPUP
// ===========================================

function showOutOfStockPopup() {

    document
        .getElementById(
            "outOfStockPopup"
        )
        ?.remove();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "outOfStockPopup";


    overlay.className =
        "out-stock-overlay";


    overlay.innerHTML = `

        <div class="out-stock-popup">

            <button
                type="button"
                class="out-stock-close"
                aria-label="Close"
            >

                <i class="fa-solid fa-xmark"></i>

            </button>


            <div class="out-stock-logo">

                <span>🔥</span>

            </div>


            <div class="out-stock-brand">

                PHOENIX STORE

            </div>


            <div class="out-stock-icon">

                <i class="fa-solid fa-box-open"></i>

            </div>


            <h2>

                Out of Stock

            </h2>


            <p class="out-stock-message">

                This product is temporarily
                unavailable.

            </p>


            <p class="out-stock-submessage">

                We are currently restocking this
                product. Please wait patiently
                and check again later.

            </p>


            <div class="out-stock-contact">

                <i class="fa-solid fa-headset"></i>


                <div>

                    <span>
                        Need assistance?
                    </span>


                    <strong>
                        +94 75 537 7823
                    </strong>

                </div>

            </div>


            <button
                type="button"
                class="out-stock-ok"
            >

                <i class="fa-solid fa-check"></i>

                Got It

            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    requestAnimationFrame(
        () => {

            overlay.classList.add(
                "show"
            );

        }
    );


    const closePopup =
        () => {

            overlay.classList.remove(
                "show"
            );


            setTimeout(
                () => {

                    overlay.remove();

                },
                250
            );

        };


    overlay
        .querySelector(
            ".out-stock-close"
        )
        ?.addEventListener(
            "click",
            closePopup
        );


    overlay
        .querySelector(
            ".out-stock-ok"
        )
        ?.addEventListener(
            "click",
            closePopup
        );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closePopup();

            }

        }
    );

}