# Simple Audio Normalization Script for Windows
# Normalizes MP3 files to -14 LUFS using ffmpeg with volume normalization
# Maintains original sample rate and bit depth
# Applies limiting to prevent clipping
# Adds "_normalized" suffix to output files

# Configuration
$TargetLUFS = "-14.0"
$LogFile = "normalization_log_simple.txt"

# Directories to process
$InputDirs = @("media/music", "public/media/music")

# Path to ffmpeg executable
$FFMPEGPath = ".\ffmpeg\ffmpeg-8.0-essentials_build\bin\ffmpeg.exe"

# Check if ffmpeg exists
if (-not (Test-Path $FFMPEGPath)) {
    Write-Error "Error: ffmpeg not found at $FFMPEGPath"
    Write-Error "Please ensure ffmpeg is properly installed."
    exit 1
}

# Clear or create log file
"Audio Normalization Log - $(Get-Date)" | Out-File -FilePath $LogFile -Encoding UTF8
"Target LUFS: $TargetLUFS" | Out-File -FilePath $LogFile -Append -Encoding UTF8
"========================================" | Out-File -FilePath $LogFile -Append -Encoding UTF8

Write-Host "Starting audio normalization..."
Write-Host "Target LUFS: $TargetLUFS"
Write-Host "Log file: $LogFile"
Write-Host ""

# Function to normalize a single file
function Normalize-File {
    param(
        [string]$InputFile,
        [string]$OutputFile
    )
    
    Write-Host "Processing: $InputFile"
    
    # Get original audio info using ffprobe
    $ffprobePath = ".\ffmpeg\ffmpeg-8.0-essentials_build\bin\ffprobe.exe"
    $audioInfo = & $ffprobePath -v quiet -select_streams a:0 -show_entries stream=sample_rate,bit_rate -of csv=p=0 $InputFile 2>$null
    $sampleRate = ($audioInfo -split ',')[0].Trim()
    $bitRate = ($audioInfo -split ',')[1].Trim()
    
    # If sample_rate is empty, default to 44100
    if ([string]::IsNullOrEmpty($sampleRate)) {
        $sampleRate = "44100"
    }
    
    # Convert bit rate to kbps format
    if ([string]::IsNullOrEmpty($bitRate)) {
        $bitRate = "320k"
    } else {
        $bitRateValue = [int]$bitRate / 1000
        $bitRate = "$bitRateValue" + "k"
    }
    
    Write-Host "  Original: Sample Rate: ${sampleRate}Hz, Bitrate: $bitRate"
    
    # Measure current loudness using ebur128
    $measureOutput = & $FFMPEGPath -i $InputFile -af "ebur128" -f null - 2>&1
    $measuredLoudness = "N/A"
    
    # Extract integrated loudness from output
    if ($measureOutput -match 'I:\s*(-?\d+\.\d+)') {
        $measuredLoudness = $matches[1]
    }
    
    # Calculate gain needed to reach target LUFS
    if ($measuredLoudness -ne "N/A") {
        $gainNeeded = [double]$TargetLUFS - [double]$measuredLoudness
        Write-Host "  Measured: $measuredLoudness LUFS, Gain needed: $gainNeeded dB"
    } else {
        $gainNeeded = 0
        Write-Host "  Could not measure loudness, using no gain"
    }
    
    # Apply volume adjustment with limiter to prevent clipping
    # Use volume filter with limiter
    $volumeFilter = "volume=${gainNeeded}dB:precision=fixed:limiter=true"
    
    $process = Start-Process -FilePath $FFMPEGPath -ArgumentList "-i", "`"$InputFile`"", "-af", $volumeFilter, "-ar", $sampleRate, "-c:a", "libmp3lame", "-b:a", $bitRate, "-ac", "2", "-y", "`"$OutputFile`"" -Wait -PassThru -NoNewWindow
    
    # Verify the output was created
    if (Test-Path $OutputFile) {
        # Measure final loudness
        $finalOutput = & $FFMPEGPath -i $OutputFile -af "ebur128" -f null - 2>&1
        $finalLoudness = "N/A"
        
        # Extract integrated loudness from output
        if ($finalOutput -match 'I:\s*(-?\d+\.\d+)') {
            $finalLoudness = $matches[1]
        }
        
        Write-Host "  Final loudness: $finalLoudness LUFS"
        
        # Log the results
        "$InputFile | $sampleRate Hz | $bitRate | $measuredLoudness | $finalLoudness | SUCCESS" | Out-File -FilePath $LogFile -Append -Encoding UTF8
    } else {
        Write-Host "  ERROR: Failed to create normalized file"
        "$InputFile | ERROR | ERROR | ERROR | ERROR | FAILED" | Out-File -FilePath $LogFile -Append -Encoding UTF8
    }
    
    Write-Host ""
}

# Process each directory
foreach ($inputDir in $InputDirs) {
    if (Test-Path $inputDir) {
        Write-Host "Processing directory: $inputDir"
        Write-Host "----------------------------------------"
        
        # Find all MP3 files recursively
        $mp3Files = Get-ChildItem -Path $inputDir -Filter "*.mp3" -Recurse -File
        
        foreach ($file in $mp3Files) {
            # Create output filename with _normalized suffix
            $dirPath = $file.DirectoryName
            $baseName = $file.BaseName
            $outputFile = Join-Path $dirPath "${baseName}_normalized.mp3"
            
            Normalize-File -InputFile $file.FullName -OutputFile $outputFile
        }
    } else {
        Write-Host "Warning: Directory $inputDir not found, skipping..."
    }
}

Write-Host ""
Write-Host "Normalization complete!"
Write-Host "========================================"
Write-Host "Summary:"
Write-Host "- Target LUFS: $TargetLUFS"
Write-Host "- Files processed: See log for details"
Write-Host "- Log file: $LogFile"
Write-Host ""
Write-Host "Normalized files have '_normalized' suffix"
Write-Host "Original sample rates and bitrates preserved"
Write-Host "Volume limiting applied to prevent clipping"
