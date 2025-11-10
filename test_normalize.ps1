# Test normalization with a single file

# Load the function from the main script
. ".\normalize_audio_fixed.ps1"

# Test with just one file
$testFile = "media/music/Dance/alex g jumpstyle.mp3"
$outputFile = "media/music/Dance/alex g jumpstyle_normalized.mp3"

Write-Host "Testing normalization with single file..."
Normalize-File -InputFile $testFile -OutputFile $outputFile
