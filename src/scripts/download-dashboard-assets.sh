#!/usr/bin/env bash
# Run from the project root. Figma asset URLs expire after 7 days.
set -euo pipefail
DIR="public/images/dashboard"
mkdir -p "$DIR"
B="https://www.figma.com/api/mcp/asset"
get() { curl -fL -o "$DIR/$1" "$B/$2"; }

# photos
get banner-texture.png "521be82e-bd5b-4df2-83b8-d831d78ac75d.png"
get doctor-sarah.png   "37c3f4a4-7146-4cf3-83d0-7621bb5d4003.png"
get doctor-mark.png    "2cadea33-6ea8-48db-ba07-c9b005ae4c96.png"

# icons (svg)
get bell.svg             "7693cd9f-bc87-4c20-a68c-adc8152cc716.svg"
get search.svg           "b223037b-9ca0-436f-96d5-aca0d3130850.svg"
get spec-general.svg     "f27b4de3-e057-48a6-a59d-55b612abbfdb.svg"
get spec-cardiology.svg  "dffa5590-aa6e-494b-aa15-13f0aaac9bad.svg"
get spec-skin.svg        "5c5d442c-72d0-4d51-8435-afc49649a556.svg"
get spec-brain.svg       "09cfd8e3-2ba2-4e5a-b79e-11c6b7743d8b.svg"
get banner-kit.svg       "1029d610-58b6-4fd4-843c-0d29bf1b5ed0.svg"
get shortcut-prescriptions.svg "c01c5bbe-a60d-4f11-b5ef-60990930f77e.svg"
get shortcut-labs.svg    "68774e37-521e-45f1-95e9-36fad5afa0a3.svg"
get star.svg             "193e9ec9-cae9-4d59-8689-d3214f9d8fd2.svg"
get ambulance.svg        "bed20376-6e81-4366-9a9d-b3b51c15115a.svg"
get chevron-right.svg    "a506a241-2e24-40bb-9c4d-00f7b4abedb8.svg"
get hydration.svg        "8147912c-486c-4042-99d8-3a4e5fe1ebd9.svg"
get medication.svg       "e518601c-005e-4966-914a-d8b5cb20ad1b.svg"
get consult.svg          "75f38749-267c-4f0b-bcc0-00b67bbbb8c2.svg"
get arrow-right.svg      "b6d94bda-c1ef-42a6-971a-ebdd6adab80b.svg"
get nav-home.svg         "9e350420-ef42-4eee-8caf-256d7cb673b3.svg"
get nav-doctors.svg      "0b3c1f0f-0c80-4a25-a48f-56d16f93368f.svg"
get nav-records.svg      "d4027488-0461-4bc2-8784-174985ad2ff7.svg"
get nav-profile.svg      "e30ca600-6daf-4ee1-aacb-5215491bfeb3.svg"
get nav-chat.svg         "e7131adf-2063-49b6-b577-95e6d673bb0e.svg"

echo "Done:"; ls -1 "$DIR"
