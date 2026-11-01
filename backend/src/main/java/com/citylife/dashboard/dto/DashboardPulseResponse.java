package com.citylife.dashboard.dto;

import java.util.List;

public record DashboardPulseResponse(
        long activeIncidents,
        long createdToday,
        long resolvedToday,
        long createdLast7Days,
        long resolvedLast7Days,
        long createdPrevious7Days,
        long resolvedPrevious7Days,
        List<ActivityDayResponse> activity,
        List<DashboardEventResponse> recentEvents,
        List<DistrictBreakdownResponse> byDistrict,
        List<DashboardMapPointResponse> mapPoints
) {
}
