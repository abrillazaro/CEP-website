#!/usr/bin/env python3
"""
Generate MP3 audio files for the Fashion Dress-Up game.

Run this on your LOCAL machine (not the server — it needs internet access).

RECOMMENDED: edge-tts (Microsoft Neural voices — sounds very natural)
    pip install edge-tts
    python generate_audio.py

FALLBACK: gtts (Google Translate TTS)
    pip install gtts
    python generate_audio.py

After running, copy the generated audio/ folder into:
    kids/games/dress-up/audio/
and push to GitHub.
"""

import asyncio
import os
import sys
import time

os.makedirs('audio', exist_ok=True)

# All phrases: {filename_stem: spoken_text}
PHRASES = {
    # ── Items: Hair ──────────────────────────────────────
    'ponytail':       'ponytail',
    'braids':         'braids',
    'curly_hair':     'curly hair',
    'straight_hair':  'straight hair',
    'hair_bun':       'hair bun',
    'pigtails':       'pigtails',
    # ── Items: Face ──────────────────────────────────────
    'natural_look':   'natural look',
    'rosy_cheeks':    'rosy cheeks',
    'freckles':       'freckles',
    'lip_gloss':      'lip gloss',
    'bright_eyes':    'bright eyes',
    # ── Items: Tops ──────────────────────────────────────
    't-shirt':        'T-shirt',
    'tank_top':       'tank top',
    'hoodie':         'hoodie',
    'sweater':        'sweater',
    'crop_top':       'crop top',
    # ── Items: Bottoms ───────────────────────────────────
    'jeans':          'jeans',
    'skirt':          'skirt',
    'shorts':         'shorts',
    'leggings':       'leggings',
    # ── Items: Dresses ───────────────────────────────────
    'short_dress':    'short dress',
    'long_dress':     'long dress',
    'gown':           'gown',
    'party_dress':    'party dress',
    # ── Items: Shoes ─────────────────────────────────────
    'sneakers':       'sneakers',
    'high_heels':     'high heels',
    'flats':          'flats',
    'boots':          'boots',
    'sandals':        'sandals',
    # ── Items: Accessories ───────────────────────────────
    'hat':            'hat',
    'bag':            'bag',
    'sunglasses':     'sunglasses',
    'necklace':       'necklace',
    'earrings':       'earrings',
    # ── Colors ───────────────────────────────────────────
    'red':            'red',
    'pink':           'pink',
    'hot_pink':       'hot pink',
    'baby_blue':      'baby blue',
    'navy_blue':      'navy blue',
    'turquoise':      'turquoise',
    'lavender':       'lavender',
    'purple':         'purple',
    'yellow':         'yellow',
    'gold':           'gold',
    'orange':         'orange',
    'coral':          'coral',
    'white':          'white',
    'black':          'black',
    'gray':           'gray',
    'brown':          'brown',
    'mint_green':     'mint green',
    'emerald_green':  'emerald green',
    # ── Patterns ─────────────────────────────────────────
    'plain':          'plain',
    'sparkly':        'sparkly',
    'floral':         'floral',
    'striped':        'striped',
    'polka_dots':     'polka dots',
    # ── Categories ───────────────────────────────────────
    'hair':           'hair',
    'face':           'face',
    'tops':           'tops',
    'bottoms':        'bottoms',
    'dresses':        'dresses',
    'shoes':          'shoes',
    'accessories':    'accessories',
}

# ── edge-tts (Microsoft Neural) ───────────────────────────────
async def gen_edge_one(key, text, voice):
    import edge_tts
    out = f'audio/{key}.mp3'
    if os.path.exists(out):
        print(f'  SKIP  {key}.mp3 (already exists)')
        return
    try:
        communicate = edge_tts.Communicate(text, voice, rate='-5%', pitch='+5Hz')
        await communicate.save(out)
        print(f'  OK    {key}.mp3')
    except Exception as e:
        print(f'  ERR   {key}.mp3 — {e}')

async def gen_all_edge():
    # Jenny = warm American female neural voice
    voice = 'en-US-JennyNeural'
    print(f'Voice: {voice}')
    for key, text in PHRASES.items():
        await gen_edge_one(key, text, voice)
        await asyncio.sleep(0.05)  # small delay to avoid rate limits

# ── gtts (Google Translate TTS) ───────────────────────────────
def gen_all_gtts():
    from gtts import gTTS
    print('Voice: Google Translate US English')
    for key, text in PHRASES.items():
        out = f'audio/{key}.mp3'
        if os.path.exists(out):
            print(f'  SKIP  {key}.mp3 (already exists)')
            continue
        try:
            tts = gTTS(text=text, lang='en', tld='us')
            tts.save(out)
            print(f'  OK    {key}.mp3')
            time.sleep(0.15)  # avoid rate limiting
        except Exception as e:
            print(f'  ERR   {key}.mp3 — {e}')

# ── Main ──────────────────────────────────────────────────────
def main():
    print(f'Generating {len(PHRASES)} audio files into audio/\n')

    try:
        import edge_tts
        print('Using edge-tts (Microsoft Neural TTS — best quality)\n')
        asyncio.run(gen_all_edge())
    except ImportError:
        try:
            import gtts
            print('Using gTTS (Google Translate TTS)\n')
            gen_all_gtts()
        except ImportError:
            print('ERROR: No TTS library found. Install one:')
            print('  pip install edge-tts   ← recommended (natural Microsoft neural voice)')
            print('  pip install gtts       ← fallback (Google Translate)')
            sys.exit(1)

    print(f'\nDone! {sum(1 for f in os.listdir("audio") if f.endswith(".mp3"))} files in audio/')
    print('\nNext steps:')
    print('  1. Copy the audio/ folder to kids/games/dress-up/audio/')
    print('  2. git add kids/games/dress-up/audio/')
    print('  3. git commit -m "Add pre-recorded audio for dress-up game"')
    print('  4. git push')

if __name__ == '__main__':
    main()
