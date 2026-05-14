package com.javanc.manager.interfaces.rest.resource;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.CompanyDTO;
import com.javanc.manager.application.dto.RoleRequestDTO;
import com.javanc.manager.application.dto.UserDTO;
import com.javanc.manager.application.mapper.CompanyMapper;
import com.javanc.manager.application.service.CompanyApplicationService;
import com.javanc.manager.interfaces.rest.form.CompanyMultipartForm;
import jakarta.inject.Inject;
import jakarta.ws.rs.BeanParam;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/manager")
@Produces(MediaType.APPLICATION_JSON)
public class CompanyResource {

    private final CompanyApplicationService companyService;
    private final CompanyMapper companyMapper;

    @Inject
    public CompanyResource(CompanyApplicationService companyService, CompanyMapper companyMapper) {
        this.companyService = companyService;
        this.companyMapper = companyMapper;
    }

    @POST
    @Path("/admin/company/create")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public ApiResponse<CompanyDTO> create(@BeanParam CompanyMultipartForm form) {
        CompanyDTO result = companyService.create(companyMapper.toDto(form), form.image);
        return new ApiResponse<>(true, "Company created successfully", result);
    }

    @POST
    @Path("/manager/company/update")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<CompanyDTO> update(CompanyDTO companyDTO) {
        return new ApiResponse<>(true, "Company updated successfully", companyService.update(companyDTO));
    }

    @PUT
    @Path("/manager/sethrtocompany")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<CompanyDTO> setHeadToCompany(AuthenticationRequest request,
            @QueryParam("idCompany") Integer idCompany) {
        return new ApiResponse<>(true, "Head updated successfully", companyService.setHRToCompany(request, idCompany));
    }

    @PUT
    @Path("/manager/promotehrtocompany")
    public ApiResponse<CompanyDTO> promoteUserToHr(@QueryParam("idUser") Integer idUser,
            @QueryParam("idCompany") Integer idCompany) {
        return new ApiResponse<>(true, "HR updated successfully", companyService.promoteUserToHR(idUser, idCompany));
    }

    @GET
    @Path("/manager/company/me")
    public ApiResponse<CompanyDTO> getMyManagedCompany() {
        return new ApiResponse<>(true, "Company retrieved successfully", companyService.getMyManagedCompany());
    }

    @GET
    @Path("/manager/hr-candidates")
    public ApiResponse<List<UserDTO>> hrCandidates(@QueryParam("query") String query, @QueryParam("page") Integer page,
            @QueryParam("size") Integer size) {
        return new ApiResponse<>(true, "HR candidates retrieved successfully",
                companyService.searchHrCandidates(query, page, size));
    }

    @POST
    @Path("/manager/hr-promotions")
    public ApiResponse<RoleRequestDTO> requestHrPromotion(@QueryParam("targetUserId") Integer targetUserId) {
        return new ApiResponse<>(true, "HR promotion requested successfully",
                companyService.requestHrPromotion(targetUserId));
    }

    @PATCH
    @Path("/user/hr-promotions/{requestId}/accept")
    public ApiResponse<CompanyDTO> acceptHrPromotion(@jakarta.ws.rs.PathParam("requestId") Integer requestId) {
        return new ApiResponse<>(true, "HR promotion accepted successfully", companyService.acceptHrPromotion(requestId));
    }

    @PATCH
    @Path("/hr/leave")
    public ApiResponse<CompanyDTO> leaveHr() {
        return new ApiResponse<>(true, "HR left company successfully", companyService.leaveHr());
    }

    @POST
    @Path("/admin/company/delete")
    public ApiResponse<String> delete(@QueryParam("id") Integer id) {
        companyService.deleteById(id);
        return new ApiResponse<>(true, "Company deleted successfully", "ok");
    }

    @PUT
    @Path("/manager/setmaanagertocompany")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<CompanyDTO> setManagerToCompany(AuthenticationRequest request,
            @QueryParam("idCompany") Integer idCompany) {
        return new ApiResponse<>(true, "Head updated successfully",
                companyService.setManagerToCompany(request, idCompany));
    }

    @GET
    @Path("/user/company/getbyid")
    public ApiResponse<CompanyDTO> getById(@QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "Company retrieved successfully", companyService.findById(id));
    }

    @GET
    @Path("/user/company/getcompany")
    public ApiResponse<List<CompanyDTO>> getAllCompanies(@QueryParam("query") String query,
            @QueryParam("page") Integer page, @QueryParam("size") Integer size, @QueryParam("sort") String sort) {
        return new ApiResponse<>(true, "Companies retrieved successfully",
                companyService.getCompanyDTOs(query, page, size, sort));
    }

    @GET
    @Path("/user/company/getcompanybytype")
    public ApiResponse<List<CompanyDTO>> getCompanyByType(@QueryParam("type") String type,
            @QueryParam("query") String query, @QueryParam("page") Integer page, @QueryParam("size") Integer size,
            @QueryParam("sort") String sort) {
        return new ApiResponse<>(true, "Companies retrieved successfully by type",
                companyService.getCompanyByType(type, query, page, size, sort));
    }

    @GET
    @Path("/company/getcompanybyidmanager")
    public ApiResponse<CompanyDTO> getCompanyByManagerId(@QueryParam("managerId") Integer managerId) {
        return new ApiResponse<>(true, "Companies retrieved successfully by manager id",
                companyService.getCompanyByIdManager(managerId));
    }

    @GET
    @Path("/hr/findByIdHr")
    public ApiResponse<CompanyDTO> findByIdHr(@QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "Company retrieved successfully by HR id", companyService.findByIdHr(id));
    }
}
