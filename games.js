import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


// =========================================
// SUPABASE
// =========================================

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


// =========================================
// GAME ELEMENTS
// =========================================

const gamesContainer =
    document.getElementById("gamesContainer");

const gameSearch =
    document.getElementById("gameSearch");

const clearSearch =
    document.getElementById("clearSearch");

const gameCount =
    document.getElementById("gameCount");

const emptySearch =
    document.getElementById("emptySearch");

const walletBalance =
    document.getElementById("walletBalance");


// =========================================
// SUBSCRIPTION ELEMENTS
// =========================================

const subscriptionsContainer =
    document.getElementById(
        "subscriptionsContainer"
    );


// =========================================
// COMING SOON POPUP
// =========================================

const comingSoonPopup =
    document.getElementById(
        "comingSoonPopup"
    );

const comingSoonClose =
    document.getElementById(
        "comingSoonClose"
    );

const comingSoonOk =
    document.getElementById(
        "comingSoonOk"
    );


// =========================================
// DATA
// =========================================

let games = [];

let subscriptions = [];


// =========================================
// GAME ICONS
// =========================================

const gameIcons = {

    "free fire":
        "fa-solid fa-fire",

    "mobile legends":
        "fa-solid fa-khanda",

    "blood strike":
        "fa-solid fa-crosshairs",

    "8 ball pool":
        "fa-solid fa-circle",

    "ludo club":
        "fa-solid fa-dice",

    "pubg":
        "fa-solid fa-person-rifle"

};


// =========================================
// GAME FALLBACK IMAGES
// =========================================

const fallbackImages = {
"free fire": "image/free-fire.jpg",
"mobile legends": "image/mobile-legends.jpg",
"blood strike": "image/blood-strike.jpg",
"8 ball pool": "image/8-ball-pool.jpg",
"ludo club": "image/ludo-club.jpg",
"pubg": "image/pubg.jpg"
};

// =========================================
// LOAD WALLET
// =========================================

async function loadWallet() {

    const {
        data: {
            session
        }
    } =
        await supabase.auth.getSession();


    if (!session) {

        if (walletBalance) {

            walletBalance.textContent =
                "Rs. 0.00";

        }

        return;

    }


    const {
        data,
        error
    } =
        await supabase
            .from("profiles")
            .select("wallet_balance")
            .eq(
                "id",
                session.user.id
            )
            .single();


    if (error) {

        console.error(
            "Wallet error:",
            error
        );

        return;

    }


    if (walletBalance) {

        walletBalance.textContent =
            "Rs. " +
            Number(
                data?.wallet_balance || 0
            ).toFixed(2);

    }

}


// =========================================
// LOAD GAMES
// =========================================

async function loadGames() {

    gamesContainer.innerHTML = `

        <div class="games-loading">

            <div class="loading-spinner"></div>

            <p>
                Loading games...
            </p>

        </div>

    `;


    const {
        data,
        error
    } =
        await supabase
            .from("games")
            .select("*")
            .eq("active", true)
            .order(
                "sort_order",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Games Error:",
            error
        );


        gamesContainer.innerHTML = `

            <div class="games-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Unable to Load Games
                </h3>

                <p>
                    Please refresh the page and try again.
                </p>

            </div>

        `;

        return;

    }


    games = data || [];

    renderGames(games);

}


// =========================================
// RENDER GAMES
// =========================================

// =========================================
// RENDER GAMES
// =========================================

function renderGames(list) {

    gamesContainer.innerHTML = "";

    emptySearch.style.display = "none";


    gameCount.textContent =
        `${list.length} ${
            list.length === 1
                ? "Game"
                : "Games"
        }`;


    if (!list.length) {

        emptySearch.style.display = "block";

        return;

    }


    list.forEach(game => {

        const card =
            document.createElement("article");


        card.className = "game-card";


        const gameName =
            game.name ||
            "Unknown Game";


        const normalizedName =
            gameName
                .toLowerCase()
                .trim();


        // =========================================
        // GARENA SHELL DETECTION
        // =========================================

        const isGarenaShell =
            normalizedName === "garena shells" ||
            normalizedName === "garena shell" ||
            game.slug === "garena-shells";


        // =========================================
        // AVAILABLE STATUS
        // =========================================

        const isAvailable =
            !game.coming_soon ||
            isGarenaShell;


        // =========================================
        // COMING SOON STYLE
        // =========================================

        if (!isAvailable) {

            card.classList.add(
                "coming-soon-card"
            );

        }


        // =========================================
        // IMAGE
        // =========================================

const image =
    game.image_url
        ? (
            game.image_url.startsWith("http")
                ? game.image_url
                : `image/${game.image_url}`
        )
        : fallbackImages[
            normalizedName
        ] || "image/default-avatar.jpg";


        // =========================================
        // ICON
        // =========================================

        const icon =
            gameIcons[
                normalizedName
            ] ||
            "fa-solid fa-gamepad";


        // =========================================
        // CARD HTML
        // =========================================

        card.innerHTML = `

            <div class="game-image">

                <img
                    src="${image}"
                    alt="${escapeHTML(gameName)}"
                    loading="lazy"
                >


                ${
                    isAvailable

                    ?

                    `
                    <div class="available-badge">

                        <span></span>

                        AVAILABLE

                    </div>
                    `

                    :

                    `
                    <div class="coming-badge">

                        <span></span>

                        COMING SOON

                    </div>
                    `
                }

            </div>


            <div class="game-info">

                <div class="game-icon">

                    <i class="${icon}"></i>

                </div>


                <div class="game-name">

                    <h3>
                        ${escapeHTML(gameName)}
                    </h3>

                    <p>

                        ${
                            isAvailable
                                ? "Top Up Now"
                                : "Launching soon"
                        }

                    </p>

                </div>


                <div class="game-arrow">

                    <i class="fa-solid fa-chevron-right"></i>

                </div>

            </div>

        `;


        // =========================================
        // CLICK
        // =========================================

        card.addEventListener(
            "click",
            () => {

                handleGameClick(game);

            }
        );


        gamesContainer.appendChild(card);

    });

}


// =========================================
// GAME CLICK
// =========================================
function handleGameClick(game) {

    const gameName =
        (game.name || "")
            .toLowerCase()
            .trim();


    const isGarenaShell =
        gameName === "garena shells" ||
        gameName === "garena shell" ||
        game.slug === "garena-shells";


    // Garena Shells
    if (isGarenaShell) {

        location.href =
            "garena-shell.html";

        return;

    }


    // Other coming soon games
    if (game.coming_soon) {

        showComingSoon(
            game.name
        );

        return;

    }

    // Call of Duty Mobile
if (
    game.slug === "cod-mobile"
) {

    location.href =
        "cod-mobile.html";

    return;

}

// Delta Force
if (
    game.slug === "delta-force"
) {

    location.href =
        "delta-force.html";

    return;

}

    // Free Fire
    if (
        game.slug === "free-fire"
    ) {

        location.href =
            "topup.html";

        return;

    }


    console.log(
        "Opening game:",
        game.name
    );

}


// =========================================
// LOAD SUBSCRIPTIONS
// =========================================

async function loadSubscriptions() {

    if (!subscriptionsContainer)
        return;


    subscriptionsContainer.innerHTML = `

        <div class="subscriptions-loading">

            <div class="loading-spinner"></div>

            <p>
                Loading subscriptions...
            </p>

        </div>

    `;


    const {
        data,
        error
    } =
        await supabase
            .from("subscriptions")
            .select("*")
            .eq("active", true)
            .order(
                "sort_order",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Subscriptions Error:",
            error
        );


        subscriptionsContainer.innerHTML = `

            <div class="subscriptions-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <p>
                    Unable to load subscriptions.
                </p>

            </div>

        `;

        return;

    }


    subscriptions =
        data || [];


    renderSubscriptions(
        subscriptions
    );

}


// =========================================
// SUBSCRIPTION FALLBACK IMAGES
// =========================================

const subscriptionImages = {
    "garena shells and account":
        "image/garena-shells.jpg",

    "canva pro":
        "image/canva-pro.jpg",

    "chatgpt plus":
        "image/chatgpt-plus.jpg",

    "smm redeem code":
        "image/smm-redeem-code.jpg"
};


// =========================================
// RENDER SUBSCRIPTIONS
// =========================================

function renderSubscriptions(list) {

    subscriptionsContainer.innerHTML = "";

    if (!list.length) {

        subscriptionsContainer.innerHTML = `
            <div class="subscriptions-empty">
                <i class="fa-solid fa-box-open"></i>
                <p>No subscriptions available.</p>
            </div>
        `;

        return;
    }

    list.forEach(subscription => {

        const card =
            document.createElement("article");

        card.className =
            "subscription-card";


        const name =
            subscription.name ||
            "Subscription";


        const normalizedName =
            name
                .toLowerCase()
                .trim();


const image =
    subscription.image_url
        ? (
            subscription.image_url.startsWith("http")
                ? subscription.image_url
                : `image/${subscription.image_url}`
        )
        : subscriptionImages[normalizedName] ||
          "image/default-avatar.jpg";

        // =========================================
        // GARENA SHELLS = AVAILABLE
        // =========================================

        const isGarenaShell =
            normalizedName ===
            "garena shells and account";


        card.innerHTML = `

            <div class="subscription-image">

                <img
                    src="${image}"
                    alt="${escapeHTML(name)}"
                    loading="lazy"
                >

                ${
                    isGarenaShell

                    ?

                    `
                    <div class="available-badge">

                        <span></span>

                        AVAILABLE

                    </div>
                    `

                    :

                    `
                    <div class="subscription-coming">

                        <span></span>

                        COMING SOON

                    </div>
                    `
                }

            </div>


            <div class="subscription-info">

                <div class="subscription-icon">

                    <i class="fa-solid fa-crown"></i>

                </div>


                <div class="subscription-name">

                    <h3>
                        ${escapeHTML(name)}
                    </h3>

                    <p>

                        ${
                            isGarenaShell
                                ? "Top Up Now"
                                : "Premium service coming soon"
                        }

                    </p>

                </div>


                <div class="subscription-arrow">

                    <i class="fa-solid fa-chevron-right"></i>

                </div>

            </div>

        `;


        // =========================================
        // CLICK
        // =========================================

        card.addEventListener(
            "click",
            () => {

                if (isGarenaShell) {

                    location.href =
                        "garena-shell.html";

                    return;

                }


                showComingSoon(name);

            }
        );


        subscriptionsContainer.appendChild(
            card
        );

    });

}


// =========================================
// COMING SOON POPUP
// =========================================

function showComingSoon(
    itemName
) {

    if (!comingSoonPopup)
        return;


    const title =
        comingSoonPopup
            .querySelector(
                ".popup-title"
            );


    if (title) {

        title.textContent =
            `${itemName} is coming soon to Phoenix Store.`;

    }


    comingSoonPopup.classList.add(
        "show"
    );


    document.body.classList.add(
        "popup-open"
    );

}


// =========================================
// CLOSE POPUP
// =========================================

function closeComingSoon() {

    if (!comingSoonPopup)
        return;


    comingSoonPopup.classList.remove(
        "show"
    );


    document.body.classList.remove(
        "popup-open"
    );

}


comingSoonClose?.addEventListener(
    "click",
    closeComingSoon
);


comingSoonOk?.addEventListener(
    "click",
    closeComingSoon
);


comingSoonPopup?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            comingSoonPopup
        ) {

            closeComingSoon();

        }

    }
);


// =========================================
// SEARCH GAMES
// =========================================

gameSearch?.addEventListener(
    "input",
    () => {

        const query =
            gameSearch.value
                .trim()
                .toLowerCase();


        clearSearch.classList.toggle(
            "show",
            query.length > 0
        );


        if (!query) {

            renderGames(games);

            return;

        }


        const filtered =
            games.filter(game => {

                return game.name
                    .toLowerCase()
                    .includes(query);

            });


        renderGames(filtered);

    }
);


// =========================================
// CLEAR SEARCH
// =========================================

clearSearch?.addEventListener(
    "click",
    () => {

        gameSearch.value = "";

        clearSearch.classList.remove(
            "show"
        );

        renderGames(games);

        gameSearch.focus();

    }
);


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================
// INITIAL LOAD
// =========================================

await loadWallet();

await loadGames();

await loadSubscriptions();


// =========================================
// WALLET AUTO REFRESH
// =========================================

setInterval(
    loadWallet,
    10000
);


console.log(
    "🔥 Phoenix Games & Subscriptions Loaded"
);