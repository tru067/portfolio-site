# Test working normalization with a single file

# Load the function from the working script
. ".\normalize_audio_working.ps1"

# Test with just one file
$testFile = "media/music/Dance/alex g jumpstyle.mp3"
$outputFile = "media/music/Dance/alex g jumpstyle_normalized.mp3"

Write-Host "Testing working normalization with single file..."
Normalize-File -InputFile $testFile -OutputFile $outputFile
