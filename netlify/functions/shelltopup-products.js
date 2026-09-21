const SUPABASE_URL =
    "https://tvhgxlqqeklrdlgbkosa.supabase.co";

const SHELLTOPUP_URL =
    "https://shelltopup.com/api/v1";


/* =========================================================
   JSON RESPONSE
========================================================= */

function json(statusCode, body) {

    return {

        statusCode,

        headers: {

            "Content-Type":
                "application/json",

            "Access-Control-Allow-Origin":
                "*",

            "Access-Control-Allow-Headers":
                "Content-Type, Authorization",

            "Access-Control-Allow-Methods":
                "GET, OPTIONS"

        },

        body:
            JSON.stringify(body)

    };

}


/* =========================================================
   MAIN FUNCTION
========================================================= */

exports.handler = async (event) => {

    /* -----------------------------------------------------
       OPTIONS
    ----------------------------------------------------- */

    if (
        event.httpMethod ===
        "OPTIONS"
    ) {

        return json(
            200,
            {
                ok: true
            }
        );

    }


    /* -----------------------------------------------------
       ONLY GET
    ----------------------------------------------------- */

    if (
        event.httpMethod !==
        "GET"
    ) {

        return json(
            405,
            {
                ok: false,

                error:
                    "Method not allowed"
            }
        );

    }


    /* -----------------------------------------------------
       ENVIRONMENT VARIABLES
    ----------------------------------------------------- */

    const SHELL_API_KEY =
        process.env.SHELL_API_KEY;

    const SUPABASE_SERVICE_ROLE_KEY =
        process.env.SUPABASE_SERVICE_ROLE_KEY;


    if (!SHELL_API_KEY) {

        return json(
            500,
            {
                ok: false,

                error:
                    "SHELL_API_KEY is not configured in Netlify."
            }
        );

    }


    if (!SUPABASE_SERVICE_ROLE_KEY) {

        return json(
            500,
            {
                ok: false,

                error:
                    "SUPABASE_SERVICE_ROLE_KEY is not configured in Netlify."
            }
        );

    }


    try {

        /* =================================================
           1. GET ACTIVE PHOENIX SHELL PRODUCTS
        ================================================= */

        const phoenixProducts =
            await getPhoenixProducts(
                SUPABASE_SERVICE_ROLE_KEY
            );


        /*
            Example:

            Weekly Lite
            shell_product_id = xxx

            Weekly
            shell_product_id = xxx

            etc.
        */

        if (
            !Array.isArray(
                phoenixProducts
            ) ||
            phoenixProducts.length === 0
        ) {

            return json(
                200,
                {

                    ok: true,

                    products: []

                }
            );

        }


        /* =================================================
           2. GET SHELLTOPUP GAMES
        ================================================= */

        const gamesResult =
            await getShellTopupGames(
                SHELL_API_KEY
            );


        /* =================================================
           3. GET SHELLTOPUP BALANCE
        ================================================= */

        const balanceResult =
            await getShellTopupBalance(
                SHELL_API_KEY
            );


        /* =================================================
           4. NORMALIZE BALANCE
        ================================================= */

        const shellBalance =
            extractBalance(
                balanceResult
            );


        console.log(
            "ShellTopup balance:",
            shellBalance
        );


        /* =================================================
           5. CREATE PHOENIX PRODUCT MAP
        ================================================= */

        const phoenixMap =
            new Map();


        for (
            const product
            of phoenixProducts
        ) {

            if (
                !product.shell_product_id
            ) {

                continue;

            }


            phoenixMap.set(

                String(
                    product.shell_product_id
                ),

                product

            );

        }


        /* =================================================
           6. EXTRACT PROVIDER PRODUCTS
        ================================================= */

        const providerProducts =
            extractProviderProducts(
                gamesResult
            );


        /* =================================================
           7. BUILD FINAL STOCK LIST
        ================================================= */

        const finalProducts = [];


        for (
            const providerProduct
            of providerProducts
        ) {

            const providerProductId =
                String(
                    providerProduct.id || ""
                );


            if (
                !providerProductId
            ) {

                continue;

            }


            /*
                Only products that are mapped
                inside Phoenix should be returned.
            */

            const phoenixProduct =
                phoenixMap.get(
                    providerProductId
                );


            if (
                !phoenixProduct
            ) {

                continue;

            }


            const shellCost =
                Number(
                    providerProduct.shells
                );


            if (
                !Number.isFinite(
                    shellCost
                ) ||
                shellCost <= 0
            ) {

                continue;

            }


            /*
                STOCK RULE

                Example:

                Balance = 472

                Weekly Lite = 18
                => IN STOCK

                Monthly = 430
                => IN STOCK

                Product = 520
                => OUT OF STOCK

                Balance = 0
                => ALL OUT OF STOCK
            */

            const inStock =
                shellBalance >=
                shellCost;


            finalProducts.push({

                product_id:
                    providerProductId,

                name:
                    providerProduct.name ||
                    phoenixProduct.product_name ||
                    "",

                shells:
                    shellCost,

                in_stock:
                    inStock

            });

        }


        /* =================================================
           8. REMOVE DUPLICATES
        ================================================= */

        const uniqueProducts =
            removeDuplicates(
                finalProducts
            );


        /* =================================================
           9. SORT BY PHOENIX PRODUCT ID
        ================================================= */

        uniqueProducts.sort(
            (a, b) => {

                const productA =
                    phoenixMap.get(
                        String(
                            a.product_id
                        )
                    );


                const productB =
                    phoenixMap.get(
                        String(
                            b.product_id
                        )
                    );


                return (
                    Number(
                        productA?.id || 0
                    ) -
                    Number(
                        productB?.id || 0
                    )
                );

            }
        );


        /* =================================================
           10. RETURN ONLY SAFE DATA
        =================================================

           IMPORTANT:

           Shell balance is NOT returned.

           API key is NOT returned.

           Only product stock status is returned.
        ================================================= */

        return json(
            200,
            {

                ok: true,

                products:
                    uniqueProducts

            }
        );


    } catch (error) {

        console.error(
            "shelltopup-products error:",
            error
        );


        /*
            If provider fails, don't show
            products as available.

            Returning an error makes frontend
            safely clear its stock map.
        */

        return json(
            500,
            {

                ok: false,

                error:
                    "Unable to load ShellTopup stock."

            }
        );

    }

};


/* =========================================================
   GET PHOENIX PRODUCTS
========================================================= */

async function getPhoenixProducts(
    serviceRoleKey
) {

    const url =

        `${SUPABASE_URL}/rest/v1/products` +

        `?select=` +
        `id,product_name,category,active,` +
        `shell_game_id,shell_product_id,garena_shell_cost` +

        `&active=eq.true` +

        `&shell_game_id=not.is.null` +

        `&shell_product_id=not.is.null`;


    const response =
        await fetch(
            url,
            {

                method:
                    "GET",

                headers: {

                    "apikey":
                        serviceRoleKey,

                    "Authorization":
                        `Bearer ${serviceRoleKey}`,

                    "Content-Type":
                        "application/json"

                }

            }
        );


    if (
        !response.ok
    ) {

        const errorText =
            await response.text();


        console.error(
            "Phoenix products error:",
            response.status,
            errorText
        );


        throw new Error(
            "Failed to load Phoenix products."
        );

    }


    const data =
        await response.json();


    if (
        !Array.isArray(data)
    ) {

        throw new Error(
            "Invalid Phoenix products response."
        );

    }


    return data;

}


/* =========================================================
   GET SHELLTOPUP GAMES
========================================================= */

async function getShellTopupGames(
    apiKey
) {

    const response =
        await fetch(
            `${SHELLTOPUP_URL}/games`,
            {

                method:
                    "GET",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json",

                    "Authorization":
                        `Bearer ${apiKey}`

                }

            }
        );


    const text =
        await response.text();


    let data;


    try {

        data =
            text
                ? JSON.parse(text)
                : {};

    } catch {

        data = {

            raw:
                text

        };

    }


    if (
        !response.ok
    ) {

        console.error(
            "ShellTopup games failed:",
            response.status,
            data
        );


        throw new Error(
            "ShellTopup games request failed."
        );

    }


    return data;

}


/* =========================================================
   GET SHELLTOPUP BALANCE
========================================================= */

async function getShellTopupBalance(
    apiKey
) {

    const response =
        await fetch(
            `${SHELLTOPUP_URL}/balance`,
            {

                method:
                    "GET",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json",

                    "Authorization":
                        `Bearer ${apiKey}`

                }

            }
        );


    const text =
        await response.text();


    let data;


    try {

        data =
            text
                ? JSON.parse(text)
                : {};

    } catch {

        data = {

            raw:
                text

        };

    }


    if (
        !response.ok
    ) {

        console.error(
            "ShellTopup balance failed:",
            response.status,
            data
        );


        throw new Error(
            "ShellTopup balance request failed."
        );

    }


    return data;

}


/* =========================================================
   EXTRACT PROVIDER PRODUCTS
========================================================= */

function extractProviderProducts(
    response
) {

    if (
        !response
    ) {

        return [];

    }


    let games = [];


    /*
        Expected:

        {
            ok: true,
            games: [
                {
                    id: "...",
                    slug: "...",
                    name: "...",
                    regions: [...],
                    products: [...]
                }
            ]
        }
    */

    if (
        Array.isArray(
            response.games
        )
    ) {

        games =
            response.games;

    }

    else if (
        Array.isArray(
            response.data
        )
    ) {

        games =
            response.data;

    }


    const products = [];


    for (
        const game
        of games
    ) {

        if (
            !game
        ) {

            continue;

        }


        /*
            Only use products that are
            actually returned by provider.

            Phoenix mapping later decides
            which products are displayed.
        */

        const gameProducts =
            Array.isArray(
                game.products
            )
                ? game.products
                : [];


        for (
            const product
            of gameProducts
        ) {

            if (
                !product
            ) {

                continue;

            }


            products.push({

                id:
                    product.id,

                name:
                    product.name,

                shells:
                    product.shells,

                game_id:
                    game.id

            });

        }

    }


    return products;

}


/* =========================================================
   EXTRACT BALANCE
========================================================= */

function extractBalance(
    response
) {

    if (
        response ===
        null
    ) {

        return 0;

    }


    if (
        response ===
        undefined
    ) {

        return 0;

    }


    /*
        Direct number
    */

    if (
        typeof response ===
        "number"
    ) {

        return normalizeNumber(
            response
        );

    }


    /*
        Possible formats:

        {
            balance: 472
        }

        {
            shells: 472
        }

        {
            shell_balance: 472
        }

        {
            data: {
                balance: 472
            }
        }

        {
            data: {
                shells: 472
            }
        }

        {
            result: {
                balance: 472
            }
        }
    */

    const values = [

        response.balance,

        response.shell_balance,

        response.shells,

        response.data?.balance,

        response.data?.shell_balance,

        response.data?.shells,

        response.result?.balance,

        response.result?.shell_balance,

        response.result?.shells

    ];


    for (
        const value
        of values
    ) {

        const number =
            Number(
                value
            );


        if (
            Number.isFinite(
                number
            )
        ) {

            return Math.max(
                0,
                number
            );

        }

    }


    return 0;

}


/* =========================================================
   NORMALIZE NUMBER
========================================================= */

function normalizeNumber(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return 0;

    }


    return Math.max(
        0,
        number
    );

}


/* =========================================================
   REMOVE DUPLICATES
========================================================= */

function removeDuplicates(
    products
) {

    const map =
        new Map();


    for (
        const product
        of products
    ) {

        const id =
            String(
                product.product_id
            );


        if (
            !map.has(id)
        ) {

            map.set(
                id,
                product
            );

        }

    }


    return Array.from(
        map.values()
    );

}