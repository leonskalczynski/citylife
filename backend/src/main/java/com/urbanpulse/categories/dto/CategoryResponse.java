package com.urbanpulse.categories.dto;

import com.urbanpulse.categories.model.Category;

import java.util.UUID;

public record CategoryResponse(UUID id, String code, String name) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getCode(), category.getName());
    }
}
