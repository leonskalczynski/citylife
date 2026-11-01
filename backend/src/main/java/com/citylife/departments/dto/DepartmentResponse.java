package com.citylife.departments.dto;

import com.citylife.departments.model.Department;

import java.util.UUID;

public record DepartmentResponse(UUID id, String code, String name) {

    public static DepartmentResponse from(Department department) {
        return new DepartmentResponse(department.getId(), department.getCode(), department.getName());
    }
}
