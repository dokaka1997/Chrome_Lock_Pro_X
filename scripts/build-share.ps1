param(
  [string]$OutputDir = "dist-share",
  [string]$ZipPath = "dist-share.zip"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-ProjectRoot {
  return Split-Path -Parent $PSScriptRoot
}

function Get-RelativePathSafe {
  param(
    [string]$RootPath,
    [string]$FullPath
  )

  $normalizedRoot = [System.IO.Path]::GetFullPath($RootPath)
  $normalizedFull = [System.IO.Path]::GetFullPath($FullPath)

  if ($normalizedFull.StartsWith($normalizedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $normalizedFull.Substring($normalizedRoot.Length).TrimStart('\', '/')
  }

  return $normalizedFull
}

function Test-IgnoredPath {
  param(
    [string]$RelativePath
  )

  $normalized = $RelativePath.Replace('\', '/')
  if ($normalized -eq "dist-share.zip") { return $true }
  if ($normalized -eq "privacy-policy.html") { return $true }
  if ($normalized -like "*.md") { return $true }
  if ($normalized.StartsWith(".idea/")) { return $true }
  if ($normalized.StartsWith("docs/")) { return $true }
  if ($normalized.StartsWith("scripts/")) { return $true }
  if ($normalized.StartsWith("dist-share/")) { return $true }
  return $false
}

function Convert-ToEscapedLiteralContent {
  param(
    [string]$Text
  )

  $builder = [System.Text.StringBuilder]::new()
  foreach ($character in $Text.ToCharArray()) {
    $codePoint = [int][char]$character
    if ($codePoint -ge 32 -and $codePoint -le 126) {
      [void]$builder.Append(('\x{0:x2}' -f $codePoint))
    } else {
      [void]$builder.Append(('\u{0:x4}' -f $codePoint))
    }
  }

  return $builder.ToString()
}

function Protect-JavaScriptStrings {
  param(
    [string]$Source
  )

  $builder = [System.Text.StringBuilder]::new()
  $length = $Source.Length
  $index = 0

  while ($index -lt $length) {
    $character = $Source[$index]

    if ($character -eq "'" -or $character -eq '"') {
      $delimiter = $character
      $start = $index
      $index += 1
      $stringBuilder = [System.Text.StringBuilder]::new()
      $hasEscape = $false
      $terminated = $false

      while ($index -lt $length) {
        $current = $Source[$index]

        if ($current -eq "`r" -or $current -eq "`n") {
          break
        }

        if ($current -eq "\") {
          $hasEscape = $true
          [void]$stringBuilder.Append($current)
          $index += 1
          if ($index -lt $length) {
            [void]$stringBuilder.Append($Source[$index])
            $index += 1
          }
          continue
        }

        if ($current -eq $delimiter) {
          $terminated = $true
          $index += 1
          break
        }

        [void]$stringBuilder.Append($current)
        $index += 1
      }

      if (-not $terminated) {
        [void]$builder.Append($Source.Substring($start, $index - $start))
        continue
      }

      $rawContent = $stringBuilder.ToString()
      if ($hasEscape -or -not $rawContent) {
        [void]$builder.Append($delimiter)
        [void]$builder.Append($rawContent)
        [void]$builder.Append($delimiter)
        continue
      }

      [void]$builder.Append($delimiter)
      [void]$builder.Append((Convert-ToEscapedLiteralContent -Text $rawContent))
      [void]$builder.Append($delimiter)
      continue
    }

    if ($character -eq '`') {
      [void]$builder.Append($character)
      $index += 1

      while ($index -lt $length) {
        $current = $Source[$index]
        [void]$builder.Append($current)

        if ($current -eq "\") {
          $index += 1
          if ($index -lt $length) {
            [void]$builder.Append($Source[$index])
          }
        } elseif ($current -eq '`') {
          $index += 1
          break
        }

        $index += 1
      }

      continue
    }

    [void]$builder.Append($character)
    $index += 1
  }

  return $builder.ToString()
}

function Protect-JavaScriptFile {
  param(
    [string]$InputPath,
    [string]$OutputPath
  )

  $source = Get-Content -Path $InputPath -Raw -Encoding UTF8
  $source = Protect-JavaScriptStrings -Source $source
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($OutputPath, $source, $utf8)
}

$projectRoot = Get-ProjectRoot
$resolvedOutputDir = Join-Path $projectRoot $OutputDir
$resolvedZipPath = Join-Path $projectRoot $ZipPath

if (Test-Path $resolvedOutputDir) {
  Remove-Item -Recurse -Force $resolvedOutputDir
}

if (Test-Path $resolvedZipPath) {
  Remove-Item -Force $resolvedZipPath
}

New-Item -ItemType Directory -Path $resolvedOutputDir | Out-Null

$files = Get-ChildItem -Path $projectRoot -Recurse -File | Where-Object {
  $relativePath = Get-RelativePathSafe -RootPath $projectRoot -FullPath $_.FullName
  -not (Test-IgnoredPath -RelativePath $relativePath)
}

foreach ($file in $files) {
  $relativePath = Get-RelativePathSafe -RootPath $projectRoot -FullPath $file.FullName
  $destination = Join-Path $resolvedOutputDir $relativePath
  $destinationDirectory = Split-Path -Parent $destination

  if (-not (Test-Path $destinationDirectory)) {
    New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
  }

  if ($file.Extension -ieq ".js") {
    Protect-JavaScriptFile -InputPath $file.FullName -OutputPath $destination
  } else {
    Copy-Item -Path $file.FullName -Destination $destination
  }
}

Compress-Archive -Path (Join-Path $resolvedOutputDir "*") -DestinationPath $resolvedZipPath -CompressionLevel Optimal

Write-Host "Share build created:"
Write-Host "  Folder: $resolvedOutputDir"
Write-Host "  Zip:    $resolvedZipPath"
