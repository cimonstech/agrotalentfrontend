// Quick script to check TypeScript errors
const { execSync } = require('child_process');

try {
  console.log('Checking TypeScript types...\n');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('\n✅ No type errors found!');
} catch (error) {
  console.log('\n❌ Type errors found. See above.');
  process.exit(1);
}
