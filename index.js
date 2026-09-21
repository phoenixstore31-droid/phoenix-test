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
            persistSession:true,
            autoRefreshToken:true,
            detectSessionInUrl:true
        }
    }

);


// =========================================
// CONSTANTS
// =========================================

const PHOENIX_WHATSAPP =
    "94755377823";


// =========================================
// ELEMENTS
// =========================================

const liveBalance =
    document.getElementById(
        "liveBalance"
    );

const walletButton =
    document.getElementById(
        "walletButton"
    );

const leaderboard =
    document.getElementById(
        "leaderboard"
    );

const leaderboardMore =
    document.getElementById(
        "leaderboardMore"
    );

const offersContainer =
    document.getElementById(
        "offersContainer"
    );

const reviewsContainer =
    document.getElementById(
        "reviewsContainer"
    );


// =========================================
// SESSION
// =========================================

let currentSession = null;


// =========================================
// MAINTENANCE CHECK
// =========================================

async function checkMaintenance(){

    const {
        data:{
            session
        }
    } =
        await supabase.auth.getSession();


    currentSession =
        session || null;


    let isAdmin = false;


    if(session){

        const {
            data:admin
        } =
            await supabase
                .from("admin_users")
                .select("id")
                .eq(
                    "id",
                    session.user.id
                )
                .maybeSingle();


        if(admin){

            isAdmin = true;

        }

    }


    const {
        data:settings,
        error
    } =
        await supabase
            .from("settings")
            .select("maintenance")
            .eq("id",1)
            .single();


    if(error){

        console.warn(
            "Maintenance check failed:",
            error
        );

        return;

    }


    if(
        settings?.maintenance === true &&
        !isAdmin
    ){

        window.location.replace(
            "maintenance.html"
        );

        throw new Error(
            "Maintenance mode active"
        );

    }

}


// =========================================
// WALLET
// =========================================

async function loadWallet(){

    if(!currentSession){

        liveBalance.textContent =
            "Login";

        walletButton.onclick = () => {

            location.href =
                "login.html";

        };

        return;

    }


    const {
        data:profile,
        error
    } =
        await supabase
            .from("profiles")
            .select(
                "wallet_balance"
            )
            .eq(
                "id",
                currentSession.user.id
            )
            .single();


    if(error){

        console.error(
            "Wallet error:",
            error
        );

        liveBalance.textContent =
            "Rs. 0.00";

        return;

    }


    liveBalance.textContent =
        "Rs. " +
        Number(
            profile?.wallet_balance || 0
        ).toFixed(2);


    walletButton.onclick = () => {

        location.href =
            "wallet-topup.html";

    };

}


// =========================================
// LEADERBOARD
// =========================================

async function loadLeaderboard(){

    if(!leaderboard)
        return;

    leaderboard.innerHTML = `

        <div class="section-loading">

            <div class="mini-spinner"></div>

            <span>
                Loading community...
            </span>

        </div>

    `;

    const {
        data,
        error
    } = await supabase.rpc(
        "get_home_leaderboard"
    );


    if(error){

        console.error(
            "Leaderboard error:",
            error
        );

        leaderboard.innerHTML = `

            <div class="section-loading">

                <span>
                    Community ranking unavailable.
                </span>

            </div>

        `;

        return;
    }


    const top5 =
        Array.isArray(data?.top5)
            ? data.top5
            : [];


    const myRank =
        data?.my_rank ?? null;


    const mySpent =
        Number(
            data?.my_total_spent || 0
        );


    leaderboard.innerHTML = "";


    // =====================================
    // TOP 5
    // =====================================

    top5.forEach(
        (user) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "rank-card";


            const rank =
                Number(user.rank);


            const avatar =
                user.avatar_url ||
                "../image/default-avatar.jpg";


            const username =
                user.username ||
                "Phoenix User";


            const spent =
                Number(
                    user.total_spent || 0
                );


            card.innerHTML = `

                <div
                    class="
                        rank-number
                        ${
                            rank === 1
                                ? "first"
                                : ""
                        }
                    "
                >

                    ${
                        rank === 1
                            ? "🥇"
                            : rank === 2
                            ? "🥈"
                            : rank === 3
                            ? "🥉"
                            : `#${rank}`
                    }

                </div>


                <img
                    class="rank-avatar"
                    src="${escapeHTML(avatar)}"
                    alt="${escapeHTML(username)}"
                    onerror="
                        this.src='../image/default-avatar.jpg'
                    "
                >


                <div class="rank-info">

                    <h3>
                        ${escapeHTML(username)}
                    </h3>

                    <p>
                        Phoenix Community
                    </p>

                </div>


                <div class="rank-value">

                    <span>
                        TOTAL SPENT
                    </span>

                    Rs.
                    ${spent.toFixed(2)}

                </div>

            `;


            leaderboard.appendChild(
                card
            );

        }
    );


    // =====================================
    // MY RANK
    // =====================================

    if(myRank !== null){

        const myRankBox =
            document.createElement(
                "div"
            );


        myRankBox.className =
            "my-ranking-card";


        myRankBox.innerHTML = `

            <div class="my-ranking-icon">
                🏆
            </div>


            <div class="my-ranking-info">

                <span>
                    YOUR RANKING
                </span>

                <strong>
                    #${myRank}
                </strong>

                <p>
                    Keep playing and climb higher!
                </p>

            </div>


            <div class="my-ranking-spent">

                <span>
                    TOTAL SPENT
                </span>

                <strong>
                    Rs. ${mySpent.toFixed(2)}
                </strong>

            </div>

        `;


        leaderboard.appendChild(
            myRankBox
        );

    }

}


// =========================================
// OFFERS
// =========================================

async function loadOffers(){

    if(!offersContainer)
        return;


    offersContainer.innerHTML = `

        <div class="section-loading">

            <div class="mini-spinner"></div>

            <span>
                Loading offers...
            </span>

        </div>

    `;


    const {
        data,
        error
    } =
        await supabase
            .from("products")
            .select(
                "id, product_name, category, price, active"
            )
            .eq(
                "active",
                true
            )
            .order(
                "id",
                {
                    ascending:true
                }
            )
            .limit(6);


    if(error){

        console.error(
            "Offers error:",
            error
        );


        offersContainer.innerHTML = `

            <div class="section-loading">

                <span>
                    Offers unavailable.
                </span>

            </div>

        `;

        return;

    }


    if(!data || data.length === 0){

        offersContainer.innerHTML = `

            <div class="section-loading">

                <span>
                    No offers available.
                </span>

            </div>

        `;

        return;

    }


    offersContainer.innerHTML = "";


    data.forEach(
        (product,index) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "offer-card";


            const image =
                getProductImage(
                    product.category,
                    index
                );


            card.innerHTML = `

                <div class="offer-image">

                    <img
                        src="${image}"
                        alt="${escapeHTML(
                            product.product_name
                        )}"
                        loading="lazy"
                    >

                    <span class="offer-tag">
                        FEATURED
                    </span>

                </div>


                <div class="offer-info">

                    <h3>
                        ${escapeHTML(
                            product.product_name
                        )}
                    </h3>

                    <p>
                        From Rs.
                        ${Number(
                            product.price || 0
                        ).toFixed(2)}
                    </p>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    const selectedProduct = {

                        id:
                            product.id,

                        category:
                            product.category,

                        title:
                            product.product_name,

                        image:
                            image,

                        price:
                            Number(
                                product.price || 0
                            )

                    };


                    localStorage.setItem(
                        "selectedProduct",
                        JSON.stringify(
                            selectedProduct
                        )
                    );


                    location.href =
                        "OrderDetails.html";

                }
            );


            offersContainer.appendChild(
                card
            );

        }
    );

}


// =========================================
// PRODUCT IMAGE
// =========================================

function getProductImage(
    category,
    index
){

    const images = {

        "Membership":[
            "../image/M-0.jpg",
            "../image/M-1.jpg",
            "../image/M-2.jpg",
            "../image/M-3.jpg",
            "../image/M-4.jpg"
        ],

        "Diamonds":[
            "../image/D-2.jpg"
        ],

        "Level UP Pass":[
            "../image/L-3.jpg"
        ]

    };


    const list =
        images[category];


    if(!list || !list.length){

        return "../image/1.jpg";

    }


    return list[
        index % list.length
    ];

}


// =========================================
// CUSTOMER REVIEWS
// =========================================

async function loadReviews(){

    if(!reviewsContainer)
        return;


    const {
        data: reviews,
        error
    } = await supabase
        .from("reviews")
        .select(`
id,
customer_name,
customer_avatar,
rating,
review_text,
status,
created_at
        `)
        .eq("status", "approved")
        .order("created_at", {
            ascending: false
        });


    if(error){

        console.error(
            "Reviews loading error:",
            error
        );

        reviewsContainer.innerHTML = "";

        return;
    }


    if(!reviews || !reviews.length){

        reviewsContainer.innerHTML = `
            <div class="reviews-empty">
                No reviews yet.
            </div>
        `;

        return;
    }


    reviewsContainer.innerHTML = "";


    reviews.forEach(review => {

        const card =
            document.createElement("article");


        card.className =
            "review-card";


        const name =
            review.customer_name ||
            "Phoenix Customer";


        const rating =
            Math.max(
                1,
                Math.min(
                    5,
                    Number(review.rating) || 5
                )
            );


        const stars =
            "★".repeat(rating) +
            "☆".repeat(5 - rating);


        const letter =
            name
                .charAt(0)
                .toUpperCase();

                const avatarHTML = review.customer_avatar
    ? `
        <img
            src="${escapeHTML(review.customer_avatar)}"
            class="review-avatar"
            alt="${escapeHTML(name)}"
        >
      `
    : `
        <div class="review-avatar-letter">
            ${escapeHTML(letter)}
        </div>
      `;


        card.innerHTML = `

            <div class="review-quote">
                “
            </div>


<div class="review-user">

    ${avatarHTML}

    <div>

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <span>
                        Phoenix Store Customer
                    </span>

                </div>

            </div>


            <div class="review-stars">

                ${stars}

            </div>


            <p class="review-text">

                “${escapeHTML(
                    review.review_text
                )}”

            </p>

        `;


        reviewsContainer.appendChild(card);

    });


    startReviewsSlider();

}

// =========================================
// REVIEWS - CONTINUOUS SMOOTH AUTO SCROLL
// =========================================

function startReviewsSlider() {

    const slider =
        document.getElementById("reviewsContainer");

    if (!slider) return;

    if (slider.children.length <= 1) return;

    // Duplicate cards for seamless loop
    if (!slider.dataset.loopReady) {

        const cards =
            Array.from(slider.children);

        cards.forEach(card => {

            const clone =
                card.cloneNode(true);

            clone.dataset.clone = "true";

            slider.appendChild(clone);

        });

        slider.dataset.loopReady = "true";
    }

    // Stop any previous animation
    if (slider._reviewAnimation) {
        cancelAnimationFrame(
            slider._reviewAnimation
        );
    }

    let position = 0;

    const speed = 0.45;

    function animate() {

        position += speed;

        slider.scrollLeft = position;

        const halfWidth =
            slider.scrollWidth / 2;

        // Seamlessly start again
        if (position >= halfWidth) {

            position = 0;

            slider.scrollLeft = 0;

        }

        slider._reviewAnimation =
            requestAnimationFrame(
                animate
            );
    }

    animate();
}

// =========================================
// HERO SLIDER
// =========================================

const heroSlides =
    Array.from(
        document.querySelectorAll(
            ".hero-slide"
        )
    );


const heroDots =
    Array.from(
        document.querySelectorAll(
            ".hero-dots span"
        )
    );


let heroIndex = 0;

let heroTimer = null;


function showHero(index){

    if(!heroSlides.length)
        return;


    heroIndex =
        (index + heroSlides.length)
        % heroSlides.length;


    heroSlides.forEach(
        (slide,i) => {

            slide.classList.toggle(
                "active",
                i === heroIndex
            );

        }
    );


    heroDots.forEach(
        (dot,i) => {

            dot.classList.toggle(
                "active",
                i === heroIndex
            );

        }
    );

}


function nextHero(){

    showHero(
        heroIndex + 1
    );

}


function previousHero(){

    showHero(
        heroIndex - 1
    );

}


function startHeroTimer(){

    clearInterval(
        heroTimer
    );


    heroTimer =
        setInterval(
            nextHero,
            2000
        );

}


function resetHeroTimer(){

    startHeroTimer();

}


document
    .getElementById("heroNext")
    ?.addEventListener(
        "click",
        () => {

            nextHero();

            resetHeroTimer();

        }
    );


document
    .getElementById("heroPrev")
    ?.addEventListener(
        "click",
        () => {

            previousHero();

            resetHeroTimer();

        }
    );


heroDots.forEach(
    (dot,index) => {

        dot.addEventListener(
            "click",
            () => {

                showHero(index);

                resetHeroTimer();

            }
        );

    }
);


showHero(0);

startHeroTimer();


// =========================================
// MOBILE SWIPE
// =========================================

let touchStartX = 0;


const heroSlider =
    document.getElementById(
        "heroSlider"
    );


heroSlider?.addEventListener(
    "touchstart",
    event => {

        touchStartX =
            event.touches[0].clientX;

    },
    {
        passive:true
    }
);


heroSlider?.addEventListener(
    "touchend",
    event => {

        const touchEndX =
            event.changedTouches[0].clientX;


        const distance =
            touchEndX -
            touchStartX;


        if(Math.abs(distance) < 45)
            return;


        if(distance < 0){

            nextHero();

        }else{

            previousHero();

        }


        resetHeroTimer();

    },
    {
        passive:true
    }
);


// =========================================
// FAQ
// =========================================

document
    .querySelectorAll(".faq-question")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const item =
                        button.closest(
                            ".faq-item"
                        );


                    document
                        .querySelectorAll(
                            ".faq-item.open"
                        )
                        .forEach(
                            openItem => {

                                if(
                                    openItem !== item
                                ){

                                    openItem
                                        .classList
                                        .remove(
                                            "open"
                                        );

                                }

                            }
                        );


                    item.classList.toggle(
                        "open"
                    );

                }
            );

        }
    );


// =========================================
// NAVIGATION
// =========================================

window.goTopup =
function(){

    location.href =
        "games.html";

};


window.goPayment =
function(){

    location.href =
        "payment.html";

};


window.goWhatsApp =
function(){

    window.location.href =
        "whatsapp.html";

};


// =========================================
// LEADERBOARD BUTTON
// =========================================

leaderboardMore?.addEventListener(
    "click",
    () => {

        /*
         * Keep this ready for a future
         * dedicated leaderboard page.
         *
         * For now, scroll back to the
         * leaderboard section.
         */

        leaderboard?.scrollIntoView({
            behavior:"smooth",
            block:"start"
        });

    }
);


// =========================================
// HTML ESCAPE
// =========================================

function escapeHTML(value){

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
// INITIALIZE
// =========================================

async function initializeHome(){

    try{

        await checkMaintenance();

        await loadWallet();

        await loadLeaderboard();

        await loadOffers();

        await loadReviews();


        console.log(
            "🔥 Phoenix Store Home Loaded"
        );

    }
    catch(error){

        console.error(
            "Home initialization error:",
            error
        );

    }

}


await initializeHome();


// =========================================
// WALLET AUTO REFRESH
// =========================================

setInterval(
    async () => {

        if(currentSession){

            await loadWallet();

        }

    },
    15000
);