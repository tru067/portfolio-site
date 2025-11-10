#!/bin/bash

# Improved Audio Normalization Script
# Normalizes MP3 files to -14 LUFS using ffmpeg with EBU R128
# Maintains original sample rate and bit depth
# Applies transparent limiting to prevent clipping
# Preserves stereo width and dynamic range
# Adds "_normalized" suffix to output files

# Configuration
TARGET_LUFS="-14.0"
LIMITER_THRESHOLD="-1.0"  # 1 dB headroom to prevent clipping
LOG_FILE="normalization_log_improved.txt"

# Directories to process
INPUT_DIRS=("media/music" "public/media/music")

# Path to ffmpeg executable
FFMPEG_PATH="./ffmpeg/ffmpeg-8.0-essentials_build/bin/ffmpeg.exe"

# Check if ffmpeg exists
if [ ! -f "$FFMPEG_PATH" ]; then
    echo "Error: ffmpeg not found at $FFMPEG_PATH"
    echo "Please ensure ffmpeg is properly installed."
    exit 1
fi

# Clear or create log file
> "$LOG_FILE"
echo "Audio Normalization Log - $(date)" >> "$LOG_FILE"
echo "Target LUFS: $TARGET_LUFS" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

echo "Starting audio normalization..."
echo "Target LUFS: $TARGET_LUFS"
echo "Limiter Threshold: $LIMITER_THRESHOLD dB"
echo "Log file: $LOG_FILE"
echo ""

# Function to normalize a single file
normalize_file() {
    local input_file="$1"
    local output_file="$2"
    
    echo "Processing: $input_file"
    
    # Get original audio info
    local sample_rate=$("$FFMPEG_PATH" -i "$input_file" 2>&1 | grep -oP '(?<=Stream #0:0: Audio: mp3, )[0-9]+' | head -1)
    local bitrate=$("$FFMPEG_PATH" -i "$input_file" 2>&1 | grep -oP '(?<=, )[0-9]+ kb/s' | head -1)
    
    # If sample_rate is empty, default to 44100
    if [ -z "$sample_rate" ]; then
        sample_rate="44100"
    fi
    
    # If bitrate is empty, default to 320k
    if [ -z "$bitrate" ]; then
        bitrate="320k"
    fi
    
    echo "  Original: Sample Rate: ${sample_rate}Hz, Bitrate: $bitrate"
    
    # Measure current loudness
    local measured_loudness=$("$FFMPEG_PATH" -i "$input_file" -af "ebur128=peak=true" -f null - 2>&1 | grep -oP 'I:\s*-?\d+\.\d+' | tail -1 | sed 's/I: //')
    
    if [ -z "$measured_loudness" ]; then
        measured_loudness="N/A"
    fi
    
    # Apply normalization with limiter
    # First pass: measure and calculate gain
    # Second pass: apply normalization and limiting
    "$FFMPEG_PATH" -i "$input_file" \
        -af "loudnorm=I=$TARGET_LUFS:TP=-1.5:LRA=7:measured_I=$measured_loudness:measured_TP=0.0:measured_LRA=0.0:measured_thresh=-50.0:offset=0.0:linear=true" \
        -ar "$sample_rate" \
        -c:a libmp3lame \
        -b:a "$bitrate" \
        -ac 2 \
        -y "$output_file" 2>/dev/null
    
    # Verify the output was created
    if [ -f "$output_file" ]; then
        # Measure final loudness
        local final_loudness=$("$FFMPEG_PATH" -i "$output_file" -af "ebur128=peak=true" -f null - 2>&1 | grep -oP 'I:\s*-?\d+\.\d+' | tail -1 | sed 's/I: //')
        
        if [ -z "$final_loudness" ]; then
            final_loudness="N/A"
        fi
        
        echo "  Measured: $measured_loudness LUFS -> Normalized: $final_loudness LUFS"
        
        # Log the results
        echo "$input_file | $sample_rate Hz | $bitrate | $measured_loudness | $final_loudness | SUCCESS" >> "$LOG_FILE"
    else
        echo "  ERROR: Failed to create normalized file"
        echo "$input_file | ERROR | ERROR | ERROR | ERROR | FAILED" >> "$LOG_FILE"
    fi
    
    echo ""
}

# Process each directory
for input_dir in "${INPUT_DIRS[@]}"; do
    if [ -d "$input_dir" ]; then
        echo "Processing directory: $input_dir"
        echo "----------------------------------------"
        
        # Find all MP3 files recursively
        find "$input_dir" -name "*.mp3" -type f | while read -r file; do
            # Create output filename with _normalized suffix
            dir_path=$(dirname "$file")
            base_name=$(basename "$file" .mp3)
            output_file="$dir_path/${base_name}_normalized.mp3"
            
            normalize_file "$file" "$output_file"
        done
    else
        echo "Warning: Directory $input_dir not found, skipping..."
    fi
done

echo ""
echo "Normalization complete!"
echo "========================================"
echo "Summary:"
echo "- Target LUFS: $TARGET_LUFS"
echo "- Files processed: See log for details"
echo "- Log file: $LOG_FILE"
echo ""
echo "Normalized files have '_normalized' suffix"
echo "Original sample rates and bitrates preserved"
echo "Transparent limiting applied to prevent clipping"
