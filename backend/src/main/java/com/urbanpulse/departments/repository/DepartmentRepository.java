package com.urbanpulse.departments.repository;

import com.urbanpulse.departments.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    List<Department> findAllByActiveTrueOrderByNameAsc();
}
