# NOISECORE

card generator for instagram and tiktok posts.

takes a title, body text, and optionally a photo — outputs ready-to-post cards with grain, scanlines, chromatic aberration, and glowing red borders.

## setup

```
pip install -r requirements.txt
```

## run

```
python comfy_to_social.py -t "WEEK OF WONDERS" -b "body text here" -i photo.jpg --dreamlog 3
```

generates all four sizes by default: instagram square (1080×1080), portrait (1080×1350), reels (1080×1920), tiktok (1080×1920).

## options

| flag | description |
|------|-------------|
| `-t` | title |
| `-b` | body text (`\n` for paragraph breaks) |
| `-i` | photo to embed |
| `--comfy-dir` | ComfyUI output folder — pulls latest image automatically |
| `--dreamlog` | issue number (default: 1) |
| `-o` | output directory (default: `noisecore/`) |
| `--size` | single size: `instagram_square`, `instagram_portrait`, `instagram_reels`, `tiktok` |
| `--preset` | filter intensity: `default`, `heavy`, `subtle` |
| `--alt-lines` | comma-separated line indices to render in green |

## test

```
python test_run.py
```

generates sample cards to `test_output/`. inspect them visually.
