#!/usr/bin/env python3
"""
NOISECORE test runner — generates sample cards to verify the pipeline.
"""

import os
import create_test_image as cti
import caption_layout as cl


def main():
    print("=" * 50)
    print("NOISECORE // TEST RUN")
    print("=" * 50)

    # Create test images
    print("\n[1] Generating test images...")
    img_dir = cti.create_test_images()
    silhouette_path = os.path.join(img_dir, "silhouette.png")
    gradient_path = os.path.join(img_dir, "gradient.png")

    output_dir = "test_output"
    os.makedirs(output_dir, exist_ok=True)

    # --- Card 1: With silhouette image ---
    print("\n[2] Building card with silhouette image...")
    card1 = cl.build_card(
        title="GET NAKED AND DANCE",
        body=(
            "Dc The Don has done it again, he's continuously pushed new norms "
            "back toward the goalpost, and he's attempting to kick a game ending goal\n"
            "We picked him up as a NOISE entity for a reason, "
            "he adapts, he's himself, and he's here to stay"
        ),
        image_path=silhouette_path,
        dreamlog_num=3,
        size_name="instagram_square",
        filter_preset="default",
    )
    p1 = os.path.join(output_dir, "card_silhouette.png")
    card1.save(p1, "PNG")
    print(f"  -> {p1}")

    # --- Card 2: With gradient, green accent lines ---
    print("\n[3] Building card with gradient + accent lines...")
    card2 = cl.build_card(
        title="FROM THE EARTH TO ANGEL HEIGHTS",
        body=(
            "Boasting one of the deepest unclassified signals in the new gen,\n"
            "Artist Oshua came across our radar by being silent in noise but rich in energy.\n"
            "Angel Heights and his upcoming album are some of the best music pieces "
            "dropped recently.\n"
            "Watch out for this one.\n"
            "By the time you hear about him, it'll be too late."
        ),
        image_path=gradient_path,
        dreamlog_num=2,
        size_name="instagram_square",
        body_alt_lines={8, 9},
        filter_preset="default",
    )
    p2 = os.path.join(output_dir, "card_gradient.png")
    card2.save(p2, "PNG")
    print(f"  -> {p2}")

    # --- Card 3: No image (text-only) ---
    print("\n[4] Building text-only card...")
    card3 = cl.build_card(
        title="WEEK OF WONDERS",
        body=(
            "Molly Santanna has done what not many could do, she despite all odds "
            "has by chance become one of the best female artists out.\n"
            "In my personal opinion, she doesn't make music too one lined, "
            "too single threaded, she makes music ambiguously, which raises the bar "
            "and potential she poses\n"
            "She's an upcoming threat, and not many are ready for her to "
            "take over and lead the way"
        ),
        dreamlog_num=3,
        size_name="instagram_portrait",
        filter_preset="subtle",
    )
    p3 = os.path.join(output_dir, "card_textonly.png")
    card3.save(p3, "PNG")
    print(f"  -> {p3}")

    # --- Card 4: All sizes ---
    print("\n[5] Building all sizes for DRO KENJI card...")
    out_multi = os.path.join(output_dir, "dro_kenji")
    cl.build_all_sizes(
        title="DRO KENJI",
        body=(
            "Boasting 435K+ monthly listeners and a loyal fanbase.\n"
            "Time Away dropped in February to critical acclaim.\n"
            "Currently embarked on a based tour.\n"
            "Under no circumstances is he to be underestimated."
        ),
        image_path=silhouette_path,
        output_dir=out_multi,
        dreamlog_num=1,
        body_alt_lines={2, 3, 4},
        filter_preset="heavy",
    )

    print("\n" + "=" * 50)
    print("All test cards generated. Check:")
    print(f"  {output_dir}/")
    for f in sorted(os.listdir(output_dir)):
        full = os.path.join(output_dir, f)
        if os.path.isfile(full):
            print(f"    {f}")
        elif os.path.isdir(full):
            for sf in sorted(os.listdir(full)):
                print(f"    {f}/{sf}")
    print("=" * 50)


if __name__ == "__main__":
    main()
