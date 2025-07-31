# Plugin Tests

This directory contains unit tests for the Fastify plugins used in the Content Moderation API.

## Test Files

### `basic.test.ts`
Basic functionality tests that verify:
- Plugins can be registered without errors
- Plugins work together without conflicts
- Environment variables are handled correctly
- Basic rate limiting configuration works

### `moderation.test.ts`
Tests for the moderation plugin:
- Verifies ModerationService is registered as a singleton
- Tests that service methods are available
- Checks that the service can be called (even if it fails due to missing API keys)

### `rate-limit.test.ts`
Tests for the rate limiting plugin:
- Verifies rate limiting is configured correctly
- Tests environment variable configuration
- Checks that health endpoints bypass rate limiting
- Tests actual rate limiting behavior

### `xApi.test.ts`
Tests for the X (Twitter) API plugin:
- Verifies XApiService is registered when credentials are provided
- Tests mock service registration when credentials are missing
- Checks that service methods are available
- Tests credential validation behavior

### `integration.test.ts`
Integration tests that verify:
- All plugins work together
- Services are available on the Fastify instance
- Rate limiting works as expected
- Health endpoints bypass rate limiting

## Running Tests

```bash
# Run all plugin tests
npm test

# Run specific test file
npx tsx --test src/plugins/__tests__/basic.test.ts

# Run with coverage
npm run test:coverage
```

## Test Coverage

The tests cover:
- ✅ Plugin registration
- ✅ Service availability
- ✅ Environment variable handling
- ✅ Rate limiting functionality
- ✅ Health endpoint bypass
- ✅ Error handling
- ✅ Integration scenarios

## Notes

- Tests use `tsx` for TypeScript support
- Mock services are used when real API credentials are not available
- Environment variables are restored after tests
- Rate limiting tests may be flaky due to timing issues
- Some tests expect failures due to missing API keys (which is expected behavior)