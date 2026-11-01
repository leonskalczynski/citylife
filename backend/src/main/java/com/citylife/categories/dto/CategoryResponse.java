package com.citylife.categories.dto;

import com.citylife.categories.model.Category;

import java.util.UUID;

public record CategoryResponse(UUID id, String code, String name) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getCode(), category.getName());
    }
}
