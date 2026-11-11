#!/bin/bash
cd /home/z/my-project
P=public/products
gen() {
  local out="$1"; local prompt="$2"
  if [ -s "$P/$out" ]; then echo "SKIP $out"; return; fi
  z-ai image -p "$prompt" -o "$P/$out" -s 1024x1024 > /dev/null 2>&1 && echo "OK $out" || echo "FAIL $out"
}

gen "laptop-gaming-1.png" "Professional e-commerce product photography: black gaming laptop open at 100 degrees, RGB backlit keyboard glowing electric blue, three-quarter front view, on dark charcoal studio background with subtle blue rim lighting, screen showing abstract dark blue tech wallpaper, centered, no text no logos, clean minimal premium catalog shot"
gen "laptop-gaming-2.png" "Professional e-commerce product photography: sleek gaming laptop viewed from side-back angle showing cooling vents and glowing fans, dark studio environment, electric blue accent lighting, dark charcoal background, no text no logos, premium catalog shot"
gen "laptop-gaming-3.png" "Professional e-commerce product photography: slim modern gaming laptop closed lid with subtle illuminated logo area, three-quarter angle, dark moody studio background with blue gradient rim light, metallic gray finish, no text no logos, premium catalog shot"
gen "laptop-silver.png" "Professional e-commerce product photography: elegant slim silver ultrabook laptop open, minimal clean design, three-quarter front view, dark studio background with soft cool lighting, screen showing subtle abstract gradient, no text no logos, premium catalog shot"
gen "laptop-business.png" "Professional e-commerce product photography: matte black business laptop open at practical angle, understated professional design, dark studio background with soft neutral rim light, no text no logos, premium catalog shot"
gen "laptop-used.png" "Professional e-commerce product photography: classic black laptop open, slightly older business model in excellent clean condition, dark studio background soft lighting, three-quarter view, no text no logos, honest clean catalog shot"
gen "laptop-tough.png" "Professional e-commerce product photography: rugged angular gaming laptop with aggressive vent design and RGB keyboard, three-quarter front view, dark charcoal studio, electric blue rim lighting, no text no logos, premium catalog shot"
gen "gpu-1.png" "Professional e-commerce product photography: high-end triple-fan graphics card standing at dynamic angle, black shroud with subtle blue accent lighting, dark charcoal studio background, dramatic rim light, no text no logos, premium catalog shot"
gen "gpu-2.png" "Professional e-commerce product photography: dual-fan graphics card angled view showing backplate and heatsink, dark studio background with electric blue edge glow, no text no logos, premium catalog shot"
gen "motherboard.png" "Professional e-commerce product photography: ATX gaming motherboard at three-quarter angle showing CPU socket and RAM slots with subtle dark heat shields, dark charcoal studio background, cool blue accent lighting, no text no logos, premium catalog shot"
gen "cooler-aio.png" "Professional e-commerce product photography: 240mm AIO liquid CPU cooler with circular pump head glowing soft blue ring and two dark fans, dark studio background, no text no logos, premium catalog shot"
echo DONE1
