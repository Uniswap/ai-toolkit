# CCA Supply Schedule MCP Server

An MCP (Model Context Protocol) server that generates supply schedules for Continuous Clearing Auction (CCA) contracts using an exponential distribution.

## Overview

This server provides a tool to generate supply schedules for CCA auctions. The schedule uses an **exponential distribution** (exponent 1.2) with block durations growing by 1.2x each segment, allocating approximately 30% of tokens to the final block to prevent price manipulation.

## Algorithm

The supply schedule generation follows these principles:

1. **10 segments** for the first 70% of supply
2. **Block durations** grow exponentially by 1.2x each segment
3. **Token distribution** follows cumulative exponential curve: `(t/T)^1.2 * 0.7`
4. **Final block** receives remaining ~30% of tokens
5. **Total accuracy**: Always sums to exactly 10,000,000 MPS

### Mathematical Details

**Block Duration Growth:**

- First segment: `b₀` blocks
- Second segment: `b₀ * 1.2` blocks
- Third segment: `b₀ * 1.2²` blocks
- ...
- Tenth segment: `b₀ * 1.2⁹` blocks

Where `b₀` is calculated to use exactly (auction_blocks - 1) total blocks.

**Token Distribution:**
For each segment from block `t₁` to `t₂`:

- Cumulative tokens at `t₁`: `(t₁/T)^1.2 * 0.7 * 10,000,000`
- Cumulative tokens at `t₂`: `(t₂/T)^1.2 * 0.7 * 10,000,000`
- Tokens in segment: difference between cumulative values
- MPS: tokens ÷ block duration

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

The server is automatically configured when you install the `uniswap-builder` plugin. The tool is available as `generate_supply_schedule`.

### Tool: generate_supply_schedule

Generates a CCA supply schedule with exponential distribution.

**Parameters:**

- `auction_blocks` (required): Total number of blocks for the auction
  - Example: 86400 for 2 days on Base (2s blocks)
  - Example: 14400 for 1 day on Mainnet (12s blocks)
- `prebid_blocks` (optional): Number of blocks for prebid period with 0 mps
  - Default: 0

**Returns:**

JSON object with:

- `schedule`: Array of {mps, blockDelta} objects
- `auction_blocks`: Input auction blocks
- `prebid_blocks`: Input prebid blocks
- `total_phases`: Number of phases in the schedule
- `summary`: Summary statistics including:
  - `total_mps`: Actual total (always 10,000,000)
  - `target_mps`: Target total (10,000,000)
  - `final_block_mps`: Tokens in final block
  - `final_block_percentage`: Percentage in final block (~30%)
  - `num_segments`: Number of segments (10)
  - `growth_exponent`: Growth factor (1.2)

**Example Output:**

```json
{
  "schedule": [
    { "mps": 42, "blockDelta": 3328 },
    { "mps": 55, "blockDelta": 3994 },
    { "mps": 63, "blockDelta": 4793 },
    { "mps": 68, "blockDelta": 5751 },
    { "mps": 73, "blockDelta": 6902 },
    { "mps": 78, "blockDelta": 8282 },
    { "mps": 82, "blockDelta": 9938 },
    { "mps": 87, "blockDelta": 11926 },
    { "mps": 91, "blockDelta": 14311 },
    { "mps": 95, "blockDelta": 17174 },
    { "mps": 3011376, "blockDelta": 1 }
  ],
  "auction_blocks": 86400,
  "prebid_blocks": 0,
  "total_phases": 11,
  "summary": {
    "total_mps": 10000000,
    "target_mps": 10000000,
    "final_block_mps": 3011376,
    "final_block_percentage": 30.11,
    "num_segments": 10,
    "growth_exponent": 1.2
  }
}
```

## Properties

### Exponential Growth

Block durations grow by exactly 1.2x each segment:

| Segment | Blocks | Growth Ratio |
| ------- | ------ | ------------ |
| 1       | 3,328  | -            |
| 2       | 3,994  | 1.20x        |
| 3       | 4,793  | 1.20x        |
| 4       | 5,751  | 1.20x        |
| ...     | ...    | ...          |
| 10      | 17,174 | 1.20x        |
| Final   | 1      | -            |

### Token Distribution

MPS (tokens per block) increases gradually following the exponential curve:

| Segment | MPS | Cumulative % |
| ------- | --- | ------------ |
| 1       | 42  | ~1.4%        |
| 2       | 55  | ~3.6%        |
| 3       | 63  | ~6.6%        |
| ...     | ... | ...          |
| 10      | 95  | ~70%         |
| Final   | 3M+ | 100%         |

## MPS Units

MPS = Milli-Basis Points = 1e7 (10 million)

Each MPS represents one thousandth of a basis point. The target total is always 10,000,000 MPS (1e7).

## Running Standalone

For testing, you can run the server directly:

```bash
python server.py
```

Or run the test suite:

```bash
python test_logic.py
```

## Configuration

The exponential distribution parameters are configurable via constants:

- `NUM_SEGMENTS`: Number of segments (default: 10)
- `GROWTH_EXPONENT`: Growth factor (default: 1.2)
- `TOTAL_TARGET`: Target MPS (default: 10,000,000)

## License

MIT
