# Voice-over for the 60-second film (edge-tts). Writes voice/<id>.mp3 plus voice/<id>.json with word timings
# (seconds from the clip's start), which render.mjs turns into captions.
# Usage: python3 voice.py
import asyncio
import json
import subprocess
import edge_tts

VOICE = "en-US-AndrewNeural"
RATE = "+4%"

LINES = json.load(open("lines.json"))


async def main():
    for line in LINES:
        words = []
        with open(f"voice/{line['id']}.mp3", "wb") as audio:
            async for chunk in edge_tts.Communicate(line["text"], VOICE, rate=RATE, boundary="WordBoundary").stream():
                if chunk["type"] == "audio":
                    audio.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    words.append({"w": chunk["text"], "t": chunk["offset"] / 1e7, "d": chunk["duration"] / 1e7})
        json.dump(words, open(f"voice/{line['id']}.json", "w"))
        secs = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"voice/{line['id']}.mp3"]))
        print(f"{line['id']}: {secs:.2f}s, {len(words)} words (window {line['at']}–{line['end']}, room {line['end'] - line['at']:.1f}s)")


asyncio.run(main())
