for ($i=1; $i -le 5; $i++) {
    Write-Host ("Run {0}:" -f $i)
    npx playwright test e2e/live-auth-flow.spec.ts 2>&1 | Select-String 'Response|Status|passed|failed'
}