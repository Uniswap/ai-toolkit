const Q96 = 2n ** 96n;
const MIN_FLOOR_PRICE = 2n ** 32n; // type(uint32).max + 1

console.log('MIN_FLOOR_PRICE:', MIN_FLOOR_PRICE.toString());
console.log('MIN_FLOOR_PRICE hex:', '0x' + MIN_FLOOR_PRICE.toString(16));

// Convert to USDC price (6 decimals, token 18 decimals)
const decimalAdjustment = BigInt(10 ** 18);
const priceInSmallestUnit = (MIN_FLOOR_PRICE * decimalAdjustment) / Q96;
const priceInUSDC = Number(priceInSmallestUnit) / 10 ** 6;

console.log('\nMinimum floor price in USDC per token:', priceInUSDC.toExponential());
console.log('Our floor price:', 0.00000001);
console.log('Is ours too low?', 0.00000001 < priceInUSDC);

// Calculate a safe floor price
const safeFloorPrice = MIN_FLOOR_PRICE;
console.log('\nUse this floor price (Q96):', safeFloorPrice.toString());
