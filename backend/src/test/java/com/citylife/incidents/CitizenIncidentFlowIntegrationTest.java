package com.citylife.incidents;

import com.citylife.categories.model.Category;
import com.citylife.categories.repository.CategoryRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CitizenIncidentFlowIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired IncidentRepository incidentRepository;
    @Autowired AttachmentRepository attachmentRepository;
    @Autowired IncidentStatusChangeRepository statusChangeRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private Category category;

    @BeforeEach
    void setUp() {
        attachmentRepository.deleteAll();
        statusChangeRepository.deleteAll();
        incidentRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
        category = categoryRepository.save(new Category("LIGHTING", "Alumbrado"));
        createUser("citizen@example.com", Role.CITIZEN);
        createUser("other@example.com", Role.CITIZEN);
        createUser("operator@example.com", Role.OPERATOR);
    }

    @Test
    void citizenCreatesListsAndReadsOwnIncident() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/incidents")
                        .with(user("citizen@example.com").roles("CITIZEN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("REPORTED"))
                .andExpect(jsonPath("$.priority").value("NORMAL"))
                .andExpect(jsonPath("$.category.name").value("Alumbrado"))
                .andReturn();

        String incidentId = com.jayway.jsonpath.JsonPath.read(
                result.getResponse().getContentAsString(), "$.id"
        );

        mockMvc.perform(get("/api/incidents/my")
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(incidentId));

        mockMvc.perform(get("/api/incidents/{id}", incidentId)
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Farola apagada"));

        mockMvc.perform(get("/api/incidents/{id}/history", incidentId)
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].previousStatus").doesNotExist())
                .andExpect(jsonPath("$[0].newStatus").value("REPORTED"))
                .andExpect(jsonPath("$[0].changedBy.displayName").value("citizen@example.com"))
                .andExpect(jsonPath("$[0].changedBy.email").doesNotExist());
    }

    @Test
    void citizenCannotSeeAnotherCitizensIncident() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/incidents")
                        .with(user("citizen@example.com").roles("CITIZEN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest()))
                .andReturn();
        String incidentId = com.jayway.jsonpath.JsonPath.read(
                result.getResponse().getContentAsString(), "$.id"
        );

        mockMvc.perform(get("/api/incidents/{id}", incidentId)
                        .with(user("other@example.com").roles("CITIZEN")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("INCIDENT_NOT_FOUND"));

        mockMvc.perform(get("/api/incidents/{id}/history", incidentId)
                        .with(user("other@example.com").roles("CITIZEN")))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/incidents/my")
                        .with(user("other@example.com").roles("CITIZEN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void validatesInputAndRequiresCitizenRole() throws Exception {
        mockMvc.perform(post("/api/incidents")
                        .with(user("citizen@example.com").roles("CITIZEN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"No","description":"Breve","categoryId":"%s"}
                                """.formatted(category.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(post("/api/incidents")
                        .with(user("citizen@example.com").roles("CITIZEN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Farola apagada",
                                  "description":"La farola no funciona desde ayer",
                                  "categoryId":"%s",
                                  "latitude":40.4
                                }
                                """.formatted(category.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_LOCATION"));

        mockMvc.perform(post("/api/incidents")
                        .with(user("operator@example.com").roles("OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    private void createUser(String email, Role role) {
        userRepository.save(new User(email, passwordEncoder.encode("Citylife123!"), email, role));
    }

    private String validRequest() {
        return """
                {
                  "title":"Farola apagada",
                  "description":"La farola no funciona desde ayer",
                  "categoryId":"%s",
                  "address":"Plaza Mayor, 3",
                  "district":"Centro"
                }
                """.formatted(category.getId());
    }
}
