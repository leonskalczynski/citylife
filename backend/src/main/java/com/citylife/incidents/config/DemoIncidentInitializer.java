package com.citylife.incidents.config;

import com.citylife.categories.model.Category;
import com.citylife.categories.repository.CategoryRepository;
import com.citylife.departments.model.Department;
import com.citylife.departments.repository.DepartmentRepository;
import com.citylife.incidents.model.Incident;
import com.citylife.incidents.repository.IncidentRepository;
import com.citylife.incidents.service.IncidentAuditService;
import com.citylife.users.model.User;
import com.citylife.users.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("local")
@Order(2)
public class DemoIncidentInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final IncidentRepository incidentRepository;
    private final DepartmentRepository departmentRepository;
    private final IncidentAuditService auditService;

    public DemoIncidentInitializer(
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            IncidentRepository incidentRepository,
            DepartmentRepository departmentRepository,
            IncidentAuditService auditService
    ) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.incidentRepository = incidentRepository;
        this.departmentRepository = departmentRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        User citizen = userRepository.findByEmailIgnoreCase("citizen@example.com").orElseThrow();
        if (incidentRepository.countByCreatedBy(citizen) > 0) return;

        create(citizen, "LIGHTING", "Farola apagada en la plaza", "La farola junto al banco central no enciende por la noche.", 40.41691, -3.70352, "Plaza Mayor, 3", "Centro");
        create(citizen, "CLEANING", "Acumulación de residuos", "Hay varias bolsas fuera del contenedor desde hace dos días.", 40.42411, -3.69572, "Calle del Río, 18", "Norte");
        create(citizen, "ROADS", "Baldosa suelta en la acera", "La baldosa se mueve al pisarla y puede provocar una caída.", 40.42045, -3.67561, "Avenida del Parque, 42", "Este");
        createAssignedWork(citizen);
    }

    private void create(User citizen, String categoryCode, String title, String description, Double latitude, Double longitude, String address, String district) {
        Category category = categoryRepository.findByCode(categoryCode).orElseThrow();
        Incident incident = incidentRepository.save(new Incident(title, description, category, latitude, longitude, address, district, citizen));
        auditService.record(incident, null, citizen, null);
    }

    private void createAssignedWork(User citizen) {
        Category category = categoryRepository.findByCode("URBAN_FURNITURE").orElseThrow();
        Department department = departmentRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .filter(item -> item.getCode().equals("URBAN_SERVICES"))
                .findFirst()
                .orElseThrow();
        User technician = userRepository.findByEmailIgnoreCase("technician@example.com").orElseThrow();
        User operator = userRepository.findByEmailIgnoreCase("operator@example.com").orElseThrow();
        Incident incident = incidentRepository.save(new Incident(
                "Banco dañado en la plaza",
                "El respaldo del banco está suelto y puede causar una caída.",
                category,
                40.41556,
                -3.71009,
                "Plaza de la Villa, 5",
                "Centro",
                citizen
        ));
        auditService.record(incident, null, citizen, null);
        var previousStatus = incident.getStatus();
        incident.validateIncident();
        auditService.record(incident, previousStatus, operator, null);
        previousStatus = incident.getStatus();
        incident.assign(department, technician);
        auditService.record(incident, previousStatus, operator, null);
    }
}
