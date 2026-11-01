package com.citylife.dashboard.dto;

public record ResolutionStatsResponse(
        long sampleSize,
        int minimumSamples,
        Long averageSeconds
) {
}
