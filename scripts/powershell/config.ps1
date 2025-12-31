# API testing shared configuration for PowerShell scripts
param()

if (-not $Script:ConfigInitialized) {
    $Script:ScriptDir = Split-Path -LiteralPath $MyInvocation.MyCommand.Path -Parent

    $baseUrl = $env:C3PO_API_BASE_URL
    if ([string]::IsNullOrWhiteSpace($baseUrl)) {
        $baseUrl = "http://localhost:8080/api/v1"
    }
    $Script:ApiBaseUrl = $baseUrl

    $timeout = $env:C3PO_API_TIMEOUT
    if (-not [int]::TryParse($timeout, [ref]$null)) {
        $timeout = "10"
    }
    $Script:ApiTimeout = [int]$timeout

    $username = $env:C3PO_ADMIN_USERNAME
    if ([string]::IsNullOrWhiteSpace($username)) {
        $username = "admin"
    }
    $Script:AdminUsername = $username

    $password = $env:C3PO_ADMIN_PASSWORD
    if ([string]::IsNullOrWhiteSpace($password)) {
        $password = "admin123"
    }
    $Script:AdminPassword = $password

    $Script:TestDataDir = Join-Path $Script:ScriptDir "data"
    $Script:TokenFile = Join-Path ([System.IO.Path]::GetTempPath()) "c3po_test_token"

    $Script:TestsPassed = 0
    $Script:TestsFailed = 0

    $Script:ConfigInitialized = $true
}

