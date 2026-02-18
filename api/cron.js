const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {
  try {

    // 1. World gold price USD
    const goldRes = await fetch("https://api.gold-api.com/price/XAU");
    const gold = await goldRes.json();
    const priceUSD = Number(gold.price);

    if (!priceUSD) throw new Error("Gold API failed");

    // 2. Currency exchange
    const fxRes = await fetch("https://open.er-api.com/v6/latest/USD");
    const fx = await fxRes.json();

    const priceTHB = priceUSD * fx.rates.THB;
    const priceMMK = priceUSD * (fx.rates.MMK || 2100);

    // 3. Save database
    const { error } = await supabase.from("gold_prices").insert({
      price_usd: priceUSD,
      price_thb: priceTHB,
      price_mmk: priceMMK
    });

    if (error) throw error;

    res.status(200).json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
