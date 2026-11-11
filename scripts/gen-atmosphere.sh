#!/bin/bash
# Atmospheric brand images — consistent dark cinematic art direction
cd /home/z/my-project
A=public/atmosphere

gen() {
  local out="$1"; local prompt="$2"; local size="${3:-1152x864}"
  if [ -s "$A/$out" ]; then echo "SKIP $out"; return; fi
  z-ai image -p "$prompt" -o "$A/$out" -s "$size" > /dev/null 2>&1 && echo "OK $out" || echo "FAIL $out"
}

gen "cat-laptops.jpg" "Cinematic dark scene of premium gaming laptops lineup on reflective black surface, deep charcoal background, electric blue neon accent lighting from the side, dramatic rim light on laptop edges, screens glowing softly, moody commercial photography, high quality detailed" 1152x864
gen "cat-computers.jpg" "Dark cinematic scene of desktop computer tower with visible RGB components and graphics card, motherboard with glowing circuits, deep black charcoal background, amber and blue accent lighting, technical premium product photography, moody atmosphere, high quality" 1152x864
gen "cat-accessories.jpg" "Dark moody flat-lay of gaming accessories: mechanical keyboard, gaming mouse, headset and controller arranged artistically on black textured surface, soft pink and blue accent lighting from sides, premium commercial product photography, cinematic atmosphere, high quality" 1152x864
gen "cat-builds.jpg" "Cinematic dark room with custom gaming PC builds lineup, towers with glass panels revealing green and blue RGB lighting, light haze, reflective dark floor, premium esports atmosphere, dramatic lighting, high quality detailed" 1152x864
gen "maintenance-scene.jpg" "Cinematic close-up of technician hands in gloves repairing laptop motherboard with precision tools, dark workshop, warm desk lamp and blue screen glow, electronic components in soft focus background, shallow depth of field, premium editorial photography, high quality" 1344x768
gen "about-store.jpg" "Interior of modern boutique electronics store at night, dark walls with electric blue LED strip lighting, laptops and gaming PCs on illuminated shelves, premium tech retail atmosphere, cinematic moody lighting, high quality detailed photography" 1344x768
gen "workspace-scene.jpg" "Cinematic dark gaming setup: ultrawide monitor with abstract blue waveform on screen, mechanical keyboard with subtle backlight, dark desk in dim room with soft blue ambient lighting, coffee cup steam, premium lifestyle photography, moody atmosphere, high quality" 1344x768
gen "promo-banner.jpg" "Dramatic dark promotional scene: graphics card and gaming laptop on pedestal with spotlight from above, electric blue energy lines and particles, deep black background, premium tech advertisement style, cinematic, high quality" 1440x720
echo "ALL ATMOSPHERE DONE"
