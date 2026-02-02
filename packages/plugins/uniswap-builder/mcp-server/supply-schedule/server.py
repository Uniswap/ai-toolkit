#!/usr/bin/env python3
"""
CCA Supply Schedule MCP Server

This MCP server provides tools for generating supply schedules for
Continuous Clearing Auction (CCA) contracts using an exponential distribution.
"""

import json
import logging
from typing import Any

from mcp.server import Server
from mcp.types import Tool, TextContent
from pydantic import BaseModel, Field

# Configure logging to stderr (not stdout for STDIO servers)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("cca-supply-schedule")

# Target total supply in mps units
TOTAL_TARGET = 10_000_000  # 1e7

# Number of segments for the first 70% of supply
NUM_SEGMENTS = 10

# Exponential growth factor
GROWTH_EXPONENT = 1.2


class GenerateScheduleInput(BaseModel):
    """Input parameters for generate_supply_schedule tool."""
    auction_blocks: int = Field(
        description="Total number of blocks for the auction (e.g., 86400 for 2 days on Base)",
        gt=0
    )
    prebid_blocks: int = Field(
        default=0,
        description="Number of blocks for prebid period with 0 mps (default: 0)",
        ge=0
    )


def calculate_block_durations(total_blocks: int, num_segments: int, growth_factor: float) -> list[int]:
    """
    Calculate block durations for each segment with exponential growth.

    Args:
        total_blocks: Total blocks available (excluding final block)
        num_segments: Number of segments to create
        growth_factor: Growth factor for block durations (e.g., 1.2)

    Returns:
        List of block durations for each segment
    """
    # Calculate sum of geometric series: sum(r^i for i in 0..n-1) = (r^n - 1) / (r - 1)
    geometric_sum = (growth_factor ** num_segments - 1) / (growth_factor - 1)

    # Calculate initial block duration
    b0 = total_blocks / geometric_sum

    # Generate block durations with exponential growth
    durations = []
    for i in range(num_segments):
        duration = b0 * (growth_factor ** i)
        # Round to nearest integer, ensure at least 1 block
        duration_int = max(1, round(duration))
        durations.append(duration_int)

    # Adjust last segment to exactly hit total_blocks
    actual_total = sum(durations)
    if actual_total != total_blocks:
        durations[-1] += (total_blocks - actual_total)
        # Ensure still at least 1 block
        durations[-1] = max(1, durations[-1])

    return durations


def generate_schedule(auction_blocks: int, prebid_blocks: int = 0) -> list[dict[str, int]]:
    """
    Generate supply schedule using exponential distribution.

    Algorithm:
        1. Allocate 30% to final block (approximately)
        2. Distribute remaining 70% over NUM_SEGMENTS segments
        3. Block durations grow exponentially (1.2x each segment)
        4. Token distribution follows cumulative curve: (t/T)^1.2 * 0.7
        5. Adjust final block to hit exactly TOTAL_TARGET

    Args:
        auction_blocks: Total number of blocks for the auction
        prebid_blocks: Number of blocks for prebid period (0 mps)

    Returns:
        List of dicts with 'mps' and 'blockDelta' keys
    """
    schedule = []

    # Add prebid period if specified
    if prebid_blocks > 0:
        schedule.append({"mps": 0, "blockDelta": prebid_blocks})

    # Reserve 1 block for final allocation
    blocks_for_segments = auction_blocks - 1

    # Calculate block durations for each segment (exponential growth)
    block_durations = calculate_block_durations(blocks_for_segments, NUM_SEGMENTS, GROWTH_EXPONENT)

    # Calculate MPS for each segment based on cumulative exponential curve
    cumulative_blocks = 0
    cumulative_tokens = 0

    for i, block_delta in enumerate(block_durations):
        # Start and end block positions for this segment
        start_block = cumulative_blocks
        end_block = cumulative_blocks + block_delta

        # Calculate cumulative token percentage at start and end
        # Using exponential curve: (t/T)^1.2 scaled to 70% of total
        start_pct = (start_block / blocks_for_segments) ** GROWTH_EXPONENT
        end_pct = (end_block / blocks_for_segments) ** GROWTH_EXPONENT

        # Convert to actual token amounts (70% of total supply)
        start_tokens = start_pct * 0.7 * TOTAL_TARGET
        end_tokens = end_pct * 0.7 * TOTAL_TARGET

        # Tokens for this segment
        segment_tokens = end_tokens - start_tokens

        # Calculate MPS (tokens per block)
        mps = round(segment_tokens / block_delta)

        # Ensure at least 1 mps (unless it's supposed to be 0)
        if segment_tokens > 0:
            mps = max(1, mps)

        schedule.append({"mps": mps, "blockDelta": block_delta})

        cumulative_blocks += block_delta
        cumulative_tokens += mps * block_delta

    # Final block gets remainder to hit exactly TOTAL_TARGET
    final_tokens = TOTAL_TARGET - cumulative_tokens
    schedule.append({"mps": final_tokens, "blockDelta": 1})

    return schedule


# Create MCP server instance
server = Server("cca-supply-schedule")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="generate_supply_schedule",
            description=(
                "Generate a CCA (Continuous Clearing Auction) supply schedule with exponential distribution. "
                f"The schedule uses {NUM_SEGMENTS} segments with block durations growing by {GROWTH_EXPONENT}x each segment. "
                "Token distribution follows a cumulative exponential curve (t/T)^1.2 scaled to 70% of supply, "
                "with the final block receiving the remaining ~30%. "
                "Returns an array of {mps, blockDelta} objects. "
                "MPS = milli-basis points (1e7 = 10 million), representing tokens per block."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "auction_blocks": {
                        "type": "integer",
                        "description": "Total number of blocks for the auction (e.g., 86400 for 2 days on Base with 2s blocks)",
                        "minimum": 1
                    },
                    "prebid_blocks": {
                        "type": "integer",
                        "description": "Number of blocks for prebid period with 0 mps (default: 0)",
                        "minimum": 0,
                        "default": 0
                    }
                },
                "required": ["auction_blocks"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls."""
    if name != "generate_supply_schedule":
        raise ValueError(f"Unknown tool: {name}")

    try:
        # Validate input
        input_data = GenerateScheduleInput(**arguments)

        # Generate schedule
        schedule = generate_schedule(
            auction_blocks=input_data.auction_blocks,
            prebid_blocks=input_data.prebid_blocks
        )

        # Calculate summary statistics
        total_mps = sum(item["mps"] * item["blockDelta"] for item in schedule)
        final_block_mps = schedule[-1]["mps"]
        final_block_percentage = (final_block_mps / TOTAL_TARGET) * 100

        # Format output
        output = {
            "schedule": schedule,
            "auction_blocks": input_data.auction_blocks,
            "prebid_blocks": input_data.prebid_blocks,
            "total_phases": len(schedule),
            "summary": {
                "total_mps": total_mps,
                "target_mps": TOTAL_TARGET,
                "final_block_mps": final_block_mps,
                "final_block_percentage": round(final_block_percentage, 2),
                "num_segments": NUM_SEGMENTS,
                "growth_exponent": GROWTH_EXPONENT
            }
        }

        return [
            TextContent(
                type="text",
                text=json.dumps(output, indent=2)
            )
        ]
    except Exception as e:
        logger.error(f"Error generating supply schedule: {e}", exc_info=True)
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "error": str(e),
                    "message": "Failed to generate supply schedule"
                })
            )
        ]


async def main():
    """Run the MCP server."""
    from mcp.server.stdio import stdio_server

    async with stdio_server() as (read_stream, write_stream):
        logger.info("CCA Supply Schedule MCP Server starting...")
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
