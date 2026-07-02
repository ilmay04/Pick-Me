/* ============================================================
   engine.js — Pick Me recommendation engine
   Maps user metrics (gender, body type, skin tone, occasion,
   budget) to curated style combinations.
   Programmatically generates 50+ distinct combinations and,
   for a given input matrix, deterministically selects:
     outfit, accessories, footwear, makeup, hairstyle, palette
   Also computes: fashion personality + styling warnings.
   ============================================================ */

const ENGINE = (function () {
  /* ---------- Option vocabularies ---------- */
  const OPTIONS = {
    gender: ["Male", "Female", "Non-binary"],
    bodyType: ["Pear", "Apple", "Rectangle", "Hourglass", "Athletic"],
    skinTone: ["Fair", "Medium", "Wheatish", "Dark"],
    occasion: ["Casual", "College", "Office", "Party", "Wedding", "Date Night", "Festival", "Travel"],
    budget: ["Under ₹1000", "₹1000–₹3000", "₹3000+"],
  };

  const PERSONALITIES = ["Minimalist", "Elegant", "Royal", "Streetwear", "Classic", "Boho"];

  /* ---------- Color palettes (cohesive sets) ---------- */
  const PALETTES = {
    Blush:       ["#FFF6F4", "#D3968C", "#B97A70", "#7A4A43"],
    Emerald:     ["#0B3D2E", "#105666", "#2A97AD", "#CDE7E1"],
    Midnight:    ["#0C1F24", "#105666", "#3A6E7A", "#D3968C"],
    Sunset:      ["#FF7B54", "#FFB26B", "#FFD56F", "#939B62"],
    Royal:       ["#3A0CA3", "#7209B7", "#C77DFF", "#F1C0E8"],
    Earthy:      ["#5C4033", "#A47551", "#D3968C", "#E9D8C4"],
    Monochrome:  ["#111111", "#4D4D4D", "#9E9E9E", "#EDEDED"],
    Ocean:       ["#023047", "#219EBC", "#8ECAE6", "#FFB703"],
    Festive:     ["#B5179E", "#F72585", "#FF8FAB", "#FFD56F"],
    Ivory:       ["#FFFFFF", "#FFF6F4", "#E9D8C4", "#D3968C"],
  };

  /* ---------- Building blocks per occasion + gender ---------- */
  // Each occasion holds gendered outfit/footwear/hairstyle pools and
  // shared accessory/makeup/palette pools. The selector deterministically
  // indexes into these using the full input matrix, so the same inputs
  // always yield the same look, and varied inputs spread across combos.
  const DATA = {
    Casual: {
      palettes: ["Blush", "Earthy", "Monochrome"],
      personality: ["Minimalist", "Streetwear"],
      outfits: {
        Male: ["Relaxed tee + tapered chinos", "Oversized shirt + straight jeans", "Henley + cargo joggers"],
        Female: ["Ribbed crop + high-waist jeans", "Flowy midi dress", "Linen shirt + wide-leg pants"],
        "Non-binary": ["Boxy tee + relaxed trousers", "Utility jumpsuit", "Knit polo + denim"],
      },
      footwear: { Male: ["White sneakers", "Canvas slip-ons"], Female: ["Chunky sneakers", "Strappy flats"], "Non-binary": ["Low-top sneakers", "Platform slides"] },
      accessories: ["Minimal watch", "Canvas tote", "Baseball cap", "Layered bracelets"],
      makeup: ["Tinted moisturizer + lip balm", "Fresh dewy base", "No-makeup makeup look"],
      hair: { Male: ["Textured crop", "Messy fringe"], Female: ["Low messy bun", "Beach waves"], "Non-binary": ["Tousled shag", "Slick short cut"] },
    },
    College: {
      palettes: ["Ocean", "Blush", "Monochrome"],
      personality: ["Streetwear", "Minimalist", "Classic"],
      outfits: {
        Male: ["Graphic tee + joggers", "Flannel + slim jeans", "Hoodie + cargos"],
        Female: ["Crop hoodie + mom jeans", "Pinafore + tee", "Oversized shirt + shorts"],
        "Non-binary": ["Zip hoodie + wide jeans", "Corduroy overshirt + tee", "Sweatvest + trousers"],
      },
      footwear: { Male: ["High-top sneakers", "Skate shoes"], Female: ["Retro sneakers", "Ankle boots"], "Non-binary": ["Chunky trainers", "Canvas high-tops"] },
      accessories: ["Backpack", "Beanie", "Wired earphones charm", "Scrunchie set"],
      makeup: ["Brow gel + lip tint", "Cream blush glow", "Quick mascara + gloss"],
      hair: { Male: ["Curtain fringe", "Buzz fade"], Female: ["Half-up claw clip", "High ponytail"], "Non-binary": ["Mullet fade", "Space buns"] },
    },
    Office: {
      palettes: ["Emerald", "Monochrome", "Ivory"],
      personality: ["Classic", "Elegant", "Minimalist"],
      outfits: {
        Male: ["Tailored shirt + trousers", "Knit polo + chinos", "Blazer + dress pants"],
        Female: ["Blazer + pencil skirt", "Shirt dress + belt", "Silk blouse + trousers"],
        "Non-binary": ["Structured blazer + wide trousers", "Turtleneck + slacks", "Vest + tailored pants"],
      },
      footwear: { Male: ["Leather derbies", "Loafers"], Female: ["Block heels", "Pointed flats"], "Non-binary": ["Oxford shoes", "Minimal loafers"] },
      accessories: ["Structured tote", "Slim leather belt", "Classic wristwatch", "Stud earrings"],
      makeup: ["Nude lip + soft matte base", "Neutral eye + groomed brows", "Rosy blush + tinted lip"],
      hair: { Male: ["Side part comb-over", "Neat crop"], Female: ["Sleek low bun", "Straight blowout"], "Non-binary": ["Polished slick-back", "Neat bob"] },
    },
    Party: {
      palettes: ["Royal", "Midnight", "Festive"],
      personality: ["Streetwear", "Royal", "Elegant"],
      outfits: {
        Male: ["Satin shirt + black jeans", "Textured blazer + tee", "Metallic bomber + trousers"],
        Female: ["Sequin mini dress", "Bodycon + blazer", "Satin cowl-neck + skirt"],
        "Non-binary": ["Mesh top + tailored trousers", "Sequin overshirt + tee", "Velvet co-ord set"],
      },
      footwear: { Male: ["Chelsea boots", "Sleek loafers"], Female: ["Stiletto heels", "Embellished heels"], "Non-binary": ["Platform boots", "Metallic sneakers"] },
      accessories: ["Statement chain", "Clutch bag", "Bold rings", "Hoop earrings"],
      makeup: ["Smokey eye + nude lip", "Glitter lid + glossy lip", "Bold red lip + glow"],
      hair: { Male: ["Slicked-back", "Tousled quiff"], Female: ["Hollywood waves", "Sleek high pony"], "Non-binary": ["Wet-look slick", "Voluminous curls"] },
    },
    Wedding: {
      palettes: ["Royal", "Ivory", "Earthy"],
      personality: ["Royal", "Elegant", "Classic"],
      outfits: {
        Male: ["Bandhgala + trousers", "Silk kurta + churidar", "Embroidered sherwani"],
        Female: ["Embellished lehenga", "Silk saree + blouse", "Anarkali gown"],
        "Non-binary": ["Draped indo-western set", "Embroidered kurta + dhoti pants", "Ethnic cape + trousers"],
      },
      footwear: { Male: ["Mojari juttis", "Formal loafers"], Female: ["Embellished juttis", "Block-heel sandals"], "Non-binary": ["Ethnic juttis", "Velvet loafers"] },
      accessories: ["Statement necklace", "Brooch", "Potli bag", "Kundan earrings"],
      makeup: ["Dewy glam + bold eye", "Traditional glam + red lip", "Soft glam + shimmer"],
      hair: { Male: ["Groomed side-swept", "Classic pompadour"], Female: ["Braided updo + accessory", "Voluminous curls"], "Non-binary": ["Adorned low bun", "Sleek half-up"] },
    },
    "Date Night": {
      palettes: ["Sunset", "Blush", "Midnight"],
      personality: ["Elegant", "Classic", "Boho"],
      outfits: {
        Male: ["Fitted shirt + dark jeans", "Roll-neck + blazer", "Linen shirt + trousers"],
        Female: ["Slip dress + heels", "Wrap dress", "Corset top + midi skirt"],
        "Non-binary": ["Silk shirt + trousers", "Monochrome co-ord", "Knit top + tailored pants"],
      },
      footwear: { Male: ["Suede loafers", "Chelsea boots"], Female: ["Strappy heels", "Kitten heels"], "Non-binary": ["Sleek boots", "Minimal heels"] },
      accessories: ["Delicate necklace", "Wrist cuff", "Mini bag", "Drop earrings"],
      makeup: ["Soft glam + rosy lip", "Warm bronze eye + gloss", "Flushed cheeks + tinted lip"],
      hair: { Male: ["Textured side part", "Loose waves"], Female: ["Soft curls", "Low twisted bun"], "Non-binary": ["Effortless waves", "Sleek tuck"] },
    },
    Festival: {
      palettes: ["Festive", "Sunset", "Earthy"],
      personality: ["Boho", "Streetwear", "Royal"],
      outfits: {
        Male: ["Printed shirt + shorts", "Kurta + jeans", "Tie-dye tee + joggers"],
        Female: ["Boho maxi dress", "Crop + printed skirt", "Kaftan + palazzo"],
        "Non-binary": ["Printed co-ord set", "Fringe jacket + tee", "Kaftan + trousers"],
      },
      footwear: { Male: ["Espadrilles", "Sport sandals"], Female: ["Gladiator sandals", "Embellished flats"], "Non-binary": ["Boho sandals", "Canvas shoes"] },
      accessories: ["Layered beads", "Fringe bag", "Flower crown", "Anklets"],
      makeup: ["Glitter accents + gloss", "Bronzed glow + coral lip", "Festival gems + dewy skin"],
      hair: { Male: ["Bandana + waves", "Man bun"], Female: ["Boho braids", "Beach waves + accessory"], "Non-binary": ["Braided crown", "Textured half-up"] },
    },
    Travel: {
      palettes: ["Ocean", "Earthy", "Monochrome"],
      personality: ["Minimalist", "Boho", "Classic"],
      outfits: {
        Male: ["Polo + comfort shorts", "Overshirt + joggers", "Tee + convertible pants"],
        Female: ["Jumpsuit + sneakers", "Maxi dress + denim jacket", "Tee + linen trousers"],
        "Non-binary": ["Utility set + tee", "Knit + relaxed pants", "Shacket + joggers"],
      },
      footwear: { Male: ["Comfort sneakers", "Slip-on trainers"], Female: ["Cushioned sneakers", "Comfort sandals"], "Non-binary": ["Trail sneakers", "Slip-ons"] },
      accessories: ["Crossbody bag", "Sunglasses", "Cap", "Travel scarf"],
      makeup: ["SPF tint + lip balm", "Minimal dewy base", "Cream blush + gloss"],
      hair: { Male: ["Low-maintenance crop", "Cap-friendly cut"], Female: ["Braided low pony", "Top knot"], "Non-binary": ["Easy tousle", "Tucked bob"] },
    },
  };

  /* ---------- Deterministic hashing helpers ---------- */
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }
  function pick(arr, seed) { return arr[seed % arr.length]; }

  /* ---------- Fashion personality composition ---------- */
  function personalityScores(prefs) {
    const base = Object.fromEntries(PERSONALITIES.map((p) => [p, 5]));
    const occ = DATA[prefs.occasion];
    if (occ) occ.personality.forEach((p, i) => (base[p] += 30 - i * 8));

    const byBudget = {
      "Under ₹1000": { Minimalist: 12, Streetwear: 10 },
      "₹1000–₹3000": { Classic: 10, Boho: 8 },
      "₹3000+": { Royal: 16, Elegant: 12 },
    }[prefs.budget] || {};
    Object.entries(byBudget).forEach(([k, v]) => (base[k] += v));

    const byBody = {
      Hourglass: { Elegant: 8 }, Athletic: { Streetwear: 8 },
      Rectangle: { Minimalist: 8 }, Pear: { Boho: 8 }, Apple: { Classic: 8 },
    }[prefs.bodyType] || {};
    Object.entries(byBody).forEach(([k, v]) => (base[k] += v));

    // gender nudge for variety
    const seed = hashStr(JSON.stringify(prefs));
    base[PERSONALITIES[seed % PERSONALITIES.length]] += 6;

    const total = Object.values(base).reduce((a, b) => a + b, 0);
    const pct = Object.fromEntries(
      Object.entries(base).map(([k, v]) => [k, Math.round((v / total) * 100)])
    );
    const top = Object.entries(pct).sort((a, b) => b[1] - a[1])[0][0];
    return { pct, top };
  }

  /* ---------- Style score ---------- */
  function styleScore(prefs) {
    const seed = hashStr("score" + JSON.stringify(prefs));
    return 72 + (seed % 27); // 72–98
  }

  /* ---------- Warning engine ---------- */
  function warnings(prefs, look) {
    const out = [];
    const warm = ["Wheatish", "Dark"].includes(prefs.skinTone);
    const acc = (look.accessories || "").toLowerCase();

    if (warm && /silver|steel/.test(acc)) {
      out.push("Avoid silver jewelry with warm skin tones — gold tones flatter you more.");
    }
    if (prefs.bodyType === "Apple" && /oversized|boxy/.test((look.outfit || "").toLowerCase())) {
      out.push("Avoid oversized jackets for an Apple body type — structured layers define the waist better.");
    }
    if (prefs.skinTone === "Medium" && prefs.occasion === "Office" && /bright|red/.test((look.makeup || "").toLowerCase())) {
      out.push("Nude lipstick suits a Medium skin tone better than bright pink for office settings.");
    }
    if (prefs.bodyType === "Pear" && /skinny|tapered/.test((look.outfit || "").toLowerCase())) {
      out.push("Balance a Pear shape with wide-leg or straight-cut bottoms rather than tapered ones.");
    }
    if (prefs.occasion === "Wedding" && /sneakers|slip-on/.test((look.footwear || "").toLowerCase())) {
      out.push("Sneakers can undercut wedding formalwear — opt for embellished juttis or heels.");
    }
    if (prefs.budget === "Under ₹1000" && prefs.occasion === "Wedding") {
      out.push("Wedding looks on a tight budget: rent statement pieces and invest in accessories instead.");
    }
    if (prefs.skinTone === "Fair" && /bold red|bright/.test((look.makeup || "").toLowerCase()) && prefs.occasion === "Casual") {
      out.push("Bold red lips can overpower a Fair tone in casual daylight — try a soft rose instead.");
    }
    return out;
  }

  /* ---------- Core selector ---------- */
  function recommend(prefs) {
    const occ = prefs.occasion && DATA[prefs.occasion] ? prefs.occasion : "Casual";
    const d = DATA[occ];
    const gender = OPTIONS.gender.includes(prefs.gender) ? prefs.gender : "Non-binary";

    // seed varies with every input dimension for spread across combos
    const seed = hashStr([prefs.gender, prefs.bodyType, prefs.skinTone, occ, prefs.budget, prefs._salt || ""].join("|"));

    const paletteName = pick(d.palettes, seed >> 2);
    const look = {
      id: `${occ}-${gender}-${prefs.bodyType || "x"}-${prefs.skinTone || "x"}-${prefs.budget || "x"}-${seed % 1000}`
        .replace(/[^\w-]/g, ""),
      occasion: occ,
      gender,
      outfit: pick(d.outfits[gender], seed),
      footwear: pick(d.footwear[gender], seed >> 1),
      accessories: pick(d.accessories, seed >> 3),
      makeup: pick(d.makeup, seed >> 4),
      hairstyle: pick(d.hair[gender], seed >> 5),
      paletteName,
      palette: PALETTES[paletteName],
      createdAt: Date.now(),
    };

    const pers = personalityScores(prefs);
    look.personality = pers.top;
    look.personalityScores = pers.pct;
    look.styleScore = styleScore({ ...prefs, occasion: occ });
    look.warnings = warnings(prefs, look);
    return look;
  }

  /* ---------- Generate the full catalog (proves 50+ combos) ---------- */
  function catalog() {
    const all = [];
    OPTIONS.gender.forEach((g) =>
      OPTIONS.bodyType.forEach((b) =>
        OPTIONS.skinTone.forEach((s) =>
          OPTIONS.occasion.forEach((o) =>
            OPTIONS.budget.forEach((bud) => {
              all.push(recommend({ gender: g, bodyType: b, skinTone: s, occasion: o, budget: bud }));
            })
          )
        )
      )
    );
    return all;
  }

  return { OPTIONS, PERSONALITIES, PALETTES, recommend, catalog, personalityScores, warnings };
})();

if (typeof module !== "undefined" && module.exports) module.exports = ENGINE;
