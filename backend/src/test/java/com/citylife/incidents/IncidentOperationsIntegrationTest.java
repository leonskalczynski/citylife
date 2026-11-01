package com.citylife.incidents;

import com.citylife.categories.model.Category;
import com.citylife.categories.repository.CategoryRepository;
import com.citylife.departments.model.Department;
import com.citylife.departments.repository.DepartmentRepository;
import com.citylife.incidents.model.Incident;
import com.citylife.incidents.repository.IncidentRepository;
import com.citylife.incidents.repository.AttachmentRepository;
import com.citylife.incidents.repository.IncidentStatusChangeRepository;
import com.citylife.users.model.Role;
import com.citylife.users.model.User;
import com.citylife.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class IncidentOperationsIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired IncidentRepository incidentRepository;
    @Autowired AttachmentRepository attachmentRepository;
    @Autowired IncidentStatusChangeRepository statusChangeRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private Category category;
    private Department department;
    private User citizen;
    private User technician;

    @BeforeEach
    void setUp() {
        attachmentRepository.deleteAll();
        statusChangeRepository.deleteAll();
        incidentRepository.deleteAll();
        departmentRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
        category = categoryRepository.save(new Category("LIGHTING", "Alumbrado"));
        department = departmentRepository.save(new Department("URBAN_SERVICES", "Servicios urbanos"));
        citizen = createUser("citizen@example.com", Role.CITIZEN);
        createUser("operator@example.com", Role.OPERATOR);
        technician = createUser("technician@example.com", Role.TECHNICIAN);
    }

    @Test
    void operatorSearchesWithPaginationAndFilters() throws Exception {
        Incident validated = createIncident("Farola apagada", "La farola lleva dos noches sin funcionar");
        createIncident("Banco dañado", "El respaldo del banco está completamente suelto");
        validated.validateIncident();
        incidentRepository.save(validated);

        mockMvc.perform(get("/api/operations/incidents")
                        .param("status", "VALIDATED")
                        .param("search", "farola")
                        .param("page", "0")
                        .param("size", "10")
                        .with(user("operator@example.com").roles("OPERATOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Farola apagada"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.page").value(0));

        mockMvc.perform(get("/api/operations/incidents")
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void validatesReportedIncidentAndRejectsInvalidTransition() throws Exception {
        Incident incident = createIncident("Farola apagada", "La farola lleva dos noches sin funcionar");

        mockMvc.perform(post("/api/operations/incidents/{id}/validate", incident.getId())
                        .with(user("operator@example.com").roles("OPERATOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VALIDATED"));

        mockMvc.perform(post("/api/operations/incidents/{id}/validate", incident.getId())
                        .with(user("operator@example.com").roles("OPERATOR")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_INCIDENT_TRANSITION"));

        mockMvc.perform(get("/api/operations/incidents/{id}/history", incident.getId())
                        .with(user("operator@example.com").roles("OPERATOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].previousStatus").value("REPORTED"))
                .andExpect(jsonPath("$[0].newStatus").value("VALIDATED"))
                .andExpect(jsonPath("$[0].changedBy.displayName").value("operator@example.com"));
    }

    @Test
    void changesPriorityAndRejectsWithReason() throws Exception {
        Incident incident = createIncident("Contenedor lleno", "El contenedor está desbordado desde esta mañana");

        mockMvc.perform(post("/api/operations/incidents/{id}/priority", incident.getId())
                        .with(user("operator@example.com").roles("OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"priority\":\"HIGH\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priority").value("HIGH"));

        mockMvc.perform(post("/api/operations/incidents/{id}/reject", incident.getId())
                        .with(user("operator@example.com").roles("OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"La incidencia está duplicada\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("La incidencia está duplicada"));

        mockMvc.perform(get("/api/operations/incidents/{id}/history", incident.getId())
                        .with(user("operator@example.com").roles("OPERATOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reason").value("La incidencia está duplicada"));
    }

    @Test
    void assignsValidatedIncidentToDepartmentAndTechnician() throws Exception {
        Incident incident = createIncident("Baldosa suelta", "La baldosa supone un riesgo para los peatones");
        incident.validateIncident();
        incidentRepository.save(incident);

        mockMvc.perform(post("/api/operations/incidents/{id}/assign", incident.getId())
                        .with(user("operator@example.com").roles("OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"departmentId":"%s","technicianId":"%s"}
                                """.formatted(department.getId(), technician.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.department.name").value("Servicios urbanos"))
                .andExpect(jsonPath("$.assignedTo.email").value("technician@example.com"));
    }

    private Incident createIncident(String title, String description) {
        return incidentRepository.save(new Incident(title, description, category, null, null, "Calle Mayor", "Centro", citizen));
    }

    private User createUser(String email, Role role) {
        return userRepository.save(new User(email, passwordEncoder.encode("Citylife123!"), email, role));
    }
}
