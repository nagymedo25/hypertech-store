#!/usr/bin/env python3
"""Sequential image search with proper stdout→JSON capture."""
import subprocess, json, re, os, sys, time

OUT = "/home/z/my-project/assets-search"
os.makedirs(OUT, exist_ok=True)

QUERIES = [
    ("laptops", "gaming laptop product photo on dark background", 8),
    ("laptop2", "slim modern laptop computer dark studio product shot", 6),
    ("desktops", "desktop computer PC tower with RGB lighting dark background", 6),
    ("keyboards", "mechanical gaming keyboard RGB backlit product photo dark", 6),
    ("mice", "gaming mouse product photo dark background", 5),
    ("headphones", "gaming headphones product photo dark moody background", 5),
    ("monitors", "curved gaming monitor product photo dark", 5),
    ("gpu", "graphics card GPU product photo dark background", 5),
    ("ssd", "NVMe SSD solid state drive product photo", 4),
    ("ram", "RGB RAM memory modules product photo dark", 4),
    ("builds", "custom gaming PC build RGB tower glass panel dark room", 8),
    ("controller", "game controller gamepad product photo dark background", 4),
    ("maintenance", "computer repair technician working on laptop motherboard dark workshop", 5),
    ("workspace", "dark moody gaming setup desk with monitors neon lighting", 6),
    ("cpu", "CPU processor chip product photo close up dark", 4),
    ("motherboard", "gaming motherboard product photo dark background", 4),
    ("cooler", "CPU liquid cooler AIO product photo RGB dark", 4),
    ("casing", "gaming PC case tower product photo dark", 4),
]

def search(name, query, count):
    path = os.path.join(OUT, f"{name}.json")
    if os.path.exists(path) and os.path.getsize(path) > 100:
        print(f"SKIP {name}", flush=True)
        return True
    for attempt in range(3):
        try:
            print(f">>> {name} (attempt {attempt+1})", flush=True)
            r = subprocess.run(
                ["z-ai", "image-search", "-q", query, "--count", str(count), "--gl", "us", "--no-rank"],
                capture_output=True, text=True, timeout=240,
            )
            out = r.stdout
            m = re.search(r"\{.*\}", out, re.DOTALL)
            if not m:
                print(f"  no json in output: {out[:200]}", flush=True)
                time.sleep(8)
                continue
            data = json.loads(m.group(0))
            if data.get("success") and data.get("results"):
                with open(path, "w") as f:
                    json.dump(data, f)
                print(f"OK {name}: {len(data['results'])} images", flush=True)
                return True
            print(f"  api said not success: {str(data)[:150]}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"  timeout on {name}", flush=True)
        time.sleep(10)
    print(f"FAIL {name}", flush=True)
    return False

ok = 0
for name, q, c in QUERIES:
    if search(name, q, c):
        ok += 1
    time.sleep(5)

print(f"DONE: {ok}/{len(QUERIES)} searches succeeded", flush=True)
