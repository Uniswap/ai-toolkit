#!/usr/bin/env python3
"""
Test the supply schedule generation logic with exponential distribution.
"""

# Import the logic to test
TOTAL_TARGET = 10_000_000  # 1e7
NUM_SEGMENTS = 10
GROWTH_EXPONENT = 1.2


def calculate_block_durations(total_blocks: int, num_segments: int, growth_factor: float) -> list[int]:
    """Calculate block durations for each segment with exponential growth."""
    geometric_sum = (growth_factor ** num_segments - 1) / (growth_factor - 1)
    b0 = total_blocks / geometric_sum

    durations = []
    for i in range(num_segments):
        duration = b0 * (growth_factor ** i)
        duration_int = max(1, round(duration))
        durations.append(duration_int)

    actual_total = sum(durations)
    if actual_total != total_blocks:
        durations[-1] += (total_blocks - actual_total)
        durations[-1] = max(1, durations[-1])

    return durations


def generate_schedule(auction_blocks: int, prebid_blocks: int = 0):
    """Generate supply schedule using exponential distribution."""
    schedule = []

    if prebid_blocks > 0:
        schedule.append({"mps": 0, "blockDelta": prebid_blocks})

    blocks_for_segments = auction_blocks - 1
    block_durations = calculate_block_durations(blocks_for_segments, NUM_SEGMENTS, GROWTH_EXPONENT)

    cumulative_blocks = 0
    cumulative_tokens = 0

    for i, block_delta in enumerate(block_durations):
        start_block = cumulative_blocks
        end_block = cumulative_blocks + block_delta

        start_pct = (start_block / blocks_for_segments) ** GROWTH_EXPONENT
        end_pct = (end_block / blocks_for_segments) ** GROWTH_EXPONENT

        start_tokens = start_pct * 0.7 * TOTAL_TARGET
        end_tokens = end_pct * 0.7 * TOTAL_TARGET

        segment_tokens = end_tokens - start_tokens
        mps = round(segment_tokens / block_delta)

        if segment_tokens > 0:
            mps = max(1, mps)

        schedule.append({"mps": mps, "blockDelta": block_delta})

        cumulative_blocks += block_delta
        cumulative_tokens += mps * block_delta

    final_tokens = TOTAL_TARGET - cumulative_tokens
    schedule.append({"mps": final_tokens, "blockDelta": 1})

    return schedule


def test_basic_schedule():
    """Test basic schedule generation."""
    print("Testing exponential schedule generation...")
    print(f"Parameters: {NUM_SEGMENTS} segments, growth factor {GROWTH_EXPONENT}x")

    schedule = generate_schedule(86400, 0)

    print(f"\nGenerated {len(schedule)} phases")
    print(f"First phase: {schedule[0]}")
    print(f"Last phase: {schedule[-1]}")

    # Verify block durations
    print("\nBlock durations (exponential growth):")
    for i, item in enumerate(schedule[:-1]):  # Exclude final block
        print(f"  Segment {i+1}: {item['blockDelta']} blocks, {item['mps']} mps")

    total_mps = sum(item["mps"] * item["blockDelta"] for item in schedule)
    final_percentage = (schedule[-1]["mps"] / TOTAL_TARGET) * 100

    print(f"\nTotal MPS: {total_mps}")
    print(f"Target MPS: {TOTAL_TARGET}")
    print(f"Match: {total_mps == TOTAL_TARGET}")
    print(f"Final block percentage: {final_percentage:.2f}%")

    # Verify exponential growth in block durations
    print("\nVerifying exponential growth in block durations:")
    for i in range(1, NUM_SEGMENTS):
        prev_delta = schedule[i-1]["blockDelta"]
        curr_delta = schedule[i]["blockDelta"]
        ratio = curr_delta / prev_delta if prev_delta > 0 else 0
        print(f"  Segment {i} to {i+1}: {prev_delta} → {curr_delta} (ratio: {ratio:.2f}x)")

    assert total_mps == TOTAL_TARGET, f"Total MPS mismatch: {total_mps} != {TOTAL_TARGET}"
    assert 25 <= final_percentage <= 35, f"Final block should be ~30%, got {final_percentage:.2f}%"
    print("\n✓ Basic schedule test passed!")


def test_prebid_schedule():
    """Test schedule with prebid period."""
    print("\nTesting schedule with prebid period...")

    schedule = generate_schedule(86400, 43200)

    print(f"Generated {len(schedule)} phases (including prebid)")
    print(f"First phase (prebid): {schedule[0]}")
    print(f"Second phase: {schedule[1]}")
    print(f"Last phase: {schedule[-1]}")

    assert schedule[0]["mps"] == 0, "Prebid phase should have 0 mps"
    assert schedule[0]["blockDelta"] == 43200, "Prebid phase should have correct blockDelta"

    total_mps = sum(item["mps"] * item["blockDelta"] for item in schedule)
    final_percentage = (schedule[-1]["mps"] / TOTAL_TARGET) * 100

    print(f"\nTotal MPS: {total_mps}")
    print(f"Target MPS: {TOTAL_TARGET}")
    print(f"Match: {total_mps == TOTAL_TARGET}")
    print(f"Final block percentage: {final_percentage:.2f}%")

    assert total_mps == TOTAL_TARGET, f"Total MPS mismatch: {total_mps} != {TOTAL_TARGET}"
    assert 25 <= final_percentage <= 35, f"Final block should be ~30%, got {final_percentage:.2f}%"
    print("\n✓ Prebid schedule test passed!")


def test_different_durations():
    """Test with different auction durations."""
    print("\nTesting different auction durations...")

    test_cases = [
        (14400, "1 day on mainnet (12s blocks)"),
        (43200, "1 day on Base (2s blocks)"),
        (86400, "2 days on Base (2s blocks)"),
        (604800, "1 week on Base (2s blocks)"),
    ]

    for blocks, description in test_cases:
        schedule = generate_schedule(blocks, 0)
        total_mps = sum(item["mps"] * item["blockDelta"] for item in schedule)
        final_percentage = (schedule[-1]["mps"] / TOTAL_TARGET) * 100

        print(f"\n{description}:")
        print(f"  Total blocks: {blocks}")
        print(f"  Segments: {len(schedule) - 1} (+ final block)")
        print(f"  Total MPS: {total_mps}")
        print(f"  Final block: {final_percentage:.2f}%")

        assert total_mps == TOTAL_TARGET, f"Total MPS mismatch for {description}"
        assert 25 <= final_percentage <= 35, f"Final block percentage out of range for {description}"

    print("\n✓ Different durations test passed!")


if __name__ == "__main__":
    test_basic_schedule()
    test_prebid_schedule()
    test_different_durations()
    print("\n✓ All tests passed!")
