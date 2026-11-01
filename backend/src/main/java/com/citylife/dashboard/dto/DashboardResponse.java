package com.citylife.dashboard.dto;

import com.citylife.users.model.Role;

import java.util.List;

public record DashboardResponse(
        Role scope,
        long totalIncidents,
        List<BreakdownResponse> byStatus,
        List<CategoryBreakdownResponse> byCategory,
        List<BreakdownResponse> byPriority,
        ResolutionStatsResponse resolution,
        OperationalIndicatorsResponse indicators
) {
}
