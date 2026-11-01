package com.citylife.incidents;

import com.citylife.categories.model.Category;
import com.citylife.categories.repository.CategoryRepository;
import com.citylife.departments.model.Department;
import com.citylife.departments.repository.DepartmentRepository;
import com.citylife.incidents.model.Incident;
import com.citylife.incidents.repository.AttachmentRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class IncidentAttachmentIntegrationTest {

    private static final byte[] PNG = new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3};

    @Autowired MockMvc mockMvc;
    @Autowired AttachmentRepository attachmentRepository;
    @Autowired IncidentStatusChangeRepository statusChangeRepository;
    @Autowired IncidentRepository incidentRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private User citizen;
    private User technician;
    private Category category;
    private Department department;

    @BeforeEach
    void setUp() {
        attachmentRepository.deleteAll();
        statusChangeRepository.deleteAll();
        incidentRepository.deleteAll();
        departmentRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
        category = categoryRepository.save(new Category("PARKS", "Parques y jardines"));
        department = departmentRepository.save(new Department("GREEN_AREAS", "Zonas verdes"));
        citizen = createUser("citizen@example.com", Role.CITIZEN);
        createUser("other@example.com", Role.CITIZEN);
        createUser("operator@example.com", Role.OPERATOR);
        technician = createUser("technician@example.com", Role.TECHNICIAN);
    }

    @Test
    void citizenUploadsListsAndDownloadsAnOwnedIncidentImage() throws Exception {
        Incident incident = createIncident();
        MockMultipartFile file = new MockMultipartFile("file", "arbol.png", "text/plain", PNG);

        MvcResult upload = mockMvc.perform(multipart("/api/incidents/{id}/attachments", incident.getId())
                        .file(file)
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName").value("arbol.png"))
                .andExpect(jsonPath("$.contentType").value("image/png"))
                .andExpect(jsonPath("$.sizeBytes").value(PNG.length))
                .andExpect(jsonPath("$.uploadedBy.displayName").value("citizen@example.com"))
                .andReturn();

        String attachmentId = com.jayway.jsonpath.JsonPath.read(upload.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/incidents/{id}/attachments", incident.getId())
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(attachmentId));

        mockMvc.perform(get("/api/operations/incidents/{id}/attachments", incident.getId())
                        .with(user("operator@example.com").roles("OPERATOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(attachmentId));

        MvcResult download = mockMvc.perform(get("/api/attachments/{id}/content", attachmentId)
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("arbol.png")))
                .andReturn();
        assertThat(download.getResponse().getContentAsByteArray()).isEqualTo(PNG);
    }

    @Test
    void preventsOtherCitizenFromReadingIncidentAttachments() throws Exception {
        Incident incident = createIncident();
        String attachmentId = uploadAsCitizen(incident);

        mockMvc.perform(get("/api/incidents/{id}/attachments", incident.getId())
                        .with(user("other@example.com").roles("CITIZEN")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("INCIDENT_NOT_FOUND"));

        mockMvc.perform(get("/api/attachments/{id}/content", attachmentId)
                        .with(user("other@example.com").roles("CITIZEN")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void technicianUploadsEvidenceOnlyForAssignedWork() throws Exception {
        Incident assigned = createIncident();
        assigned.validateIncident();
        assigned.assign(department, technician);
        incidentRepository.save(assigned);

        mockMvc.perform(multipart("/api/work/incidents/{id}/attachments", assigned.getId())
                        .file(new MockMultipartFile("file", "evidencia.webp", "image/webp", webp()))
                        .with(user("technician@example.com").roles("TECHNICIAN")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contentType").value("image/webp"));

        Incident unassigned = createIncident();
        mockMvc.perform(multipart("/api/work/incidents/{id}/attachments", unassigned.getId())
                        .file(new MockMultipartFile("file", "evidencia.png", "image/png", PNG))
                        .with(user("technician@example.com").roles("TECHNICIAN")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("WORK_NOT_FOUND"));
    }

    @Test
    void rejectsContentWhoseSignatureIsNotAnAllowedImage() throws Exception {
        Incident incident = createIncident();

        mockMvc.perform(multipart("/api/incidents/{id}/attachments", incident.getId())
                        .file(new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes()))
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_ATTACHMENT_TYPE"));
    }

    private String uploadAsCitizen(Incident incident) throws Exception {
        MvcResult result = mockMvc.perform(multipart("/api/incidents/{id}/attachments", incident.getId())
                        .file(new MockMultipartFile("file", "arbol.png", "image/png", PNG))
                        .with(user("citizen@example.com").roles("CITIZEN")))
                .andExpect(status().isCreated())
                .andReturn();
        return com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private Incident createIncident() {
        return incidentRepository.save(new Incident(
                "Rama caída",
                "Una rama grande bloquea parcialmente el paso peatonal",
                category,
                null,
                null,
                "Parque Central",
                "Centro",
                citizen
        ));
    }

    private User createUser(String email, Role role) {
        return userRepository.save(new User(email, passwordEncoder.encode("Citylife123!"), email, role));
    }

    private byte[] webp() {
        return new byte[]{'R', 'I', 'F', 'F', 4, 0, 0, 0, 'W', 'E', 'B', 'P', 1, 2};
    }
}
