#!/bin/bash
# Batch product image search for HYPER TECH mock catalog
OUT=/home/z/my-project/assets-search
mkdir -p $OUT

run() {
  local name="$1"; local query="$2"; local count="${3:-6}"
  z-ai image-search -q "$query" --count $count --gl us --no-rank -o "$OUT/$name.json" > "$OUT/$name.log" 2>&1
}

run "laptops"       "gaming laptop product photo on dark background" 8 &
run "laptop2"       "slim modern laptop computer dark studio product shot" 6 &
run "desktops"      "desktop computer PC tower with RGB lighting dark background" 6 &
run "keyboards"     "mechanical gaming keyboard RGB backlit product photo dark" 6 &
run "mice"          "gaming mouse product photo dark background" 5 &
run "headphones"    "gaming headphones product photo dark moody background" 5 &
run "monitors"      "curved gaming monitor product photo dark" 5 &
run "gpu"           "graphics card GPU product photo dark background" 5 &
run "ssd"           "NVMe SSD solid state drive product photo" 4 &
run "ram"           "RGB RAM memory modules product photo dark" 4 &
run "builds"        "custom gaming PC build RGB tower glass panel dark room" 8 &
run "controller"    "game controller gamepad product photo dark background" 4 &
run "maintenance"   "computer repair technician working on laptop motherboard dark workshop" 5 &
run "workspace"     "dark moody gaming setup desk with monitors neon lighting" 6 &
run "cpu"           "CPU processor chip product photo close up dark" 4 &
run "motherboard"   "gaming motherboard product photo dark background" 4 &
run "cooler"        "CPU liquid cooler AIO product photo RGB dark" 4 &
run "casing"        "gaming PC case tower product photo dark" 4 &
run "router"        "wifi router product photo dark background" 3 &
run "speaker"       "computer speakers product photo dark" 3 &
wait
echo "ALL SEARCHES DONE"
ls $OUT/*.json | wc -l
