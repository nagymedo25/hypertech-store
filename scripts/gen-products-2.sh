#!/bin/bash
cd /home/z/my-project
P=public/products
gen() {
  local out="$1"; local prompt="$2"
  if [ -s "$P/$out" ]; then echo "SKIP $out"; return; fi
  z-ai image -p "$prompt" -o "$P/$out" -s 1024x1024 > /dev/null 2>&1 && echo "OK $out" || echo "FAIL $out"
}

gen "keyboard.png" "Professional e-commerce product photography: mechanical gaming keyboard at slight three-quarter angle, dark gray frame with per-key RGB backlight glowing electric blue, floating keycaps design, dark charcoal studio background, no text no logos, premium catalog shot"
gen "headset.png" "Professional e-commerce product photography: gaming headset with over-ear cups and boom microphone, matte black with subtle blue ring lighting on earcups, three-quarter view, dark studio background, no text no logos, premium catalog shot"
gen "monitor.png" "Professional e-commerce product photography: curved gaming monitor front view slightly angled, thin bezels, screen showing abstract dark blue geometric wallpaper with electric blue waves, on minimal stand, dark studio background, no text no logos, premium catalog shot"
gen "controller.png" "Professional e-commerce product photography: pro gaming controller gamepad at dynamic three-quarter angle, matte black with subtle blue accent details and glowing buttons, dark charcoal studio background, no text no logos, premium catalog shot"
gen "usb-hub.png" "Professional e-commerce product photography: compact USB-C hub with multiple ports, sleek dark aluminum body, angled view with subtle cable, dark studio background soft rim light, no text no logos, premium catalog shot"
gen "cooler-pad.png" "Professional e-commerce product photography: laptop cooling pad with mesh surface and visible blue fan glow, elevated at ergonomic angle, dark studio background, no text no logos, premium catalog shot"
gen "router.png" "Professional e-commerce product photography: modern WiFi 6 router with four antennas and subtle blue status lights, three-quarter view, dark charcoal studio background, no text no logos, premium catalog shot"
gen "build-legend.png" "Professional product photography: high-end gaming PC tower with tempered glass side panel revealing blue RGB lighting components, liquid cooling, clean cable management, dark room with subtle haze, three-quarter view, no text no logos, premium showcase shot"
gen "build-dragon.png" "Professional product photography: mid-tower gaming PC with glass panel showing green-teal RGB lighting, two visible fans glowing, dark moody studio background with light haze, three-quarter view, no text no logos, premium showcase shot"
gen "build-studio.png" "Professional product photography: white workstation PC tower with clean minimal design, glass side panel showing neatly organized components with soft warm-white lighting, dark studio background, three-quarter view, no text no logos, premium showcase shot"
gen "build-starter.png" "Professional product photography: compact budget gaming PC tower with mesh front panel, subtle single blue fan glow visible, dark studio background, three-quarter view, no text no logos, premium catalog shot"
echo DONE2
