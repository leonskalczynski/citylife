package com.urbanpulse.dashboard;

import com.urbanpulse.categories.model.Category;
import com.urbanpulse.categories.repository.CategoryRepository;
import com.urbanpulse.departments.model.Department;
import com.urbanpulse.departments.repository.DepartmentRepository;
import com.urbanpulse.incidents.model.Incident;
import com.urbanpulse.incidents.repository.AttachmentRepository;
import com.urbanpulse.incidents.repository.IncidentRepository;
import com.urbanpulse.incidents.repository.IncidentStatusChangeRepository;
import com.urbanpulse.users.model.Role;
import com.urbanpulse.users.model.User;
import com.urbanpulse.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DashboardIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired IncidentRepository incidentRepository;
    @Autowired AttachmentRepository attachmentRepository;
    @Autowired IncidentStatusChangeRepository statusChangeRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JdbcTemplate jdbcTemplate;

    private Category lighting;
    private Category roads;
    private Department department;
    private User citizen;
    private User otherCitizen;
    private User technician;
    private User otherTechnician;

    @BeforeEach
    void setUp() {
        attachmentRepository.deleteAll();
        statusChangeRepository.deleteAll();
        incidentRepository.deleteAll();
        departmentRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
        lighting = categoryRepository.save(new Category("LIGHTING", "Alumbrado"));
        roads = categoryRepository.save(new Category("ROADS", "Vía pública"));
        department = departmentRepository.save(new Department("URBAN_SERVICES", "Servicios urbanos"));
        citizen = createUser("citizen@example.com", Role.CITIZEN);
        otherCitizen = createUser("other-citizen@example.com", Role.CITIZEN);
        technician = createUser("technician@example.com", Role.TECHNICIAN);
        otherTechnician = createUser("other-technician@example.com", Role.TECHNICIAN);
        createUser("operator@example.com", Role.OPERATOR);
        seedIncidents();
    }

    @Test
    void operatorSeesGlobalTotalsBreakdownsAndOperationalIndicators() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .with(user("operator@example.com").roles("OPERATOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scope").value("OPERATOR"))
                .andExpect(jsonPath("$.totalIncidents").value(10))
                .andExpect(jsonPath("$.byStatus[0].key").value("REPORTED"))
                .andExpect(jsonPath("$.byStatus[0].count").value(1))
                .andExpect(jsonPath("$.byStatus[1].key").value("VALIDATED"))
                .andExpect(jsonPath("$.byStatus[2].key").value("REJECTED"))
                .andExpect(jsonPath("$.byStatus[2].count").value(1))
                .andExpect(jsonPath("$.byStatus[3].key").value("ASSIGNED"))
                .andExpect(jsonPath("$.byStatus[3].count").value(2))
                .andExpect(jsonPath("$.byStatus[4].key").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.byStatus[5].key").value("RESOLVED"))
                .andExpect(jsonPath("$.byStatus[5].count").value(4))
                .andExpect(jsonPath("$.byPriority[0].key").value("LOW"))
                .andExpect(jsonPath("$.byPriority[1].count").value(7))
                .andExpect(jsonPath("$.byPriority[2].count").value(2))
                .andExpect(jsonPath("$.byPriority[3].count").value(1))
                .andExpect(jsonPath("$.byCategory[0].name").value("Alumbrado"))
                .andExpect(jsonPath("$.byCategory[0].count").value(5))
                .andExpect(jsonPath("$.byCategory[1].name").value("Vía pública"))
                .andExpect(jsonPath("$.byCategory[1].count").value(5))
                .andExpect(jsonPath("$.resolution.sampleSize").value(4))
                .andExpect(jsonPath("$.resolution.minimumSamples").value(3))
                .andExpect(jsonPath("$.resolution.averageSeconds").value(32400))
                .andExpect(jsonPath("$.indicators.awaitingValidation").value(1))
                .andExpect(jsonPath("$.indicators.awaitingAssignment").value(1))
                .andExpect(jsonPath("$.indicators.awaitingStart").value(2))
                .andExpect(jsonPath("$.indicators.inProgress").value(1))
                .andExpect(jsonPath("$.indicators.activeWork").value(3))
                .andExpect(jsonPath("$.indicators.urgentOpen").value(1))
                .andExpect(jsonPath("$.indicators.resolved").value(4))
                .andExpect(jsonPath("$.indicators.rejected").value(1))
                .andExpect(jsonPath("$.indicators.assignedWithoutTechnician").value(1))
                .andExpect(jsonPath("$.pulse.activeIncidents").value(5))
                .andExpect(jsonPath("$.pulse.activity.length()").value(7))
                .andExpect(jsonPath("$.pulse.byDistrict[0].district").value("Centro"))
                .andExpect(jsonPath("$.pulse.byDistrict[0].count").value(10))
                .andExpect(jsonPath("$.pulse.recentEvents.length()").value(0));
    }

    @Test
    void technicianOnlySeesAssignedWorkloadAndResolutionForOwnWork() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .with(user("technician@example.com").roles("TECHNICIAN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scope").value("TECHNICIAN"))
                .andExpect(jsonPath("$.totalIncidents").value(5))
                .andExpect(jsonPath("$.byStatus[3].count").value(1))
                .andExpect(jsonPath("$.byStatus[4].count").value(1))
                .andExpect(jsonPath("$.byStatus[5].count").value(3))
                .andExpect(jsonPath("$.byCategory[0].name").value("Vía pública"))
                .andExpect(jsonPath("$.byCategory[0].count").value(4))
                .andExpect(jsonPath("$.byCategory[1].count").value(1))
                .andExpect(jsonPath("$.resolution.sampleSize").value(3))
                .andExpect(jsonPath("$.resolution.averageSeconds").value(14400))
                .andExpect(jsonPath("$.indicators.awaitingStart").value(1))
                .andExpect(jsonPath("$.indicators.inProgress").value(1))
                .andExpect(jsonPath("$.indicators.activeWork").value(2))
                .andExpect(jsonPath("$.indicators.resolved").value(3));
    }

    @Test
    void citizenOnlySeesOwnIncidents() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scope").value("CITIZEN"))
                .andExpect(jsonPath("$.totalIncidents").value(8))
                .andExpect(jsonPath("$.byStatus[0].count").value(1))
                .andExpect(jsonPath("$.byStatus[3].count").value(2))
                .andExpect(jsonPath("$.byStatus[5].count").value(3))
                .andExpect(jsonPath("$.byCategory[0].name").value("Alumbrado"))
                .andExpect(jsonPath("$.byCategory[0].count").value(4))
                .andExpect(jsonPath("$.byCategory[1].count").value(4))
                .andExpect(jsonPath("$.resolution.sampleSize").value(3))
                .andExpect(jsonPath("$.resolution.averageSeconds").value(14400))
                .andExpect(jsonPath("$.indicators.awaitingValidation").value(1))
                .andExpect(jsonPath("$.indicators.activeWork").value(3))
                .andExpect(jsonPath("$.indicators.rejected").value(0))
                .andExpect(jsonPath("$.indicators.assignedWithoutTechnician").value(1));
    }

    @Test
    void hidesAverageResolutionUntilThereAreEnoughSamples() throws Exception {
        incidentRepository.deleteAll();
        createResolved("Primera reparación", citizen, roads, technician, Duration.ofHours(1));
        createResolved("Segunda reparación", citizen, roads, technician, Duration.ofHours(2));

        mockMvc.perform(get("/api/dashboard")
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resolution.sampleSize").value(2))
                .andExpect(jsonPath("$.resolution.minimumSamples").value(3))
                .andExpect(jsonPath("$.resolution.averageSeconds").doesNotExist());
    }

    @Test
    void forbidsRolesWithoutDashboardAccess() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .with(user("analyst@example.com").roles("ANALYST")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    private void seedIncidents() {
        createIncident("Farola apagada", citizen, lighting);
        Incident validated = createIncident("Señal torcida", citizen, lighting);
        validated.validateIncident();
        validated.changePriority(com.urbanpulse.incidents.model.Priority.HIGH);
        incidentRepository.save(validated);
        createAssigned("Contenedor desbordado", citizen, lighting, technician, com.urbanpulse.incidents.model.Priority.URGENT);
        createInProgress("Baldosa suelta", citizen, roads, technician);
        createResolved("Banco reparado", citizen, roads, technician, Duration.ofHours(2));
        createResolved("Farola reparada", citizen, roads, technician, Duration.ofHours(4), com.urbanpulse.incidents.model.Priority.HIGH);
        createResolved("Acera nivelada", citizen, roads, technician, Duration.ofHours(6));
        Incident rejected = createIncident("Aviso duplicado", otherCitizen, lighting);
        rejected.reject("La incidencia está duplicada");
        incidentRepository.save(rejected);
        createResolved("Calzada reparada", otherCitizen, roads, otherTechnician, Duration.ofHours(24));
        Incident assignedWithoutTechnician = createIncident("Pintada pendiente", citizen, lighting);
        assignedWithoutTechnician.validateIncident();
        assignedWithoutTechnician.assign(department, null);
        incidentRepository.save(assignedWithoutTechnician);
    }

    private Incident createIncident(String title, User creator, Category category) {
        return incidentRepository.save(new Incident(title, "Descripción suficientemente detallada", category, null, null, "Calle Mayor", "Centro", creator));
    }

    private Incident createAssigned(String title, User creator, Category category, User assignedTo, com.urbanpulse.incidents.model.Priority priority) {
        Incident incident = createIncident(title, creator, category);
        incident.validateIncident();
        incident.changePriority(priority);
        incident.assign(department, assignedTo);
        return incidentRepository.save(incident);
    }

    private Incident createInProgress(String title, User creator, Category category, User assignedTo) {
        Incident incident = createAssigned(title, creator, category, assignedTo, com.urbanpulse.incidents.model.Priority.NORMAL);
        incident.startWork();
        return incidentRepository.save(incident);
    }

    private Incident createResolved(String title, User creator, Category category, User assignedTo, Duration duration) {
        return createResolved(title, creator, category, assignedTo, duration, com.urbanpulse.incidents.model.Priority.NORMAL);
    }

    private Incident createResolved(String title, User creator, Category category, User assignedTo, Duration duration, com.urbanpulse.incidents.model.Priority priority) {
        Incident incident = createInProgress(title, creator, category, assignedTo);
        if (priority != com.urbanpulse.incidents.model.Priority.NORMAL) incident.changePriority(priority);
        incident.resolve("Trabajo completado y comprobado");
        incidentRepository.save(incident);
        setResolvedAt(incident, duration);
        return incident;
    }

    private void setResolvedAt(Incident incident, Duration duration) {
        Instant now = Instant.parse("2026-11-02T12:00:00Z");
        jdbcTemplate.update(
                "update incidents set created_at = ?, resolved_at = ? where id = ?",
                Timestamp.from(now.minus(duration)),
                Timestamp.from(now),
                incident.getId()
        );
    }

    private User createUser(String email, Role role) {
        return userRepository.save(new User(email, passwordEncoder.encode("Urban Pulse123!"), email, role));
    }
}
