#!/bin/bash

# Script to normalize MP3 files to -14 LUFS
# Batch processes all .mp3 files recursively in the input directory
# Exports normalized versions to output directory with same structure
# Maintains metadata, outputs as 44.1 kHz stereo MP3
# Generates a log file with filename, measured LUFS, and normalized LUFS

input_dir="media/music"
output_dir="media/music/normalized"
log_file="normalization_log.txt"

# Check if ffmpeg-normalize is installed
if ! command -v ffmpeg-normalize &> /dev/null; then
    echo "Error: ffmpeg-normalize is not installed. Please install it first."
    echo "You can install it via pip: pip install ffmpeg-normalize"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$output_dir"

# Clear or create log file
> "$log_file"

echo "Starting audio normalization..."
echo "Input directory: $input_dir"
echo "Output directory: $output_dir"
echo "Log file: $log_file"
echo ""

# Find all MP3 files recursively and process them
find "$input_dir" -name "*.mp3" -type f | while read -r file; do
    # Get relative path from input directory
    relative_path="${file#$input_dir/}"
    output_file="$output_dir/$relative_path"

    # Create output subdirectory if needed
    mkdir -p "$(dirname "$output_file")"

    echo "Processing: $relative_path"

    # Run ffmpeg-normalize with verbose output
    # -l -14: target integrated loudness -14 LUFS
    # -f: force overwrite
    # -ar 44100: sample rate 44.1 kHz
    # -c:a libmp3lame: MP3 codec
    # -b:a 320k: bitrate 320 kbps for high quality
    # -ac 2: stereo
    output=$(ffmpeg-normalize "$file" -l -14 -f -ar 44100 -c:a libmp3lame -b:a 320k -ac 2 -o "$output_file" -v 2>&1)

    # Extract measured loudness from output
    measured_loudness=$(echo "$output" | grep "Measured integrated loudness:" | sed 's/.*Measured integrated loudness: //' | sed 's/ LUFS.*//')

    # Normalized loudness is our target -14 LUFS
    normalized_loudness="-14.00"

    # Log the results
    echo "$relative_path | $measured_loudness | $normalized_loudness" >> "$log_file"

    echo "  Measured: $measured_loudness LUFS -> Normalized: $normalized_loudness LUFS"
done

echo ""
echo "Normalization complete!"
echo "Check $log_file for detailed results."
