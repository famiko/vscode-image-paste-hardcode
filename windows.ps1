Add-Type -Assembly PresentationCore
$img = [Windows.Clipboard]::GetImage()
if ($img -eq $null) {
    "no image"
    Exit 1
}

$fcb = new-object Windows.Media.Imaging.FormatConvertedBitmap($img, [Windows.Media.PixelFormats]::Rgb24, $null, 0)
$encoder = New-Object Windows.Media.Imaging.PngBitmapEncoder
$encoder.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($fcb)) | out-null
$stream = new-Object IO.MemoryStream
$encoder.Save($stream) | Out-Null
$bytes = $stream.ToArray()
$str = [Convert]::ToBase64String($bytes)
$stream.Dispose() | out-null

$str
