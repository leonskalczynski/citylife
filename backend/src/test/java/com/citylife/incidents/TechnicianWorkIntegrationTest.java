package com.citylife.incidents;

import com.citylife.categories.model.Category;
import com.citylife.categories.repository.CategoryRepository;
import com.citylife.departments.model.Department;
import com.citylife.departments.repository.DepartmentRepository;
import com.citylife.incidents.model.Incident;
import com.citylife.incidents.repository.IncidentRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TechnicianWorkIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired IncidentRepository incidentRepository;
    @Autowired IncidentStatusChangeRepository statusChangeRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private Category category;
    private Department department;
    private User citizen;
    private User technician;
    private User otherTechnician;

    @BeforeEach
    void setUp() {
        statusChangeRepository.deleteAll();
        incidentRepository.deleteAll();
        departmentRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
        category = categoryRepository.save(new Category("ROADS", "Vía pública"));
        department = departmentRepository.save(new Department("PUBLIC_WORKS", "Obras y vía pública"));
        citizen = createUser("citizen@example.com", Role.CITIZEN);
        technician = createUser("technician@example.com", Role.TECHNICIAN);
        otherTechnician = createUser("other@example.com", Role.TECHNICIAN);
    }

    @Test
    void listsOnlyWorkAssignedToAuthenticatedTechnician() throws Exception {
        createAssignedIncident("Baldosa suelta", technician);
        createAssignedIncident("Señal torcida", otherTechnician);

        mockMvc.perform(get("/api/work/incidents")
                        .with(user("technician@example.com").roles("TECHNICIAN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Baldosa suelta"));

        mockMvc.perform(get("/api/work/incidents")
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void preventsTechnicianFromOpeningSomeoneElsesWork() throws Exception {
        Incident incident = createAssignedIncident("Señal torcida", otherTechnician);

        mockMvc.perform(get("/api/work/incidents/{id}", incident.getId())
                        .with(user("technician@example.com").roles("TECHNICIAN")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("WORK_NOT_FOUND"));
    }

    @Test
    void startsDocumentsAndResolvesAssignedWork() throws Exception {
        Incident incident = createAssignedIncident("Baldosa suelta", technician);

        mockMvc.perform(post("/api/work/incidents/{id}/start", incident.getId())
                        .with(user("technician@example.com").roles("TECHNICIAN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mockMvc.perform(put("/api/work/incidents/{id}/notes", incident.getId())
                        .with(user("technician@example.com").roles("TECHNICIAN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"Se ha señalizado la zona y retirado la pieza suelta.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.technicianNotes").value("Se ha señalizado la zona y retirado la pieza suelta."));

        mockMvc.perform(post("/api/work/incidents/{id}/resolve", incident.getId())
                        .with(user("technician@example.com").roles("TECHNICIAN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"summary\":\"Baldosa sustituida y pavimento nivelado.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolutionSummary").value("Baldosa sustituida y pavimento nivelado."))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());

        mockMvc.perform(get("/api/work/incidents/{id}/history", incident.getId())
                        .with(user("technician@example.com").roles("TECHNICIAN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].newStatus").value("IN_PROGRESS"))
                .andExpect(jsonPath("$[1].newStatus").value("RESOLVED"))
                .andExpect(jsonPath("$[1].changedBy.displayName").value("technician@example.com"));
    }

    @Test
    void rejectsResolvingWorkBeforeItStarts() throws Exception {
        Incident incident = createAssignedIncident("Baldosa suelta", technician);

        mockMvc.perform(post("/api/work/incidents/{id}/resolve", incident.getId())
                        .with(user("technician@example.com").roles("TECHNICIAN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"summary\":\"Trabajo finalizado.\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_INCIDENT_TRANSITION"));
    }

    private Incident createAssignedIncident(String title, User assignedTechnician) {
        Incident incident = new Incident(title, "Descripción suficientemente detallada", category, null, null, "Calle Mayor", "Centro", citizen);
        incident.validateIncident();
        incident.assign(department, assignedTechnician);
        return incidentRepository.save(incident);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(new User(email, passwordEncoder.encode("Citylife123!"), email, role));
    }
}
