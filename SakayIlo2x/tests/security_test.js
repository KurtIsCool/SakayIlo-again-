
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const testCases = [
  { input: '<b>Hello</b>', expected: '&lt;b&gt;Hello&lt;/b&gt;' },
  { input: 'Route & Ride', expected: 'Route &amp; Ride' },
  { input: '"Quoted"', expected: '&quot;Quoted&quot;' },
  { input: "'Single'", expected: '&#039;Single&#039;' },
  { input: '<img src=x onerror=alert(1)>', expected: '&lt;img src=x onerror=alert(1)&gt;' }
];

let failed = 0;
testCases.forEach(({ input, expected }) => {
  const actual = escapeHTML(input);
  if (actual === expected) {
    console.log(`✅ PASS: "${input}" -> "${actual}"`);
  } else {
    console.log(`❌ FAIL: "${input}" -> expected "${expected}", got "${actual}"`);
    failed++;
  }
});

if (failed === 0) {
  console.log('\nAll escapeHTML tests passed!');
  process.exit(0);
} else {
  console.log(`\n${failed} escapeHTML tests failed.`);
  process.exit(1);
}
